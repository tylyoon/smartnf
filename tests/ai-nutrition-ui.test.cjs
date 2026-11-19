const {JSDOM}=require(process.env.SMARTNF_TEST_JSDOM||'jsdom'),fs=require('fs'),path=require('path'),assert=require('assert');
const root=path.join(__dirname,'../src/main/resources'),read=f=>fs.readFileSync(path.join(root,f),'utf8'),wait=()=>new Promise(r=>setTimeout(r,20));
(async()=>{
 const d=new JSDOM(read('templates/preview/recipes/recommend.html'),{runScripts:'outside-only',url:'http://localhost:8080/preview/recipes/recommend'}),w=d.window,doc=w.document;w.AbortSignal=AbortSignal;w.structuredClone=structuredClone;
 doc.querySelector('meta[name=_csrf]').content='token';doc.querySelector('meta[name=_csrf_header]').content='X-CSRF-TOKEN';doc.querySelector('header').dataset.accountKey='member:1';
 let current=null,requests=0,reviews=0;
 w.fetch=async(url,opts={})=>{
  if(url==='/api/me/ai-nutrition'&&opts.method==='POST'){
   const input=JSON.parse(opts.body);assert.equal(input.name,'검사 재료');assert(input.consent);assert.equal(opts.headers['X-CSRF-TOKEN'],'token');requests++;
   current={id:'ai:00000000-0000-4000-8000-000000000001',name:input.name,basis:'100g',status:'UNREVIEWED',model:'fixture',source:'AI_UNVERIFIED',createdAt:'2026-11-10',note:'가정',revision:2,referenceFoodId:'',nutrients:{energy:80,protein:10,carbohydrate:5,fat:2,sodium:100,sugars:1,fiber:2,saturated_fat:1},aiKeys:['energy','protein','carbohydrate','fat','sodium','sugars','fiber','saturated_fat']};
   return {ok:true,headers:{get:()=> 'application/json'},json:async()=>structuredClone(current)};
  }
  if(url.endsWith('/review')){const b=JSON.parse(opts.body);assert.equal(b.revision,current.revision);reviews++;current.status=b.action==='CONFIRM'?'USER_CONFIRMED':'EXCLUDED';current.revision++;return {ok:true,headers:{get:()=> 'application/json'},json:async()=>structuredClone(current)};}
  return {ok:true,headers:{get:()=> 'application/json'},json:async()=>current?[current]:[]};
 };
 const code=read('static/js/food-studio-core.js').replace(/export /g,'');w.eval(code+'\nwindow.core={foodPicker,renderBars};');
 const catalog=new Map(),item={name:'검사 재료',text:'검사 재료 50g',grams:50,foodId:'',matchStatus:'manual'};let changed=0;const picker=w.core.foodPicker(item,catalog,()=>changed++);doc.body.append(picker);
 const find=text=>[...picker.querySelectorAll('button')].find(b=>b.textContent===text);
 find('AI 추정 요청·DB 저장').click();await wait();assert.equal(requests,0);picker.querySelector('.fs-ai-estimate input[type=checkbox]').checked=true;find('AI 추정 요청·DB 저장').click();await wait();assert.equal(requests,1);assert.equal(item.foodId,'');assert.match(picker.textContent,/미검토 AI 추정/);
 find('확인 후 이 재료에 적용').click();await wait();assert.equal(item.foodId,current.id);assert(catalog.get(current.id).ai);assert.equal(reviews,1);assert.equal(changed,1);
 const chart=doc.createElement('div');w.core.renderBars(chart,[{name:'검사',values:{energy:40},coverage:{energy:1},aiCoverage:{energy:1},total:1}],['energy']);assert.match(chart.textContent,/AI 추정 포함/);assert(chart.querySelector('.fs-bar-ai'));
 find('이 자료 사용 제외').click();await wait();assert.equal(item.foodId,'');assert(!catalog.has(current.id));assert.equal(changed,2);
 // Move only the helper: criteria first, then helper, then the food input panel.
 const form=doc.getElementById('recipe-finder'),helper=form.querySelector('.fs-name-helper');assert(helper.compareDocumentPosition(form.querySelector('[data-recipe-mode=ingredients]'))&w.Node.DOCUMENT_POSITION_FOLLOWING);
 // Execute actual comparison selection code with inert nutritional helpers.
 w.eval(read('static/js/recipe-input-helper.js').replace(/export /g,'')+'\nwindow.inputHelpers={goalInput,conditionInput,normalizedName};');
 let draft;w.captureDraft=r=>draft=r;w.matchMedia=()=>({matches:true});
 let lab=read('static/js/recipe-lab.js').replace(/^import .*;\n/gm,'');
 lab='const {goalInput,conditionInput,normalizedName}=window.inputHelpers;const element=(t,v,c)=>{const n=document.createElement(t);if(v)n.textContent=v;if(c)n.className=c;return n;};const button=(t,f)=>{const b=element("button",t);b.addEventListener("click",f);return b;};const api=()=>{};const loadCatalog=()=>{};const parseRecipe=()=>{};const resolveIngredientMatches=()=>{};const foodPicker=()=>{};const renderBars=()=>{};const writeDraft=window.captureDraft;\n'+lab.replace("location.assign('/preview/recipes/simulator?compose=selected');","window.composedUrl='/preview/recipes/simulator?compose=selected';");w.eval(lab);
 const entries=[1,2,3].map(n=>{const card=doc.createElement('article'),control=doc.createElement('button'),parent=doc.createElement('div');parent.append(control);card.append(parent);return {recipe:{name:'음식'+n,servings:1,minutes:10,ingredients:['재료 10g'],steps:['조리']},valid:true,part:()=>control};});
 w.dispatchEvent(new w.CustomEvent('smartnf-recipes-ready',{detail:{entries}}));entries.forEach(e=>{e.compareSelection.checked=true;e.compareSelection.dispatchEvent(new w.Event('change'));});doc.getElementById('recipe-compose-selected').click();assert.equal(draft.length,3);assert.match(w.composedUrl,/compose=selected/);assert.match(doc.getElementById('recipe-compose-selected').textContent,/3개/);
 // Run the actual simulator with three incoming recipes and no external services.
 const sim=new JSDOM(read('templates/preview/recipes/simulator.html'),{runScripts:'outside-only',url:'http://localhost:8080/preview/recipes/simulator?compose=selected'}),sw=sim.window;sw.structuredClone=structuredClone;sw.AbortSignal=AbortSignal;
 sw.eval(code+'\n'+read('static/js/meal-plan-state.js').replace(/export /g,'')+'\nloadCatalog=async()=>new Map();readDraft=()=>'+JSON.stringify(draft)+';resolveIngredientMatches=async()=>{};api=async()=>null;\n'+read('static/js/meal-studio.js').replace(/^import[\s\S]*?from \'\.\/food-studio-core.js\';\n/,''));
 await wait();assert.equal(sw.document.querySelectorAll('#fs-plate article').length,3,sw.document.getElementById('fs-status').textContent);assert([...sw.document.querySelectorAll('#fs-plate input')].every(i=>i.value==='1'));
 sw.document.querySelector('#fs-plate button').click();assert.equal(sw.document.querySelectorAll('#fs-plate article').length,2);sim.window.close();
 console.log('UI: helper before input, 3 selected dishes transferred, opt-in request, saved-but-not-applied pending record, confirm/apply, AI chart badge and exclude passed');
})().catch(e=>{console.error(e);process.exitCode=1;});
