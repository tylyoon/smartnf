import {additionRequest,additionCandidates} from './meal-additions.js?v=add236';
import {prepareSingleMeal,createSingleMealRecommender} from './single-meal-gemini.js?v=edit235';
import {generateGeminiPeriod,periodCriteria,createPeriodApi} from './gemini-period.js?v=add236';
import {snapshotPlate} from './plate-editor.js?v=edit235';
import {mountShoppingSave} from './shopping-client.js?actions267';
import {previousMonthDates,mapDates,compareMonths} from './month-comparison.js';
import {monthWeeks,chooseMonthWeek,slotsInWeek} from './month-weeks.js';
import {selectedMeals,shoppingItems,mergePeriodPlans,verifySavedDay} from './period-operations.js?actions267';
import {renderGoalNutrition,assessNutrients} from './nutrient-goals.js?v=month219';
import {POLICY_VERSION,SOURCES,COMBINATION_TYPES,combinationType} from './period-criteria.js?v=library223';
import {planInput,toSimulationPlan,compareSavedWeek} from './simulator-plan-data.js?actions267';
import {readStudioDraft,writeStudioDraft,loadMealTransfer,acknowledgeMealTransfer,recipeIdentity,clearStudioDraft} from './studio-draft.js';
import {completeNutrition,automaticNutritionEnabled} from './nutrition-auto.js?v=clarity217';
import { buildSlots, replaceSlot, slotParts, estimate, mergeOwnedPlans, slotKey } from './meal-plan-state.js';
import { api, element, button, loadCatalog, parseRecipe, resolveIngredientMatches, foodPicker, readDraft, writeDraft,
    totalFor, nutrients, format, accountKey, normalizeName } from './food-studio-core.js';
const $ = id => document.getElementById(id);
const labels = { breakfast: '아침', lunch: '점심', dinner: '저녁', snack: '간식' };
const today = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Seoul' }).format(new Date());
const addDays = (date, count) => { const value = new Date(`${date}T12:00:00Z`); value.setUTCDate(value.getUTCDate() + count); return value.toISOString().slice(0, 10); };
let catalog=new Map();let catalogLoading=null;let catalogReady=false,draftReady=false;const appliedTransfers=new Set();
let recipes = [];
let plateSnapshots=[];
let periodGeneration=null;
const periodMessages={week:'',month:''};
let redrawLibraryOptions=()=>{};
let view = 'meal';
let period = [];
let monthWeekStart='';
let previousMonthEntries=[],previousMonthKey='',previousMonthLoading=false;
const periods = { week: [], month: [] };
const criteriaFor={week:null,month:null};
function readPeriodCriteria(){
 const number=id=>$(id).value.trim()===''?null:Number($(id).value);
 return {sex:$('fs-reference-sex').value,ageBand:$('fs-reference-age').value,personal:Object.fromEntries(['carbohydrate','protein','fat','saturated_fat','sugars','fiber'].map(k=>[k,number('fs-personal-'+k)])),general:$('fs-criteria-general').checked,special:$('fs-criteria-special').checked,lowerSodium:$('fs-criteria-bp').checked,fiber:$('fs-criteria-fiber').checked,energy:number('fs-goal-energy'),sodium:number('fs-goal-sodium'),minutes:null,targetSource:$('fs-goal-source').value,excluded:$('fs-criteria-excluded').value.split(/[,，\n]/)};
}
function renderCriteriaReport(result){
 const root=$('fs-criteria-report');root.replaceChildren(element('strong',result.provider==='GEMINI'?'Gemini 식단 제안 · SmartNF 검증':'적용 기준 · '+POLICY_VERSION));
 root.append(element('p',result.notes.join(' ')));
 root.append(element('p',(result.provider==='GEMINI'?'Gemini가 조합·배치를 제안하고 SmartNF가 날짜·끼니·레시피와 기재된 제외 조건을 확인합니다. 개인 목표는 ':'반복 완화·제외 조건은 SmartNF 배치 규칙입니다. 개인 목표는 ')+(result.criteria.energy==null&&result.criteria.sodium==null?'미설정':result.criteria.targetSource==='clinician'?'사용자가 입력한 의료진 안내값':'사용자가 입력한 참고값')+'이며 자동 처방이 아닙니다.'));
 for(const source of SOURCES.filter(x=>x.id==='KDRI2025'&&result.criteria.general||x.id==='KDCA-BP'&&result.criteria.lowerSodium||x.id==='KDA2025'&&result.criteria.fiber)){const link=element('a',source.title+' · '+source.section);link.href=source.url;link.target='_blank';link.rel='noopener noreferrer';root.append(link,element('p','원문 확인일 '+source.checked));}
}

function nutritionItems(){return [...plateSnapshots.flatMap(r=>r.portions),...recipes.flatMap(r=>r.portions),...Object.values(periods).flat().flatMap(slot=>[...(slot.custom||[]),...(slot.recommended||[])].flatMap(part=>part.ingredients))];}
let editingTarget = null;
let building = false;
let baseline = new Map();
let before = null;
let beforeAiCoverage={};
let active = new Map();
let pendingSave = null;
let saving = false;
let changed = false;
let revision = 0;
const savedSignatures = new Set();
const sides = [
    { id: 'rda_10_4:A013000A039a', name: '백미밥', grams: 150, group: '밥·주식' },
    { id: 'rda_10_4:A013000A069a', name: '현미밥', grams: 150, group: '밥·주식' },
    { id: 'rda_10_4:B0060000009e', name: '찐 고구마', grams: 100, group: '밥·주식' },
    { id: 'rda_10_4:J0030000009b', name: '삶은 달걀', grams: 50, group: '단백질' },
    { id: 'rda_10_4:D0150000009a', name: '두부', grams: 100, group: '단백질' },
    { id: 'rda_10_4:F0920000009c', name: '데친 브로콜리', grams: 70, group: '채소' },
    { id: 'rda_10_4:F1150000009c', name: '데친 시금치', grams: 70, group: '채소' },
    { id: 'rda_10_4:F1860000000a', name: '토마토', grams: 100, group: '채소' },
    { id: 'rda_10_4:H0500020000a', name: '사과', grams: 100, group: '과일·유제품' },
    { id: 'rda_10_4:M0080042339a', name: '플레인 요구르트', grams: 100, group: '과일·유제품' }
];
const builtinSideCount=sides.length;
function renderSides() {} // Keep restored extra foods in the plate; selection now happens on the recommendation page.
function missingNutrition(parts){return Object.fromEntries(Object.keys(nutrients).map(key=>[key,[...new Set(allIngredients(parts).filter(i=>!Number.isFinite(catalog.get(i.foodId)?.nutrients[key])||!Number.isFinite(i.grams)||i.grams<=0).map(i=>i.name||i.text||'미확인 재료'))]]));}
function renderCurrentMeal(){
 if(!catalogReady)return;
 const parts=selectedParts();
 if(!parts.length){$('fs-meal-charts').replaceChildren();$('fs-meal-status').textContent='AI 레시피 추천에서 요리를 골라 한 끼로 보내주세요.';return;}
 const analysis=estimate(parts,catalog,Object.keys(nutrients));
 renderGoalNutrition($('fs-meal-charts'),analysis,readPeriodCriteria(),{wholeDay:false,missingNames:missingNutrition(parts),title:'현재 한 끼 · 일반 참고 기준과 개인 목표 (하루 기준 대비)'});
 const invalid=parts.some(p=>p.ingredients.some(i=>!Number.isFinite(i.grams)||i.grams<=0));
 $('fs-meal-status').textContent=invalid?'분량이 비어 있는 재료가 있습니다. 요리 카드에서 확인해 주세요.':'현재 분량으로 영양값을 갱신했습니다. 자료가 부족하면 영양 계산으로 보완하세요.';
}
let mealSaveReceipt = null;
function mealSaveFingerprint(){return JSON.stringify({date:$('fs-meal-date').value,meal:$('fs-meal-time').value,parts:selectedParts()});}
function mealSaveFeedback(state,message=''){
 const control=$('fs-save-meal'),status=$('fs-meal-save-feedback');
 control.disabled=state==='saving';control.setAttribute('aria-busy',String(state==='saving'));
 control.textContent=state==='saving'?'저장 중…':state==='success'?'✓ 저장 완료':state==='error'?'다시 저장':state==='pending'?'저장 결과 확인':'식단 저장';
 status.textContent=message;status.dataset.state=state;
 mealSaveReceipt=state==='success'?mealSaveFingerprint():null;
}
function resetMealSaveFeedback(){if(!saving&&$('fs-meal-save-feedback')?.textContent&&mealSaveReceipt!==mealSaveFingerprint())mealSaveFeedback('idle');}
function markChanged() {
    resetMealSaveFeedback();
    const recommendationStatus=$('fs-single-meal-status');if(recommendationStatus)recommendationStatus.textContent='';
    changed = true; revision++;
    $('fs-meal-charts').replaceChildren(); $('fs-week-charts').replaceChildren();
    $('fs-week-summary').textContent = '';
    renderCurrentMeal();
    if (catalog) renderSides();
    if (period.length) renderPeriodSummary();
    if(!$('fs-shopping').hidden)renderShopping();
    persistStudio();
}
function makeRecipe(recipe) {
    return { ...recipe, portions: Array.isArray(recipe.portions)?recipe.portions:parseRecipe(recipe, catalog) };
}
function plateRecipe(key){return key.startsWith('recipe:')?recipes[Number(key.slice(7))]:key.startsWith('snapshot:')?plateSnapshots[Number(key.slice(9))]:null;}
function selectedParts() {
    const parts = [];
    for (const [key, amount] of active) {
        if (key.startsWith('recipe:')||key.startsWith('snapshot:')) {
            const recipe = plateRecipe(key);
            if (!recipe) continue;
            parts.push({ name: recipe.name, role:combinationType(recipe), servings:amount, ingredients: recipe.portions.map(item => ({ ...item,
                quantities:item.quantities?.map(q=>({...q,amount:q.amount*amount/recipe.servings})),grams: Number.isFinite(item.grams) ? item.grams * amount / recipe.servings : null })) });
        } else {
            const side = sides.find(item => item.id === key);
            if (side) parts.push({ name: side.name, servings:1, ingredients: [{ foodId: side.id, grams: amount, text: side.name }] });
        }
    }
    return parts;
}
function allIngredients(parts) { return parts.flatMap(part => part.ingredients); }
function valuesFor(parts) { return totalFor(allIngredients(parts), 1, catalog); }
function renderPlate() {
    resetMealSaveFeedback();
    const plate = $('fs-plate'); plate.replaceChildren();
    for (const [key, amount] of active) {
        const isRecipe = key.startsWith('recipe:')||key.startsWith('snapshot:');
        const recipe = isRecipe ? plateRecipe(key) : null;
        const side = !isRecipe ? sides.find(item => item.id === key) : null;
        if (!recipe && !side) continue;
        const tile = element('article', undefined, 'fs-plate-item');
        tile.append(element('span', isRecipe ? '요리' : '함께 먹을 음식', 'fs-eyebrow'), element('h3', recipe?.name || side.name));
        const label = element('label', isRecipe ? '먹을 인분' : '먹을 양 (g)');
        const input = element('input');
        Object.assign(input, { type: 'number', min: '0.1', max: isRecipe ? '10' : '2000', step: '0.1', value: String(amount) });
        input.addEventListener('input', () => {
            const value = input.valueAsNumber;
            active.set(key, input.validity.valid && value > 0 ? value : NaN);
            markChanged();
        });
        label.append(input); tile.append(label, button('구성에서 빼기', () => { active.delete(key); renderPlate(); markChanged(); }));
        if(isRecipe&&['main','soup','bowl'].includes(combinationType(recipe))){
            tile.append(button('이 요리 유지하고 밥·반찬 추천',()=>recommendOneMeal(key)));
            const notice=element('p','','fs-muted');notice.id=`fs-single-status-${key}`;notice.setAttribute('role','status');notice.setAttribute('aria-live','polite');tile.append(notice);
        }
        plate.append(tile);
    }
    if (catalog) renderSides();
    if (!active.size) plate.append(element('p', '위의 요리 카드에서 한 끼에 담을 음식을 골라주세요.', 'fs-empty'));
}
function excludeCandidate(index){
 if(saving||pendingSave||building)return;
 recipes[index].candidateExcluded=true;
 renderLibrary();markChanged();
 $('fs-status').textContent='한 끼 추천 후보에서 제외했습니다. MyRecipe 원본과 이미 구성한 식단은 유지되며, 주간·월간은 별도 조건으로 추천합니다.';
}
function showSingleMealMessage(index,message){
 $('fs-status').textContent=message;
 const card=$(`fs-single-status-${index}`);if(card)card.textContent=message;
 const result=$('fs-single-meal-status');if(result)result.textContent=message;
}
const recommendFixedMeal=createSingleMealRecommender(createPeriodApi(accountKey));
async function recommendOneMeal(index){
 if(saving||pendingSave||building)return;
 let locked=false;
 try{
  const target=editingTarget?{...editingTarget}:null;
  if(target&&!periods[target.kind]?.some(slot=>slotKey(slot)===target.key))throw Error('변경할 날짜·끼니를 다시 선택해 주세요.');
  const prepared=prepareSingleMeal({...(typeof index==='string'?{anchorKey:index}:{index}),recipes,plateSnapshots,sides,active,combinationType});
  const date=$('fs-meal-date').value,meal=$('fs-meal-time').value;
  if(!$('fs-meal-date').validity.valid||!date)throw Error('한 끼의 계획 날짜를 확인해 주세요.');
  switchView(tabs.find(tab=>tab.dataset.view==='meal'));
  const owner=accountKey(),captured=revision;
  building=true;locked=true;lockSave(true);showSingleMealMessage(index,'Gemini가 선택한 요리와 현재 음식을 유지하고 부족한 주식·반찬을 추천하고 있습니다…');
  const slot=await recommendFixedMeal({owner,first:date,meal,criteria:readPeriodCriteria(),fixedDishes:prepared.fixedDishes,excludedRecipeNames:prepared.excludedRecipeNames});
  if(owner!==accountKey()||revision!==captured||editingTarget?.kind!==target?.kind||editingTarget?.key!==target?.key)throw Error('계정·구성 또는 편집 대상이 변경되어 추천을 적용하지 않았습니다.');
  const fixedNames=new Set(prepared.fixedDishes.map(d=>normalizeName(d.recipe.name)));
  const additions=slot.recommended.filter(p=>!fixedNames.has(normalizeName(p.name)));
  if(plateSnapshots.length+additions.length>30)throw Error('초안에 보관된 음식이 많습니다. 현재 구성을 확인해 주세요.');
  const snapshots=snapshotPlate(additions).map((r,i)=>({...r,combinationType:additions[i].role,savedDish:true}));
  const next=new Map(prepared.active);snapshots.forEach((r,i)=>next.set(`snapshot:${plateSnapshots.length+i}`,1));
  plateSnapshots.push(...snapshots);active=next;renderPlate();markChanged();
  showSingleMealMessage(index,`${prepared.anchorName}와 이미 담은 음식은 유지했습니다. Gemini가 ${additions.length}개 음식을 추가했습니다. ${target?'구성을 확인한 뒤 위의 날짜·끼니에 적용 버튼을 누르세요. MyPage 저장은 별도입니다.':'날짜·끼니와 분량을 확인한 뒤 저장하세요.'}`);
  $('fs-meal-status').textContent='현재 구성으로 영양량을 갱신했습니다. 자료가 부족한 성분은 영양 계산으로 보완하세요.';
  $('fs-meal').scrollIntoView({behavior:'smooth',block:'start'});
 }catch(error){showSingleMealMessage(index,error.message+' 현재 한 끼 구성은 유지됩니다.');}
 finally{if(locked){building=false;lockSave(Boolean(pendingSave));}}
}
function clearMealAdditionCandidates(){
 $('fs-addition-candidates').replaceChildren();$('fs-addition-status').textContent='';
}
async function requestMealAdditions(mode){
 if(saving||pendingSave||building)return;
 let locked=false;
 try{
  const request=additionRequest({mode,foodName:$('fs-add-food-name').value,parts:selectedParts(),criteria:readPeriodCriteria()});
  const owner=accountKey(),captured=revision,target=editingTarget?{...editingTarget}:null,criteriaKey=JSON.stringify(periodCriteria(readPeriodCriteria()));
  building=true;locked=true;lockSave(true);$('fs-addition-status').textContent='추가할 음식 후보를 준비하고 있습니다…';$('fs-addition-candidates').replaceChildren();
  const response=await createPeriodApi(accountKey)('/api/me/meal-additions/recommend',request);
  if(owner!==accountKey()||revision!==captured||editingTarget?.kind!==target?.kind||editingTarget?.key!==target?.key)throw Error('계정·구성 또는 편집 대상이 변경되어 후보를 적용하지 않았습니다.');
  const candidates=additionCandidates(response),root=$('fs-addition-candidates');
  for(const candidate of candidates){
   const card=element('article',undefined,'fs-mini-card');card.append(element('h3',candidate.recipe.name),element('p',response.provider==='STORED'?'저장 레시피 재사용':'Gemini 추가 후보','fs-muted'),element('p',candidate.reason||'현재 한 끼에 추가할 음식 후보입니다.','fs-muted'));
   card.append(element('p',`${candidate.recipe.servings}인분 레시피 · 한 끼에는 1인분 추가`,'fs-muted'));
   const detail=element('details'),summary=element('summary','재료·조리법 확인');detail.append(summary,element('p',candidate.recipe.ingredients.join(' · '),'fs-muted'),element('p',candidate.recipe.steps.join(' → '),'fs-muted'));card.append(detail);
   const add=button('한 끼에 추가',()=>{
    if(saving||pendingSave||building)return;
    try{
     if(owner!==accountKey()||editingTarget?.kind!==target?.kind||editingTarget?.key!==target?.key||JSON.stringify(periodCriteria(readPeriodCriteria()))!==criteriaKey)throw Error('계정·편집 대상 또는 추천 조건이 바뀌었습니다. 다시 추천해 주세요.');
     if(selectedParts().some(p=>normalizeName(p.name)===normalizeName(candidate.recipe.name)))throw Error('이미 담은 음식입니다. 해당 카드에서 먹을 인분을 조정해 주세요.');
     if(plateSnapshots.length>=30||active.size>=30)throw Error('한 끼에 담은 음식이 많습니다. 현재 구성을 확인해 주세요.');
     const portions=parseRecipe(candidate.recipe,catalog);if(!portions.length||portions.some(p=>!Number.isFinite(p.grams)||p.grams<=0))throw Error('추가 음식의 재료 분량을 확인해 주세요.');
     const index=plateSnapshots.length;plateSnapshots.push({...candidate.recipe,portions,combinationType:candidate.role,publicRecipeId:candidate.id});active.set(`snapshot:${index}`,1);renderPlate();markChanged();add.disabled=true;add.textContent='추가 완료';
     $('fs-addition-status').textContent=candidate.recipe.name+' 1인분을 추가했습니다. 기존 음식은 유지했습니다. '+(editingTarget?'위의 날짜·끼니에 적용을 누르세요.':'날짜·끼니를 확인하고 식단 저장을 누르세요.');
    }catch(error){$('fs-addition-status').textContent=error.message;}
   });card.append(add);root.append(card);
  }
  $('fs-addition-status').textContent=candidates.length?'후보를 확인한 뒤 한 끼에 추가를 눌러 주세요. 아직 현재 구성에는 담지 않았습니다.':'현재 조건에서 추가 후보를 찾지 못했습니다. 음식명을 입력해 다시 요청해 주세요.';
 }catch(error){$('fs-addition-status').textContent=error.message+' 현재 한 끼는 유지됩니다.';}
 finally{if(locked){building=false;lockSave(Boolean(pendingSave));}}
}
$('fs-add-food-named').addEventListener('click',()=>requestMealAdditions('named'));
$('fs-add-food-compatible').addEventListener('click',()=>requestMealAdditions('compatible'));
function renderLibrary() {
    const root = $('fs-library'); root.replaceChildren(element('p','한 끼에 담기는 선택한 음식만 추가합니다. 이 요리로 한 끼 추천은 선택한 요리와 이미 담은 음식·재료·분량을 Gemini에 보내 유지하고, 부족한 주식·반찬을 추가합니다. 제외한 후보 이름도 전달합니다. MyPage 저장은 별도입니다.','fs-library-help fs-muted'));
    recipes.forEach((recipe, index) => {
        if(recipe.candidateExcluded)return;
        const card = element('article', undefined, 'fs-mini-card');
        const imageBox = element('div', '사진 준비 중', 'fs-photo-placeholder');
        const photoCredit = element('div', '', 'fs-photo-credit');
        card.append(imageBox, photoCredit, element('h3', recipe.name), element('p',recipe.savedDish?'저장한 식단 구성 · 조리법 원문은 MyRecipe에서 확인':`${recipe.servings}인분 레시피 · 약 ${recipe.minutes || '—'}분`));
        card.append(button('한 끼에 담기', () => { active.set(`recipe:${index}`, 1); renderPlate(); markChanged(); }));
        if(!['staple','side'].includes(combinationType(recipe))){card.append(button('이 요리로 한 끼 추천',()=>recommendOneMeal(index)));const notice=element('p','','fs-muted');notice.id=`fs-single-status-${index}`;notice.setAttribute('role','status');notice.setAttribute('aria-live','polite');card.append(notice);}
        card.append(button('후보에서 제외',()=>excludeCandidate(index)));
        const typeLabel=element('label','조합에서의 역할 '),typeSelect=element('select');
        for(const [value,title] of Object.entries(COMBINATION_TYPES)){const option=element('option',title);option.value=value;typeSelect.append(option);}
        typeSelect.value=combinationType(recipe);typeSelect.setAttribute('aria-label',recipe.name+' 조합 역할');
        typeSelect.addEventListener('change',()=>{recipe.combinationType=typeSelect.value;markChanged();$('fs-status').textContent='역할을 변경했습니다. 이 요리로 한 끼 추천에 적용됩니다. 주간·월간 추천은 별도입니다.';});
        typeLabel.append(typeSelect);card.append(typeLabel);
        const details = element('details', undefined, 'fs-editor');
        details.append(element('summary', '재료·분량 확인'));
        details.dataset.recipeIndex=String(index);
        if(catalogReady)recipe.portions.forEach(ingredient=>details.append(foodPicker(ingredient,catalog,markChanged)));
        else details.append(element('p','영양 자료를 확인하고 있습니다. 요리와 인분은 바로 조절할 수 있어요.'));
        card.append(details); root.append(card);
        api('/api/recipes/commons-photo', { name: recipe.name, discover: true }).then(photo => {
            if (!photo?.image || !trustedImage(photo.image) || !photo.source?.startsWith('https://')) return;
            const image = element('img'); Object.assign(image, { src: photo.image, alt: `${recipe.name} 참고 사진`, loading: 'lazy', referrerPolicy: 'no-referrer' });
            image.addEventListener('error', () => { imageBox.textContent = '사진 준비 중'; photoCredit.replaceChildren(); });
            const credit = element('a', `${photo.title || recipe.name} · ${photo.author} · ${photo.provider} · ${photo.license}`); credit.href = photo.source; credit.rel = 'noreferrer';
            imageBox.replaceChildren(image); photoCredit.append(credit); imageBox.classList.add('fs-has-photo');
        }).catch(() => {});
    });
    const excluded=recipes.map((r,index)=>({r,index})).filter(x=>x.r.candidateExcluded);
    if(excluded.length){const restore=element('details',undefined,'fs-excluded-candidates');restore.append(element('summary',`제외한 후보 ${excluded.length}개 · 다시 추가`));excluded.forEach(({r,index})=>restore.append(button(r.name+' 다시 추가',()=>{if(saving||pendingSave||building)return;r.candidateExcluded=false;renderLibrary();markChanged();})));root.append(restore);}
    if (!recipes.some(r=>!r.candidateExcluded)) root.append(element('p', '추천에서 요리를 고르거나 MyRecipe를 불러오면 시작할 수 있어요.', 'fs-empty'));
    redrawLibraryOptions();
}
function trustedImage(value) {
    try { const url = new URL(value, location.origin); return !url.username && !url.password &&
        (url.origin === location.origin && url.pathname.startsWith('/photos/catalog/') || url.protocol === 'https:' &&
        ['upload.wikimedia.org','thumb.wikimedia.org','api.openverse.org','www.foodsafetykorea.go.kr','tong.visitkorea.or.kr'].includes(url.hostname)); }
    catch { return false; }
}
function recipeParts(index) {
    const recipe = recipes[index];
    return recipe ? [{ name: recipe.name, servings:1, ingredients: recipe.portions.map(item => ({ ...item,
        quantities:item.quantities?.map(q=>({...q,amount:q.amount/recipe.servings})),grams: item.grams == null ? null : item.grams / recipe.servings })) }] : [];
}
function partsForSlot(slot) { return slot.excluded ? [] : slotParts(slot, recipeParts); }
function slotName(slot) { return partsForSlot(slot).map(part => part.name).join(' + ') || '비운 끼니'; }
function currentMonthWeek(){const selected=chooseMonthWeek(period,monthWeekStart,today);if(selected)monthWeekStart=selected.from;return selected;}
function displayedSlots(){return view==='month'?slotsInWeek(period,currentMonthWeek()):period;}
function analysisSlots(){return view==='month'&&$('fs-analysis-scope').value!=='month'?displayedSlots():period;}
function renderMonthNavigation(){
 const monthly=view==='month',weeks=monthly?monthWeeks(period):[],selected=monthly?currentMonthWeek():null;
 $('fs-month-review').hidden=!monthly;
 $('fs-shopping-control').hidden=!monthly;
 $('fs-month-nav').hidden=!monthly||!weeks.length;$('fs-save-month').hidden=!monthly||!period.length;$('fs-analysis-control').hidden=!monthly||!period.length;
 $('fs-save-period').textContent='이번 주 저장';$('fs-shopping-toggle').textContent=monthly?'장보기 보기':'이번 주 장보기 보기';
 if(!monthly)return;
 const select=$('fs-month-week');select.replaceChildren();for(const week of weeks){const option=element('option',week.label);option.value=week.from;select.append(option);}select.value=selected?.from||'';
 $('fs-month-title').textContent=selected?period[0].date.slice(0,4)+'년 '+Number(period[0].date.slice(5,7))+'월 · '+selected.label:'';
 $('fs-month-prev').disabled=!selected||selected.index===0;$('fs-month-next').disabled=!selected||selected.index===weeks.length-1;
}
function changeMonthWeek(from){if(saving||pendingSave||building)return;monthWeekStart=from;if($('fs-shopping-scope').value!=='month')shoppingSelected.clear();renderCalendar();persistStudio();$('fs-save-status').textContent='';}
function renderPeriodSummary() {
    const scope=analysisSlots();
    const populated = scope.filter(slot => partsForSlot(slot).length);
    const monthCompare=view==='month'&&$('fs-analysis-scope').value==='month'&&previousMonthKey===period[0]?.date.slice(0,7)?compareMonths(previousMonthEntries,period.filter(s=>!s.excluded).map(slot=>({...slot,kind:'CURRENT'})),[...new Set(period.map(s=>s.meal))],Object.keys(nutrients),entry=>entry.kind==='PLAN'?entry.analysis:estimate(entry.kind==='ACTUAL'?[{ingredients:entry.ingredients}]:partsForSlot(entry),catalog,Object.keys(nutrients))):null;
    const comparison=view==='week'?compareSavedWeek(period,baseline,partsForSlot,catalog,Object.keys(nutrients)):monthCompare;
    const notes=monthCompare?monthCompare.notes:Object.fromEntries((comparison?.notes||[]).map(text=>{const [key,...rest]=text.split(':');return [key,rest.join(':')];}));
    const totals = estimate(populated.flatMap(partsForSlot), catalog, Object.keys(nutrients));
    const dates=[...new Set(scope.map(slot=>slot.date))],wholeDay=dates.length>0&&dates.every(date=>['breakfast','lunch','dinner'].every(meal=>scope.some(slot=>slot.date===date&&slot.meal===meal&&partsForSlot(slot).length)));
    renderGoalNutrition($('fs-period-charts'),totals,readPeriodCriteria(),{divisor:dates.length||1,wholeDay,missingNames:missingNutrition(populated.flatMap(partsForSlot)),previous:comparison?.rows[0],comparableCurrent:comparison?.rows[1],comparisonNotes:notes,previousPeriodLabel:monthCompare?'전달':undefined,comparableLabel:monthCompare?'이번 달 자료 있는 날짜 평균':undefined,title:`${view==='month'?$('fs-analysis-scope').value==='month'?'한 달 전체':'현재 주':'이번 주'} 하루 평균 · ${dates.length}일 ${populated.length}끼 (간식·음료 별도)`});
    $('fs-period-note').textContent = '하루 평균과 일반 참고·개인 목표를 비교합니다. 3끼를 모두 구성하지 않았거나 자료가 부족하면 부족 판정을 보류합니다. 선택한 범위의 평균이므로 하루별 차이가 가려질 수 있습니다.';
}
function editSlot(slot) {
    if(saving||pendingSave||building)return;
    clearMealAdditionCandidates();
    editingTarget = { kind: view, key: slotKey(slot) };
    plateSnapshots=snapshotPlate(partsForSlot(slot));active=new Map(plateSnapshots.map((r,index)=>[`snapshot:${index}`,r.servings]));renderPlate();
    before = valuesFor(partsForSlot(slot));beforeAiCoverage=estimate(partsForSlot(slot),catalog,Object.keys(nutrients)).aiCoverage;
    $('fs-meal-date').value = slot.date; $('fs-meal-time').value = slot.meal;
    $('fs-replace-target').hidden = false;
    $('fs-save-meal').hidden = true; $('fs-meal-date').disabled = $('fs-meal-time').disabled = true;
    $('fs-replace-label').textContent = `${slot.date} ${labels[slot.meal]} · ${slotName(slot)} → 내가 구성한 한 끼`;
    $('fs-apply-slot').textContent = `${slot.date} ${labels[slot.meal]}에 적용`;
    switchView(tabs.find(tab => tab.dataset.view === 'meal'));
    $('fs-meal').scrollIntoView({ behavior: 'smooth', block: 'start' });
}
function renderCalendar() {
 const root=$('fs-calendar');root.replaceChildren();root.classList.remove('fs-month-calendar');renderMonthNavigation();
 const visible=displayedSlots(),dates=[...new Set(visible.map(s=>s.date))];
 for(const date of dates){
  const row=element('section',undefined,'fs-day-row'),d=new Date(date+'T12:00:00Z');row.setAttribute('aria-label',date+' 식단');
  const dateCard=element('div',undefined,'fs-date-card');dateCard.append(element('strong',`${d.getUTCMonth()+1}/${d.getUTCDate()}`),element('span',`(${'일월화수목금토'[d.getUTCDay()]})`));row.append(dateCard);
  for(const meal of ['breakfast','lunch','dinner']){
   const slot=period.find(s=>s.date===date&&s.meal===meal),card=element('article',undefined,'fs-period-slot');
   card.append(element('span',labels[meal]+(slot?.excluded?' · 제외':slot?slot.custom?' · 내 한 끼':' · 추천':' · 구성 안 함'),'fs-pill'));
   if(!slot){card.append(element('p','선택하지 않은 끼니입니다.','fs-muted'));row.append(card);continue;}
   if(slot.excluded){card.append(element('p','외식 등으로 이 끼니를 제외했습니다. 영양·장보기·새 저장에서 제외됩니다.','fs-muted'),button('끼니 되살리기',()=>{slot.excluded=false;renderCalendar();markChanged();}));}
   else {
    card.append(element('strong',slotName(slot)));
    if(slot.recommended?.length>1&&!slot.custom)card.append(element('p',`${slot.recommended.length}개 요리 · 각 1인분. 인분 변경은 이 끼니 바꾸기에서 확인하세요.`,'fs-muted'));
    if(slot.reason){const detail=element('details',undefined,'fs-slot-reason');detail.append(element('summary','배치 이유 보기'),element('p',slot.reason,'fs-muted'));card.append(detail);}
    const actions=element('div',undefined,'fs-slot-actions');actions.append(button('이 끼니 바꾸기',()=>editSlot(slot)),button('이 끼니 제외',()=>{slot.excluded=true;renderCalendar();markChanged();}));card.append(actions);
    if(slot.original)card.append(button('처음 추천으로 되돌리기',()=>{slot.recipe=slot.original.recipe;slot.custom=slot.original.custom;delete slot.original;slot.locked=false;renderCalendar();markChanged();}));
   }row.append(card);
  }
  root.append(row);
 }
 $('fs-period-count').textContent=`${view==='month'?'현재 주 ':''}${dates.length}일 · ${visible.filter(s=>partsForSlot(s).length).length}끼 · ${visible.filter(s=>s.excluded).length}끼 제외${view==='month'?' / 한 달 '+new Set(period.map(s=>s.date)).size+'일':''}`;renderPeriodSummary();
 if(!$('fs-shopping').hidden)renderShopping();
}
async function buildPeriod() {
    const status=$('fs-period-status');
    if(building){status.textContent='Gemini 식단 추천이 진행 중입니다. 응답을 기다려 주세요.';return;}
    if(saving){status.textContent='MyPage 저장이 진행 중입니다. 저장 완료 후 추천해 주세요.';return;}
    if(pendingSave){status.textContent='이전 저장 결과가 아직 확인되지 않았습니다. 저장 버튼으로 결과를 확인한 뒤 추천해 주세요.';return;}

    const start = $('fs-start').value;
    if (!$('fs-start').validity.valid || !start) { status.textContent = '시작 날짜를 확인해 주세요.'; return; }
    const kind = view;
    const length = kind === 'month' ? new Date(Date.UTC(Number(start.slice(0,4)),Number(start.slice(5,7)),0)).getUTCDate() : 7;
    const first = kind === 'month' ? `${start.slice(0,7)}-01` : start;
    const scope = $('fs-scope').value;
    const meals=selectedMeals(scope);if(!meals.length){status.textContent='구성할 끼니를 하나 이상 선택해 주세요.';return;}
    const owner=accountKey();
    try {
        const criteria=periodCriteria(readPeriodCriteria());
        building=true;lockSave(true);$('fs-build').disabled=true;$('fs-build').textContent='Gemini 추천 중…';status.textContent='Gemini가 메인·주식·반찬을 포함한 식단을 추천하고 있습니다…';
        const result=await generateGeminiPeriod({first,days:length,meals,criteria,usePreferences:$('fs-period-taste').checked,job:periodGeneration,api:createPeriodApi(accountKey),addDays,isCurrent:()=>owner===accountKey(),onJob:job=>{if(owner===accountKey()){periodGeneration=job;persistStudio();}},onProgress:(index,total)=>{status.textContent=`Gemini 식단 추천 ${index}/${total}구간 · 응답을 기다리고 있습니다…`;}});
        const ingredientRows=result.slots.flatMap(slot=>slot.recommended.flatMap(part=>part.ingredients));
        for(const slot of result.slots)for(const part of slot.recommended){const parsed=parseRecipe({name:part.name,servings:1,ingredients:part.ingredients.map(i=>`${i.name} ${i.grams}g`),steps:[]},catalog);part.ingredients.forEach((item,i)=>{if(parsed[i]?.foodId)item.foodId=parsed[i].foodId;});}
        if(owner!==accountKey())return;
        if(view!==kind||owner!==accountKey())return;
        period=result.slots;periodGeneration=null;criteriaFor[kind]=result;renderCriteriaReport(result);
        periods[kind] = period;if(kind==='month'){previousMonthEntries=[];previousMonthKey='';monthWeekStart='';$('fs-shopping-scope').value='visible';$('fs-analysis-scope').value='visible';}
        baseline.clear(); $('fs-baselines').replaceChildren(); $('fs-shopping').hidden = true;
        renderCalendar(); markChanged();const nutritionRevision=revision;
        const current=()=>catalogReady&&owner===accountKey()&&periods[kind]===result.slots&&revision===nutritionRevision&&!saving&&!pendingSave;
        Promise.resolve().then(async()=>{
            if(!current())return;
            try{await resolveIngredientMatches(ingredientRows,catalog,()=>{},current);}catch{if(current()){result.notes.push('일부 재료의 추가 연결이 지연되고 있습니다. 영양 자료가 없는 성분은 평가를 보류합니다.');if(view===kind)renderCriteriaReport(result);}}
            if(!current())return;
            await completeNutrition(ingredientRows,catalog,current);
            if(current()){if(view===kind)renderCalendar();persistStudio();}
        }).catch(()=>{}); if(kind==='week')loadPreviousWeek();else if(kind==='month'){previousMonthEntries=[];previousMonthKey='';loadPreviousMonth();} status.textContent = 'Gemini가 '+length+'일의 메인·주식·반찬 식단을 추천했습니다. 영양값은 DB 자료로 별도 계산합니다. MyPage 저장은 저장 버튼을 눌러 주세요.';
    } catch (error) { status.textContent = error.message; }
    finally { periodMessages[kind]=status.textContent;building = false;lockSave(Boolean(pendingSave)); $('fs-build').disabled = false;$('fs-build').textContent=kind==='month'?'월간 식단 추천받기':'주간 식단 추천받기'; }
}
function toPlan(slot,parts){const plan=toSimulationPlan(slot,parts);if(slot.policy)plan.note+=' · '+slot.policy;return plan;}
function rememberPending() {
    sessionStorage.setItem('smartnf.food-studio.pending', JSON.stringify({ account: accountKey(), request: pendingSave }));
}
function lockSave(locked) {
    document.querySelectorAll('.food-studio input, .food-studio select, .food-studio button, .food-studio summary').forEach(node => {
        node.inert = locked;
    });
    for (const id of ['fs-save-meal', 'fs-save-period','fs-save-month']) $(id).inert = false;
}
function showSaveProblem(error,status){
 status.replaceChildren(element('span',error.message));
 if(error.needsAmount){const parts=selectedParts(),part=parts[error.dishIndex];const recipeIndex=recipes.findIndex(r=>r.name===part?.name);const details=[...document.querySelectorAll('#fs-library details[data-recipe-index]')].find(d=>Number(d.dataset.recipeIndex)===recipeIndex);
  if(details){details.open=true;const fields=details.querySelectorAll('[data-amount-field]');const field=fields[error.ingredientIndex];status.append(button('해당 재료 분량 입력하기',()=>{details.open=true;field?.scrollIntoView?.({block:'center'});field?.focus();}));field?.focus();}
 }
}
function savedPlanLink(date){const a=element('a','저장한 날짜의 식단 확인 →');a.href='/mypage/plans?date='+encodeURIComponent(date);return a;}
async function saveSlots(slots, status, feedback=()=>{}) {
    if (saving || building) return;
    if(!catalogReady){status.textContent='영양 자료를 불러오는 중입니다. 잠시 후 다시 눌러주세요.';feedback('error',status.textContent);return;}
    if(!pendingSave)try{slots.forEach(({slot,parts})=>parts.forEach((part,dishIndex)=>part.ingredients.forEach((item,ingredientIndex)=>{if(!Number.isFinite(item.grams)||item.grams<=0||item.grams>50000){const error=Error(`${part.name} · ${item.name||item.text||'재료'}: 먹을 양(g)을 확인해 주세요.`);Object.assign(error,{dishIndex,ingredientIndex,needsAmount:true});throw error;}})));}catch(error){showSaveProblem(error,status);feedback('error',error.message);return;}
    const captured = revision;
    saving = true; lockSave(true);feedback('saving','MyPage에 저장하고 있습니다…');
    let done = 0;
    try {
        if (pendingSave) {
            const request = pendingSave.body;
            await api(pendingSave.url||'/api/me/health/plans', request);
            const confirmed=await api('/api/me/health/plans/day?date='+request.date);verifySavedDay(confirmed,{...request,plans:request.plans||[]});
            savedSignatures.add(pendingSave.signature);
            sessionStorage.setItem('smartnf.food-studio.receipts', JSON.stringify({ account: accountKey(), created: Date.now(), signatures: [...savedSignatures] }));
            pendingSave = null;
            sessionStorage.removeItem('smartnf.food-studio.pending');
            status.replaceChildren(element('span',`${request.date}의 저장 결과를 확인했습니다. 나머지 날짜가 있으면 식단 저장을 다시 눌러주세요. `),savedPlanLink(request.date));
            feedback('pending',request.date+'의 이전 저장 결과를 확인했습니다. 현재 구성을 저장하려면 다시 눌러주세요.');
            return;
        }
        const consent = await api('/api/me/health/plans/consent');
        if (!consent.agreed) throw new Error('MyPage의 식단 계획 저장 안내에 동의한 뒤 다시 저장해 주세요.');
        sessionStorage.setItem(`smartnf.nutrition-auto-consent.v2:${accountKey()}`,'yes');
        status.textContent='공공 영양 DB와 저장된 AI 자료를 확인하고 있습니다…';
        const inputs=slots.flatMap(({parts})=>parts.flatMap(part=>part.ingredients));
        const previous=inputs.map(item=>({id:item.foodId,name:normalizeName(item.name||item.text||'')}));
        const completion=await completeNutrition(inputs,catalog,()=>captured===revision,{retryFailed:true});
        if(captured!==revision)throw Error('구성이 변경되었습니다. 다시 확인해 주세요.');
        inputs.forEach((item,index)=>{const prior=previous[index];if(item.foodId!==prior.id)for(const live of nutritionItems())if(live.foodId===prior.id&&normalizeName(live.name||live.text||'')===prior.name){live.foodId=item.foodId;live.matchStatus=item.matchStatus;}});
        refreshLibraryEditors();persistStudio();lockSave(true);
        const unresolved=inputs.filter(item=>!item.foodId||!catalog.has(item.foodId));
        if(unresolved.length)throw Error('영양 자료 연결을 완료하지 못했습니다: '+[...new Set(unresolved.map(i=>i.name||i.text||'재료'))].join(', ')+(completion?.issues?.length?' · '+completion.issues.map(i=>i.message).join(' / '):' · 재료 카드에서 연결 상태를 확인해 주세요.'));
        const grouped = new Map();
        slots.forEach(({ slot, parts }) => {
            if (!grouped.has(slot.date)) grouped.set(slot.date, []);
            if(parts.length)grouped.get(slot.date).push(toPlan(slot, parts));
        });
        if (!grouped.size) throw new Error('저장할 끼니를 선택해 주세요.');
        for (const [date, additions] of grouped) {
            const signature = JSON.stringify({ date, plans: additions });
            // Always compare/update the owned slot, including a deliberate return to an earlier composition.
            const existing = await api('/api/me/health/plans/day?date=' + date);
            if (captured !== revision) throw new Error('구성이 변경되었습니다. 다시 확인해 주세요.');
            const body = { requestId: crypto.randomUUID(), date, expectedRevision: existing.revision,
                consentEventId: consent.eventId, plans: mergePeriodPlans(existing.plans,additions,slots.filter(x=>x.slot.date===date).map(x=>x.slot.meal),planInput) };
            const url=body.plans.length?'/api/me/health/plans':'/api/me/health/plans/delete';
            pendingSave = { body, signature, url };
            rememberPending();
            status.textContent = `${done}/${grouped.size}일 저장됨 · ${date} 저장 중`;
            await api(url, body);
            verifySavedDay(await api('/api/me/health/plans/day?date='+date),body);
            savedSignatures.add(signature);
            sessionStorage.setItem('smartnf.food-studio.receipts', JSON.stringify({ account: accountKey(), created: Date.now(), signatures: [...savedSignatures] }));
            pendingSave = null;
            sessionStorage.removeItem('smartnf.food-studio.pending');
            done++;
        }
        if(view==='meal'&&slots.length===1)renderGoalNutrition($('fs-meal-charts'),estimate(slots[0].parts,catalog,Object.keys(nutrients)),readPeriodCriteria(),{wholeDay:false,title:'저장한 한 끼 · 하루 기준 대비'});
        status.replaceChildren(element('span',`${done}일의 식단을 저장했습니다. `),savedPlanLink(slots[0].slot.date),element('span',' 확인 기간: '+slots[0].slot.date+' ~ '+slots.at(-1).slot.date));
        if(period.length)renderCalendar();
        changed = false;
        for(const id of ['fs-status','fs-period-status'])if($(id).textContent.includes('MyPage에는 아직 저장되지 않았습니다.'))$(id).textContent='선택한 범위의 식단을 MyPage에 저장했습니다. 저장 결과의 날짜 범위를 확인해 주세요.';
        feedback('success',slots[0].slot.date+' '+labels[slots[0].slot.meal]+' · MyPage 저장 완료');
    } catch (error) {
        if (error.status >= 400 && error.status < 500) {
            pendingSave = null; sessionStorage.removeItem('smartnf.food-studio.pending');
        }
        status.textContent = `${done?done+'일 저장 완료 · ':pendingSave?'저장 결과를 확인하지 못했습니다 · ':'저장되지 않았습니다 · '}${error.message}` + (pendingSave ? ' 같은 저장 버튼을 눌러 결과를 다시 확인해 주세요.' : '');
        feedback(pendingSave?'pending':'error',status.textContent);
    } finally { if(catalogReady&&period.length)renderCalendar();saving = false; lockSave(Boolean(pendingSave)); }
}
function checkedSelectedParts() {
    for (const amount of active.values()) if (!Number.isFinite(amount) || amount <= 0) throw new Error('먹을 인분과 분량을 확인해 주세요.');
    return selectedParts();
}
$('fs-confirm-meal').addEventListener('click', async () => {
    try {
        sessionStorage.setItem(`smartnf.nutrition-auto-consent.v2:${accountKey()}`,'yes');
        await completeNutrition(nutritionItems(),catalog,()=>true,{retryFailed:true});
        const parts = checkedSelectedParts();
        const ingredients = allIngredients(parts);
        const captured = revision;
        const analyses = await api('/api/recipes/nutrition', { estimate: true, meals: [{ name: '내 한 끼', servings: 1, ingredients }] });
        if (captured !== revision) return;
        const values = analyses[0].nutrients;
        renderGoalNutrition($('fs-meal-charts'),{values,coverage:analyses[0].coverage,aiCoverage:analyses[0].aiCoverage,total:analyses[0].total},readPeriodCriteria(),{wholeDay:false});
        $('fs-meal-status').textContent = analyses[0].matched < analyses[0].total ? '확인되지 않은 재료가 있어요. 요리 카드에서 항목과 분량을 확인해 주세요.' : '확인한 음식과 분량의 한 끼 합계입니다.';
    } catch (error) { $('fs-meal-status').textContent = error.message; }
});
$('fs-save-meal').addEventListener('click', () => {
    if(saving||building)return;
    if (!$('fs-meal-date').validity.valid || !$('fs-meal-date').value) { mealSaveFeedback('error','계획 날짜를 확인해 주세요.');return; }
    try {const parts=checkedSelectedParts();if(!parts.length)throw Error('저장할 음식을 한 끼에 담아 주세요.');saveSlots([{slot:{date:$('fs-meal-date').value,meal:$('fs-meal-time').value},parts}],$('fs-meal-status'),mealSaveFeedback);}
    catch(error){mealSaveFeedback('error',error.message);}
});
for(const id of ['fs-meal-date','fs-meal-time'])for(const event of ['input','change'])$(id).addEventListener(event,resetMealSaveFeedback);
$('fs-save-period').addEventListener('click', () => saveSlots(displayedSlots().map(slot => ({ slot, parts: partsForSlot(slot) })), $('fs-save-status')));
$('fs-save-month').addEventListener('click',()=>{if(view==='month')saveSlots(period.map(slot=>({slot,parts:partsForSlot(slot)})),$('fs-save-status'));});
$('fs-month-week').addEventListener('change',()=>changeMonthWeek($('fs-month-week').value));
for(const [id,step]of [['fs-month-prev',-1],['fs-month-next',1]])$(id).addEventListener('click',()=>{const weeks=monthWeeks(period),selected=currentMonthWeek(),next=weeks[(selected?.index??0)+step];if(next)changeMonthWeek(next.from);});
$('fs-analysis-scope').addEventListener('change',()=>{renderPeriodSummary();persistStudio();});
$('fs-build').addEventListener('click', buildPeriod);
for (const id of ['fs-start', 'fs-scope']) $(id).addEventListener('change', () => {
    $('fs-status').textContent = '범위를 바꿨습니다. 추천받기를 눌러 적용해 주세요.';
});
const shoppingSelected=new Set();
function shoppingCategory(name){
 if(/소금|후추|간장|된장|고추장|소스|식초|설탕|참기름|올리브오일|식용유|양념/.test(name))return '양념·소스';
 if(/치즈|우유|버터|크림|요구르트|요거트/.test(name))return '유제품';
 if(/소고기|돼지고기|닭|양고기|베이컨|햄|달걀|계란|두부|콩/.test(name))return '육류·달걀·콩류';
 if(/생선|고등어|연어|참치|새우|오징어|조개|해물|미역|김$|다시마/.test(name))return '수산물';
 if(/쌀|밥|면|파스타|스파게티|빵|밀가루|감자|고구마|귀리/.test(name))return '곡류·주식';
 if(/당근|호박|양파|마늘|브로콜리|버섯|채소|시금치|대파|토마토|배추|무$|상추|오이|양배추/.test(name))return '채소';
 if(/사과|배$|바나나|귤|오렌지|포도|과일/.test(name))return '과일';return '기타';
}
function renderShopping(){
 const root=$('fs-shopping');root.replaceChildren();
 if(!period.length){root.textContent='먼저 식단 초안을 만들어 주세요.';return;}
 const entire=view==='month'&&$('fs-shopping-scope').value==='month',scope=entire?period:displayedSlots();if(!scope.length){root.textContent='표시할 주간 식단이 없습니다.';return;}
 const first=scope[0].date,last=scope.at(-1).date,data=shoppingItems(scope,partsForSlot,catalog,last);
 for(const id of shoppingSelected)if(!data.items.some(i=>i.id===id))shoppingSelected.delete(id);
 root.append(element('h3',`${first} ~ ${last} · ${entire?'한 달 전체':'현재 주'} 장보기`));
 const columns=element('div',undefined,'fs-shopping-columns'),left=element('section'),right=element('section',undefined,'fs-shopping-basket');
 const heading=element('div',undefined,'fs-shopping-heading');heading.append(element('h4','필요한 재료 선택'),button('전체 선택',()=>{data.items.forEach(item=>shoppingSelected.add(item.id));renderShopping();}),button('전체 해제',()=>{shoppingSelected.clear();renderShopping();}));left.append(heading);right.append(element('h4','장바구니 담기'));
 const basket=element('div'),savePanel=element('div');right.append(basket,element('p','구매할 재료를 모은 목록입니다. 실제 주문·결제는 진행되지 않습니다.','fs-muted'),savePanel);
 function grouped(target,items,checks=false){
  const groups=new Map();for(const item of items){const category=shoppingCategory(item.name);if(!groups.has(category))groups.set(category,[]);groups.get(category).push(item);}
  for(const [category,list]of groups){const group=element('section',undefined,'fs-shopping-group');group.append(element('h5',category+' · '+list.length+'종'));const grid=element('div',undefined,'fs-shopping-items');
   for(const item of list){const text=item.name+' · '+(item.grams>0?format(item.grams)+'g':(item.quantities||[]).map(q=>format(q.amount)+({ml:'mL',ea:'개',pack:'팩',bag:'봉',bottle:'병'}[q.unit]||q.unit)).join(' / '))+(item.unlinked?' · 영양 자료 미연결':'');if(checks){const label=element('label',undefined,'fs-criteria-check fs-shopping-item'),check=element('input');check.type='checkbox';check.checked=shoppingSelected.has(item.id);check.addEventListener('change',()=>{if(check.checked)shoppingSelected.add(item.id);else shoppingSelected.delete(item.id);showBasket();});label.append(check,element('span',text));grid.append(label);}else grid.append(element('p',text,'fs-shopping-item'));}
   group.append(grid);target.append(group);
  }
 }
 function showBasket(){basket.replaceChildren();const items=data.items.filter(i=>shoppingSelected.has(i.id));if(!items.length)basket.append(element('p','왼쪽에서 재료를 선택하세요.','fs-muted'));else {basket.append(element('p',items.length+'종 선택'));grouped(basket,items);}
  savePanel.replaceChildren();mountShoppingSave(savePanel,{items,from:first,to:last,kind:entire?'MONTH':'WEEK',refresh:renderShopping});
 }
 grouped(left,data.items,true);
 columns.append(left,right);root.append(columns,element('p','재고 차감 전 필요량입니다.'+(data.missing?' 분량 미확인 '+data.missing+'건은 합계에서 제외했습니다.':''),'fs-muted'));showBasket();
}
$('fs-shopping-scope').addEventListener('change',()=>{shoppingSelected.clear();if(!$('fs-shopping').hidden)renderShopping();persistStudio();});
$('fs-shopping-toggle').addEventListener('click',()=>{const root=$('fs-shopping');root.hidden=!root.hidden;if(!root.hidden)renderShopping();});
for(const meal of ['breakfast','lunch','dinner'])$('fs-scope-'+meal).addEventListener('change',()=>{const chosen=['breakfast','lunch','dinner'].filter(m=>$('fs-scope-'+m).checked);$('fs-scope').value=chosen.length===3?'all':chosen.join(',');persistStudio();$('fs-status').textContent='구성할 끼니를 바꿨습니다. 추천받기를 눌러 적용하세요.';});
$('fs-load-library').addEventListener('click', async () => {
    const control = $('fs-load-library'); control.disabled = true;
    try {
        const library = await api('/api/me/recipes/taste');
        const root = $('fs-library-options'); root.replaceChildren(); root.hidden = false;
        root.append(element('p', library.message));
        const controls = element('div', undefined, 'fs-library-filters');
        const country = element('select'), role = element('select'), sort = element('select');
        const choices = (select, values) => values.forEach(value => { const option = element('option', value); option.value = value; select.append(option); });
        choices(country, ['전체', ...new Set(library.recipes.map(item => item.features.cuisine))]);
        choices(role, ['전체', '메인', '사이드', '겸용', '기타', '미분류']); choices(sort, ['최근 저장순', '취향순']);
        country.setAttribute('aria-label', '나라·문화권'); role.setAttribute('aria-label', '한 끼 역할'); sort.setAttribute('aria-label', '레시피 정렬');
        controls.append(country, role, sort); root.append(controls);
        const options = element('div', undefined, 'fs-library-results'); root.append(options);
        const draw = () => {
            options.replaceChildren();
            let entries = library.recipes.filter(item => (country.value === '전체' || country.value === item.features.cuisine)
                && (role.value === '전체' || role.value === item.features.role || item.features.role === '겸용' && ['메인','사이드'].includes(role.value)));
            if (sort.value === '취향순') entries.sort((a,b) => (a.distance ?? Infinity) - (b.distance ?? Infinity) || b.number-a.number);
            if (!entries.length) options.append(element('p', '해당 분류에 저장된 MyRecipe가 없습니다.'));
            entries.forEach(entry => {
                const recipe = entry.recipe;
                const tile=element('article',undefined,'fs-library-choice');
                tile.append(element('strong',recipe.name),element('span',`${entry.features.cuisine} / ${entry.features.role}${sort.value==='취향순'&&entry.distance!=null?' · 취향 참고':''}`,'fs-muted'));
                const existing=recipes.find(item=>JSON.stringify(item.ingredients)===JSON.stringify(recipe.ingredients)&&item.name===recipe.name);
                const add=button(existing&&!existing.candidateExcluded?'추가됨':'후보로 추가', async()=>{
                    if(saving||pendingSave||building)return;
                    const found=recipes.find(item=>JSON.stringify(item.ingredients)===JSON.stringify(recipe.ingredients)&&item.name===recipe.name);
                    if(found){found.candidateExcluded=false;renderLibrary();markChanged();draw();return;}
                    if(recipes.length>=30){$('fs-status').textContent='현재 초안에는 제외한 요리를 포함해 최대 30개 요리를 보관할 수 있습니다. 제외한 후보는 다시 추가할 수 있습니다.';return;}
                    const added=makeRecipe({...recipe,features:structuredClone(entry.features)});recipes.push(added);renderLibrary();markChanged();draw();
                    await resolveIngredientMatches(added.portions,catalog,message=>{$('fs-status').textContent=message;},()=>recipes.includes(added));
                    renderLibrary();markChanged();draw();
                });
                add.disabled=Boolean(existing&&!existing.candidateExcluded);tile.append(add);options.append(tile);
            });
        };
        [country, role, sort].forEach(select => select.addEventListener('change', draw)); redrawLibraryOptions=draw;draw();
    } catch (error) { $('fs-status').textContent = error.message; }
    finally { control.disabled = false; }
});
function snapshotMonthAnalysis(snapshots){const result={values:{},coverage:{},aiCoverage:{},total:0};for(const snap of snapshots){result.total+=snap.total||0;for(const key of Object.keys(nutrients)){const v=snap.nutrients?.[key];if(Number.isFinite(v))result.values[key]=(result.values[key]||0)+v;result.coverage[key]=(result.coverage[key]||0)+(snap.coverage?.[key]||0);result.aiCoverage[key]=(result.aiCoverage[key]||0)+(snap.aiCoverage?.[key]||0);}}return result;}
async function loadPreviousMonth(){
 if(!period.length||view!=='month')return;if(previousMonthLoading)return;
 const key=period[0].date.slice(0,7),captured=revision,owner=accountKey(),control=$('fs-load-month-previous'),root=$('fs-month-baselines');previousMonthLoading=true;control.disabled=true;
 $('fs-month-status').textContent='전달 기록을 확인하고 있습니다…';
 try{
  const dates=previousMonthDates(period[0].date),meals=[...new Set(period.map(s=>s.meal))];
  const results=await mapDates(dates,async date=>({date,records:await Promise.allSettled([api('/api/me/health/meals/day?date='+date),api('/api/me/health/plans/day?date='+date)])}));
  if(view!=='month'||captured!==revision||accountKey()!==owner||period[0]?.date.slice(0,7)!==key)return;
  const entries=[];let errors=0,actual=0,planned=0;root.replaceChildren();
  for(const {date,records}of results){const record=records[0].status==='fulfilled'?records[0].value:null,plans=records[1].status==='fulfilled'?records[1].value:null;errors+=records.filter(r=>r.status==='rejected').length;
   for(const meal of meals){const items=(record?.items||[]).filter(i=>i.meal===meal);
    if(items.length){const ingredients=items.map(item=>{const matches=[...catalog.values()].filter(f=>normalizeName(f.name)===normalizeName(item.name));return {name:item.name,text:item.name,foodId:matches.length===1?matches[0].id:'',grams:null};});entries.push({date,meal,kind:'ACTUAL',ingredients});actual++;const detail=element('details',undefined,'fs-editor');detail.append(element('summary',date+' '+labels[meal]+' · 실제 먹은 g 확인'));ingredients.forEach(i=>detail.append(foodPicker(i,catalog,renderPeriodSummary)));root.append(detail);
    }else {const snapshots=(plans?.plans||[]).filter(p=>p.simulation?.input?.meal===meal).map(p=>p.simulation);if(snapshots.length){entries.push({date,meal,kind:'PLAN',analysis:snapshotMonthAnalysis(snapshots)});planned++;}}
   }
  }
  previousMonthEntries=entries;previousMonthKey=key;
  $('fs-month-status').textContent=dates[0]+' ~ '+dates.at(-1)+' · 실제 기록 '+actual+'끼 / 저장 계획 '+planned+'끼'+(errors?' · 조회 실패 '+errors+'건 (없는 기록으로 단정하지 않습니다)':'')+'. 전달은 자료가 있는 날짜의 하루 평균입니다. 선택 끼니가 빠지면 변화량은 보류합니다. 실제 기록은 g 확인 후 반영합니다. 한 달 전체 그래프에서 비교하세요.';
  renderPeriodSummary();
 }catch(error){$('fs-month-status').textContent=error.message;}finally{previousMonthLoading=false;control.disabled=false;}
}
$('fs-load-month-previous').addEventListener('click',()=>{$('fs-analysis-scope').value='month';persistStudio();loadPreviousMonth();});
async function loadPreviousWeek(){
 if(!period.length||view!=='week'){$('fs-baseline-status').textContent='먼저 주간 초안을 만들어 주세요.';return;}
 const control=$('fs-load-previous');if(control.disabled)return;control.disabled=true;const captured=revision;
 try{
  baseline.clear();$('fs-baselines').replaceChildren();
  const dates=[...new Set(period.map(s=>s.date))];
  const results=await Promise.all(dates.map(async date=>({date,records:await Promise.allSettled([api('/api/me/health/meals/day?date='+addDays(date,-7)),api('/api/me/health/plans/day?date='+addDays(date,-7))])})));
  if(captured!==revision)return;
  let planned=0,actual=0;
  for(const {date,records}of results){const [recordResult,planResult]=records,record=recordResult.status==='fulfilled'?recordResult.value:null,plans=planResult.status==='fulfilled'?planResult.value:null;
   const details=element('details',undefined,'fs-editor');details.append(element('summary',addDays(date,-7)+' · 전주 비교 자료'));
   for(const slot of period.filter(s=>s.date===date)){
    const items=(record?.items||[]).filter(i=>i.meal===slot.meal);
    if(items.length){
     const ingredients=items.map(item=>{const matches=[...catalog.values()].filter(f=>normalizeName(f.name)===normalizeName(item.name));return {text:labels[slot.meal]+' · '+item.name,name:item.name,foodId:matches.length===1?matches[0].id:'',grams:null};});
     baseline.set(slotKey(slot),{kind:'ACTUAL',ingredients});details.append(element('strong',labels[slot.meal]+' · 실제 기록 (먹은 무게 확인 필요)'));ingredients.forEach(i=>details.append(foodPicker(i,catalog,()=>{renderPeriodSummary();})));actual++;
    }else{const snapshots=(plans?.plans||[]).filter(p=>p.simulation?.input?.meal===slot.meal).map(p=>p.simulation);
     if(snapshots.length){baseline.set(slotKey(slot),{kind:'PLAN',snapshots});details.append(element('p',`${labels[slot.meal]} · 저장한 계획 ${snapshots.length}건 (실제 섭취 기록 아님)${record?'':' · 실제 기록 조회 불가'}`));snapshots.forEach(s=>details.append(element('p',s.dishes.map(d=>d.name).join(' + '))));planned++;}
     else details.append(element('p',labels[slot.meal]+(record&&plans?' · 비교 자료 없음':' · 조회하지 못한 자료가 있습니다. 동의·연결 상태를 확인하세요.')));
    }
   }$('fs-baselines').append(details);
  }
  $('fs-baseline-status').textContent=`실제 기록 ${actual}끼 · 저장 계획 ${planned}끼. 실제 기록은 먹은 g을 확인해야 하며 계획은 저장 당시 수치로 비교합니다.`;
   renderPeriodSummary();
 }catch(error){$('fs-baseline-status').textContent=error.message;}finally{control.disabled=false;}
}
$('fs-load-previous').addEventListener('click',loadPreviousWeek);
$('fs-load-saved-plan').addEventListener('click',async()=>{
 if(saving||pendingSave||!catalogReady)return;const captured=revision,loadDate=$('fs-meal-date').value,loadMeal=$('fs-meal-time').value,control=$('fs-load-saved-plan');control.disabled=true;
 try{
  const day=await api('/api/me/health/plans/day?date='+loadDate);if(captured!==revision||loadDate!==$('fs-meal-date').value||loadMeal!==$('fs-meal-time').value)return;
  const snapshots=day.plans.filter(p=>p.simulation?.input?.meal===$('fs-meal-time').value).map(p=>p.simulation);if(!snapshots.length)throw Error('선택한 날짜·끼니에 저장한 시뮬레이터 식단이 없습니다.');
  const incoming=[];
  snapshots.forEach((snapshot,si)=>snapshot.dishes.forEach((dish,di)=>{
   const servings=Number(dish.servings),portions=dish.ingredients.map(i=>{if(i.foodId&&!catalog.has(i.foodId))catalog.set(i.foodId,{id:i.foodId,name:i.name,basis:'100g',nutrients:i.nutrients,ai:i.aiKeys.length>0,aiKeys:i.aiKeys,referenceFoodId:i.referenceFoodId});return {text:`${i.name} ${Number(i.grams)/servings}g`,name:i.name,quantities:i.quantities?.map(q=>({...q,amount:Number(q.amount)/servings})),grams:Number(i.grams)/servings,foodId:i.foodId,matchStatus:'confirmed'};});
   incoming.push({name:dish.name,servings:1,minutes:null,steps:[],ingredients:portions.map(i=>i.text),portions,savedDish:true,savedPlanKey:`${day.date}:${$('fs-meal-time').value}:${si}:${di}`,amount:servings});
  }));
  const next=[...recipes];const chosen=[];for(const item of incoming){let index=next.findIndex(r=>r.savedPlanKey===item.savedPlanKey);if(index<0){index=next.length;next.push(item);}else next[index]=item;chosen.push([`recipe:${index}`,item.amount]);}
  if(next.length>30)throw Error('초안 요리가 30개를 넘습니다. 새 초안을 시작한 뒤 불러와 주세요.');recipes=next;active=new Map(chosen);before=null;beforeAiCoverage={};renderLibrary();renderPlate();markChanged();
  // Display frozen saved totals before a deliberate new calculation.
  const savedValues={};const coverage={},aiCoverage={};let total=0;for(const snap of snapshots){total+=snap.total;for(const key of Object.keys(nutrients)){if(Number.isFinite(snap.nutrients[key]))savedValues[key]=(savedValues[key]||0)+snap.nutrients[key];coverage[key]=(coverage[key]||0)+(snap.coverage[key]||0);aiCoverage[key]=(aiCoverage[key]||0)+(snap.aiCoverage[key]||0);}}
  for(const key of Object.keys(nutrients))if(!(key in savedValues))savedValues[key]=null;renderGoalNutrition($('fs-meal-charts'),{values:savedValues,coverage,aiCoverage,total},readPeriodCriteria(),{wholeDay:false,title:'저장 당시 구성 · 현재 입력한 하루 기준 대비'});$('fs-meal-status').textContent='저장한 요리·무게·영양값을 불러왔습니다. 변경 후 영양 확인을 누르면 현재 자료로 다시 계산합니다.';
 }catch(error){$('fs-meal-status').textContent=error.message;}finally{control.disabled=false;}
});
const tabs = [...document.querySelectorAll('[data-view]')];
function switchView(tab) {
    if (pendingSave || saving) return;
    const next = tab.dataset.view;
    if (view === next || building) return;
    if (view !== 'meal') periods[view] = period;
    view = next;
    $('fs-period-status').textContent=periodMessages[next]||'';
    $('fs-month-review').hidden=view!=='month';$('fs-shopping-control').hidden=view!=='month';
    tabs.forEach(item => { item.setAttribute('aria-selected', String(item === tab)); item.tabIndex = item === tab ? 0 : -1; });
    $('fs-meal').hidden = view !== 'meal'; $('fs-period').hidden = view === 'meal';
    $('fs-period').setAttribute('aria-labelledby', tab.id);
    $('fs-period-heading').textContent = view === 'month' ? '나의 월간 식단' : '나의 주간 식단';
    $('fs-week-review').hidden = view !== 'week';
    period = next === 'meal' ? [] : periods[next];if(criteriaFor[next])renderCriteriaReport(criteriaFor[next]);else $('fs-criteria-report').replaceChildren(); baseline.clear();
    if (next !== 'meal') renderCalendar();
    $('fs-week-charts').replaceChildren(); $('fs-shopping').hidden = true;
    $('fs-save-status').textContent = '';
    if (next !== 'meal') $('fs-build').textContent = next === 'month' ? '월간 식단 추천받기' : '주간 식단 추천받기';
    persistStudio();
}
tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => switchView(tab));
    tab.addEventListener('keydown', event => {
        let next;
        if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
        if (event.key === 'ArrowLeft') next = (index + tabs.length - 1) % tabs.length;
        if (event.key === 'Home') next = 0;
        if (event.key === 'End') next = tabs.length - 1;
        if (next !== undefined) { event.preventDefault(); tabs[next].focus(); switchView(tabs[next]); }
    });
});
$('fs-apply-slot').addEventListener('click', () => {
    if (!editingTarget || saving || pendingSave || building) return;
    try {
        const parts = checkedSelectedParts();
        const target = periods[editingTarget.kind].find(slot => slotKey(slot) === editingTarget.key);
        if (!target) throw new Error('변경할 끼니를 다시 선택해 주세요.');
        replaceSlot(target, parts);target.locked=false;target.excluded=false;clearMealAdditionCandidates();
        const kind = editingTarget.kind; editingTarget = null; $('fs-replace-target').hidden = true;
        $('fs-save-meal').hidden = false; $('fs-meal-date').disabled = $('fs-meal-time').disabled = false;
        switchView(tabs.find(tab => tab.dataset.view === kind));
        renderCalendar(); markChanged();
        const notice=`${target.date} ${labels[target.meal]}을 ${kind==='month'?'월간':'주간'} 식단 초안에 반영했습니다. MyPage에는 아직 저장되지 않았습니다. 이 날짜가 포함된 주에서 ‘이번 주 저장’을 눌러주세요.`;
        $('fs-status').textContent=notice;
        $('fs-period-status').textContent=notice;
        $('fs-save-status').textContent=notice;
    } catch (error) { $('fs-meal-status').textContent = error.message; }
});
$('fs-cancel-slot').addEventListener('click', () => {
    if(saving||pendingSave||building)return;
    clearMealAdditionCandidates();const kind = editingTarget?.kind; editingTarget = null; $('fs-replace-target').hidden = true;
        $('fs-save-meal').hidden = false; $('fs-meal-date').disabled = $('fs-meal-time').disabled = false;
    if (kind) switchView(tabs.find(tab => tab.dataset.view === kind));
});
function persistStudio(){
 if(!draftReady)return false;
 try{
  const fields=Object.fromEntries(['fs-start','fs-scope','fs-meal-date','fs-meal-time'].map(id=>[id,$(id).value]));
  writeStudioDraft({recipes,plateSnapshots,periodGeneration,active:[...active],sideExtras:sides,periods,view,fields,monthDisplay:{weekStart:monthWeekStart,analysisScope:$('fs-analysis-scope').value,shoppingScope:$('fs-shopping-scope').value},periodTaste:$('fs-period-taste').checked,referenceFields:Object.fromEntries(referenceIds.map(id=>[id,$(id).value])),before,beforeAiCoverage,editingTarget,appliedTransfers:[...appliedTransfers].slice(-50)});
  $('fs-draft-status').textContent='식단 초안을 이 브라우저에 자동 보관했습니다. MyPage 최종 저장은 별도입니다.';return true;
 }catch(error){$('fs-draft-status').textContent='초안을 자동 보관하지 못했습니다. '+error.message;return false;}
}
function refreshLibraryEditors(){
 if(!catalogReady)return;
 document.querySelectorAll('#fs-library details[data-recipe-index]').forEach(details=>{
  if(details.contains(document.activeElement))return;
  const recipe=recipes[Number(details.dataset.recipeIndex)];if(!recipe)return;
  const summary=details.querySelector('summary');details.replaceChildren(summary);
  recipe.portions.forEach(item=>details.append(foodPicker(item,catalog,markChanged)));
 });
}
function restoreState(state){
 $('fs-period-taste').checked=Boolean(state.periodTaste);
 monthWeekStart=typeof state.monthDisplay?.weekStart==='string'?state.monthDisplay.weekStart:'';
 $('fs-analysis-scope').value=state.monthDisplay?.analysisScope==='month'?'month':'visible';
 $('fs-shopping-scope').value=state.monthDisplay?.shoppingScope==='month'?'month':'visible';
 periodGeneration=state.periodGeneration||null;plateSnapshots=Array.isArray(state.plateSnapshots)?state.plateSnapshots.slice(0,30):[];recipes=state.recipes.map(makeRecipe);active=new Map(state.active.filter(pair=>Array.isArray(pair)&&typeof pair[0]==='string').map(([key,n])=>[key,n==null?NaN:n]));
 for(const extra of (state.sideExtras||[]).slice(0,60))if(extra&&typeof extra.id==='string'&&typeof extra.name==='string'&&!sides.some(s=>s.id===extra.id))sides.push(extra);
 for(const kind of ['week','month'])periods[kind]=Array.isArray(state.periods?.[kind])?state.periods[kind].filter(slot=>slot&&/^\d{4}-\d{2}-\d{2}$/.test(slot.date)&&['breakfast','lunch','dinner','snack'].includes(slot.meal)).slice(0,93):[];
 for(const [id,value]of Object.entries(state.fields||{}))if(['fs-start','fs-scope','fs-meal-date','fs-meal-time'].includes(id))$(id).value=value;
 for(const meal of ['breakfast','lunch','dinner'])$('fs-scope-'+meal).checked=selectedMeals($('fs-scope').value).includes(meal);
 for(const [id,value]of Object.entries(state.referenceFields||{}))if(referenceIds.includes(id))$(id).value=value;
 before=state.before||null;beforeAiCoverage=state.beforeAiCoverage||{};editingTarget=state.editingTarget||null;
 for(const token of(state.appliedTransfers||[]))appliedTransfers.add(token);
 if(state.view==='week'||state.view==='month')switchView(tabs.find(tab=>tab.dataset.view===state.view));
 if(editingTarget){const target=periods[editingTarget.kind]?.find(slot=>slotKey(slot)===editingTarget.key);if(target){$('fs-replace-target').hidden=false;$('fs-save-meal').hidden=true;$('fs-meal-date').disabled=$('fs-meal-time').disabled=true;$('fs-replace-label').textContent=`${target.date} ${labels[target.meal]} · ${slotName(target)} → 내가 구성한 한 끼`;}else editingTarget=null;}
}
window.addEventListener('pagehide',persistStudio);
document.addEventListener('visibilitychange',()=>{if(document.hidden)persistStudio();});
for(const id of ['fs-start','fs-scope','fs-meal-date','fs-meal-time'])for(const name of ['input','change'])$(id).addEventListener(name,persistStudio);

$('fs-clear-draft').addEventListener('click',()=>{
 if(saving||pendingSave){$('fs-draft-status').textContent='먼저 진행 중인 MyPage 저장 결과를 확인해 주세요.';return;}
 try{clearStudioDraft();clearMealAdditionCandidates();periodMessages.week=periodMessages.month='';$('fs-period-status').textContent='';recipes=[];plateSnapshots=[];periodGeneration=null;active.clear();appliedTransfers.clear();sides.splice(builtinSideCount);const cleanUrl=new URL(location.href);cleanUrl.searchParams.delete('transfer');cleanUrl.searchParams.delete('compose');history.replaceState(null,'',cleanUrl.pathname+cleanUrl.search);periods.week=[];periods.month=[];period=[];previousMonthEntries=[];previousMonthKey='';monthWeekStart='';$('fs-shopping-scope').value='visible';$('fs-analysis-scope').value='visible';before=null;beforeAiCoverage={};editingTarget=null;view='meal';$('fs-replace-target').hidden=true;$('fs-save-meal').hidden=false;$('fs-meal-date').disabled=$('fs-meal-time').disabled=false;
  tabs.forEach(tab=>{tab.setAttribute('aria-selected',String(tab.dataset.view==='meal'));tab.tabIndex=tab.dataset.view==='meal'?0:-1;});$('fs-meal').hidden=false;$('fs-period').hidden=true;renderLibrary();renderPlate();markChanged();
 }catch(error){$('fs-draft-status').textContent=error.message;}
});
const referenceIds=['fs-reference-sex','fs-reference-age','fs-goal-energy','fs-goal-sodium','fs-goal-source',...['carbohydrate','protein','fat','saturated_fat','sugars','fiber'].map(k=>'fs-personal-'+k)];
for(const id of referenceIds)$(id).addEventListener('change',()=>{renderCurrentMeal();if(period.length)renderCalendar();persistStudio();});
function matchPublicNutrition(items){
 if(!catalogReady)return;
 for(const item of items)if(!item.foodId){const parsed=parseRecipe({servings:1,ingredients:[item.text||`${item.name} ${item.grams}g`]},catalog)[0];if(parsed?.foodId)item.foodId=parsed.foodId;}
}
async function hydrateNutrition(){
 if(!catalogReady)return;
 const owner=accountKey(),captured=revision,items=nutritionItems();
 const current=()=>owner===accountKey()&&captured===revision&&!saving&&!pendingSave;
 matchPublicNutrition(items);
 try{await resolveIngredientMatches(items.filter(i=>i.matchStatus!=='confirmed'),catalog,()=>{},current);}catch{if(current())$('fs-period-nutrition-status').textContent='기본 영양 자료는 준비됐습니다. 일부 재료의 추가 연결이 지연되어 해당 성분은 자료 부족으로 표시합니다.';}
 if(!current())return;
 refreshLibraryEditors();renderSides();renderCurrentMeal();if(period.length)renderCalendar();persistStudio();
 await completeNutrition(items,catalog,current);
 if(current()){refreshLibraryEditors();renderCurrentMeal();if(period.length)renderCalendar();persistStudio();}
}
function prepareNutritionCatalog(){
 if(catalogLoading)return catalogLoading;
 if(catalogReady){return hydrateNutrition().catch(()=>{});}
 const owner=accountKey();$('fs-period-nutrition-status').textContent='영양 자료를 준비하고 있습니다. 기다리지 않고 주간·월간 추천을 받을 수 있습니다.';$('fs-retry-catalog').hidden=true;
 catalogLoading=(async()=>{
  try{
   const loaded=await Promise.resolve().then(()=>loadCatalog());
   if(owner!==accountKey())return false;
   if(!(loaded instanceof Map)||!loaded.size)throw Error('사용 가능한 영양 자료가 없습니다.');
   catalog=loaded;catalogReady=true;
   for(const id of ['fs-confirm-meal','fs-load-library','fs-load-saved-plan'])$(id).disabled=false;
   $('fs-period-nutrition-status').textContent='영양 자료를 불러왔습니다. 식단 재료의 영양 연결을 갱신합니다.';
   hydrateNutrition().catch(()=>{if(owner===accountKey())$('fs-period-nutrition-status').textContent='기본 영양 자료는 준비됐습니다. 추가 영양 연결은 잠시 후 다시 확인해 주세요.';});
   return true;
  }catch(error){
   if(owner===accountKey()){$('fs-period-nutrition-status').textContent='영양 자료 연결 실패: '+error.message+' 주간·월간 식단 추천은 계속 이용할 수 있습니다. 영양 자료 없는 성분은 평가하지 않습니다.';$('fs-retry-catalog').hidden=false;}
   return false;
  }finally{catalogLoading=null;}
 })();
 return catalogLoading;
}
$('fs-retry-catalog').addEventListener('click',()=>prepareNutritionCatalog());
async function init(){
 $('fs-start').value=$('fs-meal-date').value=today;catalog=new Map();$('fs-confirm-meal').disabled=true;$('fs-load-library').disabled=true;$('fs-load-saved-plan').disabled=true;
 try{
  const state=readStudioDraft();if(state)restoreState(state);
  const transferId=new URLSearchParams(location.search).get('transfer'),transfer=loadMealTransfer(transferId);
  if(transfer&&!appliedTransfers.has(transferId)){
   const next=[...recipes],indices=[];
   for(const recipe of transfer.recipes){let index=next.findIndex(r=>recipeIdentity(r)===recipeIdentity(recipe));if(index<0){index=next.length;next.push(makeRecipe(recipe));}indices.push(index);}
   if(next.length>30)throw Error('초안에 최대 30개 요리를 보관할 수 있습니다. 새 초안을 시작하고 추천 화면에서 다시 보내주세요.');
   recipes=next;if(view!=='meal')switchView(tabs.find(tab=>tab.dataset.view==='meal'));
   const choose=indices.length<=5?indices:active.size?[]:indices.slice(0,1);for(const index of choose)if(!active.has(`recipe:${index}`))active.set(`recipe:${index}`,1);
   appliedTransfers.add(transferId);
  }else if(!state&&!transfer){
   recipes=readDraft().map(makeRecipe);if(recipes.length<=5&&new URLSearchParams(location.search).get('compose')==='selected')recipes.forEach((_,i)=>active.set(`recipe:${i}`,1));else if(recipes.length)active.set('recipe:0',1);
  }
  draftReady=true;renderLibrary();renderPlate();renderSides();
  const saved=persistStudio();
  if(transfer&&saved){const changedCart=acknowledgeMealTransfer(transferId,transfer);const url=new URL(location.href);url.searchParams.delete('transfer');url.searchParams.delete('compose');history.replaceState(null,'',url.pathname+url.search);$('fs-status').textContent=changedCart?'요리는 초안에 옮겼습니다. 다른 화면에서 담은 목록이 변경되어 목록은 유지했습니다.':'담은 요리를 초안으로 옮겼습니다. 추천 화면의 담은 목록은 비웠습니다. MyRecipe는 유지됩니다.';}
  else $('fs-status').textContent=state?'보관한 초안을 불러왔습니다. 요리·인분·분량을 이어서 조절하세요.':'요리를 고르고 한 끼·주간·월간 식단을 구성해 보세요.';
  try{
   const receipts=JSON.parse(sessionStorage.getItem('smartnf.food-studio.receipts'));if(receipts?.account===accountKey()&&Date.now()-receipts.created<3600000&&Array.isArray(receipts.signatures))receipts.signatures.forEach(value=>savedSignatures.add(value));
   const retry=JSON.parse(sessionStorage.getItem('smartnf.food-studio.pending'));if(retry?.account===accountKey()&&retry.request?.body?.requestId&&retry.request?.signature){pendingSave=retry.request;lockSave(true);$('fs-status').textContent='이전 MyPage 저장 결과를 확인해야 합니다. 저장 버튼으로 같은 요청을 확인해 주세요.';}
  }catch{}
 }catch(error){$('fs-status').textContent=error.message;}
 // Nutrition startup is independent of draft restoration and recommendation.
 prepareNutritionCatalog();
}
init();
window.addEventListener('smartnf-auto-nutrition-changed',async()=>{if(!catalogReady)return;await completeNutrition(nutritionItems(),catalog);refreshLibraryEditors();markChanged();});

for(const id of ['fs-criteria-general','fs-criteria-special','fs-criteria-bp','fs-criteria-fiber','fs-goal-energy','fs-goal-sodium','fs-goal-source','fs-criteria-excluded'])$(id).addEventListener('change',()=>{$('fs-status').textContent='추천 기준을 바꿨습니다. 추천받기를 누르면 메뉴 배치에 적용합니다. 목표 그래프는 현재 입력값으로 갱신합니다.';renderCurrentMeal();if(period.length)renderCalendar();});
