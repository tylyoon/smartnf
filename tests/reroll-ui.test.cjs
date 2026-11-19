const {JSDOM}=require(process.env.SMARTNF_TEST_JSDOM||'jsdom'),fs=require('fs'),path=require('path'),assert=require('assert'),{webcrypto}=require('crypto');
const root=path.join(__dirname,'../src/main/resources'),read=p=>fs.readFileSync(path.join(root,p),'utf8'),wait=()=>new Promise(r=>setTimeout(r,30));
(async()=>{
 const dom=new JSDOM(read('templates/preview/recipes/recommend.html'),{runScripts:'outside-only',url:'http://localhost/preview/recipes/recommend'}),w=dom.window,d=w.document;w.TextEncoder=TextEncoder;w.AbortSignal=AbortSignal;Object.defineProperty(w.crypto,'subtle',{value:webcrypto.subtle});
 d.querySelector('header').dataset.accountKey='member:1';d.querySelector('meta[name=_csrf]').content='token';d.querySelector('meta[name=_csrf_header]').content='X-CSRF-TOKEN';let batches=[],comparisons=0,fail=false,uncertain=false,normalizes=0,delayed=null,autoCalls=0,autoRecords=[],responsePool=null,failReroll=false,exclusions=[];
 const recipes=[1,2,3,4,5].map(i=>({name:'요리'+i,servings:1,minutes:10,ingredients:['두부 100g'],steps:['조리']}));
 w.fetch=async(url,options={})=>{
  let data={};const body=options.body?JSON.parse(options.body):{};let status=200;
  if(url==='/api/recipes/normalize'){
   normalizes++;
   if(body.text==='응답 대기'){return new Promise((resolve,reject)=>{delayed={resolve,reject};options.signal.addEventListener('abort',()=>reject(new w.DOMException('aborted','AbortError')));});}
   data={entities:[{normalized_name:body.text==='스파게티'?'스파게티':'양파',kind:body.text==='스파게티'?'dish':'ingredient',amount_text:null}]};
  }
  else if(url.includes('generate-candidates')){data=responsePool||recipes;if(body.excludedRecipeNames){exclusions.push(body.excludedRecipeNames);if(failReroll){status=503;data={};}}}
  else if(url==='/api/me/ai-nutrition'){
   if(options.method==='POST'){autoCalls++;data={id:'ai:fixture',name:body.name,referenceFoodId:body.referenceFoodId,status:'UNREVIEWED',revision:2,model:'fixture',createdAt:'2026-11-10',nutrients:{energy:80,protein:8},aiKeys:['protein']};autoRecords.unshift(data);}else data=autoRecords;
  }
  else if(url.endsWith('/review')){assert.equal(body.action,'AUTO_APPLY');autoRecords[0].status='AUTO_APPLIED';data=autoRecords[0];}
  else if(url==='/api/recipes/nutrition'){comparisons++;assert.equal(body.meals.length,5);data=body.meals.map(m=>({name:m.name,nutrients:{energy:80},coverage:{energy:1},aiCoverage:{},total:1,matched:1}));}
  else if(url==='/api/me/recipes/batch'){batches.push(body);if(uncertain){uncertain=false;throw Error('lost response');}if(fail)status=400;data={numbers:body.items.map((_,i)=>i+1)};}
  return {ok:status===200,status,headers:{get:k=>k.toLowerCase()==='content-type'?'application/json':null},json:async()=>data};
 };
 w.eval(read('static/js/food-studio-core.js').replace(/export /g,'')+'\n(()=>{'+read('static/js/nutrition-auto.js').replace(/^import .*;\n/gm,'').replace(/export /g,'')+';window.auto={completeNutrition,automaticNutritionEnabled};})();const {completeNutrition,automaticNutritionEnabled}=window.auto;\n'+read('static/js/recipe-input-helper.js').replace(/export /g,'')+'\nloadCatalog=async()=>new Map([["food",{id:"food",name:"두부",basis:"100g",nutrients:{energy:80}}]]);resolveIngredientMatches=async()=>{};\n'+read('static/js/recipe-lab.js').replace(/^import .*;\n/gm,'')+'\nwindow.inspect={readDraft,writeDraft};');
 w.eval(read('static/js/recipe-finder.js'));
 const mode=d.querySelector('[name=recipe-mode][value=food-name]');mode.checked=true;mode.dispatchEvent(new w.Event('change'));d.getElementById('recipe-food-name').value='스파게티';d.getElementById('recipe-ai-consent').checked=true;
 d.getElementById('recipe-finder').dispatchEvent(new w.Event('submit',{cancelable:true}));await wait();await wait();
 assert.equal(autoCalls,1,'one shared missing ingredient is automatically supplemented after recommendation consent');assert.equal(d.querySelectorAll('#recipe-cards article').length,5);assert(comparisons>0);assert(!d.getElementById('recipe-lab').hidden);assert.equal(d.getElementById('recipe-lab').tagName,'DETAILS');assert(!d.getElementById('recipe-lab').open);assert(!d.getElementById('nutrition-auto-consent'));assert(d.getElementById('recipe-save').compareDocumentPosition(d.getElementById('meal-cart-count'))&w.Node.DOCUMENT_POSITION_FOLLOWING);assert(!d.getElementById('recipe-compare-toolbar'));assert(!d.getElementById('recipe-lab-studio'));
 // Exact reported sequence: normalize dish, select its card, switch to ingredients.
 const raw=d.getElementById('recipe-normalize-input'),normalize=d.getElementById('recipe-normalize'),apply=d.getElementById('recipe-normalize-apply');
 raw.value='스파게티';raw.dispatchEvent(new w.Event('input'));normalize.click();await wait();assert(!apply.hidden);apply.click();
 // Applying clears old results; request another recommendation and choose one.
 d.getElementById('recipe-ai-consent').checked=true;d.getElementById('recipe-finder').dispatchEvent(new w.Event('submit',{cancelable:true}));await wait();await wait();d.querySelector('#recipe-cards [data-part=recipe-compare]').click();
 const ingredientsMode=d.querySelector('[name=recipe-mode][value=ingredients]');ingredientsMode.checked=true;ingredientsMode.dispatchEvent(new w.Event('change'));
 raw.value='소고기';raw.dispatchEvent(new w.Event('input'));const beforeNormalize=normalizes;normalize.click();await wait();assert(!apply.hidden);assert(!normalize.disabled);assert.equal(normalizes,beforeNormalize,'plain beef must not wait for model');apply.click();assert.equal(d.getElementById('recipe-ingredients').value,'소고기');
 // A pending request is cancelled on mode/input change; next request is usable.
 raw.value='응답 대기';raw.dispatchEvent(new w.Event('input'));normalize.click();await wait();assert(normalize.disabled);mode.checked=true;mode.dispatchEvent(new w.Event('change'));assert(!normalize.disabled);raw.value='스파게티';raw.dispatchEvent(new w.Event('input'));normalize.click();await wait();assert(!apply.hidden);assert.match(d.getElementById('recipe-normalize-status').textContent,/스파게티/);
 raw.value='응답 대기';raw.dispatchEvent(new w.Event('input'));normalize.click();await wait();[...d.querySelectorAll('button')].find(b=>b.textContent==='입력 정리 중단').click();await wait();assert(!normalize.disabled);assert(apply.hidden);
 const originalTimer=w.setTimeout.bind(w);w.setTimeout=(f,ms,...args)=>originalTimer(f,ms===20000?1:ms,...args);
 raw.value='응답 대기';raw.dispatchEvent(new w.Event('input'));normalize.click();await wait();assert(!normalize.disabled);assert.match(d.getElementById('recipe-normalize-status').textContent,/응답이 지연/);w.setTimeout=originalTimer;
 // Restore results for registration regression.
 d.getElementById('recipe-ai-consent').checked=true;d.getElementById('recipe-finder').dispatchEvent(new w.Event('submit',{cancelable:true}));await wait();await wait();
 const buttons=[...d.querySelectorAll('#recipe-cards [data-part=recipe-compare]')];buttons[0].click();buttons[1].click();assert.equal(w.inspect.readDraft().length,0);assert.equal(batches.length,0);assert.equal(buttons[0].getAttribute('aria-pressed'),'true');assert.match(d.getElementById('recipe-save').textContent,/2개/);
 buttons[1].click();assert.equal(buttons[1].getAttribute('aria-pressed'),'false');buttons[1].click();
 d.getElementById('recipe-save').click();await wait();await wait();assert.equal(batches.length,1);assert.equal(w.inspect.readDraft().length,2);assert.equal(buttons[0].getAttribute('aria-pressed'),'false');assert.match(d.getElementById('meal-cart-count').textContent,/2\/20개/);assert.equal(w.location.pathname,'/preview/recipes/recommend');
 const keys=batches[0].items.map(i=>i.key);buttons[0].click();buttons[1].click();d.getElementById('recipe-save').click();await wait();await wait();assert.deepEqual(batches[1].items.map(i=>i.key),keys);assert.equal(w.inspect.readDraft().length,2);
 fail=true;buttons[2].click();d.getElementById('recipe-save').click();await wait();await wait();assert.equal(w.inspect.readDraft().length,2,'server rejection must not add to cart');
 fail=false;uncertain=true;d.getElementById('recipe-save').click();await wait();await wait();assert.match(d.getElementById('recipe-save').textContent,/다시 확인/);const pendingKey=batches.at(-1).items[0].key;d.getElementById('recipe-save').click();await wait();await wait();assert.equal(batches.at(-1).items[0].key,pendingKey);assert.equal(w.inspect.readDraft().length,3);
 w.inspect.writeDraft(Array.from({length:20},(_,i)=>i+1).map(i=>({...recipes[0],name:'기존'+i})));buttons[3].click();assert.equal(w.inspect.readDraft().length,20);const before=batches.length;d.getElementById('recipe-save').click();await wait();assert.equal(batches.length,before);assert.match(d.getElementById('recipe-action-feedback').textContent,/최대 20개/);
 // A retry failure or no new dishes must keep the current recommendations/cart.
 const names=()=>[...d.querySelectorAll('#recipe-cards [data-part=recipe-generated-name]')].map(n=>n.textContent);
 const previousNames=names(),savedCart=w.inspect.readDraft().map(r=>r.name),batchCount=batches.length;
 const reroll=d.getElementById('recipe-reroll');failReroll=true;reroll.click();await wait();await wait();assert.deepEqual(names(),previousNames);assert(!reroll.disabled);
 failReroll=false;responsePool=[recipes[0],...recipes.slice(1).map((r,i)=>({...r,name:'새 메뉴'+i}))];reroll.click();await wait();await wait();assert.equal(names().length,4);assert(!names().includes(previousNames[0]));assert.deepEqual(exclusions.at(-1),previousNames);assert.deepEqual(w.inspect.readDraft().map(r=>r.name),savedCart);assert.equal(batches.length,batchCount);assert(!d.querySelector('#recipe-cards [aria-pressed=true]'));
 const newer=names();responsePool=[];reroll.click();await wait();await wait();assert.deepEqual(names(),newer);assert.match(d.getElementById('recipe-feedback').textContent,/기존 추천은 유지/);
 responsePool=recipes.map((r,i)=>({...r,name:'다음 후보'+i}));reroll.click();await wait();await wait();assert.equal(names().length,5);assert.deepEqual(exclusions.at(-1),newer);assert.equal(w.location.pathname,'/preview/recipes/recommend');
 const comparison=d.getElementById('recipe-lab');comparison.querySelector('summary').click();assert(comparison.open);comparison.querySelector('summary').click();assert(!comparison.open);
 const simulator=new JSDOM(read('templates/preview/recipes/simulator.html'),{runScripts:'outside-only',url:'http://localhost/preview/recipes/simulator?compose=selected'}),sw=simulator.window;sw.structuredClone=structuredClone;
 const pool=Array.from({length:20},(_,i)=>({...recipes[0],name:'보관 요리'+i}));
 sw.eval(read('static/js/food-studio-core.js').replace(/export /g,'')+'\n'+read('static/js/meal-plan-state.js').replace(/export /g,'')+'\n(()=>{'+read('static/js/nutrition-auto.js').replace(/^import .*;\n/gm,'').replace(/export /g,'')+';window.auto={completeNutrition,automaticNutritionEnabled};})();const {completeNutrition,automaticNutritionEnabled}=window.auto;\nloadCatalog=async()=>new Map();resolveIngredientMatches=async()=>{};api=async()=>null;readDraft=()=>'+JSON.stringify(pool)+';\n'+read('static/js/meal-studio.js').replace(/^import[\s\S]*?from \'\.\/food-studio-core.js\';\n/,''));await wait();
 assert.equal(sw.document.querySelectorAll('#fs-library article').length,20,sw.document.getElementById('fs-status').textContent);assert.equal(sw.document.querySelectorAll('#fs-plate article').length,1);sw.document.querySelectorAll('#fs-library article')[1].querySelector('button').click();assert.equal(sw.document.querySelectorAll('#fs-plate article').length,2);simulator.window.close();
 console.log('PASS: reroll excludes current names, drops old names, keeps saved cart and MyRecipe, preserves old list on error/empty; plus dish → select → ingredient beef; cancellation on mode/input changes; explicit stop; plus  automatic 5-dish comparison; one visible toggle; no save/navigation before registration; batch success adds both; stable keys/deduplicated cart; failure leaves cart unchanged; uncertain retry same key; 20-item capacity preflight; no extra checkbox; automatic nutrition after recommendation consent; collapsed comparison and bottom cart');dom.window.close();
})().catch(e=>{console.error(e);process.exitCode=1});
