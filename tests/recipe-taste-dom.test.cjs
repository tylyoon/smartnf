const {JSDOM}=require(process.env.SMARTNF_TEST_JSDOM||'jsdom');
const fs=require('fs'),assert=require('assert'),path=require('path');
const actualSource=fs.readFileSync(path.join(__dirname,'../src/main/resources/static/js/recipe-taste.js'),'utf8');
const baseline={cuisine:'한식',role:'메인',taste:{spicy:1,salty:2},texture:'부드러움',aroma:'마늘향',source:'LOCAL_LLM'};
const makeState=()=>({account:'member:1',recipes:[{number:1,recipe:{name:'김치찌개'},features:structuredClone(baseline),prediction:structuredClone(baseline),feedback:{liking:3,again:true,actual:{spicy:2},adjustments:[]},revision:1,distance:null},{number:2,recipe:{name:'두부구이'},features:{...structuredClone(baseline),source:'RULE',role:'겸용',taste:{}},prediction:null,feedback:null,revision:0,distance:null}],profile:{},evaluated:1,message:'평가 안내'});
const wait=()=>new Promise(r=>setTimeout(r,25));
async function run(){
 const state=makeState();let analyzeCalls=0,saved;
 const dom=new JSDOM(`<meta name="_csrf" content="test"><meta name="_csrf_header" content="X-CSRF-TOKEN"><section id="rt-toolbar"></section><section id="rt-profile"></section><p id="rt-status"></p><div id="rt-list">${state.recipes.map(e=>`<details class="recipe-saved" data-recipe-number="${e.number}"><summary class="recipe-saved-heading"><strong>${e.recipe.name}</strong></summary><div class="rt-tools"></div></details>`).join('')}</div>`,{runScripts:'outside-only',url:'http://localhost:8080/mypage/recipes'});
 const w=dom.window;w.structuredClone=structuredClone;w.AbortSignal=AbortSignal;
 w.fetch=async(url,opts)=>{let data;if(url.endsWith('/analyze')){analyzeCalls++;data=baseline;}else if(opts.method==='POST'){
  assert.equal(opts.headers['X-CSRF-TOKEN'],'test');assert.equal(opts.headers['X-SmartNF-Account'],'member:1');saved=JSON.parse(opts.body);const e=state.recipes[Number(url.split('/').at(-1))-1];assert.equal(saved.revision,e.revision);e.features=saved.features;e.feedback=saved.feedback;e.revision++;data={revision:e.revision};
 }else data=state;return {ok:true,redirected:false,headers:{get:()=> 'application/json'},json:async()=>structuredClone(data)};};
 w.eval(actualSource);await wait();await wait();
 const card=w.document.querySelector('[data-recipe-number="1"]');assert(card.open);assert.equal(card.querySelector('h3').textContent,'AI 분류·예상 맛');assert(!card.textContent.includes('제안'));assert.equal(card.querySelectorAll('.rt-heading-ratings [role="radiogroup"]').length,2);assert.equal(card.querySelectorAll('select').length,2);assert.equal(card.querySelectorAll('.rt-tools details').length,0);assert.equal(analyzeCalls,1);
 const label=card.querySelector('[aria-label="내 입맛"]');assert.equal(label.querySelector('[aria-checked="true"]').getAttribute('aria-label'),'내 입맛 5점'); // legacy conversion
 card.querySelector('[aria-label="내 입맛 4점"]').click();card.querySelector('[aria-label="다시 먹고 싶은 정도 2점"]').click();assert(card.open);
 assert.equal(card.querySelectorAll('input[type=range]').length,6);
 assert.equal(card.querySelectorAll('.rt-star-clear,.rt-star-value').length,0);
 card.querySelector('[aria-label="내 입맛 4점"]').click();assert.equal(card.querySelector('[aria-label="내 입맛 4점"]').getAttribute('aria-checked'),'false');card.querySelector('[aria-label="내 입맛 4점"]').click();
 const range=card.querySelector('input[type=range]');range.value='3';range.dispatchEvent(new w.Event('input',{bubbles:true}));assert.equal(card.querySelector('output').value,'3');
 card.querySelector('[aria-label="매운맛 자료 없음으로 변경"]').click();assert.equal(range.dataset.known,'false');assert.equal(card.querySelector('output').value,'미확인');
 range.dispatchEvent(new w.Event('pointerup',{bubbles:true}));assert.equal(range.dataset.known,'true');assert.equal(range.value,'0');assert.equal(card.querySelector('output').value,'0');
 card.querySelector('input[type="checkbox"]').checked=true;card.querySelector('.rt-tools>button').click();await wait();
 assert.equal(saved.feedback.likingStars,4);assert.equal(saved.feedback.againStars,2);assert.equal(saved.feedback.actual.spicy,0);assert.equal(saved.features.taste.spicy,1);assert.equal(card.querySelector('[aria-label="내 입맛 4점"]').getAttribute('aria-checked'),'true');
 const second=w.document.querySelector('[data-recipe-number="2"]');assert.equal(second.querySelector('select').value,'한식');assert.equal(second.querySelector('input[type=range]').value,'1');assert.equal(second.querySelector('[aria-label="내 입맛"]').querySelectorAll('[aria-checked=true]').length,0);
 const star=card.querySelector('[aria-label="내 입맛 4점"]');star.dispatchEvent(new w.KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true}));assert.equal(card.querySelector('[aria-label="내 입맛 5점"]').getAttribute('aria-checked'),'true');
 console.log('DOM: native sliders, null vs zero, slider clearing, compact stars/toggle, legacy conversion, keyboard and saved AI baseline passed');
}
async function lateResponse(){
 const state=makeState();state.recipes=[state.recipes[1]];let complete;
 const dom=new JSDOM('<meta name="_csrf" content="test"><meta name="_csrf_header" content="X-CSRF-TOKEN"><section id="rt-toolbar"></section><section id="rt-profile"></section><p id="rt-status"></p><div id="rt-list"><details data-recipe-number="2"><summary>두부구이</summary><div class="rt-tools"></div></details></div>',{runScripts:'outside-only',url:'http://localhost:8080'});
 const w=dom.window;w.structuredClone=structuredClone;w.AbortSignal=AbortSignal;
 w.fetch=async(url)=>{if(url.endsWith('/analyze'))await new Promise(resolve=>complete=resolve);return {ok:true,redirected:false,headers:{get:()=> 'application/json'},json:async()=>structuredClone(url.endsWith('/analyze')?baseline:state)};};
 w.eval(actualSource);await wait();assert(complete);const input=w.document.querySelector('.rt-tools input[type=range]');input.value='4';input.dispatchEvent(new w.Event('input',{bubbles:true}));complete();await wait();assert.equal(input.value,'4');assert.match(w.document.querySelector('.rt-tools').textContent,/편집 중인 내용은 그대로/);console.log('DOM: late automatic response preserves user input passed');
}
run().then(lateResponse).catch(e=>{console.error(e);process.exitCode=1;});
