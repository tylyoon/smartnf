const {JSDOM}=require(process.env.SMARTNF_TEST_JSDOM||'jsdom'),fs=require('fs'),path=require('path'),assert=require('assert');
const root=path.join(__dirname,'../src/main/resources');const source=n=>fs.readFileSync(path.join(root,'static/js/'+n),'utf8');const wait=()=>new Promise(r=>setTimeout(r,25));
async function create(targets){
 const html=fs.readFileSync(path.join(root,'templates/preview/recipes/recommend.html'),'utf8');
 const dom=new JSDOM(html,{runScripts:'outside-only',url:'http://localhost:8080/preview/recipes/recommend'}),w=dom.window;w.AbortSignal=AbortSignal;
 w.document.querySelector('meta[name=_csrf]').content='token';w.document.querySelector('meta[name=_csrf_header]').content='X-CSRF-TOKEN';w.document.querySelector('header').dataset.accountKey='member:1';
 let requests=[];let profileReads=0;
 w.fetch=async(url,opts={})=>{
  if(url==='/api/me/recipes/preferences'){profileReads++;assert.equal(opts.headers['X-SmartNF-Account'],'member:1');return {ok:true,headers:{get:()=> 'application/json'},json:async()=>({targets,source:'SAVED',evaluated:3})};}
  if(url==='/api/recipes/generate-candidates'){
   const body=JSON.parse(opts.body);requests.push(body);assert.equal(opts.headers['X-SmartNF-Account'],'member:1');assert.equal(opts.headers['X-CSRF-TOKEN'],'token');
   return {ok:true,status:200,headers:{get:k=>k==='X-SmartNF-Candidate-Count'?'5':k==='X-SmartNF-Taste-Applied'&&body.usePreferences?encodeURIComponent('저장한 취향 반영: 매운맛 1.0/5'):null},json:async()=>Array.from({length:5},(_,i)=>({name:'두부 요리'+i,servings:1,minutes:10,ingredients:['두부 100g'],steps:['굽기'],availableIngredients:[],additionalIngredients:[]}))};
  }
  return {ok:true,status:204,headers:{get:()=>null}};
 };
 w.eval(source('recipe-preference.js'));w.eval(source('recipe-finder.js'));
 return {w,requests,get reads(){return profileReads;}};
}
(async()=>{
 const a=await create({spicy:1,salty:2}),w=a.w,d=w.document;
 assert.equal(a.reads,0);assert.equal(w.smartnfRecipePreferences.payload().usePreferences,false);
 const checked=d.getElementById('recipe-use-preferences');d.getElementById('recipe-ai-consent').checked=true;checked.checked=true;checked.dispatchEvent(new w.Event('change'));await wait();assert.equal(a.reads,1);assert(!d.getElementById('recipe-ai-consent').checked);
 const saved=w.smartnfRecipePreferences.payload();assert(saved.usePreferences);assert(!saved.manualTasteEnabled);assert(!saved.preferredTaste);
 d.querySelector('input[name=recipe-mode][value="food-name"]').checked=true;d.querySelector('input[name=recipe-mode][value="food-name"]').dispatchEvent(new w.Event('change'));d.getElementById('recipe-food-name').value='두부';d.getElementById('recipe-ai-consent').checked=true;
 d.getElementById('recipe-finder').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));await wait();assert.equal(a.requests.length,1);assert(a.requests[0].usePreferences);assert.equal(a.requests[0].foodName,'두부');assert.match(d.getElementById('recipe-feedback').textContent,/저장한 취향 반영/);
 const mode=d.getElementById('recipe-preference-mode');mode.value='manual';mode.dispatchEvent(new w.Event('change'));const spicy=d.querySelector('[data-taste-axis=spicy]');spicy.value='0';spicy.dispatchEvent(new w.Event('change'));assert.equal(w.smartnfRecipePreferences.payload().preferredTaste.spicy,0);
 checked.checked=false;checked.dispatchEvent(new w.Event('change'));assert.deepEqual(JSON.parse(JSON.stringify(w.smartnfRecipePreferences.payload())),{usePreferences:false});
 const b=await create({});b.w.document.getElementById('recipe-use-preferences').checked=true;b.w.document.getElementById('recipe-use-preferences').dispatchEvent(new b.w.Event('change'));await wait();assert.equal(b.w.document.getElementById('recipe-preference-mode').value,'manual');assert.throws(()=>b.w.smartnfRecipePreferences.payload());
 console.log('UI: default OFF/no profile request, consent reset, server-owned saved preference, candidate request + summary, manual zero, insufficient-profile onboarding passed');
})().catch(e=>{console.error(e);process.exitCode=1;});
