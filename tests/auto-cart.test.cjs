const {JSDOM}=require(process.env.SMARTNF_TEST_JSDOM||'jsdom'),fs=require('fs'),path=require('path'),assert=require('assert');
const root=path.join(__dirname,'../src/main/resources'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
(async()=>{
 const dom=new JSDOM(read('templates/preview/recipes/recommend.html'),{runScripts:'outside-only',url:'http://localhost/preview/recipes/recommend'}),w=dom.window,d=w.document;
 d.querySelector('header').dataset.accountKey='member:1';d.querySelector('meta[name=_csrf]').content='csrf';d.querySelector('meta[name=_csrf_header]').content='X-CSRF-TOKEN';
 let db=[],calls=0;w.fetch=async(url,options={})=>{
  let data=db;
  if(options.method==='POST'){
   const b=JSON.parse(options.body);
   if(url.endsWith('/review')){assert.equal(b.action,'AUTO_APPLY');db[0].status='AUTO_APPLIED';data=db[0];}
   else {calls++;assert(b.consent);data={id:'ai:test',name:b.name,referenceFoodId:b.referenceFoodId,status:'UNREVIEWED',revision:2,model:'fixture',createdAt:'2026-11-10',nutrients:{energy:100,fat:5},aiKeys:['fat']};db.unshift(data);}
  }
  return {ok:true,headers:{get:()=> 'application/json'},json:async()=>structuredClone(data)};
 };
 w.eval(read('static/js/food-studio-core.js').replace(/export /g,'')+'\n'+read('static/js/nutrition-auto.js').replace(/^import .*;\n/,'').replace(/export /g,'')+'\nwindow.test={completeNutrition,addToMealCart,readDraft,writeDraft};');
 const catalog=new Map([['public',{name:'재료',nutrients:{energy:100,fat:null}}]]),items=[{name:'재료',foodId:'public',grams:100},{name:'재료',foodId:'public',grams:50}];
 await w.test.completeNutrition(items,catalog);assert.equal(calls,0);const c=d.getElementById('nutrition-auto-consent');c.checked=true;c.dispatchEvent(new w.Event('change'));await w.test.completeNutrition(items,catalog);assert.equal(calls,1);assert(items.every(i=>i.foodId==='ai:test'));assert.equal(catalog.get('ai:test').nutrients.energy,100);assert.equal(db[0].status,'AUTO_APPLIED');
 await w.test.completeNutrition([{name:'재료',foodId:'public',grams:30}],catalog);assert.equal(calls,1,'reuse saved record');c.checked=false;await w.test.completeNutrition(items,catalog);assert(items.every(i=>i.foodId==='public'));
 const recipe=n=>({name:n,servings:1,ingredients:['재료 100g'],steps:['조리']});w.test.addToMealCart([recipe('A')]);w.test.addToMealCart([recipe('B')]);assert.deepEqual(Array.from(w.test.readDraft(),r=>r.name),['A','B']);w.test.addToMealCart([recipe('A')]);assert.equal(w.test.readDraft().length,2);w.sessionStorage.clear();assert.equal(w.test.readDraft().length,2,'cart survives session reset');
 w.test.writeDraft([]);
 const helper=read('static/js/recipe-input-helper.js').replace(/export /g,'');
 const lab=read('static/js/recipe-lab.js').replace(/^import .*;\n/gm,'');w.eval(helper+'\n'+lab);
 const feedback=d.createElement('p');
 for(const name of ['A','B'])w.dispatchEvent(new w.CustomEvent('smartnf-open-studio',{detail:{recipe:recipe(name),feedback}}));
 assert.deepEqual(Array.from(w.test.readDraft(),r=>r.name),['A','B']);assert.match(d.getElementById('meal-cart-count').textContent,/2개/);assert.match(feedback.textContent,/담았습니다/);
 d.querySelector('#meal-cart-items button').click();assert.deepEqual(Array.from(w.test.readDraft(),r=>r.name),['B']);
 d.querySelector('header').dataset.accountKey='member:2';assert.equal(w.test.readDraft().length,0,'account scoped');dom.window.close();
 console.log('PASS: explicit opt-in, duplicate ingredients one request, automatic apply metadata, saved reuse, OFF reverts to public, additive/deduplicated cart, persistent cart and account boundary');
})().catch(e=>{console.error(e);process.exitCode=1});
