import fs from 'node:fs';import vm from 'node:vm';import test from 'node:test';import assert from 'node:assert/strict';
const src=fs.readFileSync(new URL('../src/main/resources/static/js/price-budget.js',import.meta.url),'utf8');
const m=await import('data:text/javascript;base64,'+Buffer.from(src).toString('base64'));
const ref=(p='KAMIS',e=878.4,extra={})=>({provider:p,estimated:e,surveyGrams:1000,surveyDate:'2026-11-13',name:'양파(1kg) · 상품',oldData:false,...extra});
test('latest mass KAMIS wins; not lowest price or non-mass grade',()=>{assert.equal(m.chooseReference({references:[ref('CHAMPRICE',200),ref('KAMIS',1,{estimated:null}),ref()]}).estimated,878.4);assert.equal(m.chooseReference({references:[ref('KAMIS',100,{oldData:true}),ref('CHAMPRICE',300)]}).provider,'CHAMPRICE');assert.equal(m.chooseReference({references:[ref('KAMIS',null)]}),null);});
test('same provider uses latest date, then grade, not cheapest',()=>{assert.equal(m.chooseReference({references:[ref('KAMIS',100,{name:'양파(1kg) 중품'}),ref('KAMIS',900)]}).estimated,900);});
test('missing entries are not priced at zero; rounded lines equal total',()=>{assert.deepEqual(m.budgetTotal([ref(),null,ref('CHAMPRICE',12.6)]),{count:2,total:891,missing:1});});
test('compare required share separately from whole pack; required amount stays 480g',()=>{const r=m.compareBudget(ref(),480,3000,4990,1);assert.equal(r.equivalent,798.4);assert.equal(r.total,4990);assert.equal(r.bought,3000);assert.equal(r.left,2520);assert.ok(Math.abs(r.difference+80)<0.00001);});
test('short purchase remains visible; invalid weight or fractional packs excluded',()=>{assert.equal(m.compareBudget(ref(),480,100,1000,2).shortage,280);assert.equal(m.compareBudget(ref(),480,0,1000,1),null);assert.equal(m.compareBudget(ref(),480,100,1000,1.5),null);});
test('stored product totals exclude stale selections and duplicates',()=>{const c={entryNo:0,packs:1,price:4990,packGrams:3000};const total=m.choiceTotal([c,c,{...c,entryNo:1,stale:true}],{items:[{grams:480},{grams:200}]});assert.deepEqual(total,{total:4990,count:1,shortage:0});});
test('Korean display converts UTC regardless of machine timezone',()=>{assert.equal(m.koreaTime('2026-11-16T05:31:31.131836+00:00'),'2026-11-16 14:31 (한국시간)');assert.equal(m.koreaTime('bad'),'확인 불가');});
test('comparison cannot reuse reference for a changed ingredient/amount',()=>{m.setReference('양파',480,{references:[ref()]});assert.match(m.comparisonText('양파',480,3000,4990,1,'양파 3kg'),/798원/);assert.match(m.comparisonText('쌀',480,3000,4990,1),/없어/);assert.match(m.comparisonText('양파',1000,3000,4990,1),/없어/);assert.match(m.comparisonText('양파',480,3000,4990,1,'토마토'),/보류/);});
const budgetCode=fs.readFileSync(new URL('../src/main/resources/static/js/shopping-budget.js',import.meta.url),'utf8').replace(/^import .*\n/gm,'').replace(/export /g,'');
class Node{constructor(t=''){this.textContent=t;this.children=[];}replaceChildren(...n){this.children=n;}append(...n){this.children.push(...n);}}
const text=n=>[n.textContent,...n.children.map(text)].join(' ');
function boot(){const requests=[];const ctx={structuredClone,Date,console,chooseReference:m.chooseReference,budgetTotal:m.budgetTotal,choiceTotal:m.choiceTotal,won:m.won,referenceReason:m.referenceReason,selectedBudget:m.selectedBudget,koreaTime:m.koreaTime,element:(tag,t)=>new Node(t),api:url=>new Promise((resolve,reject)=>requests.push({url,resolve,reject}))};vm.createContext(ctx);vm.runInContext(budgetCode,ctx);return {ctx,requests};}
test('edited list cannot receive late previous-price total',async()=>{const h=boot(),root=new Node(),slot=new Node();const promise=h.ctx.showShoppingBudget(root,{id:1,items:[{name:'양파',grams:480}]},[slot],false);h.ctx.invalidateBudget(root);h.requests[0].resolve({references:[ref()]});await promise;assert.doesNotMatch(text(root),/878원/);assert.match(text(root),/편집 중/);});
test('a failed ingredient query renders partial sum, never a complete total',async()=>{const h=boot(),root=new Node(),slots=[new Node(),new Node()];const promise=h.ctx.showShoppingBudget(root,{id:1,items:[{name:'양파',grams:480},{name:'계란',grams:100}]},slots,false);h.requests[0].resolve({references:[ref()]});h.requests[1].reject(Error('offline'));await promise;assert.match(text(root),/확인된 재료 예상 합계 약 878원/);assert.match(text(root),/1\/2/);assert.match(slots[1].textContent,/미확인/);});
test('aggregate request queue caps concurrency and shares same ingredient request',async()=>{const h=boot(),items=Array.from({length:6},(_,i)=>({name:'재료'+i,grams:100}));const work=items.map(i=>h.ctx.loadReference(i));const duplicate=h.ctx.loadReference(items[0]);assert.equal(h.requests.length,4);h.requests[0].resolve({references:[ref()]});await new Promise(setImmediate);assert.equal(h.requests.length,5);h.requests[1].resolve({references:[ref()]});await new Promise(setImmediate);assert.equal(h.requests.length,6);h.requests.slice(2).forEach(r=>r.resolve({references:[ref()]}));await Promise.all([...work,duplicate]);assert.equal(h.requests.length,6);});

test('missing causes distinguish units, age, I/O and request failure',()=>{
 assert.match(m.referenceReason({references:[]}),/자료 없음/);
 assert.match(m.referenceReason({references:[ref('KAMIS',null,{surveyGrams:null})]}),/환산 불가/);
 assert.match(m.referenceReason({references:[ref('KAMIS',100,{oldData:true})]}),/유효기간/);
 assert.match(m.referenceReason({lookupFailed:true}),/조회 실패/);
 assert.match(m.referenceReason({sourceErrors:['KAMIS']}),/읽기 실패/);
});
test('sale budget uses verified selection, freshness and same list item',()=>{
 const item={name:'스파게티면',grams:480},now=Date.parse('2026-11-16T08:00:00Z');
 const c={ingredientName:item.name,requiredGrams:480,checkedAt:'2026-11-16T07:00:00Z',price:3000,packGrams:500,productName:'스파게티 500g'};
 assert.equal(m.selectedBudget(c,item,now).estimated,2880);
 for(const change of [{stale:true},{ingredientName:'양파'},{requiredGrams:500},{checkedAt:'2026-11-14T07:00:00Z'},{sourceDetails:'FLYER'},{packGrams:0}])assert.equal(m.selectedBudget({...c,...change},item,now),null);
});
test('selecting a purchase cannot fabricate or overwrite the independent estimate',async()=>{
 const h=boot(),root=new Node(),slot=new Node(),item={name:'스파게티면',grams:480};
 const promise=h.ctx.showShoppingBudget(root,{id:1,items:[item]},[slot]);
 h.requests[0].resolve({references:[]});await new Promise(setImmediate);
 h.requests[1].resolve([{entryNo:0,ingredientName:item.name,requiredGrams:480,checkedAt:new Date().toISOString(),price:3000,packGrams:500,packs:1,productName:'스파게티 500g'}]);await promise;
 assert.match(slot.textContent,/미확인/);assert.doesNotMatch(text(root),/2,880원/);assert.match(text(root),/구매금액 합계 3,000원/);
});

test('shopping estimate uses survey sources only and never falls back to sale prices',()=>{
 const sale={provider:'OASIS',name:'양파 500g',merchant:'오아시스',surveyGrams:500,estimated:2880,checkedAt:new Date().toISOString()};
 assert.equal(m.chooseReference({references:[ref()],market:[sale]}).provider,'KAMIS');
 assert.equal(m.chooseReference({references:[],market:[sale]}),null);
 assert.equal(m.chooseReference({market:[{...sale,checkedAt:'2001-01-01T00:00:00Z'}]}),null);
 m.setReference('양파',480,{market:[sale]});assert.match(m.comparisonText('양파',480,500,3000,1,'양파'),/없어 예상 비용 대비 차이를 계산하지 않습니다/);
});


test('unverified sale prices cannot fill a missing estimate; selected purchase total stays separate',async()=>{
 const h=boot(),root=new Node(),slot=new Node();const work=h.ctx.showShoppingBudget(root,{id:1,items:[{name:'우유',grams:100}]},[slot]);
 h.requests[0].resolve({references:[],market:[{provider:'HOMEPLUS',name:'우유 100g',surveyGrams:100,estimated:9999,checkedAt:new Date().toISOString()}]});await new Promise(setImmediate);
 h.requests[1].resolve([{entryNo:0,price:2700,packs:1,packGrams:900}]);await work;
 assert.match(text(root),/총예상 비용 미확인/);assert.match(text(root),/선택 상품 구매금액 합계 2,700원/);assert.doesNotMatch(text(root),/9,999원/);
});

test('verified seller fallback includes pepper package reference once, with survey priority',()=>{
 const sale={provider:'HOMEPLUS',name:'순후추 50g 1병',price:3000,surveyAmount:50,unit:'g',priceVerified:true,checkedAt:new Date().toISOString(),referenceEstimated:180};
 const r=m.chooseReference({query:'후추',requiredAmount:3,unit:'g',references:[],market:[sale]});assert.equal(r.estimated,3000);assert.equal(r.referenceBasis,'PACKAGE');assert.match(r.quantityNote,/1병/);assert.equal(m.budgetTotal([r]).total,3000);
 assert.equal(m.chooseReference({query:'후추',references:[ref()],market:[sale]}).provider,'KAMIS');
 assert.equal(m.chooseReference({query:'후추',market:[{...sale,priceVerified:false,verificationStatus:'REVIEW'}]}),null);
 assert.equal(m.chooseReference({query:'후추',market:[{...sale,checkedAt:'2000-01-01T00:00:00Z'}]}),null);
});

test('verified volume price can contribute one package without assuming grams equal ml',()=>{
 const r=m.chooseReference({query:'우유',requiredAmount:100,unit:'g',market:[{provider:'HOMEPLUS',name:'우유 900ml',price:2700,surveyAmount:900,unit:'ml',priceVerified:true,checkedAt:new Date().toISOString(),referenceEstimated:null}]});assert.equal(r.estimated,2700);assert.equal(r.referenceBasis,'PACKAGE');assert.match(r.quantityNote,/900mL/);
});

test('shopping total includes source-verified supplement and distinguishes its basis',async()=>{
 const h=boot(),root=new Node(),slot=new Node();const work=h.ctx.showShoppingBudget(root,{id:1,items:[{name:'후추',grams:3}]},[slot],false);
 h.requests[0].resolve({references:[],market:[{provider:'HOMEPLUS',name:'후추 50g 1병',price:3000,surveyAmount:50,unit:'g',priceVerified:true,checkedAt:new Date().toISOString(),referenceEstimated:180}]});await work;assert.match(text(root),/3,000원/);assert.match(text(root),/판매가 참고 1개/);assert.match(slot.textContent,/1병/);assert.doesNotMatch(slot.textContent,/180원/);
});

test('confirmed user product supplies fresh compatible reference, rejecting stale and unrelated items',()=>{
 const c={ingredientName:'후추',productId:'k:123',sourceDetails:'사용자 선택',checkedAt:new Date().toISOString(),packageAmount:50,price:3000,productName:'순후추 50g 1병',quantityUnit:'g',requiredAmount:3};
 assert.equal(m.confirmedChoiceReference(c,{name:'후추',grams:3}).estimated,3000);
 assert.equal(m.confirmedChoiceReference({...c,stale:true},{name:'후추',grams:3}),null);
 assert.equal(m.confirmedChoiceReference({...c,productName:'후추 치즈'},{name:'후추',grams:3}),null);
 assert.equal(m.confirmedChoiceReference({...c,checkedAt:'2020-01-01'},{name:'후추',grams:3}),null);
});
test('package budget never presents a misleading required-share percentage',()=>{
 m.setReference('후추',3,{market:[{name:'후추 50g 1병',provider:'HOMEPLUS',price:3000,surveyAmount:50,unit:'g',priceVerified:true,checkedAt:new Date().toISOString()}]},'g');
 assert.match(m.comparisonText('후추',3,50,3000,1,'후추 50g 1병'),/포장|1병/);
 assert.doesNotMatch(m.comparisonText('후추',3,50,3000,1,'후추 50g 1병'),/%/);
});

test('shopping ingredient displays selected purchase price separately from survey budget',async()=>{
 const h=boot(),root=new Node(),slot=new Node();const promise=h.ctx.showShoppingBudget(root,{id:1,items:[{name:'양파',grams:480}]},[slot]);
 h.requests[0].resolve({references:[ref()]});await new Promise(setImmediate);
 h.requests[1].resolve([{entryNo:0,packs:1,price:9630,packageAmount:1000,quantityUnit:'g',merchant:'판매처',productName:'양파 1kg',stale:false}]);await promise;
 assert.match(text(slot),/선택 상품 구매금액 9,630원/);assert.match(text(slot),/1,?000g × 1개/);assert.match(text(root),/878원/);assert.match(text(root),/선택 상품 구매금액 합계 9,630원/);
});
