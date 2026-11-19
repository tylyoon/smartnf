import fs from 'node:fs';import vm from 'node:vm';import test from 'node:test';import assert from 'node:assert/strict';
const base=new URL('../src/main/resources/static/js/',import.meta.url),read=n=>fs.readFileSync(new URL(n,base),'utf8');
const core=await import('data:text/javascript;base64,'+Buffer.from(read('food-studio-core.js')).toString('base64'));
const period=await import('data:text/javascript;base64,'+Buffer.from(read('period-operations.js')).toString('base64'));
const money=await import('data:text/javascript;base64,'+Buffer.from(read('product-purchase.js')).toString('base64'));
test('recipe native units survive without invented grams or egg density',()=>{
 const rows=core.parseRecipe({ingredients:['달걀 2개','우유 100ml','밀가루 0.5kg','식용유 1L']},new Map());
 assert.equal(rows[0].quantities[0].unit,'ea');assert.equal(rows[0].grams,null);assert.equal(rows[1].quantities[0].amount,100);assert.equal(rows[1].grams,null);assert.equal(rows[2].grams,500);assert.equal(rows[3].quantities[0].amount,1000);
});
test('shopping aggregation retains complete alternate quantities once and omits incomplete alternatives',()=>{
 const parts=[{ingredients:[{foodId:'egg',name:'계란',grams:100,quantities:[{amount:2,unit:'ea'}]},{foodId:'egg',name:'계란',grams:50,quantities:[{amount:1,unit:'ea'}]}]}];
 let out=period.shoppingItems([{date:'2026-11-17'}],()=>parts,new Map(),'2026-11-17');assert.equal(out.items.length,1);assert.equal(out.items[0].grams,150);assert.equal(out.items[0].quantities.find(q=>q.unit==='ea').amount,3);
 parts[0].ingredients.push({foodId:'egg',name:'계란',grams:50});out=period.shoppingItems([{date:'2026-11-17'}],()=>parts,new Map(),'2026-11-17');assert(!out.items[0].quantities.some(q=>q.unit==='ea'));
});
test('count-only items remain usable and unit price uses one egg',()=>{
 const out=period.shoppingItems([{date:'2026-11-17'}],()=>[{ingredients:[{name:'계란',grams:null,quantities:[{amount:2,unit:'ea'}]}]}],new Map(),'2026-11-17');assert.equal(out.missing,0);assert.equal(out.items[0].grams,null);
 const cost=money.purchaseAmounts(2,10,1,5000,'ea');assert.equal(cost.unit,500);assert.equal(cost.total,5000);assert.equal(cost.left,8);
});
test('shopping payload retains source quantities and unknown nutrition weight',()=>{
 const c=vm.createContext({Intl,Date,crypto:{randomUUID:()=> 'uuid'},accountKey:()=>'',sessionStorage:{getItem:()=>null}});
 vm.runInContext(read('shopping-client.js').replace(/^import .*\n/gm,'').replace(/export /g,''),c);
 const body=c.shoppingBody({shoppingDate:'2026-11-17',from:'2026-11-17',to:'2026-11-17',kind:'WEEK',items:[{name:'계란',grams:null,quantities:[{amount:2,unit:'ea',evidence:'레시피 원문'}]}]});assert.equal(body.items[0].grams,null);assert.equal(body.items[0].quantities[0].amount,2);
});
test('budget tries verified alternate units but chooses only one estimate per ingredient',async()=>{
 const price=await import('data:text/javascript;base64,'+Buffer.from(read('price-budget.js')).toString('base64'));const calls=[];
 const c=vm.createContext({Date,chooseReference:price.chooseReference,referenceReason:price.referenceReason,api:async url=>{calls.push(url);return url.includes('unit=ea')?{references:[{provider:'KAMIS',name:'계란10개',surveyAmount:10,estimated:1000,surveyDate:'2026-11-17'}]}:{references:[]};}});
 vm.runInContext(read('shopping-budget.js').replace(/^import .*\n/gm,'').replace(/export /g,''),c);
 const result=await c.loadReference({name:'계란',grams:100,quantities:[{amount:2,unit:'ea',evidence:'확인'}]});assert.equal(result.reference.estimated,1000);assert.equal(calls.length,2);
});


test('unconvertible contributions of one ingredient are preserved as native-unit rows',()=>{
 const out=period.shoppingItems([{date:'2026-11-17'}],()=>[{ingredients:[{foodId:'egg',name:'계란',grams:100},{foodId:'egg',name:'계란',grams:null,quantities:[{amount:2,unit:'ea'}]}]}],new Map(),'2026-11-17');assert.equal(out.missing,0);assert.equal(out.items.length,2);assert(out.items.some(x=>x.grams===100));assert(out.items.some(x=>x.quantities[0].unit==='ea'&&x.quantities[0].amount===2));
});
