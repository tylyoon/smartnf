import fs from 'node:fs';import assert from 'node:assert/strict';import vm from 'node:vm';
const root=new URL('../src/main/resources/',import.meta.url),js=n=>fs.readFileSync(new URL('static/js/'+n,root),'utf8');
const policy=await import('data:text/javascript;base64,'+Buffer.from(js('period-criteria.js')).toString('base64'));
const recipes=[{name:'소고기 무국',servings:2,ingredients:['소고기 200g'],portions:[{foodId:'beef',text:'소고기',grams:200}]},{name:'백미밥',servings:1,ingredients:['쌀 75g'],portions:[{foodId:'rice',text:'쌀',grams:75}]},{name:'시금치나물',servings:1,ingredients:['시금치 50g'],portions:[{foodId:'spinach',text:'시금치',grams:50}]}];
const recipeParts=i=>[{name:recipes[i].name,servings:1,ingredients:recipes[i].portions.map(p=>({...p,grams:p.grams/recipes[i].servings}))}];
let result=policy.recommendSingleMeal({index:0,recipes,criteria:{excluded:[]},recipeParts});assert.deepEqual(result.indices,[0,1,2]);assert.equal(result.parts[0].ingredients[0].grams,100);
assert.throws(()=>policy.recommendSingleMeal({index:0,recipes,criteria:{excluded:['소고기']},recipeParts}));
assert.throws(()=>policy.recommendSingleMeal({index:1,recipes,criteria:{excluded:[]},recipeParts}));
class N{constructor(tag,text,cls){Object.assign(this,{tag,textContent:text||'',className:cls||'',children:[],events:{},dataset:{},value:'',style:{},classList:{add(){}}});}append(...nodes){this.children.push(...nodes);if(this.tag==='select'&&!this.value)this.value=nodes[0]?.value||'';}replaceChildren(...nodes){this.children=nodes;}setAttribute(k,v){this[k]=v;}addEventListener(k,f){this.events[k]=f;}scrollIntoView(){}}
const nodes=new Map(),$=id=>{if(!nodes.has(id))nodes.set(id,new N('div'));return nodes.get(id);},element=(...a)=>new N(...a),button=(t,f)=>{const n=element('button',t);n.events.click=f;return n;};
const period=[{date:'2026-11-15',recipe:0,recipeIndices:[0,1,2],recommended:structuredClone(result.parts)}];const saved=JSON.stringify(period);
const c={...policy,createSingleMealRecommender:()=>()=>{},createPeriodApi:()=>{},accountKey:()=> 'member:1',editingTarget:null,structuredClone,Map,Set,Number,JSON,Object,recipes,periods:{week:period,month:[]},active:new Map([['recipe:0',2]]),recipeParts,readPeriodCriteria:()=>({excluded:[]}),saving:false,pendingSave:null,building:false,redrawLibraryOptions(){},$,element,button,renderPlate(){},markChanged(){c.changes++;},changes:0,switchView(){},tabs:[{dataset:{view:'meal'}}],catalogReady:false,api:async()=>({}),trustedImage:()=>false};
vm.createContext(c);const source=js('meal-studio.js');
vm.runInContext(source.slice(source.indexOf('function excludeCandidate('),source.indexOf('function trustedImage('))+';this.excludeCandidate=excludeCandidate;this.recommendOneMeal=recommendOneMeal;this.renderLibrary=renderLibrary;',c);
c.renderLibrary();c.excludeCandidate(1);assert.equal(recipes.length,3,'stable recipe indices');assert(recipes[1].candidateExcluded);assert.equal(c.active.get('recipe:0'),2,'existing plate stays unchanged');assert.equal(JSON.stringify(period),saved,'existing period snapshots unchanged');
assert(!$('fs-library').children.some(n=>n.tag==='article'&&n.children.some(x=>x.tag==='h3'&&x.textContent==='백미밥')));
const restore=$('fs-library').children.find(n=>n.tag==='details');restore.children.find(n=>n.tag==='button').events.click();assert.equal(recipes[1].candidateExcluded,false);
// Gemini single-meal commits and portion preservation are covered in single-meal-gemini.test.mjs.
c.pendingSave={};const before=c.active;c.recommendOneMeal(0);c.excludeCandidate(0);assert.equal(c.active,before);assert(!recipes[0].candidateExcluded);c.pendingSave=null;
// Execute the actual MyRecipe picker and add/restore events.
const library={message:'저장 목록',recipes:recipes.map((recipe,i)=>({number:i,recipe,features:{cuisine:'한식',role:i?'사이드':'메인'}}))};
c.api=async url=>url==='/api/me/recipes/taste'?library:{};c.makeRecipe=r=>r;c.catalog={};c.resolveIngredientMatches=async()=>{};
vm.runInContext(source.slice(source.indexOf("$('fs-load-library').addEventListener('click'"),source.indexOf('function snapshotMonthAnalysis(')),c);
await $('fs-load-library').events.click();const filters=$('fs-library-options').children.find(n=>n.className==='fs-library-filters'),choices=$('fs-library-options').children.find(n=>n.className==='fs-library-results');assert.equal(filters.children.length,3);assert.equal(choices.children.length,3);assert(choices.children.every(n=>n.className==='fs-library-choice'));assert(choices.children.every(n=>n.children.at(-1).disabled));
c.excludeCandidate(1);assert.equal(choices.children[1].children.at(-1).disabled,false);await choices.children[1].children.at(-1).events.click();assert(!recipes[1].candidateExcluded);assert.equal(recipes.length,3,'reactivation does not duplicate');
filters.children[1].value='메인';filters.children[1].events.change();assert.equal(choices.children.length,1);
const eligibility=policy.eligibleRecipes(recipes.map((r,i)=>({...r,candidateExcluded:i===1})),{excluded:[]});assert(!eligibility.some(x=>x.index===1));
const css=fs.readFileSync(new URL('static/css/library-selection.css',root),'utf8');assert.match(css,/repeat\(3,minmax\(0,1fr\)\)/);assert.match(css,/grid-auto-rows:1fr/);assert.match(css,/max-width:520px/);
const html=fs.readFileSync(new URL('templates/preview/recipes/simulator.html',root),'utf8');assert.match(html,/library-selection.css\?v=library223/);assert.match(html,/meal-studio.js\?v=add236/);
console.log('PASS actual picker/filter/add/restore events, three equal grid columns and responsive rules; single-meal composition and portions; exclusion preserves existing plate/period and stable indices; pending-save guards; cache versions');
