(() => {
    const form = document.querySelector("#recipe-finder");
    const modes = form.querySelectorAll('input[name="recipe-mode"]');
    const selectedMode = () => form.querySelector('input[name="recipe-mode"]:checked').value;
    const ingredients = document.querySelector("#recipe-ingredients");
    const foodName = document.querySelector("#recipe-food-name");
    const calories = document.querySelector("#recipe-calories");
    const submit = document.querySelector("#recipe-submit");
    const rerollStatus=document.getElementById("recipe-reroll-status");const rerollButton=document.getElementById("recipe-reroll");let requestedReroll=false;
    rerollButton.addEventListener("click",()=>{if(saving||pendingSave||pending||!entries.length)return;requestedReroll=true;form.requestSubmit();requestedReroll=false;});
    const feedback = document.querySelector("#recipe-feedback");
    const consent = document.querySelector("#recipe-ai-consent");
    const consentText = document.querySelector("#recipe-consent-text");
    const results = document.querySelector("#recipe-results");
    const cards = document.querySelector("#recipe-cards");
    const template = document.querySelector("#recipe-card-template");
    const save = document.querySelector("#recipe-save");
    const actionFeedback = document.querySelector("#recipe-action-feedback");
    const recipePhotos = [
        { name: /^(?:돼지고기)?김치찌[개게]$/, file: "kimchi-jjigae.png" },
        { name: /^(?:(?:노릇노릇한|노릇하게구운|바삭한|집에서굽는|돼지고기|돼지|팬에굽는|팬으로굽는|기본|통|대패))*삼겹살(?:팬)?(?:구이)?(?:\(팬구이\))?$/, file: "samgyeopsal-gui.png" }
    ];
    const parameters = new URLSearchParams(location.search);
    const initialChoice = [...modes].find(choice => choice.value === parameters.get("mode"));
    if (initialChoice) initialChoice.checked = true;
    ingredients.value = (parameters.get("ingredient") || "").slice(0, 200);

    const token = document.querySelector('meta[name="_csrf"]')?.content;
    const header = document.querySelector('meta[name="_csrf_header"]')?.content;
    const account = document.querySelector("header[data-account-key]")?.dataset.accountKey;
    let pending;
    let entries = [];
    let saving = false;
    let pendingSave;

    function request(url, data, options = {}) {
        return fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json", Accept: "application/json", [header]: token, ...(account ? { "X-SmartNF-Account": account } : {}), ...options.headers },
            body: JSON.stringify(data),
            signal: options.signal
        });
    }

    function updateSave() {
        const count=entries.filter(entry=>entry.selection.checked&&entry.valid).length;
        save.disabled=saving||Boolean(pending)||(!pendingSave&&!count);
        save.textContent=pendingSave?'등록 결과 다시 확인':`선택한 요리 등록 · ${count}개`;
        for(const entry of entries){const selected=entry.selection.checked;const control=entry.part('recipe-compare');control.textContent=selected?'담기 선택됨 · 해제':'한 끼에 담기';control.setAttribute('aria-pressed',String(selected));entry.card.classList.toggle('recipe-chosen',selected);}
    }
    async function stableKey(recipe){
        const bytes=new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(recipe)))).slice(0,16);
        bytes[6]=(bytes[6]&15)|128;bytes[8]=(bytes[8]&63)|128;
        const h=[...bytes].map(n=>n.toString(16).padStart(2,'0')).join('');return `${h.slice(0,8)}-${h.slice(8,12)}-${h.slice(12,16)}-${h.slice(16,20)}-${h.slice(20)}`;
    }

    function clearResults() {
        if (pendingSave) return;
        pending?.abort();
        pending = undefined;
        submit.disabled = false;rerollButton.disabled=true;rerollStatus.textContent="";cards.inert=false;
        entries = [];
        window.dispatchEvent(new Event("smartnf-recipes-cleared"));
        cards.replaceChildren();
        results.hidden = true;
        feedback.textContent = "";
        actionFeedback.textContent = "";
        updateSave();
    }

    const dietProfileField = document.querySelector("#recipe-condition");
    const otherConditionField = document.querySelector("#recipe-other-condition-field");
    const otherConditionInput = document.querySelector("#recipe-other-condition");

    function updateConditionFields() {
        const isOther = selectedMode() === "conditions" && dietProfileField.value === "other";
        otherConditionField.hidden = !isOther;
        otherConditionInput.disabled = !isOther;
        otherConditionInput.required = isOther;
        if (selectedMode() === "conditions") {
            consentText.textContent = isOther
                ? "입력한 질환명과 제외 조건으로 Gemini 추천을 요청하고, 음식·재료명으로 부족한 영양값을 자동 추정·저장하는 데 동의합니다."
                : "식사 기준과 제외 조건으로 Gemini 추천을 요청하고, 음식·재료명으로 부족한 영양값을 자동 추정·저장하는 데 동의합니다.";
        }
    }

    let previousMode = null;
    function showMode() {
        const mode = selectedMode();
        const fieldFor = key => key === "ingredients" ? ingredients : key === "food-name" ? foodName : null;
        const previous = fieldFor(previousMode), next = fieldFor(mode);
        if (previousMode !== mode && previous && next && !next.value.trim() && previous.value.trim().length <= next.maxLength) next.value = previous.value.trim();
        previousMode = mode;
        for (const panel of form.querySelectorAll("[data-recipe-mode]")) {
            const active = panel.dataset.recipeMode === mode;
            panel.hidden = !active;
            for (const field of panel.querySelectorAll("input, select")) field.disabled = !active;
        }
        const inputs = { ingredients: "재료 목록", "food-name": "음식명", goal: "열량 상한", conditions: "식사 기준과 재료 제외 조건" };
        consentText.textContent = `${inputs[mode]} 정보로 Gemini 추천을 요청하고, 음식·재료명으로 부족한 영양값을 자동 추정·저장하는 데 동의합니다.`;
        updateConditionFields();
        consent.checked = false;
        clearResults();
    }

    function renderList(list, items) {
        list.replaceChildren(...items.map(item => {
            const row = document.createElement("li");
            row.textContent = item;
            return row;
        }));
    }

    async function loadPhoto(entry, signal) {
        const figure = entry.part("recipe-generated-photo");
        const credit = entry.part("recipe-photo-credit");
        const image = figure.querySelector("img");
        const name = entry.recipe.name;
        image.alt = `${name} 참고 사진`;
        image.addEventListener("load", () => {
            figure.hidden = false;
            credit.hidden = !credit.querySelector("a[href]");
        }, { once: true });
        const key = name.normalize("NFKC").replace(/\s+/g, "").replace(/[.!。]+$/, "");
        const local = recipePhotos.find(item => item.name.test(key));
        if (local) {
            image.src = `/images/recipes/${local.file}`;
            return;
        }
        try {
            const response = await request("/api/recipes/commons-photo", { name, discover: true }, { signal });
            if (!response.ok || response.status === 204 || response.redirected) return;
            const photo = await response.json();
            if (signal.aborted) return;
            const source = entry.part("recipe-photo-source");
            source.href = photo.source;
            source.textContent = `${photo.title || name} · ${photo.author} · ${photo.provider || "Wikimedia Commons"}`;
            const license = entry.part("recipe-photo-license");
            license.href = photo.licenseUrl;
            license.textContent = photo.license;
            image.src = photo.image;
        } catch {
            // The recipe remains usable while a reference photo is unavailable.
        }
    }

    save.addEventListener("click", async () => {
        const selected = pendingSave?.selected ?? entries.filter(entry => entry.selection.checked && entry.valid);
        if (saving || pending || !selected.length) return;
        if (!account || !token || !header) {
            actionFeedback.textContent = "로그인 상태를 확인하고 페이지를 다시 열어 주세요.";
            return;
        }

        saving = true;rerollButton.disabled=true;
        form.inert = true;
        cards.inert = true;
        updateSave();
        actionFeedback.textContent = "선택한 레시피를 등록하고 있습니다.";
        try {
            if (!pendingSave) {
                if(!window.smartnfMealRegistration)throw new Error('화면 기능을 불러오지 못했습니다. 새로고침해 주세요.');
                const recipes=window.smartnfMealRegistration.prepare(selected);
                const items=await Promise.all(recipes.map(async (value,index)=>{
                    const recipe={name:value.name,servings:value.servings,minutes:value.minutes,ingredients:value.ingredients,steps:value.steps};
                    const baseRecipe=selected[index].baseRecipe||selected[index].recipe;
                    return {key:await stableKey({recipe,baseRecipe}),recipe,baseRecipe};
                }));
                pendingSave = { selected, items, recipes };
            }
            const { items } = pendingSave;
            const response = await request("/api/me/recipes/batch", { items }, { headers: { "X-SmartNF-Account": account } });
            const failureMessages = {
                400: "레시피 이름, 분량 또는 조리법 형식이 올바르지 않아 등록하지 못했습니다.",
                401: "로그인한 뒤 다시 시도해 주세요.",
                403: "로그인 상태 또는 권한을 확인하고 페이지를 다시 열어 주세요.",
                404: "일괄 등록 기능을 서버에서 찾지 못했습니다. 최신 파일 적용과 서버 재시작을 확인해 주세요.",
                405: "일괄 등록 기능이 서버에 적용되었는지 확인해 주세요.",
                409: "로그인 계정이 바뀌었거나 이전 등록 요청과 충돌했습니다. 현재 계정의 MyRecipe를 확인해 주세요."
            };
            if (response.redirected || failureMessages[response.status]) {
                // A later rejection does not establish what happened to an earlier request.
                if (!pendingSave.uncertain) pendingSave = undefined;
                actionFeedback.textContent = response.redirected
                    ? "로그인이 필요합니다. 로그인한 뒤 MyRecipe를 확인해 주세요."
                    : failureMessages[response.status];
                return;
            }
            if (!response.ok) throw new Error("Save failed");
            const { numbers } = await response.json();
            if (!Array.isArray(numbers) || numbers.length !== selected.length
                    || !numbers.every(number => Number.isSafeInteger(number) && number > 0)) {
                throw new Error("Missing numbers");
            }
            window.smartnfMealRegistration.commit(pendingSave.recipes);
            pendingSave = undefined;
            selected.forEach(entry => {
                entry.saved = true;
                entry.selection.checked = false;
                entry.selection.disabled = false;
                entry.part("recipe-card-feedback").textContent = `‘${entry.recipe.name}’을(를) 한 끼 목록과 MyRecipe에 등록했습니다.`;
            });
            actionFeedback.textContent = selected.length === 1
                ? `‘${selected[0].recipe.name}’을(를) 한 끼 목록과 MyRecipe에 등록했습니다.`
                : `선택한 레시피 ${selected.length}개를 한 끼 목록과 MyRecipe에 등록했습니다.`;
        } catch (error) {
            if (pendingSave) {
                pendingSave.uncertain = true;
                actionFeedback.textContent = "서버 응답을 확인하지 못했습니다. ‘등록 결과 다시 확인’을 누르면 같은 요청으로 확인합니다.";
            } else {
                actionFeedback.textContent = error.message || "등록 요청을 만들지 못했습니다. 페이지를 다시 열어 주세요.";
            }
        } finally {
            saving = false;rerollButton.disabled=Boolean(pendingSave)||!entries.length;
            form.inert = Boolean(pendingSave);
            cards.inert = Boolean(pendingSave);
            save.textContent = pendingSave ? "등록 결과 다시 확인" : "선택한 레시피 등록";
            updateSave();
        }
    });

    async function loadCatalog(signal) {
        const response = await fetch("/js/data/food-nutrition/recipe-goal-references.tsv", { signal });
        if (!response.ok || response.redirected) throw new Error("Missing references");
        const catalog = new Map();
        for (const line of (await response.text()).split(/\r?\n/)) {
            const [, name, , , basis, , energy, protein, , , sodium] = line.split("\t");
            const values = [energy, protein, sodium];
            if (basis === "100g edible portion"
                    && values.every(value => value?.trim() && Number.isFinite(Number(value)) && Number(value) >= 0)) {
                catalog.set(name, values.map(Number));
            }
        }
        if (!catalog.size) throw new Error("Empty references");
        return catalog;
    }

    function showGoalNutrition(entry, limit, catalog, signal) {
        entry.part("recipe-goal-editor").hidden = false;
        const result = entry.part("recipe-candidate-summary");
        const formatter = new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 1 });
        const rows = entry.recipe.ingredients.map(ingredient => {
            const [, name, amount] = ingredient.match(/^(.+) ([0-9]+(?:\.[0-9]+)?)g$/);
            const row = document.createElement("div");
            row.className = "ui-fields";
            const weightLabel = document.createElement("label");
            weightLabel.textContent = `${name} · 전체 분량 (g)`;
            const grams = document.createElement("input");
            Object.assign(grams, { type: "number", min: "0.01", max: "5000", step: "0.01", required: true, value: amount });
            weightLabel.append(grams);
            const referenceLabel = document.createElement("label");
            referenceLabel.textContent = `${name} · 영양 DB 항목`;
            const select = document.createElement("select");
            select.add(new Option("확인된 항목 없음", ""));
            referenceLabel.append(select);
            row.append(weightLabel, referenceLabel);
            return { row, name, grams, select };
        });
        entry.part("recipe-goal-ingredients").replaceChildren(...rows.map(item => item.row));
        let valuesByName = new Map();
        let unavailable = false;

        function estimate() {
            const totals = [0, 0, 0];
            let matched = 0;
            for (const { grams, select } of rows) {
                const values = valuesByName.get(select.value);
                if (!values || !grams.validity.valid) continue;
                matched++;
                values.forEach((value, index) => {
                    totals[index] += value * grams.valueAsNumber / (100 * entry.recipe.servings);
                });
            }
            const complete = matched === rows.length;
            entry.rank = complete ? (totals[0] <= limit ? 0 : 2) : 1;
            if (!matched) {
                result.textContent = unavailable ? "영양성분 자료를 불러오지 못했습니다."
                    : "열량 확인 필요 · 확인된 재료의 영양 자료가 없습니다.";
                return;
            }
            const units = ["kcal", "g 단백질", "mg 나트륨"];
            const summary = totals.map((value, index) => `${formatter.format(value)} ${units[index]}`).join(" · ");
            result.textContent = complete
                ? `1인분 추정값 · ${summary} · 목표 ${limit} kcal 이하 ${entry.rank === 0 ? "충족" : "초과"}`
                : `1인분 부분 합계 · ${summary} (${matched}/${rows.length}개 재료) · 열량 확인 필요`;
        }

        for (const { grams, select } of rows) {
            grams.addEventListener("input", () => {
                entry.valid = rows.every(item => item.grams.validity.valid);
                entry.selection.disabled = !entry.valid;
                entry.part("recipe-compare").disabled = !entry.valid;
                if (entry.valid) {
                    const updated = rows.map(item => `${item.name} ${item.grams.valueAsNumber}g`);
                    if (updated.some((ingredient, index) => ingredient !== entry.recipe.ingredients[index])) {
                        entry.recipe.ingredients = updated;
                        entry.key = undefined;
                        entry.saved = false;
                        entry.selection.disabled = false;
                        entry.part("recipe-card-feedback").textContent = "";
                        renderList(entry.part("recipe-generated-ingredients"), updated);
                        window.dispatchEvent(new CustomEvent("smartnf-recipe-updated"));
                    }
                }
                estimate();
                updateSave();
            });
            select.addEventListener("change", estimate);
        }

        result.textContent = "영양성분 자료를 불러오는 중입니다.";
        return catalog.then(data => {
            if (signal.aborted) return;
            valuesByName = data;
            unavailable = !data.size;
            for (const { name, select } of rows) {
                for (const reference of data.keys()) select.add(new Option(reference, reference));
                if (data.has(name)) select.value = name;
            }
            estimate();
        });
    }

    function makeCard(recipe, mode, conditions, dietRule) {
        const card = template.content.firstElementChild.cloneNode(true);
        const part = name => card.querySelector(`[data-part="${name}"]`);
        const selection = part("recipe-select");
        const entry = { card, part, selection, valid: true, rank: 1, recipe: {
            name: recipe.name, servings: recipe.servings, minutes: recipe.minutes,
            ingredients: recipe.ingredients, steps: recipe.steps
        } };
        entry.baseRecipe=JSON.parse(JSON.stringify(entry.recipe));
        part("recipe-generated-name").textContent = recipe.name;
        part("recipe-generated-meta").textContent = `${recipe.servings}인분 · 약 ${recipe.minutes}분`;
        selection.setAttribute("aria-label", `${recipe.name} 담기 선택 상태`);
        selection.addEventListener("change", updateSave);
        part("recipe-compare").addEventListener("click", () => {
            if(!entry.valid||saving||pendingSave)return;
            selection.checked=!selection.checked;updateSave();
            part('recipe-card-feedback').textContent=selection.checked?'선택했습니다. 아래 ‘선택한 요리 등록’을 눌러 저장하세요.':'';
        });

        if (mode === "ingredients") {
            part("recipe-all-ingredients").hidden = true;
            part("recipe-ingredient-summary").hidden = false;
            renderList(part("recipe-available"), recipe.availableIngredients);
            renderList(part("recipe-missing"), recipe.additionalIngredients.length ? recipe.additionalIngredients : ["없음"]);
            part("recipe-candidate-summary").textContent =
                `보유 재료 ${recipe.availableIngredients.length}개 · 추가 재료 ${recipe.additionalIngredients.length}개`;
        } else {
            renderList(part("recipe-generated-ingredients"), recipe.ingredients);
        }
        if (mode === "conditions") {
            const labels = { salt: "소금", "soy-sauce": "간장", oil: "식용유", egg: "달걀" };
            const exclusions = conditions.length
                ? ` · 제외 재료: ${conditions.map(key => labels[key]).join(", ")}`
                : "";
            part("recipe-candidate-summary").textContent =
                `추천에 요청한 식사 기준 · ${dietRule}${exclusions} 조리 순서와 실제 제품 성분은 확인해 주세요.`;
        }
        renderList(part("recipe-generated-steps"), recipe.steps);
        return entry;
    }

    form.addEventListener("input", event => {
        if (event.target !== consent) consent.checked = false;
        clearResults();
    });
    dietProfileField.addEventListener("change", () => {
        updateConditionFields();
        consent.checked = false;
    });
    for (const mode of modes) mode.addEventListener("change", showMode);
    form.addEventListener("submit", async event => {
        event.preventDefault();
        if (saving || pendingSave) return;
        const reroll=requestedReroll;
        const excludedRecipeNames=reroll?entries.map(e=>e.recipe.name):[];
        const mode = selectedMode();
        const conditions = [...form.querySelectorAll('input[name="recipe-exclusion"]:checked')].map(input => input.value);
        const dietProfile = dietProfileField.value;
        const conditionName = otherConditionInput.value.trim();
        if (mode === "conditions" && !dietProfile) {
            feedback.textContent = "질환·관리 항목을 선택해 주세요.";
            return;
        }
        if (mode === "conditions" && dietProfile === "other" && !conditionName) {
            feedback.textContent = "질환명을 입력해 주세요.";
            return;
        }
        if (!token || !header) {
            feedback.textContent = "로그인 상태를 확인하고 페이지를 다시 열어 주세요.";
            return;
        }
        if (!consent.checked) {
            feedback.textContent = "레시피 추천을 위해 Gemini 전송에 동의해 주세요.";
            consent.focus();
            return;
        }
        let tastePreferences;
        try {
            if (document.getElementById("recipe-use-preferences")?.checked && !window.smartnfRecipePreferences) throw new Error("취향 기능을 불러오지 못했습니다. 화면을 새로고침해 주세요.");
            tastePreferences = window.smartnfRecipePreferences?.payload() || { usePreferences: false, manualTasteEnabled: false };
        }
        catch (error) { feedback.textContent = error.message; return; }
        const data = {
            ingredients: { availableIngredients: ingredients.value.trim() },
            "food-name": { foodName: foodName.value.trim() },
            goal: { calorieLimit: calories.valueAsNumber },
            conditions: { conditions, dietProfile, ...(dietProfile === "other" ? { conditionName } : {}) }
        }[mode];
        if(!reroll)clearResults();else{pending?.abort();cards.inert=true;}
        const controller = new AbortController();
        pending = controller;
        const { signal } = controller;
        submit.disabled = true;rerollButton.disabled=true;save.disabled=true;if(reroll)rerollStatus.textContent="기존 음식을 제외하고 새 후보를 찾고 있습니다…";
        // Keep consent for retrying the same conditions; edits revoke it.
        feedback.textContent = "레시피 5개를 찾고 있습니다. 부족하면 한 번 더 요청하므로 시간이 더 걸릴 수 있습니다.";
        try {
            const response = await request("/api/recipes/generate-candidates", { ...data, ...tastePreferences, consent: true, ...(reroll?{excludedRecipeNames}:{}) }, { signal });
            if (signal.aborted) return;
            if (response.redirected || response.status === 401 || response.status === 403) {
                feedback.textContent = "로그인 상태를 확인하고 페이지를 다시 열어 주세요.";
                return;
            }
            if (!response.ok) {
                const messages = {
                    400: "입력 형식 또는 취향 설정을 서버에서 처리하지 못했습니다. 최신 수정 파일 적용 후 다시 시도해 주세요.",
                    429: "요청이 많습니다. 잠시 후 다시 시도해 주세요.",
                    503: "서버의 Gemini 설정을 확인해 주세요."
                };
                feedback.textContent = messages[response.status] || "레시피 추천에 실패했습니다. 다시 시도해 주세요.";
                return;
            }
            let recipes = await response.json();
            sessionStorage.setItem(`smartnf.nutrition-auto-consent.v2:${account}`,'yes');

            if (signal.aborted) return;
            if (!Array.isArray(recipes)) throw new Error("Invalid recipe response");
            if(reroll){const key=n=>n.normalize("NFKC").toLowerCase().replace(/[^\p{L}\p{N}]/gu,"");const excluded=new Set(excludedRecipeNames.map(key));recipes=recipes.filter(r=>typeof r.name==='string'&&!excluded.has(key(r.name)));}
            if (!recipes.length) {
                feedback.textContent = reroll?"이전 음식을 제외한 새 후보를 찾지 못했습니다. 기존 추천은 유지했습니다. 조건을 바꾸거나 다시 시도해 주세요.":"조건에 맞는 후보를 찾지 못했습니다. 조건을 바꿔 다시 시도해 주세요.";
                return;
            }
            const encodedRule = response.headers?.get("X-SmartNF-Diet-Rule");
            if (mode === "conditions" && !encodedRule) {
                feedback.textContent = "서버에서 적용한 식사 기준을 확인하지 못했습니다. 서버 업데이트 후 다시 시도해 주세요.";
                return;
            }
            const dietRule = encodedRule ? decodeURIComponent(encodedRule.replace(/\+/g, " ")) : "";
            entries = recipes.map(recipe => makeCard(recipe, mode, conditions, dietRule));
            cards.replaceChildren(...entries.map(entry => entry.card));
            results.hidden = false;
            window.dispatchEvent(new CustomEvent("smartnf-recipes-ready", { detail: { entries } }));
            const generatedCount = Number(response.headers?.get("X-SmartNF-Candidate-Count"));
            const attempts = Number(response.headers?.get("X-SmartNF-Candidate-Attempts")) || 1;
            updateSave();
            let message = `레시피 후보 ${entries.length}개입니다 (목표 5개).`;
            if(reroll)message += " 이전 음식은 제외했습니다. 등록한 요리는 유지됩니다.";
            if (attempts > 1) message += " 부족한 후보를 한 번 더 요청했습니다.";
            if (entries.length < 5) {
                message += ` 현재 조건으로 확보한 유효 후보는 ${entries.length}개입니다. 조건을 바꿔 다시 추천받을 수 있습니다.`;
            } else if (generatedCount > entries.length) {
                message += " 받은 후보에서 중복과 조건·형식을 확인해 5개를 표시했습니다.";
            }
            const encodedTaste = response.headers?.get("X-SmartNF-Taste-Applied");
            if (encodedTaste) message += " " + decodeURIComponent(encodedTaste.replace(/\+/g, " "));
            else if (tastePreferences.usePreferences) message += " 취향 적용 정보를 확인하지 못했습니다. 서버 업데이트 상태를 확인해 주세요.";
            feedback.textContent = message;
            for (const entry of entries) loadPhoto(entry, signal);
            if (mode === "goal") {
                const catalog = loadCatalog(signal).catch(() => new Map());
                Promise.all(entries.map(entry => showGoalNutrition(entry, data.calorieLimit, catalog, signal))).then(() => {
                    if (signal.aborted || cards.contains(document.activeElement)) return;
                    entries.sort((a, b) => a.rank - b.rank);
                    cards.append(...entries.map(entry => entry.card));
                });
            }
        } catch {
            if (!signal.aborted) feedback.textContent = "레시피를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.";
        } finally {
            if (pending === controller){if(reroll)rerollStatus.textContent=feedback.textContent;pending=undefined;submit.disabled=false;rerollButton.disabled=!entries.length;cards.inert=Boolean(pendingSave);updateSave();}
        }
    });

    showMode();
})();
