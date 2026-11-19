import fs from 'node:fs';
import assert from 'node:assert/strict';
import vm from 'node:vm';
const root=new URL('../src/main/resources/static/js/',import.meta.url);
const source=fs.readFileSync(new URL('period-criteria.js',root),'utf8');
const {composeMeal,combinationType,recommendPeriod}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const recipes=[
 {name:'소고기 무국',ingredients:['소고기 100g','무 100g'],features:{cuisine:'한국'}},
 {name:'백미밥',ingredients:['쌀 75g'],features:{cuisine:'한국'}},
 {name:'시금치 나물',ingredients:['시금치 100g'],features:{cuisine:'한국'}},
 {name:'토마토 스파게티',ingredients:['면 100g','토마토 100g']},
 {name:'매콤한 닭구이',ingredients:['닭 100g','고추장 10g']},
 {name:'매운 오이무침',ingredients:['오이 100g','고추장 10g']},
 {name:'미역국',ingredients:['미역 20g']},
 {name:'시금치나물',ingredients:['시금치 100g']}
];
const candidates=recipes.map((r,index)=>({r,index}));
const recipeParts=i=>[{name:recipes[i].name,servings:1,ingredients:[{foodId:String(i),text:recipes[i].ingredients[0],grams:100}]}];
let combo=composeMeal(candidates[0],candidates,recipeParts);
assert.deepEqual(combo.indices,[0,1,2]);assert.equal(combo.parts.length,3);
combo.parts[0].ingredients[0].grams=55;assert.equal(recipeParts(0)[0].ingredients[0].grams,100,'snapshots are independent');
combo=composeMeal(candidates[3],candidates,recipeParts);assert.deepEqual(combo.indices,[3,2],'pasta gets no additional rice or soup');
combo=composeMeal(candidates[4],[candidates[4],candidates[1],candidates[5]],recipeParts);assert.deepEqual(combo.indices,[4,1]);assert.match(combo.reason,/反|반찬 후보 없음/);
combo=composeMeal(candidates[0],[candidates[0],candidates[6]],recipeParts);assert.deepEqual(combo.indices,[0],'no soup+soup');assert.match(combo.reason,/주식·반찬 후보 없음/);
assert.equal(combinationType({name:'백미밥',combinationType:'main'}),'main','manual correction wins');
assert.equal(combinationType({name:'정체불명'}),'unknown');
assert.equal(combinationType({name:'전복죽'}),'bowl');
assert.equal(combinationType({name:'시금치 나물'}),'side');
const keys=['energy','protein','carbohydrate','fat','sodium','fiber'];
const analyze=parts=>({total:parts.length,values:Object.fromEntries(keys.map(k=>[k,parts.length*100])),coverage:Object.fromEntries(keys.map(k=>[k,parts.length])),aiCoverage:{}});
const opts={first:'2026-11-15',days:7,meals:['breakfast','lunch','dinner'],recipes,criteria:{excluded:['고추장'],general:false},recipeParts,analyze,slotParts:s=>s.recommended,addDays:(d,n)=>new Date(Date.parse(d+'T12:00:00Z')+n*86400000).toISOString().slice(0,10)};
const result=recommendPeriod(opts);assert.equal(result.slots.length,21);
assert(result.slots.every(s=>s.recipeIndices.every(i=>![4,5].includes(i))),'exclusion applies to every component');
assert(result.slots.every(s=>new Set(s.recommended.map(p=>p.name.replace(/\s/g,''))).size===s.recommended.length));
assert(result.slots.every(s=>![1,2,7].includes(s.recipe)),'sides never become main while mains exist');
assert.equal(result.slots[0].recommended.length,3);
assert.equal(analyze(result.slots[0].recommended).values.energy,300,'all dishes enter nutrition totals');
assert.equal(JSON.parse(JSON.stringify(result.slots))[0].recommended[1].name,'백미밥','draft roundtrip keeps components');
// Execute the actual title/parts/edit path, rather than matching implementation strings.
const {snapshotPlate}=await import('data:text/javascript;base64,'+Buffer.from(fs.readFileSync(new URL('plate-editor.js',root),'utf8')).toString('base64'));
const ui=fs.readFileSync(new URL('meal-studio.js',root),'utf8');
let rendered=0;const nodes=new Map(),$=id=>{if(!nodes.has(id))nodes.set(id,{});return nodes.get(id);};
$('fs-meal').scrollIntoView=()=>{};
const c={clearMealAdditionCandidates(){},snapshotPlate,plateSnapshots:[],editingTarget:null,saving:false,pendingSave:null,building:false,structuredClone,markChanged(){},renderEditSummary(){},recipes,active:new Map(),partsForSlot:s=>s.excluded?[]:s.custom||s.recommended,slotKey:s=>s.date+':'+s.meal,view:'week',valuesFor:()=>({}),estimate:()=>({aiCoverage:{}}),catalog:{},nutrients:{},renderPlate(){rendered++;},$,labels:{breakfast:'아침'},tabs:[{dataset:{view:'meal'}}],switchView(){},Map,Object};
vm.createContext(c);
vm.runInContext(ui.slice(ui.indexOf('function slotName('),ui.indexOf('function currentMonthWeek('))+ui.slice(ui.indexOf('function editSlot('),ui.indexOf('function renderCalendar()'))+';this.editSlot=editSlot;this.slotName=slotName;',c);
assert.equal(c.slotName(result.slots[0]),'소고기 무국 + 백미밥 + 시금치 나물');
c.editSlot(result.slots[0]);assert.equal(c.active.size,3);assert.equal(rendered,1);
assert.equal(c.slotName({...result.slots[0],excluded:true}),'비운 끼니');
console.log('PASS: soup/rice/side, pasta no extra staple, spicy overlap, missing candidates, manual role, exclusions across components, deduplication, aggregate nutrition, draft snapshots, actual UI title and edit composition');
