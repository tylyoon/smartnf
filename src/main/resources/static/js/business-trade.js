import {api,accountKey} from './food-studio-core.js';
import {states,roles,labels,numbers,money,quantity,packaging,element,table} from './business-format.js';

const actions = {
    register:['업체 등록','name','업체·담당자','ANY'],
    deleteOrg:['미사용 업체 삭제','confirmedOrg','업체·담당자','ADMIN'],
    staff:['담당자 권한 부여','member role','업체·담당자','ADMIN'],
    partner:['거래처 등록·수정','partner kind contact? phone? address? terms? note?','거래처','BUY SELL'],
    warehouse:['논리 창고 등록','name zone','재고·로트','STORE'],
    catalog:['판매 상품 등록','name origin unit pack price barcode? allergens protein sodium min_packs? shipping region? lead_days? tax_note?','상품·견적','SELL'],
    catalogEdit:['상품 수정·판매 중지','sku name origin unit pack price barcode? allergens protein sodium active min_packs? shipping region? lead_days? tax_note?','상품·견적','SELL'],
    stock:['로트 입고','sku place producerLot expires qty','재고·로트','STORE'],
    rfq:['미등록 식재료 견적 요청','seller name spec unit qty delivery region? note?','상품·견적','BUY'],
    quoteRfq:['식재료 요청에 견적 제안','rfq sku price until','상품·견적','SELL'],
    priceRequest:['희망단가 요청','quote price reason','상품·견적','BUY'],
    reviseQuote:['견적 수정·재제안','quote price until','상품·견적','SELL'],
    rejectPrice:['희망단가 요청 반려','id reason','상품·견적','SELL'],
    quote:['거래처 견적 등록','sku buyer price until','상품·견적','SELL'],
    order:['발주 요청','sku packs quote? delivery? region?','발주·배송','BUY'],
    editOrder:['승인 전 발주 수량 수정','id packs','발주·배송','BUY'],
    approve:['판매자 발주 승인','id','발주·배송','SELL'],
    pay:['모의 결제·재고 예약','id','발주·배송','BUY FINANCE'],
    cancel:['발주 취소·예약 해제','id','발주·배송','BUY FINANCE'],
    ship:['출고','id','발주·배송','STORE'],
    receive:['도착 수량 검수','id shipment place qty','발주·배송','STORE'],
    requestChange:['변경·부족·파손·반품 요청','id kind qty? packs? reason','거래 조정','BUY'],
    resolveClaim:['변경·검수 요청 합의 처리','id decision resolution','거래 조정','SELL'],
    invoice:['승인 명세서 대조','id doc','문서·정산','FINANCE'],
    settle:['검수금액 대조·정산 기록','id','문서·정산','FINANCE'],
    erp:['모의 ERP 반영·대조','id','문서·정산','FINANCE'],
    budget:['기간별 구매 예산 등록','start end amount','실적·예산','BUY FINANCE'],
    plan:['식수별 소요량·발주량 계산','sku people perPerson delivery','식단·대체','BUY'],
    substitute:['대체 식재료 비교','oldSku newSku avoid','식단·대체','BUY'],
    acceptSub:['대체안 승인','id','식단·대체','BUY'],
    use:['식재료 사용','lot place qty reference','재고·로트','STORE'],
    discard:['재고 폐기','lot place qty reference','재고·로트','STORE'],
    transfer:['창고 간 이동','lot place toPlace qty reference','재고·로트','STORE'],
    recall:['로트 회수·납품처 추적','lot','재고·로트','STORE'],
    campaign:['공동구매·산지 예약 모집','sku target capacity deadline delivery','공동구매·예약','SELL'],
    pledge:['예약 포장 수 등록','id qty','공동구매·예약','BUY'],
    close:['모집 마감·발주 생성','id','공동구매·예약','SELL'],
    insurance:['보험 내역 등록','kind expires reference','업체·담당자','ADMIN']
};
const help = {
    order:'상품에 표시된 최소 주문량·배송 지역·세금·배송비를 확인하세요. 가격과 조건은 발주 당시 값으로 보관됩니다.',
    catalog:'포장당 가격에는 세금을 포함하세요. 배송비 0원은 무료배송인 경우에 입력하세요.',
    catalogEdit:'기존 SKU의 포장량과 단위는 유지합니다. 포장 구성이 달라지면 새 상품으로 등록하세요.',
    stock:'수량은 상품의 기본 단위로 입력합니다. 1kg 포장 10개의 기본 단위가 g이면 10000을 입력합니다.',
    receive:'실제로 확인한 수량을 기본 단위로 입력합니다. 전량이 도착하지 않았으면 도착한 수량만 입력하세요.',
    rfq:'상품 등록 전에도 공급자에게 재료·규격·필요량과 희망 납기를 요청할 수 있습니다.',
    quoteRfq:'요청에 맞는 판매 상품을 먼저 등록한 뒤 제안하세요. 구매자가 가격·규격을 확인하고 포장 수를 정해 발주합니다.',
    requestChange:'변경은 결제 전 승인 주문에 요청합니다. 부족·파손·반품은 모의 정산 전에 요청하며, 열린 요청은 거래 처리를 보류합니다.',
    resolveClaim:'반품·파손 수락은 반품 수령과 수량을 확인한 뒤 실행하세요. 반품 재고는 공급자 격리창고에 보관됩니다.',
    settle:'열린 문제 요청이 없어야 합니다. 일부 입고는 부족분·반품 합의와 명세서 대조 후 정산합니다.',
    invoice:'승인된 단일 상품 명세서를 선택하세요. 문서 수량은 포장 수이며 발주 규격으로 환산해 검수량과 대조합니다.',
    substitute:'상품에 입력된 성분·알레르겐 표시를 비교합니다. 표시가 미확인이면 담당자 검토가 필요합니다.',
    deleteOrg:'삭제는 업무 자료나 다른 담당자가 연결되지 않은 업체에서 가능합니다.',
    partner:'연락처·납품처·조건·메모는 현재 작업 업체에 저장됩니다. 거래처별 이력은 아래 실적 조회에서 확인합니다.'
};
const kindOptions = {
    partner:[['SUPPLIER','공급업체'],['CUSTOMER','고객사'],['BOTH','공급업체·고객사']],
    requestChange:[['CHANGE','수량 변경'],['CANCEL','취소 요청'],['SHORTAGE','부족분 확정'],['DAMAGE','파손 반품'],['RETURN','반품']]
};
const $=id=>document.getElementById(id);
let reportFilter=null,organizations=[],data={},lastRequest,loading=false,busy=false,timer,reportCsv='',openedLink=false,dirty=false,revision=0,queuedInitial=false,lastTableSnapshot='',lastTaskSnapshot='';
const section=location.pathname.split('/').pop();
const defaultAction=({shop:'order',partners:'partner',orders:'receive',purchase:'plan',jobs:'erp'})[section]||'register';
const call=async(op,payload)=>{
    const result=await api('/api/me/business-trade/'+op,payload);
    if(result.error)throw Error(result.error);
    return result;
};
const orgStorage='smartnf.business.org:'+accountKey();
const role=()=>organizations.find(o=>o.id===$('org').value)?.role;
const allowed=op=>Boolean(actions[op])&&(op==='register'||role()==='ADMIN'||actions[op][3].split(' ').includes(role()));
const activeOrder=id=>(data['거래']||[]).find(o=>o.id===id);
const own=(row,key)=>row[key]===$('org').value;
const error=e=>{$('message').textContent=e.message;};

function optionItems(select, items, placeholder='선택하세요') {
    const value=select.value;
    select.replaceChildren(new Option(placeholder,''));
    for(const [id,title] of items)select.add(new Option(title,id));
    if(value && items.some(([id])=>String(id)===value))select.value=value;
    else if(value){
        const missing=new Option('현재 선택값 · '+value,value);
        missing.disabled=true;select.add(missing);select.value=value;
    }
}
function nameOf(id) {
    for(const key of ['업체','상품','창고','거래','견적요청']){
        const item=(data[key]||[]).find(row=>row.id===id);
        if(item)return (item.name||item.sellerName||item.id)+' · '+id;
    }
    return id||'미확인';
}
function eligibleOrders(op) {
    const buyerStates={order:[],editOrder:['REQUESTED'],pay:['APPROVED'],receive:['SHIPPED','PARTIAL'],
        cancel:['REQUESTED','APPROVED','PAID'],invoice:['PARTIAL','RECEIVED'],settle:['PARTIAL','RECEIVED'],erp:['SETTLED'],
        requestChange:['REQUESTED','APPROVED','PAID','SHIPPED','PARTIAL','RECEIVED']};
    const sellerStates={approve:['REQUESTED'],ship:['PAID']};
    const side=sellerStates[op]?'seller':'buyer';
    const expected=sellerStates[op]||buyerStates[op];
    return (data['거래']||[]).filter(row=>(!expected||(own(row,side)&&expected.includes(row.state)))&&!(op==='cancel'&&row.state==='PAID'&&row.pg_state));
}
function referenceSource(op,key) {
    if(key==='id'){
        if(['pledge','close'].includes(op))return '예약모집';
        if(op==='acceptSub')return '대체안';
        if(op==='resolveClaim')return '변경요청';
        if(op==='rejectPrice')return '가격협의';
        return '거래';
    }
    return ({sku:'상품',oldSku:'상품',newSku:'상품',place:'창고',toPlace:'창고',buyer:'업체',seller:'업체',partner:'업체',
        shipment:'출고',quote:'견적',lot:'재고',doc:'승인 문서',rfq:'견적요청'})[key];
}
function sourceItems(op,key) {
    let list=data[referenceSource(op,key)]||[];
    if(key==='id'&&referenceSource(op,key)==='거래')list=eligibleOrders(op);
    if(key==='id'&&op==='resolveClaim')list=list.filter(r=>r.state==='OPEN'&&own(activeOrder(r.ord)||{},'seller'));
    if(key==='id'&&op==='acceptSub')list=list.filter(r=>r.state==='PROPOSED');
    if(key==='id'&&op==='close')list=list.filter(r=>r.state==='OPEN'&&own(r,'seller'));
    if(key==='id'&&op==='pledge')list=list.filter(r=>r.state==='OPEN'&&!own(r,'seller'));
    if(['buyer','seller','partner'].includes(key))list=list.filter(r=>r.id!==$('org').value);
    if(key==='rfq')list=list.filter(r=>own(r,'seller')&&r.state==='OPEN');
    if(key==='sku'){
        if(['catalogEdit','stock','quote','quoteRfq','campaign'].includes(op))list=list.filter(r=>own(r,'seller'));
        if(op==='order')list=list.filter(r=>!own(r,'seller')&&r.active);
    }
    if(key==='quote'){
        const sku=$('fields').querySelector('[name=sku]')?.value;
        list=list.filter(r=>own(r,op==='reviseQuote'?'seller':'buyer')&&r.quoteState==='ACTIVE'&&(!sku||r.sku===sku)&&!r.ord&&(op==='reviseQuote'||r.until_day>=new Date().toLocaleDateString('en-CA')));
    }
    if(key==='shipment'){
        const order=$('fields').querySelector('[name=id]')?.value;
        list=list.filter(r=>(!order||r.ord===order)&&r.received<r.qty);
    }
    if(key==='lot'){
        if(op==='recall')list=list.filter(r=>(data['상품']||[]).some(s=>s.id===r.sku&&own(s,'seller')));
        list=[...new Map(list.map(r=>[r.lot,r])).values()];
    }
    return list.map(r=>{
        const id=r.id||r.lot;
        let title=[r.name,r.kind?claimKind(r.kind):'',id,r.state?states[r.state]||r.state:'',r.sellerName].filter(Boolean).join(' · ');
        if(key==='shipment')title=[r.name,quantity(r.qty,r.unit),'미검수 '+quantity(r.qty-r.received,r.unit),id,'주문 '+r.ord].join(' · ');
        else if(key==='id'&&referenceSource(op,key)==='거래')title=[r.name,packaging(r),money(r.qty*r.price/r.pack+r.shipping),id].join(' · ');
        else if(key==='quote')title=[r.name,money(r.price)+'/포장','v'+r.version,r.until_day,id].join(' · ');
        return [id,title];
    });
}
function buildActions() {
    const previous=$('action').value;
    $('action').replaceChildren();
    const groups=new Map();
    for(const [key,[title,,category]] of Object.entries(actions)){
        if(!allowed(key))continue;
        const perspective=$('perspective').value,workRoles=actions[key][3].split(' ');
        if(perspective==='BUY'&&workRoles.includes('SELL')&&!workRoles.includes('BUY'))continue;
        if(perspective==='SELL'&&workRoles.includes('BUY')&&!workRoles.includes('SELL'))continue;
        if(!groups.has(category)){const group=element('optgroup');group.label=category;groups.set(category,group);$('action').append(group);}
        groups.get(category).append(new Option(title,key));
    }
        const choices=[...$('action').options].map(o=>o.value);
    $('action').value=choices.includes(previous)?previous:choices.includes(defaultAction)?defaultAction:'register';
}
function choice(key,op) {
    if(key==='unit')return [['g','g'],['ml','mL'],['ea','개']];
    if(key==='role')return Object.entries(roles).filter(([r])=>r!=='ADMIN');
    if(key==='active')return [['1','판매 중'],['0','판매 중지']];
    if(key==='decision')return [['ACCEPT','수락'],['REJECT','반려']];
    if(key==='kind'&&kindOptions[op])return kindOptions[op];
    return null;
}
function fieldTitle(op,key) {
    if(key==='name')return ({register:'업체명',warehouse:'창고명',catalog:'상품명',catalogEdit:'상품명',rfq:'식재료명'})[op]||'명칭';
    if(key==='shipment')return '출고 내역 선택';
    if(key==='price'&&op==='priceRequest')return '희망 포장 단가(세금 포함)';
    if(op==='pledge'&&key==='qty')return '예약 포장 수';
    if(op==='requestChange'&&key==='qty')return '부족·반품 수량(기본 단위)';
    if(op==='requestChange'&&key==='packs')return '변경 후 포장 수';
    if(op==='insurance'&&key==='expires')return '보험 만료일';
    if(op==='insurance'&&key==='kind')return '보험 종류';
    return labels[key]||key;
}
function draw() {
    const op=$('action').value;
    if(!actions[op])return;
    $('fields').replaceChildren();
    for(const raw of actions[op][1].split(' ')){
        const key=raw.replace('?',''), optional=key!==raw;
        const label=element('label',fieldTitle(op,key)+(optional?' (선택)':''));
        const predefined=choice(key,op),source=referenceSource(op,key);
        let input;
        if(predefined||source){
            input=element('select');
            if(source){input.dataset.source=source;input.dataset.field=key;optionItems(input,sourceItems(op,key));}
            else optionItems(input,predefined);
        }else{
            input=element(['note','terms','reason','resolution','address'].includes(key)?'textarea':'input');
            if(['expires','delivery','until','deadline','start','end'].includes(key))input.type='date';
            if(['member','pack','price','protein','sodium','qty','people','perPerson','packs','target','capacity','min_packs','shipping','lead_days','amount'].includes(key)){
                input.type='number';input.min=['protein','sodium','shipping','lead_days','amount'].includes(key)?0:1;input.step=1;
            }
            if(input.tagName==='INPUT'||input.tagName==='TEXTAREA')input.maxLength=1000;
        }
        input.name=key;input.required=!optional;label.append(input);$('fields').append(label);
    }
    $('action-help').textContent=help[op]||'작업 업체와 대상 자료를 확인한 후 실행하세요.';
    $('execute').textContent=actions[op][0];
    $('execute').classList.toggle('danger',op==='deleteOrg');
    dirty=false;
    formContext();
}
function fill(values) {
    for(const input of $('fields').querySelectorAll('[name]')){
        if(values[input.name]!=null)input.value=String(values[input.name]);
    }
}
function formContext() {
    const panel=$('price-panel');panel.replaceChildren();panel.hidden=true;
    const op=$('action').value,sku=(data['상품']||[]).find(r=>r.id===$('fields').querySelector('[name=sku]')?.value);
    if(sku){
        const quote=(data['견적']||[]).find(r=>r.id===$('fields').querySelector('[name=quote]')?.value);
        const unitPrice=quote?.price??sku.price;
        const packs=Number($('fields').querySelector('[name=packs]')?.value)||0;
        const details=' '+sku.name+' · '+quantity(sku.pack,sku.unit)+'/포장 · '+money(unitPrice)+(quote?' (견적가)':'')+' · 최소 '+sku.min_packs+'포장 · 배송비 '+money(sku.shipping)+(sku.region?' · 배송 지역 '+sku.region:'')+' · '+sku.tax_note;
        $('action-help').textContent=(help[op]||'상품 조건을 확인하세요.')+details+(op==='order'&&packs?' · 발주 합계 '+money(packs*unitPrice+sku.shipping):'');
    }
    const selectedId=$('fields').querySelector('[name=id]')?.value;
    const row=activeOrder(selectedId);
    const quote=(data['견적']||[]).find(r=>r.id===$('fields').querySelector('[name=quote]')?.value);
    const selectedSku=sku||(quote&&(data['상품']||[]).find(r=>r.id===quote.sku));
    const requestId=$('fields').querySelector('[name=rfq]')?.value||quote?.rfq;
    const request=(data['견적요청']||[]).find(r=>r.id===requestId);
    const estimatedPacks=request&&selectedSku?Math.max(selectedSku.min_packs||1,Math.ceil(request.qty/selectedSku.pack)):0;
    const packs=row&&op!=='editOrder'?row.qty/row.pack:Number($('fields').querySelector('[name=packs]')?.value)||estimatedPacks;
    const enteredPrice=Number($('fields').querySelector('[name=price]')?.value);
    const price=row?row.price:enteredPrice>0?enteredPrice:quote?.price??selectedSku?.price;
    const shipping=row?row.shipping:selectedSku?.shipping||0;
    if(price!=null){
        panel.hidden=false;
        panel.append(element('h3',row?.name||selectedSku?.name||'금액 확인'));
        if(row)panel.append(element('p',row.id,'business-note'));
        const cards=element('div',null,'business-prices');
        const amounts=[['포장당 견적가',price],['상품금액',price*packs],['배송비',shipping],['총 결제금액',price*packs+shipping]];
        for(const [title,amount] of amounts){
            const card=element('div',null,'business-price');card.append(element('span',title),element('strong',money(amount)));cards.append(card);
        }
        if(row&&op==='settle'){
            const checked=Math.floor((row.received*row.price+Math.floor(row.pack/2))/row.pack)+(row.received?row.shipping:0);
            const card=element('div',null,'business-price');
            card.append(element('span','검수 인정금액'),element('strong',money(checked)));cards.append(card);
        }
        if(estimatedPacks)panel.append(element('p','요청 수량으로 계산한 예상 금액입니다. 최종 포장 수는 발주 시 확정합니다.','business-note'));
        panel.append(element('p',packs?numbers(packs)+'포장':'구매 포장 수를 입력하면 합계가 계산됩니다.','business-note'),cards);
    }
}
function syncSelects() {
    const op=$('action').value;
    for(const select of $('fields').querySelectorAll('select[data-source]'))optionItems(select,sourceItems(op,select.name));
    for(const key of ['partner','sku']){
        const select=$('report-form').elements.namedItem(key);
        const rows=data[key==='partner'?'업체':'상품']||[];
        optionItems(select,rows.filter(r=>key!=='partner'||r.id!==$('org').value).map(r=>[r.id,r.name+' · '+r.id]),'전체');
    }
}
function startAction(op,id,values={}) {
    if(!allowed(op))return;
    if(dirty &&
       $('action').value!==op && !window.confirm('현재 입력 내용을 닫고 선택한 업무로 이동할까요?'))return;
    $('action').value=op;draw();
    fill({id,...values});
    syncSelects();formContext();
    $('trade-form').scrollIntoView({behavior:'smooth',block:'start'});
}
function button(title,callback,secondary=true) {
    const result=element('button',title,secondary?'secondary':'');
    result.type='button';result.onclick=callback;return result;
}
function hasClaim(id) {
    return (data['변경요청']||[]).some(c=>c.ord===id&&c.state==='OPEN');
}
function taskActions(row) {
    const buyer=own(row,'buyer'),seller=own(row,'seller');
    if(hasClaim(row.id))return [];
    const candidates=[];
    if(seller&&row.state==='REQUESTED')candidates.push('approve');
    if(seller&&row.state==='PAID')candidates.push('ship');
    if(buyer&&row.state==='REQUESTED')candidates.push('editOrder','cancel');
    if(buyer&&row.state==='APPROVED')candidates.push('pay','requestChange','cancel');
    if(buyer&&row.state==='PAID')candidates.push('requestChange',...(row.pg_state?[]:['cancel']));
    if(buyer&&['SHIPPED','PARTIAL'].includes(row.state)&&!row.receipt_closed)candidates.push('receive');
    if(buyer&&['PARTIAL','RECEIVED'].includes(row.state)){
        candidates.push('requestChange','invoice');
        if(row.billed===row.received&&(row.state==='RECEIVED'||row.receipt_closed))candidates.push('settle');
    }
    if(buyer&&row.state==='SETTLED'&&!row.erp_verified)candidates.push('erp');
    return candidates.filter(allowed);
}
function claimKind(value) {
    return ({CHANGE:'수량 변경',CANCEL:'취소',SHORTAGE:'부족분',DAMAGE:'파손 반품',RETURN:'반품',SUPPLIER:'공급업체',CUSTOMER:'고객사',BOTH:'공급업체·고객사'})[value]||value;
}
function renderTasks() {
    $('tasks').replaceChildren();
    const perspective=$('perspective').value;
    let count=0;
    for(const row of data['거래']||[]){
        if(perspective==='BUY'&&!own(row,'buyer')||perspective==='SELL'&&!own(row,'seller'))continue;
        const steps=taskActions(row);
        if(!steps.length&&!hasClaim(row.id)&&!(own(row,'buyer')&&row.state==='PAYMENT_PENDING'))continue;
        count++;
        const card=element('article',null,'business-task');
        card.append(element('strong',row.name+' · '+(row.pg_state?'PG 테스트 · ':'')+(states[row.state]||row.state)));
        card.append(element('p',(own(row,'buyer')?'공급자 '+row.sellerName:'구매자 '+row.buyerName)+' · '+packaging(row)+' · '+money(row.qty*row.price/row.pack+row.shipping)));
        card.append(element('p',row.id,'business-note'));
        card.append(element('strong','총 '+money(row.qty*row.price/row.pack+row.shipping)+' · 포장당 '+money(row.price),'business-task-price'));
        const controls=element('div',null,'business-actions');
        if(hasClaim(row.id))card.append(element('p','변경·검수 문제 합의가 필요합니다. 처리가 보류됐습니다.','business-note'));
        for(const op of steps)controls.append(button(actions[op][0]+' · 내용 확인',()=>startAction(op,row.id),op!=='approve'));
        if(own(row,'buyer')&&['APPROVED','PAYMENT_PENDING','PAID','PARTIAL','RECEIVED'].includes(row.state)){
            const link=element('a',row.pg_state?'PG 결제·환불 관리':'PG 테스트 결제','business-button');
            link.href='/preview/business/payment?org='+encodeURIComponent($('org').value)+'&order='+encodeURIComponent(row.id);
            controls.append(link);
        }
        card.append(controls);$('tasks').append(card);
    }
    for(const row of data['견적요청']||[]){
        if(row.state!=='OPEN')continue;
        const seller=own(row,'seller');
        if(perspective==='BUY'&&seller||perspective==='SELL'&&!seller)continue;
        const card=element('article',null,'business-task');
        card.append(element('strong',row.name+' · 견적 요청'));
        card.append(element('p',quantity(row.qty,row.unit)+' · '+row.spec+' · 희망 납기 '+row.delivery));
        if(seller&&allowed('quoteRfq'))card.append(button('견적 제안',()=>startAction('quoteRfq',null,{rfq:row.id})));
        else card.append(element('p','공급자의 견적을 기다리고 있습니다.','business-note'));
        $('tasks').append(card);count++;
    }
    for(const row of data['견적']||[]){
        if(!own(row,'buyer')||row.ord||row.quoteState!=='ACTIVE'||row.until_day<new Date().toLocaleDateString('en-CA')||perspective==='SELL'||!allowed('order'))continue;
        const card=element('article',null,'business-task');
        card.append(element('strong','받은 견적 · '+nameOf(row.sku)));
        card.append(element('p',money(row.price)+' /포장 · v'+row.version+' · 유효일 '+row.until_day));
        if(allowed('priceRequest'))card.append(button('희망단가 요청',()=>startAction('priceRequest',null,{quote:row.id})));
        card.append(button('견적 확인·발주',()=>{
            const request=(data['견적요청']||[]).find(r=>r.id===row.rfq);
            const sku=(data['상품']||[]).find(s=>s.id===row.sku);
            const values={sku:row.sku,quote:row.id};
            if(request&&sku)Object.assign(values,{packs:Math.max(sku.min_packs,Math.ceil(request.qty/sku.pack)),delivery:request.delivery,region:request.region});
            startAction('order',null,values);
        }));
        $('tasks').append(card);count++;
    }
    for(const row of data['변경요청']||[]){
        if(row.state!=='OPEN'||!own(activeOrder(row.ord)||{},'seller')||!allowed('resolveClaim'))continue;
        const card=element('article',null,'business-task');
        card.append(element('strong',claimKind(row.kind)+' 처리 요청'));
        card.append(element('p',row.reason+' · 수량 '+quantity(row.qty,activeOrder(row.ord)?.unit)+(row.packs?' · 변경 후 '+row.packs+'포장':'')+' · '+row.ord));
        card.append(button('요청 확인·합의 처리',()=>startAction('resolveClaim',row.id)));
        $('tasks').append(card);count++;
    }
    for(const request of data['가격협의']||[]){
        const quote=(data['견적']||[]).find(q=>q.id===request.quote);
        if(request.state!=='REQUESTED'||!quote||!own(quote,'seller'))continue;
        const card=element('article',null,'business-task');
        card.append(element('strong',quote.name+' · 희망단가 요청'),element('p',money(request.price)+'/포장 · '+request.reason));
        card.append(button('재견적 내용 확인',()=>startAction('reviseQuote',null,{quote:request.quote,price:request.price,until:quote.until_day})));
        card.append(button('반려 내용 확인',()=>startAction('rejectPrice',request.id)));
        $('tasks').append(card);count++;
    }
    if(!count)$('tasks').append(element('p','현재 처리할 대기 업무가 없습니다. 아래에서 필요한 업무를 선택하세요.','business-note'));
}
function value(key,v,row={}) {
    if(v==null||v==='')return '미확인';
    if(['price','paid','amount','shipping','기간 예산','예산 잔액','검수 기준 구매지출','전체 검수 기준 구매지출','조회 조건 검수금액'].includes(key)||key.endsWith('금액'))return money(v);
    if(['org','seller','buyer','partner','owner'].includes(key))return nameOf(v);
    if(key==='sku')return nameOf(v);
    if(['created','updated','at'].includes(key)&&String(v).length>10){
        const timestamp=String(v).includes('T')?v:String(v).replace(' ','T')+'Z';
        return new Date(timestamp).toLocaleString('ko-KR',{timeZone:'Asia/Seoul'})+' (한국시간)';
    }
    if(key==='state'||key==='상태'||key==='quoteState')return states[v]||v;
    if(key==='role')return roles[v]||v;
    if(key==='isRead')return v?'읽음':'미확인';
    if(key==='kind')return claimKind(v);
    if(key==='blocked')return v?'회수 차단':'정상';
    if(key==='active')return v?'판매 중':'판매 중지';
    if(key==='receipt_closed')return v?'마감':'진행 중';
    if(key==='erp_verified')return v?'완료':'대기';
    if(['qty','received','billed'].includes(key))return quantity(v,row.unit);
    if(key==='unit')return ({ml:'mL',ea:'개'})[v]||v;
    if(typeof v==='object')return JSON.stringify(v);
    return String(v);
}
function detailResult(parent,title,result) {
    const panel=element('section',null,'business-panel');panel.append(element('h3',title));
    const records=Array.isArray(result)?result:[result];
    for(const row of records){
        const dl=element('dl');
        for(const [key,v] of Object.entries(row)){
            if(key==='csv')continue;
            if(Array.isArray(v)){
                const nested=element('details');nested.open=true;nested.append(element('summary',labels[key]||key));
                for(const item of v){const p=element('dl');for(const [k,x] of Object.entries(item))p.append(element('dt',labels[k]||k),element('dd',value(k,x,item)));nested.append(p);}
                panel.append(nested);
            }else if(v&&typeof v==='object'){
                for(const [k,x] of Object.entries(v))dl.append(element('dt',labels[k]||k),element('dd',value(k,x,v)));
            }else dl.append(element('dt',labels[key]||key),element('dd',value(key,v,row)));
        }
        panel.append(dl);
    }
    parent.append(panel);
}
const tableColumns = {
    '업체':['name','id'],'상품':['name','sellerName','pack','unit','price','shipping','min_packs','region','active','id'],
    '창고':['name','zone','id'],'재고':['name','placeName','qty','unit','expires','blocked','lot'],
    '견적':['name','price','version','quoteState','supersedes','buyer','seller','until_day','id'],'거래':['id','name','buyerName','sellerName','qty','unit','price','shipping','state'],
    '출고':['id','ord','qty','received','lot'],'예약모집':['id','sku','target','capacity','deadline','delivery','state'],
    '대체안':['id','oldsku','newsku','allergens','state'],'정산원장':['ord','kind','amount','id'],
    '보험':['kind','expires','reference','id'],'거래처':['name','kind','contact','phone','address','terms','note'],
    '견적요청':['name','buyer','seller','spec','qty','unit','delivery','state','id'],
    '변경요청':['id','ord','kind','reason','qty','packs','state','resolution'],
    '가격협의':['quote','price','reason','state','response','id'],
    'PG 결제':['order','name','amount','refunded','state','id'],
    '승인 문서':['name','version','state','id']
};
function renderTables() {
    const opened=new Set([...$('tables').querySelectorAll('details[open]')].map(e=>e.dataset.key));
    $('tables').replaceChildren();
    for(const [key,columns] of Object.entries(tableColumns)){
        const records=data[key]||[];
        const details=element('details');details.dataset.key=key;details.open=opened.has(key);
        details.append(element('summary',key+' ('+records.length+')'));
        if(!records.length)details.append(element('p','등록 자료 없음','business-note'));
        else{
            table(details,key,records,columns.map(k=>[k,(k==='name'?({업체:'업체명',상품:'상품명',창고:'창고명',재고:'상품명',거래:'상품명',거래처:'거래처명',견적요청:'식재료명','승인 문서':'문서명'})[key]:null)||labels[k]||({oldsku:'기존 상품',newsku:'대체 상품',version:'버전'})[k]||k,(v,r)=>value(k,v,r)]));
            if(key==='거래')for(const r of records){
                const item=element('details');item.dataset.key=r.id;item.open=opened.has(r.id);item.append(element('summary',r.name+' · '+r.id));
                detailResult(item,'주문 당시 조건',r);details.append(item);
            }
            if(key==='거래처')for(const r of records)details.append(button(r.name+' 거래 이력',()=>{
                $('report-form').elements.namedItem('partner').value=r.partner;
                loadReport().catch(error);$('performance').scrollIntoView({behavior:'smooth'});
            }));
            if(key==='상품')for(const r of records.filter(r=>own(r,'seller')&&allowed('catalogEdit')))details.append(button(r.name+' 수정',()=>{startAction('catalogEdit',null,{sku:r.id});fill(r);}));
        }
        $('tables').append(details);
    }
}
function renderNotices() {
    $('unread').textContent=numbers(data.unread||0);
    $('notice-list').replaceChildren();
    for(const notice of data.notifications||[]){
        const card=element('article',null,'business-notice-item');
        card.append(element('p',(notice.isRead?'':'새 알림 · ')+notice.message));
        card.append(element('p',notice.ref+' · '+notice.at,'business-note'));
        if(activeOrder(notice.ref))card.append(button('관련 주문 보기',()=>{
            const row=activeOrder(notice.ref);$('result').replaceChildren();detailResult($('result'),'주문 상세',row);$('result').scrollIntoView({behavior:'smooth'});
        }));
        if(!notice.isRead)card.append(button('읽음 처리',async()=>{try{await mutate('readNotice',{id:notice.id});await refresh();}catch(e){error(e);}}));
        $('notice-list').append(card);
    }
    if(!(data.notifications||[]).length)$('notice-list').append(element('p','업무 알림이 없습니다.'));
}
async function refresh(initial=false) {
    if(loading||busy){queuedInitial=queuedInitial||initial;return;}
    loading=true;
    const version=revision;
    const requestedOrg=$('org').value;
    try{
        const orgs=await call('organizations',{});
        if(version!==revision)return;
        if(JSON.stringify(organizations)!==JSON.stringify(orgs)){
            let previous=$('org').value;
            if(!previous){
                try{previous=new URLSearchParams(location.search).get('org')||sessionStorage.getItem(orgStorage)||'';}catch{/* Storage can be disabled. */}
            }
            $('org').replaceChildren();
            for(const org of orgs)$('org').add(new Option(org.name+' · '+org.id+' · '+roles[org.role],org.id));
            if(orgs.some(r=>r.id===previous))$('org').value=previous;
        }
        organizations=orgs;
        const org=$('org').value;
        try{sessionStorage.setItem(orgStorage,org);}catch{/* Storage can be disabled. */}
        const next=org?await call('dashboard',{org}):{};
        if(requestedOrg && requestedOrg!==org && !initial){buildActions();draw();}
        if(org){
            const response=await api('/api/me/business-documents/list',{});
            next['승인 문서']=response.documents.filter(d=>['APPROVED','SENT'].includes(d.state));
        }
        if(version!==revision)return;
        data=next;
        if(initial){buildActions();draw();}
        syncSelects();
        const taskSnapshot=JSON.stringify([role(),$('perspective').value,data['거래'],data['변경요청'],data['견적요청'],data['견적'],data['가격협의']]);
        if(initial||taskSnapshot!==lastTaskSnapshot){renderTasks();lastTaskSnapshot=taskSnapshot;}
        renderNotices();
        const tableSnapshot=JSON.stringify(Object.keys(tableColumns).map(key=>data[key]));
        if(initial||tableSnapshot!==lastTableSnapshot){renderTables();lastTableSnapshot=tableSnapshot;}
        if(!openedLink){
            const linked=new URLSearchParams(location.search).get('order');
            const row=activeOrder(linked);
            if(row){$('result').replaceChildren();detailResult($('result'),'알림 관련 주문',row);openedLink=true;}
        }
        $('sync-status').textContent='자동 갱신 중 · '+new Date().toLocaleTimeString('ko-KR')+' 확인 · 5초 간격';
    }finally{
        loading=false;
        if(queuedInitial){queuedInitial=false;await refresh(true);}
    }
}
async function mutate(op,payload) {
    const body={...payload,org:$('org').value};
    const key=JSON.stringify([op,body]);
    if(lastRequest?.key!==key)lastRequest={key,id:crypto.randomUUID()};
    const result=await call(op,{...body,requestId:lastRequest.id});
    lastRequest=null;
    return result;
}
async function poll() {
    if(!document.hidden&&!busy){
        try{await refresh();}
        catch(e){$('sync-status').textContent='자동 갱신 연결 확인 필요 · '+e.message;}
    }
    timer=setTimeout(poll,5000);
}
async function loadReport() {
    const filter=Object.fromEntries(new FormData($('report-form')));
    const org=$('org').value;
    const result=await call('report',{...filter,org});
    if(org!==$('org').value)return;
    reportCsv=result.csv;reportFilter=filter;
    $('export-report').disabled=false;$('export-excel').disabled=false;
    $('report-result').replaceChildren();
    table($('report-result'),'기간 실적',result['집계'],[['구분','구분'],['주문건수','주문 건수'],['취소건수','취소 건수'],...['주문금액','검수금액','정산금액','PG정산예정금액','수수료','순결제금액'].map(k=>[k,k,money])]);
    table($('report-result'),'거래처·상품별 실적',result['거래처·상품별'],[['구분','구분'],['거래처','거래처'],['상품','상품'],['주문건수','주문 건수'],...['주문금액','검수금액','정산금액'].map(k=>[k,k,money])]);
    detailResult($('report-result'),'기간 예산',result['예산']);
    table($('report-result'),'거래 상세',result['내역'],[['주문번호','주문번호'],['구분','구분'],['거래처','거래처'],['상품','상품'],['상태','상태',v=>states[v]||v],...['주문금액','검수금액','정산금액'].map(k=>[k,k,money])]);
    $('report-result').append(element('p',result['기준'],'business-note'));
}
$('trade-title').textContent=({shop:'식재료 탐색·견적',partners:'거래처·상품 관리',orders:'구매·주문 관리',purchase:'발주·재고 관리',jobs:'정산·업무 대조'})[section]||'스마트 푸드 거래 업무';
$('trade-form').onsubmit=async event=>{
    event.preventDefault();
    if(busy||loading)return;
    const op=$('action').value,payload=Object.fromEntries(new FormData(event.currentTarget));
    if(!allowed(op))return;
    if(op==='deleteOrg'&&!window.confirm($('org').selectedOptions[0].text+' 업체를 삭제할까요?'))return;
    const selected=activeOrder(payload.id);
    const confirmation=selected?[selected.name,packaging(selected),'포장당 '+money(selected.price),'배송비 '+money(selected.shipping),'총 '+money(selected.qty*selected.price/selected.pack+selected.shipping),selected.id].join(' · '):'';
    if(['pay','settle','cancel','resolveClaim','recall'].includes(op)&&!window.confirm(confirmation+'\n'+actions[op][0]+'을 실행할까요?'))return;
    busy=true;$('execute').disabled=true;$('org').disabled=true;$('action').disabled=true;
    try{
        const result=await mutate(op,payload);
        $('result').replaceChildren();detailResult($('result'),actions[op][0]+' 결과',result);
        $('message').textContent='처리했습니다.';
        draw();
        busy=false;
        await refresh(true);
        if(op==='register'&&result.id){$('org').value=result.id;await refresh(true);}
    }catch(e){error(e);}
    finally{busy=false;$('execute').disabled=false;$('org').disabled=false;$('action').disabled=false;}
};
$('action').onchange=draw;
$('fields').addEventListener('input',()=>{dirty=true;formContext();});
$('fields').addEventListener('change',event=>{
    dirty=true;
    const op=$('action').value;
    if(op==='catalogEdit'&&event.target.name==='sku')fill((data['상품']||[]).find(r=>r.id===event.target.value)||{});
    if(op==='partner'&&event.target.name==='partner')fill((data['거래처']||[]).find(r=>r.partner===event.target.value)||{});
    if(op==='editOrder'&&event.target.name==='id'){
        const row=activeOrder(event.target.value);if(row)fill({packs:row.qty/row.pack});
    }
    syncSelects();formContext();
});
$('org').onchange=async()=>{
    revision++;
    try{lastRequest=null;await refresh(true);$('result').replaceChildren();$('report-result').replaceChildren();reportCsv='';reportFilter=null;$('export-report').disabled=true;$('export-excel').disabled=true;}
    catch(e){error(e);}
};
$('perspective').onchange=()=>{buildActions();draw();renderTasks();};
$('show-notices').onclick=()=>{
    $('notice-list').hidden=!$('notice-list').hidden;
    $('show-notices').textContent=$('notice-list').hidden?'알림 펼치기':'알림 접기';
    $('show-notices').setAttribute('aria-expanded',String(!$('notice-list').hidden));
};
$('report-form').onsubmit=e=>{e.preventDefault();loadReport().catch(error);};
$('export-report').onclick=()=>{
    const url=URL.createObjectURL(new Blob([reportCsv],{type:'text/csv;charset=utf-8'}));
    const link=element('a');link.href=url;link.download='SmartNF_거래실적.csv';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
};
$('export-excel').onclick=async()=>{
    if(!reportFilter)return;
    const org=$('org').value,button=$('export-excel');button.disabled=true;
    try{
        const result=await call('reportExcel',{...reportFilter,org});
        const bytes=Uint8Array.from(atob(result.content),c=>c.charCodeAt(0));
        const url=URL.createObjectURL(new Blob([bytes],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}));
        const link=element('a');link.href=url;link.download=result.filename;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
    }catch(e){error(e);}finally{button.disabled=false;}
};
const today=new Date(),start=new Date(today.getFullYear(),today.getMonth(),1);
const localDate=d=>[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
$('report-form').elements.namedItem('start').value=localDate(start);
$('report-form').elements.namedItem('end').value=localDate(today);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh().catch(error);});
window.addEventListener('pagehide',()=>clearTimeout(timer));
refresh(true).catch(error).finally(()=>{timer=setTimeout(poll,5000);});
