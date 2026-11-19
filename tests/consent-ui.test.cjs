const {JSDOM}=require(process.env.SMARTNF_TEST_JSDOM||'jsdom'),fs=require('fs'),path=require('path'),assert=require('assert');
const root=path.join(__dirname,'../src/main/resources'),read=p=>fs.readFileSync(path.join(root,p),'utf8'),wait=()=>new Promise(r=>setTimeout(r,20));
(async()=>{
 const d=new JSDOM(read('templates/preview/recipes/recommend.html'),{runScripts:'outside-only',url:'http://localhost/preview/recipes/recommend'}),w=d.window,doc=w.document;w.AbortSignal=AbortSignal;
 doc.querySelector('meta[name=_csrf]').content='csrf';doc.querySelector('meta[name=_csrf_header]').content='X-CSRF-TOKEN';
 let calls=0,responseStatus=400;w.fetch=async(url,options)=>{calls++;const body=JSON.parse(options.body);assert.equal(body.consent,true);assert.equal(body.usePreferences,false);assert.equal(body.manualTasteEnabled,false);assert.equal(body.foodName,'스파게티');assert.equal(options.headers['X-CSRF-TOKEN'],'csrf');return {ok:responseStatus===200,status:responseStatus,headers:{get:()=>null},json:async()=>[]};};
 w.eval(read('static/js/recipe-preference.js'));w.eval(read('static/js/recipe-finder.js'));
 const form=doc.getElementById('recipe-finder'),consent=doc.getElementById('recipe-ai-consent'),food=doc.getElementById('recipe-food-name'),feedback=doc.getElementById('recipe-feedback');
 const mode=form.querySelector('[name=recipe-mode][value=food-name]');mode.checked=true;mode.dispatchEvent(new w.Event('change'));food.value='스파게티';food.dispatchEvent(new w.Event('input',{bubbles:true}));
 const submit=()=>form.dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));submit();await wait();assert.equal(calls,0);assert.match(feedback.textContent,/Gemini 전송에 동의/);
 consent.checked=true;submit();await wait();assert.equal(calls,1);assert(consent.checked,'400 must preserve checked consent');assert.match(feedback.textContent,/입력 형식/);
 responseStatus=200;submit();await wait();assert.equal(calls,2);assert(consent.checked,'successful request must preserve consent');assert.match(feedback.textContent,/후보를 찾지 못/);
 food.value='토마토 스파게티';food.dispatchEvent(new w.Event('input',{bubbles:true}));assert(!consent.checked,'changed conditions require renewed consent');
 console.log('UI: taste OFF request with explicit false flags, missing-consent specific guidance/no call, consent survives 400 and retry/success, changed food revokes consent');d.window.close();
})().catch(e=>{console.error(e);process.exitCode=1});
