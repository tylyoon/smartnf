import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';

class Node {
    constructor(tag='div',text='',value) {
        this.tagName=tag.toUpperCase();this.children=[];this.dataset={};this.events={};this.name='';
        this._text=text;this._value=value;this.hidden=false;this.disabled=false;this.open=false;
        this.classList={toggle(){}};
    }
    append(...items){for(const item of items){if(item instanceof Node)this.children.push(item);else this._text+=String(item);}}
    replaceChildren(...items){this.children=[];this._text='';this._value=undefined;this.append(...items);}
    add(item){this.append(item);}
    get textContent(){return this._text+this.children.map(c=>c.textContent).join('');}
    set textContent(value){this._text=String(value);this.children=[];}
    get options(){return this.querySelectorAll('option');}
    get selectedOptions(){return this.options.filter(o=>o.value===this.value);}
    get value(){
        if(this.tagName==='SELECT'){
            if(this._value!==undefined)return this.options.some(o=>o.value===this._value)?this._value:'';
            return this.options[0]?.value||'';
        }
        return this._value??'';
    }
    set value(value){this._value=String(value);}
    get elements(){return {namedItem:name=>this.querySelector('[name='+name+']')};}
    setAttribute(key,value){this[key]=value;}
    addEventListener(type,fn){this.events[type]=fn;}
    scrollIntoView(){}
    matches(selector){
        const tag=selector.match(/^[a-z]+/i)?.[0];
        if(tag&&tag.toUpperCase()!==this.tagName)return false;
        const attribute=selector.match(/\[([^\]=]+)(?:=['"]?([^\]'"]+)['"]?)?\]/);
        if(attribute){
            const [,key,expected]=attribute;
            const actual=key.startsWith('data-')?this.dataset[key.slice(5).replace(/-([a-z])/g,(_,c)=>c.toUpperCase())]:this[key];
            if(expected!==undefined)return String(actual)===expected;
            return actual!==undefined&&actual!==false&&actual!=='';
        }
        return true;
    }
    querySelectorAll(selector){
        return this.children.flatMap(child=>[...(child.matches(selector)?[child]:[]),...child.querySelectorAll(selector)]);
    }
    querySelector(selector){return this.querySelectorAll(selector)[0]||null;}
}
const code=readFileSync(new URL('../src/main/resources/static/js/business-trade.js',import.meta.url),'utf8').replace(/^import .*;\n/gm,'');
const formatting=readFileSync(new URL('../src/main/resources/static/js/business-format.js',import.meta.url),'utf8').replace(/^export /gm,'');
const settle=()=>new Promise(resolve=>setImmediate(resolve));

async function boot({empty=false}={}) {
    const nodes={},timers=new Map(),sent=[];
    const get=(id,tag='div')=>nodes[id]??=new Node(tag);
    get('org','select');get('perspective','select').add(new Node('option','전체','ALL'));
    get('action','select');get('trade-form','form').append(get('fields'),get('execute','button'));
    const report=get('report-form','form');
    for(const key of ['start','end','side','partner','sku']){
        const n=new Node(['side','partner','sku'].includes(key)?'select':'input');n.name=key;
        if(n.tagName==='SELECT')n.add(new Node('option','전체',key==='side'?'ALL':''));
        report.append(n);
    }
    const organizations=empty?[]:[{id:'SELLER',name:'농장',role:'ADMIN'}];
    const state={organizations,dashboard:{
        업체:[{id:'SELLER',name:'농장'},{id:'BUYER',name:'급식소'}],
        상품:[{id:'SKU1',name:'양송이',seller:'SELLER',sellerName:'농장',unit:'g',pack:1000,price:9000,active:1,min_packs:1,shipping:0,tax_note:'세금 포함',origin:'국내',allergens:'미확인',protein:3,sodium:5}],
        거래:[],변경요청:[],견적요청:[],견적:[],notifications:[],unread:0
    },fail:false};
    let seq=0;
    const ctx={
        console,Date,Intl,JSON,Map,Set,URL,URLSearchParams,Blob,accountKey:()=> 'fixture',sessionStorage:{getItem(){return null;},setItem(){}},
        location:{pathname:'/preview/business'},crypto:{randomUUID:()=>String(++seq)},
        Option:class extends Node{constructor(title,value){super('option',title,String(value));}},
        FormData:class {constructor(form){this.items=form.querySelectorAll('[name]').filter(n=>!n.disabled).map(n=>[n.name,n.value]);} [Symbol.iterator](){return this.items[Symbol.iterator]();}values(){return this.items.map(i=>i[1]).values();}},
        document:{hidden:false,getElementById:get,createElement:tag=>new Node(tag),addEventListener(){}},
        window:{confirm:()=>true,addEventListener(){}},
        setTimeout:fn=>{timers.set(++seq,fn);return seq;},clearTimeout:id=>timers.delete(id),
        api:async(url,payload)=>{
            sent.push({url,payload});
            const op=url.split('/').pop();
            if(op==='organizations')return structuredClone(state.organizations);
            if(op==='dashboard')return structuredClone(state.dashboard);
            if(op==='list')return {documents:[]};
            if(state.fail){state.fail=false;throw Error('연결 실패');}
            return {처리:'완료'};
        }
    };
    vm.createContext(ctx);vm.runInContext(formatting+'\n'+code,ctx);
    for(let i=0;i<8;i++)await settle();
    return {
        nodes,state,sent,
        run:code=>vm.runInContext(code,ctx),
        select:op=>{nodes.action.value=op;nodes.action.onchange();},
        poll:async()=>{const entry=[...timers][0];assert.ok(entry);timers.delete(entry[0]);await entry[1]();},
        input:(name,value)=>{const n=nodes.fields.querySelector('[name='+name+']');assert.ok(n,name);n.value=value;nodes.fields.events.input({target:n});return n;}
    };
}
test('new account shows registration without accessing an organization',async()=>{
    const h=await boot({empty:true});
    assert.equal(h.nodes.action.value,'register');
    assert.equal(h.nodes.fields.querySelector('[name=name]').required,true);
    assert.equal(h.sent.some(s=>s.url.endsWith('/dashboard')),false);
});
test('polling discovers a buyer order while supplier input remains intact',async()=>{
    const h=await boot();
    h.select('catalog');h.input('name','입력 중');
    h.state.dashboard.거래=[{id:'ORD1',name:'양송이',buyer:'BUYER',seller:'SELLER',buyerName:'급식소',sellerName:'농장',qty:2000,pack:1000,unit:'g',price:9000,shipping:0,state:'REQUESTED'}];
    h.state.dashboard.notifications=[{id:1,ref:'ORD1',message:'새 발주',isRead:0}];h.state.dashboard.unread=1;
    await h.poll();
    assert.equal(h.nodes.fields.querySelector('[name=name]').value,'입력 중');
    assert.match(h.nodes.tasks.textContent,/판매자 발주 승인/);
    assert.equal(h.nodes.unread.textContent,'1');
});
test('catalog changes update SKU choices without clearing typed pack quantity',async()=>{
    const h=await boot();
    h.select('order');h.input('packs','4');
    h.state.dashboard.상품.push({id:'SKU2',name:'급식소 상품',seller:'BUYER',active:1});
    await h.poll();
    const sku=h.nodes.fields.querySelector('[name=sku]');
    assert.ok(sku.options.some(o=>o.value==='SKU2'));
    assert.ok(!sku.options.some(o=>o.value==='SKU1'));
    assert.equal(h.nodes.fields.querySelector('[name=packs]').value,'4');
});
test('unknown mutation response retries with the same request ID',async()=>{
    const h=await boot();
    h.select('warehouse');h.input('name','냉장고');h.input('zone','냉장');
    h.state.fail=true;
    await h.nodes['trade-form'].onsubmit({preventDefault(){},currentTarget:h.nodes['trade-form']});
    await h.nodes['trade-form'].onsubmit({preventDefault(){},currentTarget:h.nodes['trade-form']});
    const requests=h.sent.filter(s=>s.url.endsWith('/warehouse'));
    assert.equal(requests.length,2);assert.equal(requests[0].payload.requestId,requests[1].payload.requestId);
});
test('renamed consumption date and Korean quantity and state formatting are used',async()=>{
    const h=await boot();
    h.select('stock');
    assert.match(h.nodes.fields.textContent,/소비기한/);
    assert.equal(h.run("packaging({qty:2000,pack:1000,unit:'g'})"),'2,000 g · 2포장 × 1,000 g');
    assert.equal(h.run("value('state','SHIPPED')"),'출고 완료');
    assert.equal(h.run("value('shipping',0)"),'0원');
});

test('quote price and total are prominent and replaced quotes cannot be selected',async()=>{
    const h=await boot();
    h.state.dashboard.상품.push({id:'PEPPER',name:'후추 100g 병',seller:'BUYER',active:1,pack:100,unit:'g',price:3000,shipping:0,min_packs:1});
    h.state.dashboard.견적=[
        {id:'Q1',name:'후추',buyer:'SELLER',seller:'BUYER',sku:'PEPPER',price:3000,quoteState:'SUPERSEDED',until_day:'2090-01-01'},
        {id:'Q2',name:'후추',buyer:'SELLER',seller:'BUYER',sku:'PEPPER',price:2800,quoteState:'ACTIVE',version:2,until_day:'2090-01-01'}
    ];
    await h.poll();h.select('order');
    const sku=h.input('sku','PEPPER');
    h.nodes.fields.events.change({target:sku});
    h.input('quote','Q2');h.input('packs','2');
    assert.match(h.nodes['price-panel'].textContent,/포장당 견적가2,800원/);
    assert.match(h.nodes['price-panel'].textContent,/총 결제금액5,600원/);
    assert.equal(h.nodes.fields.querySelector('[name=quote]').options.some(o=>o.value==='Q1'),false);
    h.select('rfq');assert.match(h.nodes.fields.textContent,/식재료명/);
});

test('shipment selection displays product quantity and order number together',async()=>{
    const h=await boot();
    h.state.dashboard.출고=[{id:'OUT1',ord:'ORD1',name:'후추 100g 병',unit:'g',qty:200,received:0}];
    await h.poll();h.select('receive');
    assert.match(h.nodes.fields.textContent,/출고 내역 선택/);
    assert.match(h.nodes.fields.querySelector('[name=shipment]').textContent,/후추 100g 병 · 200 g · 미검수 200 g · OUT1 · 주문 ORD1/);
});

test('revised quote preview uses the entered price and requested pack quantity',async()=>{
    const h=await boot();
    h.state.dashboard.견적요청=[{id:'RFQ1',name:'양송이',buyer:'BUYER',seller:'SELLER',qty:2000,state:'OPEN'}];
    h.state.dashboard.견적=[{id:'Q1',buyer:'BUYER',seller:'SELLER',sku:'SKU1',price:3000,quoteState:'ACTIVE',version:1,until_day:'2090-01-01',rfq:'RFQ1'}];
    await h.poll();h.select('reviseQuote');
    h.input('quote','Q1');h.input('price','2800');
    assert.match(h.nodes['price-panel'].textContent,/포장당 견적가2,800원/);
    assert.match(h.nodes['price-panel'].textContent,/총 결제금액5,600원/);
});

const paymentCode=readFileSync(new URL('../src/main/resources/static/js/business-payment.js',import.meta.url),'utf8').replace(/^import .*;\n/gm,'');
async function paymentBoot({configured=true,search='?order=ORD1&org=BUYER'}={}) {
    const nodes={},calls=[],events={},sdkRequests=[],amounts=[],histories=[];
    const get=id=>nodes[id]??=new Node(id==='back'?'a':'button');
    for(const id of ['pg-pay','pg-sync','pg-release','pg-cancel','pg-refund'])get(id).disabled=true;
    const payment={order:'ORD1',orderId:'PAY1',org:'BUYER',customerKey:'random-customer',name:'후추 100g 병',
        price:3000,qty:200,pack:100,unit:'g',amount:6000,shipping:0,refunded:0,state:'PREPARED',orderState:'PAYMENT_PENDING',captured:false};
    const ctx={
        URLSearchParams,Intl,Date,console,
        location:{search,pathname:'/preview/business/payment',origin:'http://localhost:8080'},
        history:{replaceState:(...args)=>histories.push(args)},
        document:{getElementById:get,createElement:tag=>new Node(tag)},
        window:{confirm:()=>true,TossPayments:client=>({widgets:customer=>({
            setAmount:async amount=>amounts.push(amount),
            renderPaymentWindow:async()=>({on:(event,fn)=>events[event]=fn,destroy(){}}),
            requestPayment:async body=>sdkRequests.push(body)
        })})},
        api:async(url,body)=>{
            calls.push({url,body});
            if(url.endsWith('/config'))return {configured,clientKey:'test_gck_fixture',message:'PG 테스트 키 설정 필요'};
            if(url.endsWith('/status'))return {error:'준비 기록 없음'};
            if(url.endsWith('/confirm'))return {...payment,state:'PAID',captured:true,orderState:'PAID'};
            return payment;
        }
    };
    vm.createContext(ctx);vm.runInContext(formatting+'\n'+paymentCode,ctx);
    for(let i=0;i<8;i++)await settle();
    return {nodes,calls,events,sdkRequests,amounts,histories};
}
test('PG checkout uses server amount and supported SDK redirect methods',async()=>{
    const h=await paymentBoot();
    assert.equal(h.nodes['pg-pay'].disabled,false);
    await h.nodes['pg-pay'].onclick();
    assert.equal(h.amounts[0].value,6000);
    await h.events.paymentRequest({paymentMethod:{method:'CARD'}});
    assert.equal(h.sdkRequests[0].orderId,'PAY1');
    assert.match(h.sdkRequests[0].successUrl,/result=success/);
    assert.equal(h.nodes['pg-pay'].disabled,true);
    h.events.cancel();
    assert.equal(h.nodes['pg-pay'].disabled,false);
});
test('PG callback calls server confirmation and removes query payment identifier',async()=>{
    const h=await paymentBoot({search:'?order=ORD1&org=BUYER&orderId=PAY1&paymentKey=test-key&amount=6000'});
    const confirmation=h.calls.find(c=>c.url.endsWith('/confirm'));
    assert.equal(confirmation.body.amount,'6000');
    assert.equal(confirmation.body.paymentKey,'test-key');
    assert.ok(!h.histories[0][2].includes('paymentKey'));
    assert.match(h.nodes['pg-status'].textContent,/PG 테스트 결제 완료/);
});
test('missing PG configuration is visible and creates no reservation',async()=>{
    const h=await paymentBoot({configured:false});
    assert.match(h.nodes['pg-status'].textContent,/키 설정 필요/);
    assert.equal(h.calls.some(c=>c.url.endsWith('/prepare')),false);
    assert.equal(h.nodes['pg-pay'].disabled,true);
});
