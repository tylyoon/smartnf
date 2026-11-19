import {stageMealTransfer} from './studio-draft.js';
import {completeNutrition,automaticNutritionEnabled} from './nutrition-auto.js';
import { goalInput, conditionInput, normalizedName, simpleIngredient } from './recipe-input-helper.js?v=helper203';
import { api, element, button, loadCatalog, parseRecipe, resolveIngredientMatches, foodPicker, renderBars, writeDraft, readDraft, addToMealCart } from './food-studio-core.js';

const panel = document.getElementById('recipe-lab');
const status = document.getElementById('recipe-lab-status');
const editors = document.getElementById('recipe-lab-editors');
const chart = document.getElementById('recipe-lab-charts');
const calculationNote = element('p', '', 'fs-calculation-note');
calculationNote.setAttribute('role', 'status');
calculationNote.style.minHeight = '24px';
calculationNote.style.margin = '8px 0';
chart.before(calculationNote);
const rawInput = document.getElementById('recipe-normalize-input');
const normalizeButton = document.getElementById('recipe-normalize');
const normalizeStatus = document.getElementById('recipe-normalize-status');
const applyName = document.getElementById('recipe-normalize-apply');
let entries = [];
let selected = [];
let parsed = [];
let catalog;
let revision = 0;
let calculateSequence = 0;
let normalized = '';
let normalizedMode = '';
let helperValue = null;
let recalculateTimer;

window.addEventListener('smartnf-recipes-ready', event => {
    entries=event.detail.entries;selected=entries.filter(entry=>entry.valid);revision++;panel.open=false;
    showComparison();
});
window.addEventListener('smartnf-recipe-updated',()=>{selected=entries.filter(entry=>entry.valid);revision++;showComparison();});
window.addEventListener('smartnf-recipes-cleared',()=>{
    entries=[];selected=[];parsed=[];revision++;calculateSequence++;clearTimeout(recalculateTimer);panel.hidden=true;editors.replaceChildren();chart.replaceChildren();
});
async function showComparison(){
    if(!selected.length){panel.hidden=true;return;}
    const captured = revision;
    panel.hidden = false;
    status.textContent = '비교할 음식의 영양 자료를 확인하고 있습니다.';
    chart.replaceChildren(); editors.replaceChildren();
    try {
        catalog = await loadCatalog();
        if (captured !== revision) return;
        parsed = selected.map(entry => ({ entry, ingredients: parseRecipe(entry.recipe, catalog) }));
        await resolveIngredientMatches(parsed.flatMap(item => item.ingredients), catalog,
            message => { if (captured === revision) status.textContent = message; }, () => captured === revision);
        if (captured !== revision) return;
        for (const item of parsed) {
            const details = element('details', undefined, 'fs-editor');
            const heading = element('summary', undefined, 'fs-recipe-heading');
            heading.append(element('strong', item.entry.recipe.name, 'fs-recipe-name'),
                element('span', '재료·분량 보기 / 수정', 'fs-recipe-help'));
            details.append(heading);
            details.open = false;
            details.append(element('p', '표시한 DB 기준으로 추정합니다. 실제 재료가 다르면 변경하세요. 수정하면 자동으로 다시 계산됩니다.'));
            item.ingredients.forEach(ingredient => details.append(foodPicker(ingredient, catalog, () => {
                chart.setAttribute('aria-busy', 'true');
                calculationNote.textContent = '수정 중 · 그래프는 이전 계산값입니다.';
                calculateSequence++;
                clearTimeout(recalculateTimer);
                recalculateTimer = setTimeout(calculate, 350);
            })));
            editors.append(details);
        }
        await calculate();
    } catch (error) { status.textContent = error.message; }
}

async function calculate() {
    clearTimeout(recalculateTimer);
    const seq = ++calculateSequence;
    const captured = revision;
    if(automaticNutritionEnabled()){
        try{
            const preview=await api('/api/recipes/nutrition',{estimate:true,meals:parsed.map(item=>({name:item.entry.recipe.name,servings:item.entry.recipe.servings,ingredients:item.ingredients.map(({foodId,grams})=>({foodId,grams:Number.isFinite(grams)?grams:null}))}))});
            if(captured===revision&&seq===calculateSequence)renderBars(chart,preview.map(item=>({name:item.name,values:item.nutrients,coverage:item.coverage,aiCoverage:item.aiCoverage,total:item.total})));
        }catch{/* Final calculation reports any persistent error. */}
    }
    await completeNutrition(parsed.flatMap(item=>item.ingredients),catalog,()=>captured===revision&&seq===calculateSequence);
    if(captured!==revision||seq!==calculateSequence)return;
    const meals = parsed.map(item => ({ name: item.entry.recipe.name, servings: item.entry.recipe.servings,
        ingredients: item.ingredients.map(({ foodId, grams }) => ({ foodId, grams: Number.isFinite(grams) ? grams : null })) }));
    chart.setAttribute('aria-busy', 'true');
    calculationNote.textContent = '계산 중 · 그래프는 이전 계산값입니다.';
    try {
        const analyses = await api('/api/recipes/nutrition', { meals, estimate: true });
        if (seq !== calculateSequence || captured !== revision) return;
        const data = analyses.map(item => ({ name: item.name, values: item.nutrients, coverage: item.coverage, aiCoverage:item.aiCoverage, total: item.total }));
        renderBars(chart, data);
        const missing = analyses.reduce((sum, item) => sum + item.total - item.matched, 0);
        const assumptions = parsed.flatMap(item => item.ingredients.filter(ingredient => ingredient.matchStatus === 'reference')
            .map(ingredient => `${ingredient.name || ingredient.text} → ${catalog.get(ingredient.foodId)?.name}`));
        const bases = [...new Set(assumptions)];
        const partial = analyses.some(item => Object.values(item.coverage || {}).some(count => count < item.total));
        status.textContent = `${analyses.length}개 음식의 1인분 추정값입니다.`
            + (bases.length ? ` 추정 기준: ${bases.join(' / ')}.` : '')
            + (partial ? ' 일부 합계는 자료가 있는 재료만 더한 값으로, 음식 전체 값이나 우열 판단에 사용할 수 없습니다.' : '')
            + (missing ? ` 미연결 또는 분량 미확인 재료 ${missing}건은 재료·분량을 펼쳐 확인할 수 있습니다.` : '');
        calculationNote.textContent = '수정한 분량으로 계산을 완료했습니다.';
    } catch (error) {
        if (seq === calculateSequence && captured === revision) calculationNote.textContent = `${error.message} 그래프는 이전 계산값입니다.`;
    } finally {
        if (seq === calculateSequence && captured === revision) chart.setAttribute('aria-busy', 'false');
    }
}
document.getElementById('recipe-lab-recalculate').addEventListener('click', calculate);
window.smartnfMealRegistration={
 prepare(chosen){
    const recipes=chosen.map(entry=>{
        const edited=parsed.find(p=>p.entry===entry);
        return edited?{...entry.recipe,ingredientRefs:edited.ingredients.map(i=>i.foodId||''),ingredients:edited.ingredients.map(i=>i.foodId&&i.grams>0?`${catalog.get(i.foodId)?.name||i.name||i.text} ${i.grams}g`:i.text)}:entry.recipe;
    });
    const names=new Set([...readDraft(),...recipes].map(r=>r.name.normalize('NFKC').replace(/[\s_·]/g,'').toLowerCase()));
    if(names.size>20)throw new Error('한 끼에는 최대 20개 요리를 담을 수 있습니다. 아래 목록에서 요리를 먼저 빼주세요.');
    return recipes;
 },
 commit(recipes){addToMealCart(recipes);renderCart();}
};
const helperMode = () => document.querySelector('input[name="recipe-mode"]:checked').value;
const helperHints = {
 ingredients:['정리할 재료·분량','예: 돼지고기 조금, 두부 반 모','재료명과 원문 분량을 정리해 재료 입력에 적용합니다.'],
 'food-name':['정리할 음식명','예: 스파게티, 김치찌게','음식명 한 가지를 정리해 음식명 입력에 적용합니다.'],
 goal:['정리할 열량 목표','예: 한 끼 500kcal 이하','입력한 1인분 열량 상한만 확인합니다. 필요한 열량을 추정하지 않습니다.'],
 conditions:['정리할 질환명·명시한 제외 조건','예: 고혈압, 소금 빼기','질환명과 명시한 조건만 정리합니다. 식사 제한을 임의로 결정하지 않습니다.']
};
let helperSequence=0,helperRequest=null;
const cancelHelper=button('입력 정리 중단',()=>{invalidateHelper();normalizeStatus.textContent='입력 정리를 중단했습니다. 다시 정리하거나 아래 입력칸에 직접 입력할 수 있습니다.';});
cancelHelper.hidden=true;normalizeButton.after(cancelHelper);
function invalidateHelper(){
 helperSequence++;helperRequest?.abort();helperRequest=null;normalizeButton.disabled=false;cancelHelper.hidden=true;
 normalized='';helperValue=null;normalizedMode='';applyName.hidden=true;
}
function helperContext(){
 invalidateHelper();const hint=helperHints[helperMode()];document.getElementById('recipe-normalize-label').textContent=hint[0];rawInput.placeholder=hint[1];normalizeStatus.textContent=hint[2];
}
document.querySelectorAll('input[name="recipe-mode"]').forEach(input=>input.addEventListener('change',helperContext));
normalizeButton.addEventListener('click',async()=>{
 const original=rawInput.value.trim(),mode=helperMode();invalidateHelper();
 if(!original){normalizeStatus.textContent='정리할 표현을 입력하세요.';return;}
 const sequence=helperSequence,controller=new AbortController();helperRequest=controller;
 normalizeButton.disabled=true;cancelHelper.hidden=false;normalizeStatus.textContent='입력을 확인하고 있습니다. 자체 모델이 지연되면 중단하거나 직접 입력할 수 있습니다.';
 let timedOut=false;const timer=setTimeout(()=>{timedOut=true;controller.abort();},20000);
 try{
  let value;
  const simple=mode==='ingredients'?simpleIngredient(original):null;
  if(simple)value={text:simple};
  else if(mode==='goal')value=goalInput(original);
  else if(mode==='conditions')value=conditionInput(original,document.getElementById('recipe-condition').value);
  else{const result=await api('/api/recipes/normalize',{text:original},controller.signal);value={text:normalizedName(mode,result.entities)};}
  if(sequence!==helperSequence||rawInput.value.trim()!==original||helperMode()!==mode||controller.signal.aborted)return;
  helperValue=value;normalized=value.text;normalizedMode=mode;normalizeStatus.textContent=`확인한 입력 · ${normalized}`;applyName.hidden=false;
 }catch(error){
  if(sequence===helperSequence&&rawInput.value.trim()===original&&helperMode()===mode)normalizeStatus.textContent=timedOut?'자체 모델 응답이 지연되어 정리를 중단했습니다. 다시 시도하거나 아래 입력칸에 직접 입력해 주세요.':error.message;
 }finally{clearTimeout(timer);if(sequence===helperSequence){helperRequest=null;normalizeButton.disabled=false;cancelHelper.hidden=true;}}
});
rawInput.addEventListener('input',()=>{invalidateHelper();normalizeStatus.textContent='입력이 바뀌었습니다. 입력 정리하기를 눌러 확인해 주세요.';});
rawInput.addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();if(!normalizeButton.disabled)normalizeButton.click();}});
applyName.addEventListener('click',()=>{
 const mode=helperMode();if(!helperValue||normalizedMode!==mode){normalizeStatus.textContent='현재 검색 기준에서 다시 확인해 주세요.';return;}
 const id=mode==='food-name'?'recipe-food-name':mode==='ingredients'?'recipe-ingredients':mode==='goal'?'recipe-calories':'recipe-condition';
 const input=document.getElementById(id);
 if(mode==='conditions'){
  input.value=helperValue.profile;
  if(helperValue.name)document.getElementById('recipe-other-condition').value=helperValue.name;
  for(const key of helperValue.exclusions){const checkbox=document.querySelector(`input[name="recipe-exclusion"][value="${key}"]`);if(checkbox)checkbox.checked=true;}
 }else{
  const value=mode==='goal'?String(helperValue.calories):normalized;
  if(input.maxLength>0&&value.length>input.maxLength){normalizeStatus.textContent='입력 길이를 줄여 주세요.';return;}input.value=value;
 }
 input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));
 document.getElementById('recipe-ai-consent').checked=false;
 normalizeStatus.textContent='선택한 검색 기준의 입력에 반영했습니다. 조건을 확인하고 동의해 주세요.';
});
helperContext();

function renderCart(){
 const recipes=readDraft(),root=document.getElementById('meal-cart-items');root.replaceChildren();
 document.getElementById('meal-cart-count').textContent=`한 끼에 담은 요리 · ${recipes.length}/20개`;
 document.getElementById('meal-cart-open').disabled=!recipes.length;
 recipes.forEach((recipe,index)=>{const row=element('div',undefined,'fs-cart-row');row.append(element('strong',recipe.name),button('빼기',()=>{const latest=readDraft();latest.splice(index,1);writeDraft(latest);renderCart();}));root.append(row);});
}
document.getElementById('meal-cart-open').addEventListener('click',()=>{try{const id=stageMealTransfer();location.assign('/preview/recipes/simulator?transfer='+encodeURIComponent(id));}catch(error){document.getElementById('meal-cart-status').textContent=error.message;}});
window.addEventListener('pageshow',renderCart);window.addEventListener('storage',renderCart);
document.getElementById('meal-cart-clear').addEventListener('click',()=>{writeDraft([]);renderCart();});
window.addEventListener('smartnf-auto-nutrition-changed',()=>{if(parsed.length&&catalog)calculate();});
renderCart();
