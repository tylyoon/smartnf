export const nutrients = {
    energy: { label: '열량', unit: 'kcal' },
    protein: { label: '단백질', unit: 'g' },
    sodium: { label: '나트륨', unit: 'mg' },
    fiber: { label: '식이섬유', unit: 'g' },
    carbohydrate: { label: '탄수화물', unit: 'g' },
    fat: { label: '지방', unit: 'g' },
    saturated_fat: { label: '포화지방', unit: 'g' },
    sugars: { label: '당류', unit: 'g' }
};
export const format = value => value == null ? '자료 부족' : new Intl.NumberFormat('ko-KR', { maximumFractionDigits: 1 }).format(Math.abs(value) < 0.05 ? 0 : value);
export const accountKey = () => document.querySelector('header[data-account-key]')?.dataset.accountKey;
export function element(tag, text, className) {
    const node = document.createElement(tag);
    if (text !== undefined) node.textContent = text;
    if (className) node.className = className;
    return node;
}
export function button(text, action, className = 'fs-button fs-secondary') {
    const node = element('button', text, className);
    node.type = 'button';
    node.addEventListener('click', action);
    return node;
}
export async function api(url, data, signal) {
    const headers = { Accept: 'application/json', 'X-SmartNF-Account': accountKey() || '' };
    if (data !== undefined) {
        const key = document.querySelector('meta[name="_csrf_header"]')?.content;
        const token = document.querySelector('meta[name="_csrf"]')?.content;
        if (!key || !token) throw new Error('로그인 상태를 확인하고 화면을 새로 열어 주세요.');
        headers[key] = token;
        headers['Content-Type'] = 'application/json';
    }
    const response = await fetch(url, {
        method: data === undefined ? 'GET' : 'POST', headers, credentials: 'same-origin', cache: 'no-store',
        body: data === undefined ? undefined : JSON.stringify(data), signal: signal || AbortSignal.timeout(50000)
    });
    if (response.redirected || [401, 403].includes(response.status)) {
        const error = new Error('로그인·저장 동의를 확인하고 화면을 다시 열어 주세요.');
        error.status = response.status;
        throw error;
    }
    if (response.status === 204) return null;
    if (!response.ok) {
        const localMessages = {
            LOCAL_LLM_AMOUNT_MISMATCH: '모델이 입력과 다른 분량을 반환해 적용하지 않았습니다. 원문은 유지됩니다. 다시 시도하거나 직접 입력해 주세요.',
            LOCAL_LLM_INVALID_OUTPUT: '모델 응답 형식을 확인하지 못했습니다. 다시 시도하거나 직접 입력해 주세요.',
            LOCAL_LLM_HTTP_ERROR: '자체 모델 서버가 요청을 처리하지 못했습니다. 모델 로그를 확인해 주세요.',
            LOCAL_LLM_TIMEOUT: '자체 모델의 응답 시간이 초과됐습니다. 잠시 후 다시 시도해 주세요.',
            LOCAL_LLM_DISABLED: '자체 이름 도우미가 꺼져 있습니다. 실행 설정을 확인해 주세요.',
            LOCAL_LLM_BUSY: '다른 이름 정리 요청을 처리 중입니다. 잠시 후 다시 시도해 주세요.',
            LOCAL_LLM_UNAVAILABLE: '자체 모델에 연결하지 못했거나 응답을 읽지 못했습니다. 실행 상태를 확인해 주세요.'
        };
        let specific;
        if (url === '/api/recipes/normalize') {
            try { specific = localMessages[(await response.json()).code]; } catch (_) { /* Keep generic error. */ }
        }
        const error = new Error(specific || (response.status === 409 ? '다른 화면에서 변경되었습니다. 최신 계획을 확인해 주세요.'
            : response.status === 503 ? '현재 연결을 사용할 수 없습니다. 직접 선택하거나 잠시 후 다시 시도해 주세요.'
                : '요청을 완료하지 못했습니다. 입력과 서버 상태를 확인해 주세요.'));
        error.status = response.status;
        throw error;
    }
    return response.json();
}
let catalogPromise;
export function normalizeName(text) {
    return text.normalize('NFKC').replace(/[\s_·]/g, '').toLowerCase();
}
export function loadCatalog() {
    if (!catalogPromise) catalogPromise = fetch('/js/data/food-nutrition/meal-references.tsv').then(async response => {
        if (!response.ok) throw new Error('영양 자료를 불러오지 못했습니다.');
        const catalog = new Map();
        for (const line of (await response.text()).split(/\r?\n/)) {
            const [id, name, version, source, basis, group, ...values] = line.split('\t');
            if (!/^100g(?: |$)/.test(basis || '')) continue;
            const keys = ['energy', 'protein', 'carbohydrate', 'fat', 'sodium', 'sugars', 'fiber', 'saturated_fat'];
            const data = Object.fromEntries(keys.map((key, index) => [key, values[index]?.trim() && Number.isFinite(Number(values[index])) && Number(values[index]) >= 0 ? Number(values[index]) : null]));
            catalog.set(id, { id, name, version, source, basis, group, nutrients: data });
        }
        try{
            const estimates=await api('/api/me/ai-nutrition',undefined,AbortSignal.timeout(8000));
            estimates.filter(e=>['USER_CONFIRMED','AUTO_APPLIED'].includes(e.status)).forEach(e=>catalog.set(e.id,aiFood(e)));
        }catch{ /* Public data remains available if personal estimates cannot be loaded. */ }
        return catalog;
    }).catch(error => { catalogPromise = null; throw error; });
    return catalogPromise;
}
export function parseRecipe(recipe, catalog) {
    return recipe.ingredients.map((text,index) => {
        const match = text.normalize('NFKC').match(/^(.*?)\s*(\d+(?:\.\d+)?)\s*(kg|g|ml|L|개|알|판|팩|봉|병)\s*$/i);
        const name = match ? match[1].trim() : text;
        const isWaterVolume = match && match[3].toLowerCase() === 'ml'
            && ['물', '생수'].includes(normalizeName(name));
        const rawUnit=match?.[3].toLowerCase(),unit=({kg:'g',l:'ml',개:'ea',알:'ea',판:'pack',팩:'pack',봉:'bag',병:'bottle'}[rawUnit]||rawUnit),amount=match?Number(match[2])*(['kg','l'].includes(rawUnit)?1000:1):null;
        const grams = match && (unit==='g'||isWaterVolume)?amount:null;
        const allExact = [...catalog.values()].filter(food => normalizeName(food.name) === normalizeName(name));
        const publicExact=allExact.filter(food=>!food.ai);const exact=publicExact.length?publicExact:allExact;
        const saved=recipe.ingredientRefs?.[index];
        return { text, name, ...(match?{quantities:[{amount,unit,evidence:('레시피 원문: '+text).slice(0,300)}]}:{}), foodId: saved?.startsWith('ai:')&&catalog.has(saved)?saved:exact.length === 1 ? exact[0].id : '', grams,
            conversionNote: isWaterVolume ? '물의 부피는 1mL ≈ 1g으로 환산한 추정값입니다. 아래 입력은 g 기준입니다.'
                : match && match[3].toLowerCase() === 'ml' ? '이 재료의 mL를 g으로 자동 환산하지 않았습니다. 제품 무게를 확인해 입력하세요.' : '' };
    });
}
// Resolve unique names once per comparison, preserving all original gram amounts.
export async function resolveIngredientMatches(items, catalog, progress = () => {}, current = () => true) {
    const groups = new Map();
    for (const item of items.filter(item => !item.foodId)) {
        const name = item.name || item.text.replace(/\s*\d+(?:\.\d+)?\s*g\s*$/i, '').trim();
        if (!name || name.length > 140) continue;
        item.matchStatus = 'manual';
        if (!groups.has(name)) groups.set(name, []);
        groups.get(name).push(item);
    }
    const names = [...groups.keys()].slice(0, 30);
    for (let offset = 0; offset < names.length; offset += 6) {
        if (!current()) return;
        const batch = names.slice(offset, offset + 6);
        progress(`자체 모델이 재료와 영양 DB를 연결하고 있습니다 · ${offset + 1}~${offset + batch.length}/${names.length}`);
        let results;
        try { results = await api('/api/recipes/match-ingredients', { names: batch }); }
        catch (_) { continue; } // Keep manual selection available on model failure.
        if (!current()) return;
        if (!Array.isArray(results) || results.length !== batch.length) continue;
        for (let index = 0; index < batch.length; index++) {
            const result = results[index];
            if (!result || result.name !== batch[index]) continue;
            const candidates = Array.isArray(result.candidates) ? result.candidates.filter(food => catalog.has(food.id)) : [];
            const offered = new Set(candidates.map(food => food.id));
            for (const item of groups.get(batch[index])) {
                if (item.foodId) continue;
                item.candidates = candidates;
                if (['local_llm', 'reference'].includes(result.status) && offered.has(result.foodId)) {
                    item.foodId = result.foodId; item.matchStatus = result.status;
                } else if (result.status === 'confirmation' && offered.has(result.suggestedId)) {
                    item.suggestedId = result.suggestedId; item.matchStatus = 'confirmation';
                } else item.matchStatus = 'manual';
            }
        }
    }
}
export function totalFor(ingredients, servings, catalog) {
    return Object.fromEntries(Object.keys(nutrients).map(key => {
        if (!ingredients.length) return [key, null];
        let total = 0;
        for (const item of ingredients) {
            const value = catalog.get(item.foodId)?.nutrients[key];
            if (value == null || !Number.isFinite(item.grams) || item.grams <= 0 || item.grams > 50000) return [key, null];
            total += value * item.grams / (100 * servings);
        }
        return [key, total];
    }));
}
export function writeDraft(recipes) {
    const account = accountKey();
    if (!account || account === 'anonymous') throw new Error('로그인 후 이용해 주세요.');
    const value=JSON.stringify({account,created:Date.now(),recipes});
    sessionStorage.setItem('smartnf.food-studio.v1',value);
    try{localStorage.setItem(`smartnf.meal-cart:${account}`,value);}catch{}
}
export function readDraft() {
    try {
        const draft = JSON.parse(localStorage.getItem(`smartnf.meal-cart:${accountKey()}`)||sessionStorage.getItem('smartnf.food-studio.v1'));
        if (draft?.account !== accountKey() || Date.now() - draft.created > 7*24*3600000 || !Array.isArray(draft.recipes)
                || draft.recipes.length > 20) return [];
        return draft.recipes.filter(recipe => typeof recipe.name === 'string' && Number.isInteger(recipe.servings)
            && recipe.servings > 0 && recipe.servings <= 24 && Array.isArray(recipe.ingredients) && recipe.ingredients.length <= 25
            && recipe.ingredients.every(text => typeof text === 'string'));
    } catch { return []; }
}
export function foodPicker(item, catalog, onChange) {
    const root = element('div', undefined, 'fs-food-editor');
    root.dataset.ingredientName=item.name||item.text||'재료';
    const title = element('strong', item.text || '음식 선택');
    const sourceName = item.name || (item.text || '').replace(/\s*\d+(?:\.\d+)?\s*g\s*$/i, '').trim();
    let liveSummary;
    function refreshTitle() {
        const amount = Number.isFinite(item.grams) ? `${format(item.grams)}g` : '분량 확인 필요';
        title.textContent = `${sourceName || '재료'} ${amount}`;
        if (Number.isFinite(item.grams)) item.text = `${sourceName} ${item.grams}g`;
        if (liveSummary) {
            const label = catalog.get(item.foodId)?.ai ? 'AI 추정 자료' : item.matchStatus === 'reference' ? '추정 기준' : item.matchStatus === 'local_llm' ? 'AI 연결' : item.matchStatus === 'confirmed' ? '확인 완료' : '이름 일치';
            liveSummary.textContent = `${title.textContent} · ${label}: ${catalog.get(item.foodId)?.name || '항목 확인 필요'}`;
        }
    }
    const queryLabel = element('label', '영양 DB에서 찾기');
    const query = element('input');
    query.type = 'search'; query.placeholder = '예: 두부, 돼지고기 삼겹살'; query.maxLength = 80;
    const selectLabel = element('label', '재료·조리 상태 확인');
    const select = element('select');
    function options(term = '') {
        select.replaceChildren(new Option('항목을 확인해 주세요', ''));
        const match = [...catalog.values()].filter(food => normalizeName(food.name).includes(normalizeName(term))).slice(0, 20);
        for (const candidate of [...(item.candidates || [])].reverse()) {
            if (!match.some(food => food.id === candidate.id) && catalog.has(candidate.id)) match.unshift(catalog.get(candidate.id));
        }
        if (item.foodId && catalog.has(item.foodId) && !match.some(food => food.id === item.foodId)) match.unshift(catalog.get(item.foodId));
        for (const food of match) select.add(new Option(`${food.ai?'[AI 추정] ':''}${food.name}`, food.id));
        select.value = item.foodId;
    }
    options(item.foodId ? catalog.get(item.foodId)?.name : (item.text || '').replace(/\s*\d+(\.\d+)?g$/, ''));
    query.addEventListener('input', () => options(query.value));
    select.addEventListener('change', () => { item.foodId = select.value; item.matchStatus = 'confirmed'; refreshTitle(); onChange(); });
    const gramsLabel = element('label', '전체 분량 (g)');
    const grams = element('input');grams.dataset.amountField='true';grams.setAttribute('aria-label',`${sourceName||'재료'} 전체 분량(g)`);
    Object.assign(grams, { type: 'number', min: '0.01', max: '50000', step: '0.01' });
    grams.value = item.grams ?? '';
    const updateGrams = () => { item.grams = grams.valueAsNumber;if(item.quantities)item.quantities=item.quantities.map(q=>q.unit==='g'?{...q,amount:item.grams,evidence:'사용자 확인 중량'}:q); refreshTitle(); onChange(); };
    grams.addEventListener('input', updateGrams);
    grams.addEventListener('change', updateGrams);
    queryLabel.append(query); selectLabel.append(select); gramsLabel.append(grams);
    root.append(title, queryLabel, selectLabel, gramsLabel);
    if (item.conversionNote) root.append(element('p', item.conversionNote));
    if (item.suggestedId && !item.foodId && catalog.has(item.suggestedId)) {
        const suggestion = element('p', `AI 제안 · ${catalog.get(item.suggestedId).name} — 종류·부위를 확인해 주세요.`);
        const accept = button('이 항목으로 확인', () => {
            item.foodId = item.suggestedId; item.matchStatus = 'confirmed';
            select.value = item.foodId; suggestion.textContent = '선택한 DB 항목을 적용했습니다.';
            accept.disabled = true; refreshTitle(); onChange();
        });
        root.append(suggestion, accept);
    } else if (item.matchStatus === 'manual') {
        root.append(element('p', '자동 연결을 확정하지 못했습니다. 후보 또는 검색에서 항목을 선택해 주세요.'));
    }
    if(catalog.get(item.foodId)?.ai)root.append(element('p','AI 추정 자료','fs-ai-label'));
    if (item.foodId && catalog.has(item.foodId)) {
        const details = element('details');
        liveSummary = element('summary');
        refreshTitle();
        details.append(liveSummary, root);
        if (['local_llm', 'reference'].includes(item.matchStatus)) root.append(element('p', '일반 재료 투입 기준으로 연결했습니다. 실제 재료·조리 상태가 다르면 변경하세요.'));
        return details;
    }
    return root;
}
export function renderBars(root, meals, keys = ['energy', 'carbohydrate', 'protein', 'fat', 'saturated_fat', 'sugars', 'sodium', 'fiber']) {
    root.replaceChildren();
    if (meals.some(meal => keys.some(key => meal.coverage?.[key] !== undefined && meal.coverage[key] < (meal.totalByNutrient?.[key]??meal.total)))) {
        const legend = element('p', '점선 막대는 확인된 재료의 일부 합계입니다. 전체 음식 값이나 음식 간 우열 판단에 사용하지 마세요.', 'fs-partial-legend');
        legend.style.gridColumn = '1 / -1'; root.append(legend);
    }
    for (const key of keys) {
        const info = nutrients[key];
        const section = element('section', undefined, 'fs-chart');
        section.append(element('h4', `${info.label} · ${info.unit}`));
        const max = Math.max(1, ...meals.map(meal => meal.values[key] ?? 0));
        meals.forEach((meal, index) => {
            const row = element('div', undefined, 'fs-bar-row');
            const value = meal.values[key];
            const track = element('div', undefined, 'fs-bar-track');
            const bar = element('span', undefined, `fs-bar fs-color-${index % 5}`);
            bar.style.width = value == null ? '0%' : `${value / max * 100}%`;
            track.append(bar);
            const covered = meal.coverage?.[key];
            const total=meal.totalByNutrient?.[key]??meal.total;
            const partial = covered !== undefined && covered < total;
            if (partial) bar.classList.add('fs-bar-partial');
            const aiCount=meal.aiCoverage?.[key]||0;
            if(aiCount)bar.classList.add('fs-bar-ai');
            const shown = value == null ? '자료 부족' : `${format(value)} ${info.unit}${partial ? ` · 일부 합계 (${covered}/${total}개)` : ''}`;
            const valueNode=element('strong',shown);
            if(aiCount)valueNode.append(element('small','AI 추정 자료','fs-ai-label'));
            row.append(element('span', meal.name, 'fs-bar-label'), track, valueNode);
            track.setAttribute('aria-label', `${meal.name} ${info.label} · ${shown}${aiCount?" · AI 추정 자료":""}`);
            if (partial) row.title = `${total}개 재료 중 ${covered}개의 자료만 반영했습니다. 전체 음식 영양값이 아닙니다.`;
            section.append(row);
        });
        root.append(section);
    }
}

function aiFood(e){return {id:e.id,name:e.name,version:`${e.model} · ${e.createdAt}`,source:'AI 추정 자료 (공식 검증 아님)',basis:'100g',group:'AI_ESTIMATE',nutrients:e.nutrients,ai:true,aiKeys:e.aiKeys,referenceFoodId:e.referenceFoodId};}
export function addToMealCart(incoming) {
    const cart=readDraft();
    for(const recipe of incoming){const key=normalizeName(recipe.name);const index=cart.findIndex(r=>normalizeName(r.name)===key);if(index>=0)cart[index]=recipe;else cart.push(recipe);}
    if(cart.length>20)throw new Error('한 끼에는 최대 20개 요리를 담을 수 있습니다. 담은 요리를 먼저 빼주세요.');
    writeDraft(cart);return cart;
}
