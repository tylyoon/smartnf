const {JSDOM}=require(process.env.SMARTNF_TEST_JSDOM||'jsdom'),fs=require('fs'),path=require('path'),assert=require('assert');
const root=path.join(__dirname,'../src/main/resources'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
const wait=()=>new Promise(r=>setTimeout(r,20));
(async()=>{
 const d=new JSDOM(read('templates/preview/recipes/recommend.html'),{runScripts:'outside-only',url:'http://localhost:8080/preview/recipes/recommend'}),w=d.window;w.AbortSignal=AbortSignal;w.structuredClone=structuredClone;
 const doc=w.document;doc.querySelector('meta[name=_csrf]').content='test';doc.querySelector('meta[name=_csrf_header]').content='X-CSRF-TOKEN';
 w.fetch=async()=>({ok:true,status:200,headers:{get:()=> 'application/json'},json:async()=>[]});w.matchMedia=()=>({matches:true});w.HTMLElement.prototype.scrollIntoView=()=>{};
 w.eval(read('static/js/recipe-finder.js'));
 const moduleSource=read('static/js/recipe-input-helper.js').replace(/export /g,'');w.eval(moduleSource+'\nwindow.helpers={goalInput,conditionInput,normalizedName};');
 const core=read('static/js/food-studio-core.js').replace(/export /g,'');w.eval(core+'\nwindow.core198={element,button,renderBars};');
 const fakeApi=async(url)=>{if(url==='/api/recipes/normalize')return {entities:[{normalized_name:'스파게티',kind:'dish',amount_text:null}]};throw Error(url);};w.fakeApi=fakeApi;
 let lab=read('static/js/recipe-lab.js').replace(/^import .*;\n/gm,'');
 lab='const {goalInput,conditionInput,normalizedName}=window.helpers;const {element,button,renderBars}=window.core198;const api=window.fakeApi;const loadCatalog=()=>{};const parseRecipe=()=>{};const resolveIngredientMatches=()=>{};const foodPicker=()=>{};const writeDraft=()=>{};\n'+lab;w.eval(lab);
 const form=doc.getElementById('recipe-finder');assert(form.querySelector('.recipe-modes').compareDocumentPosition(form.querySelector('.fs-name-helper'))&w.Node.DOCUMENT_POSITION_FOLLOWING);
 const raw=doc.getElementById('recipe-normalize-input'),normalize=doc.getElementById('recipe-normalize'),apply=doc.getElementById('recipe-normalize-apply');raw.value='스파게티';normalize.click();await wait();assert(apply.hidden);assert.match(doc.getElementById('recipe-normalize-status').textContent,/음식명으로 찾기/);
 function mode(value){const r=doc.querySelector(`input[name=recipe-mode][value="${value}"]`);r.checked=true;r.dispatchEvent(new w.Event('change'));}
 doc.getElementById('recipe-ingredients').value='스파게티';mode('food-name');assert.equal(doc.getElementById('recipe-food-name').value,'스파게티');assert.equal(raw.value,'스파게티');normalize.click();await wait();assert(!apply.hidden);apply.click();assert.equal(doc.getElementById('recipe-food-name').value,'스파게티');assert(doc.querySelector('input[value="food-name"]').checked);
 mode('ingredients');assert.equal(doc.getElementById('recipe-ingredients').value,'스파게티');mode('goal');raw.value='한 끼 500kcal 이하';raw.dispatchEvent(new w.Event('input'));normalize.click();await wait();apply.click();assert.equal(doc.getElementById('recipe-calories').value,'500');
 mode('conditions');raw.value='고혈압, 소금 빼기';raw.dispatchEvent(new w.Event('input'));normalize.click();await wait();apply.click();assert.equal(doc.getElementById('recipe-condition').value,'pressure');assert(doc.querySelector('input[name=recipe-exclusion][value=salt]').checked);assert(!doc.getElementById('recipe-ai-consent').checked);
 assert.throws(()=>w.helpers.goalInput('하루 1500kcal'));assert.throws(()=>w.helpers.goalInput('500~600kcal'));assert.equal(w.helpers.goalInput('한 끼 1인분 450칼로리 이하').calories,450);
 const chart=doc.createElement('div');w.core198.renderBars(chart,[{name:'일부',values:{energy:50},coverage:{energy:2},total:4},{name:'전체',values:{energy:100},coverage:{energy:4},total:4},{name:'미확인',values:{energy:null},coverage:{energy:0},total:4}],['energy']);assert.equal(chart.querySelector('.fs-bar-partial').style.width,'50%');assert.match(chart.textContent,/일부 합계 \(2\/4개\)/);assert.match(chart.textContent,/전체 음식 값/);assert.equal(chart.querySelectorAll('.fs-bar')[2].style.width,'0%');assert.match(chart.textContent,/자료 부족/);
 console.log('Passed: criteria-first DOM, dish/ingredient routing, mode input preservation, all four helper modes, consent reset, explicit calorie safeguards, partial bar + missing value');
})().catch(e=>{console.error(e);process.exitCode=1;});
