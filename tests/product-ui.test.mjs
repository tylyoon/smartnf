import fs from 'node:fs';import vm from 'node:vm';import test from 'node:test';import assert from 'node:assert/strict';
const base=new URL('../src/main/resources/static/js/',import.meta.url),helper=fs.readFileSync(new URL('product-purchase.js',base),'utf8').replaceAll('export ',''),ui=fs.readFileSync(new URL('product-offers.js',base),'utf8').replace(/^import .*\n/gm,'');
class Node{constructor(tag='div',text=''){this.tag=tag;this.textContent=text;this.value='';this.children=[];this.events={};}append(...items){this.children.push(...items);}replaceChildren(...items){this.children=items;}addEventListener(k,f){this.events[k]=f;}}
const walk=n=>[n,...n.children.flatMap(walk)];
async function boot(provider="KAKAO",override=null){const nodes={},sent=[],urls=[],emitted=[];let selected=null;const product=override||{id:'123',name:'양파 1kg',merchant:'농장',price:3000,grams:1000,url:'https://www.11st.co.kr/products/123',checkedAt:'2026-11-13T07:00:00Z',delivery:'무료'};const ctx={Intl,Date,Number,URLSearchParams,Event,CustomEvent:class{constructor(type,options){this.type=type;this.detail=options.detail;}},window:{addEventListener(){},dispatchEvent(event){emitted.push(event);if(event.type==='smartnf:compare-add')event.detail.added=true;}},comparisonText:()=>"comparison",koreaTime:()=>"한국시간",crypto:{randomUUID:()=> 'request'},location:{search:'?view=compare&ingredient=양파&grams=700&listId=list&entryNo=0&listRevision=1'},document:{getElementById:id=>nodes[id]??=new Node()},element:(...a)=>new Node(...a),button:(text,fn)=>{const node=new Node('button',text);node.events.click=fn;return node;},api:async(url,body)=>{urls.push(url);if(body){sent.push(body);selected={...body,revision:1,stale:false};return selected;}if(url.startsWith('/api/me/shopping-lists/'))return {id:'list',revision:1,items:[{name:'양파',grams:700}]};if(url.startsWith('/api/me/shopping-products'))return selected?[selected]:[];return {products:[product],message:'조회 결과'};}};vm.createContext(ctx);vm.runInContext(helper+'\n'+ui,ctx);await new Promise(setImmediate);nodes['product-search-provider']??=new Node();nodes['product-search-provider'].value=provider;await nodes['product-search-button'].events.click();return {ctx,nodes,sent,urls,emitted};}
test('selection stores package quantity separately and leaves meal requirement unchanged',async()=>{const h=await boot();const all=walk(h.nodes['product-results']),inputs=all.filter(n=>n.tag==='input');const [weight,count,confirm]=inputs;assert.equal(h.nodes['purchase-needed'].readOnly,true);assert.equal(count.value,1);count.value='2';count.events.input();assert(all.some(n=>n.tag==='p'&&n.textContent.includes('구매량 2,000g')));confirm.checked=true;all.find(n=>n.tag==='button'&&n.textContent==='이 상품 선택·저장').events.click();await new Promise(setImmediate);assert.equal(h.sent.length,1);assert.equal(h.sent[0].packs,2);assert.equal(h.sent[0].packGrams,1000);assert.equal(h.nodes['purchase-needed'].value,700);assert.match(h.nodes['product-choice-status'].textContent,/저장한 상품/);});
test('unconfirmed package cannot be saved',async()=>{const h=await boot();walk(h.nodes['product-results']).find(n=>n.tag==='button'&&n.textContent==='이 상품 선택·저장').events.click();await new Promise(setImmediate);assert.equal(h.sent.length,0);});
test('purchase arithmetic supports buying below requirement without changing requirement',()=>{const c=vm.createContext({});vm.runInContext(helper+';globalThis.result=purchaseAmounts(700,500,1,3000)',c);assert.equal(c.result.needed,700);assert.equal(c.result.shortage,200);assert.equal(c.result.total,3000);assert.equal(c.result.bought,500);});

test('all connected provider selections reach the authenticated lookup endpoint',async()=>{
 for(const p of ['KAKAO','DANAWA','ENURI','OASIS','EMART','LOTTE','HOMEPLUS']){
  const h=await boot(p);assert(h.urls.some(u=>u.startsWith('/api/me/ingredient-products?')&&u.includes('provider='+p)));
 }
});

test('user-confirmed ml need persists as ml rather than counterfeit grams',async()=>{
 const product={id:'k:receipt',name:'우유 900ml',merchant:'판매처',price:2700,grams:null,quantityUnit:'ml',packageAmount:900,url:'https://shoppinghow.kakao.com/go.daum?x=1',checkedAt:new Date().toISOString(),provider:'KAKAO'};
 const h=await boot('KAKAO',product);h.nodes['purchase-unit'].value='ml';h.nodes['purchase-unit'].events.change();assert.equal(h.nodes['purchase-needed'].value,'');h.nodes['purchase-needed'].value='100';await h.nodes['product-search-button'].events.click();const all=walk(h.nodes['product-results']),inputs=all.filter(n=>n.tag==='input');assert.equal(inputs[0].value,900);inputs[2].checked=true;all.find(n=>n.tag==='button'&&n.textContent==='이 상품 선택·저장').events.click();await new Promise(setImmediate);assert.equal(h.sent[0].quantityUnit,'ml');assert.equal(h.sent[0].packGrams,null);assert.equal(h.sent[0].packageAmount,900);assert.equal(h.sent[0].requiredAmount,100);
});

test('2.3L offer displays 2300ml and its unit price without pretending it is grams',async()=>{
 const product={id:'k:receipt',name:'NC다이노스 1A 우유 2.3L',merchant:'홈플러스',price:5290,grams:null,quantityUnit:'ml',packageAmount:2300,url:'https://mfront.homeplus.co.kr/item?itemNo=1&storeType=HYPER',checkedAt:new Date().toISOString(),provider:'HOMEPLUS'};
 const h=await boot('HOMEPLUS',product),all=walk(h.nodes['product-results']);const text=all.map(n=>n.textContent).join(' ');
 assert.match(text,/2,300mL/);assert.match(text,/100mL당 230원/);assert.match(text,/계산·선택만 보류/);assert.doesNotMatch(text,/중량을 확정할 수 없습니다/);
 const inputs=all.filter(n=>n.tag==='input');assert.equal(inputs[0].value,2300);assert.equal(inputs[0].disabled,true);assert.equal(all.find(n=>n.tag==='button'&&n.textContent==='이 상품 선택·저장').disabled,true);
 all.find(n=>n.tag==='button'&&n.textContent==='이 상품 선택·저장').events.click();await new Promise(setImmediate);assert.equal(h.sent.length,0);
});

test('2300ml selection uses user-confirmed volume and restores original meal grams on switch back',async()=>{
 const product={id:'k:receipt',name:'우유 2.3L',merchant:'홈플러스',price:5290,grams:null,quantityUnit:'ml',packageAmount:2300,url:'https://mfront.homeplus.co.kr/item?itemNo=1&storeType=HYPER',checkedAt:new Date().toISOString(),provider:'HOMEPLUS'};
 const h=await boot('HOMEPLUS',product);h.nodes['purchase-unit'].value='ml';h.nodes['purchase-unit'].events.change();assert.equal(h.nodes['purchase-needed'].value,'');
 h.nodes['purchase-needed'].value='100';await h.nodes['product-search-button'].events.click();const all=walk(h.nodes['product-results']),inputs=all.filter(n=>n.tag==='input');assert.equal(inputs[0].value,2300);assert.match(all.map(n=>n.textContent).join(' '),/구매량 2,300mL/);assert.match(all.map(n=>n.textContent).join(' '),/상품금액 5,290원/);
 inputs[2].checked=true;all.find(n=>n.tag==='button'&&n.textContent==='이 상품 선택·저장').events.click();await new Promise(setImmediate);assert.equal(h.sent[0].quantityUnit,'ml');assert.equal(h.sent[0].packageAmount,2300);assert.equal(h.sent[0].requiredAmount,100);assert.equal(h.sent[0].packGrams,null);
 h.nodes['purchase-unit'].value='g';h.nodes['purchase-unit'].events.change();assert.equal(h.nodes['purchase-needed'].value,700);assert.equal(h.nodes['purchase-needed'].readOnly,true);
});

test('live lookup passes a comparison candidate without saving, and its callback keeps receipt-based save',async()=>{
 const product={id:'k:receipt',name:'우유 900ml',merchant:'홈플러스',price:2700,grams:null,quantityUnit:'ml',packageAmount:900,url:'https://mfront.homeplus.co.kr/item?itemNo=1&storeType=HYPER',checkedAt:new Date().toISOString(),provider:'HOMEPLUS'};
 const h=await boot('HOMEPLUS',product);h.nodes['purchase-unit'].value='ml';h.nodes['purchase-unit'].events.change();h.nodes['purchase-needed'].value='100';await h.nodes['product-search-button'].events.click();
 walk(h.nodes['product-results']).find(n=>n.tag==='button'&&n.textContent==='비교 목록에 추가').events.click();const event=h.emitted.find(e=>e.type==='smartnf:compare-add');assert(event);assert.equal(event.detail.quantityUnit,'ml');assert.equal(event.detail.grams,900);assert.equal(h.sent.length,0);
 await event.detail.onSave(1,new Node('button'));assert.equal(h.sent.length,1);assert.equal(h.sent[0].productId,'k:receipt');assert.equal(h.sent[0].packGrams,null);assert.equal(h.sent[0].packageAmount,900);assert.equal(h.sent[0].requiredAmount,100);
});


test('one product can be selected in a second explicitly declared count unit',async()=>{
 const product={id:'k:receipt',name:'계란 10개 (500g)',merchant:'판매처',price:5000,grams:500,quantityUnit:'g',packageAmount:500,quantities:[{unit:'g',amount:500},{unit:'ea',amount:10}],url:'https://shoppinghow.kakao.com/go.daum?x=1',checkedAt:new Date().toISOString(),provider:'KAKAO'};
 const h=await boot('KAKAO',product);h.nodes['purchase-unit'].value='ea';h.nodes['purchase-unit'].events.change();h.nodes['purchase-needed'].value='2';await h.nodes['product-search-button'].events.click();const all=walk(h.nodes['product-results']),inputs=all.filter(n=>n.tag==='input');assert.equal(inputs[0].value,10);assert.match(all.map(n=>n.textContent).join(' '),/1개당 500원/);inputs[2].checked=true;all.find(n=>n.tag==='button'&&n.textContent==='이 상품 선택·저장').events.click();await new Promise(setImmediate);assert.equal(h.sent[0].quantityUnit,'ea');assert.equal(h.sent[0].requiredAmount,2);assert.equal(h.sent[0].packGrams,null);
});


test('mismatched native-unit product can be added without inventing required volume',async()=>{const product={id:'k:receipt',name:'우유 1000ml · 10개',merchant:'판매처',price:19900,grams:null,quantityUnit:'ml',packageAmount:10000,quantities:[{unit:'ml',amount:10000}],url:'https://shoppinghow.kakao.com/go.daum?x=1',checkedAt:new Date().toISOString(),provider:'KAKAO'};const h=await boot('KAKAO',product),all=walk(h.nodes['product-results']);const add=all.find(n=>n.tag==='button'&&n.textContent==='비교 목록에 추가');assert.equal(add.disabled,false);add.events.click();const e=h.emitted.find(e=>e.type==='smartnf:compare-add');assert(e);assert.equal(e.detail.quantityUnit,'ml');assert.equal(e.detail.grams,10000);assert.equal(e.detail.requiredAmount,null);assert.equal(h.sent.length,0);});

test('ambiguous kilogram options use representative 1kg and require confirmed option price',async()=>{
 const product={id:'k:receipt',name:'양송이버섯 1kg/2kg 골라담기',merchant:'판매처',price:9810,grams:null,url:'https://shoppinghow.kakao.com/go.daum?x=1',checkedAt:new Date().toISOString(),provider:'KAKAO'};
 const h=await boot('KAKAO',product),all=walk(h.nodes['product-results']),inputs=all.filter(n=>n.tag==='input');
 const [weight,count,name,price,confirm]=inputs;assert.equal(weight.value,1000);assert.equal(weight.readOnly,true);assert.equal(price.value,'');
 const add=all.find(n=>n.tag==='button'&&n.textContent==='비교 목록에 추가'),save=all.find(n=>n.tag==='button'&&n.textContent==='이 상품 선택·저장');assert.equal(add.disabled,true);assert.equal(save.disabled,true);
 assert(all.some(n=>String(n.textContent).includes('대표 규격 1kg')));save.events.click();await new Promise(setImmediate);assert.equal(h.sent.length,0);
 name.value='파지 1kg';price.value='9630';confirm.checked=true;confirm.events.input();assert.equal(add.disabled,false);assert.equal(save.disabled,false);
 add.events.click();assert.equal(h.emitted.find(e=>e.type==='smartnf:compare-add').detail.price,9630);
 save.events.click();await new Promise(setImmediate);assert.equal(h.sent[0].price,9630);assert.equal(h.sent[0].packageAmount,1000);assert.equal(h.sent[0].optionName,'파지 1kg');assert.equal(h.sent[0].optionPriceConfirmed,true);assert.equal(h.nodes['purchase-needed'].value,700);
});
