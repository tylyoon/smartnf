import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
test('raw ml sale remains visible for a g request and reuses authenticated selection search',async()=>{
 const nodes=new Map();
 const element=(tag,text='')=>({tag,textContent:text,children:[],value:'',listeners:{},append(...xs){this.children.push(...xs);},prepend(...xs){this.children.unshift(...xs);},replaceChildren(){this.children=[];},addEventListener(t,fn){this.listeners[t]=fn;},dispatchEvent(){},focus(){},click(){this.clicked=true;}});
 for(const id of ['price-reference-results','purchase-name','purchase-needed','purchase-unit','price-reference-status','purchase-seller-links','product-search-query','product-search-provider','product-search-button'])nodes.set(id,element('div'));
 nodes.get('purchase-name').value='우유';nodes.get('purchase-needed').value='100';nodes.get('purchase-unit').value='g';
 const result={message:'확인',kamisAvailable:true,references:[{provider:'KAMIS',name:'조사우유900ml',estimated:296}],market:[{provider:'HOMEPLUS',name:'우유 900ML×2',merchant:'홈플러스',price:2790,surveyAmount:1800,unit:'ml',unitPrice:155,estimated:null,comparisonReason:'필요량과 상품 단위 불일치',verificationStatus:'REVIEW',verificationReason:'조건부 할인 적용 자격 확인 필요',checkedAt:new Date().toISOString(),conditions:'배송 미확인',sourceUrl:'https://mfront.homeplus.co.kr/item?itemNo=1&storeType=HYPER'}]};
 const context=vm.createContext({document:{getElementById:id=>nodes.get(id),createTextNode:text=>text},window:{addEventListener(){},dispatchEvent(){}},Event:class{},location:{search:''},URLSearchParams,setTimeout,clearTimeout,element,api:async()=>result,chooseReference:()=>null,setReference(){},koreaTime:x=>x,won:x=>x});
 const code=fs.readFileSync(new URL('../src/main/resources/static/js/price-reference.js',import.meta.url),'utf8').replace(/^import .*;$/gm,'').replace(/export /g,'');vm.runInContext(code,context);await context.refreshReference();
 const flatten=x=>typeof x==='string'?x:[x.textContent,...x.children.map(flatten)].join(' ');
 const text=flatten(nodes.get('price-reference-results'));assert.match(text,/2,790원/);assert.doesNotMatch(text,/조사우유900ml|296원/);assert.match(text,/1800ml/);assert.match(text,/검토 사유: 조건부 할인 적용 자격 확인 필요/);assert.match(text,/100ml당 155원/);assert.match(text,/计算|계산 보류/);assert.doesNotMatch(text,/필요량 .*예상비용 0원/);
 const card=nodes.get('price-reference-results').children.find(x=>x.tag==='article');const button=card.children.find(x=>x.tag==='button');button.listeners.click();assert.equal(nodes.get('product-search-provider').value,'HOMEPLUS');assert.equal(nodes.get('product-search-query').value,'우유 900ML×2');assert.equal(nodes.get('product-search-button').clicked,true);
});

test('scheduled work counts, immediate run counts and historical unknown runs remain distinct',async()=>{
 const panel={children:[],prepend(x){this.children.unshift(x);}},element=(tag,text='')=>({tag,textContent:text});
 const today=new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Seoul'}).format(new Date());
 const data={updatedAt:new Date().toISOString(),jobs:[{day:today,provider:'GEMINI',state:'FAILED',count:1}],offers:[{provider:'HOMEPLUS',count:17}],analysis:[{state:'REVIEW',count:17}],runTotals:[{day:today,mode:'IMMEDIATE',state:'DONE',count:1},{day:today,mode:'UNKNOWN',state:'DONE',count:1}],recentRuns:[{mode:'UNKNOWN',provider:'HOMEPLUS',query:'우유',state:'DONE',fetched:17,saved:17,finished:new Date().toISOString()}]};
 const context=vm.createContext({Intl,Date,document:{getElementById:id=>id==='product-search-panel'?panel:null},window:{addEventListener(){}},location:{search:''},URLSearchParams,element,api:async()=>data,koreaTime:x=>x});
 const code=fs.readFileSync(new URL('../src/main/resources/static/js/price-reference.js',import.meta.url),'utf8').replace(/^import .*;$/gm,'').replace(/export /g,'');vm.runInContext(code,context);await context.collectionStatus();
 const text=panel.children.map(n=>n.textContent).join(' ');assert.match(text,/오늘 정기 판매작업 완료 0건/);assert.match(text,/오늘 즉시 수집 성공 1회/);assert.match(text,/정기 작업 실패\(분류·조사 포함\) 1건/);assert.match(text,/저장 상품 17개/);assert.match(text,/유형 미기록/);assert.doesNotMatch(text,/오늘 즉시 수집 성공 2회/);
});
