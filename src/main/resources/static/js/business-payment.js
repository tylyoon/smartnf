import {api} from './food-studio-core.js';
import {element,money,packaging,states} from './business-format.js';

const get=id=>document.getElementById(id);
const query=new URLSearchParams(location.search);
const order=query.get('order'),org=query.get('org');
const callback={orderId:query.get('orderId'),paymentKey:query.get('paymentKey'),amount:query.get('amount')};
if(callback.paymentKey)history.replaceState(null,'',location.pathname+'?order='+encodeURIComponent(order||'')+'&org='+encodeURIComponent(org||''));
get('back').href='/preview/business?org='+encodeURIComponent(org||'')+'&order='+encodeURIComponent(order||'');
let payment,configuration,busy=false,windowOpen=false;
const displayStates={PREPARED:'PG 결제 준비',CONFIRMING:'PG 승인 확인 중',PAID:'PG 테스트 결제 완료',REFUNDING:'PG 환불 확인 중',REFUNDED:'PG 환불 완료',CANCELLED:'PG 취소 완료',RELEASED:'결제 준비 해제',FAILED:'승인 실패·예약 해제',REVIEW:'PG 내역 확인 필요'};
async function call(action,body={}) {
    const result=await api('/api/me/business-payments/'+action,{id:order,org,...body});
    if(result.error)throw Error(result.error);
    return result;
}
function render() {
    get('payment-summary').replaceChildren();
    if(!payment)return;
    get('payment-summary').append(element('h3',payment.name),element('p',payment.order,'business-note'));
    const prices=element('div',null,'business-prices');
    for(const [title,amount] of [['포장당 견적가',payment.price],['상품금액',payment.amount-payment.shipping],['배송비',payment.shipping],['총 결제금액',payment.amount]]){
        const box=element('div',null,'business-price');
        box.append(element('span',title),element('strong',money(amount)));prices.append(box);
    }
    get('payment-summary').append(element('p',packaging(payment)),prices);
    get('payment-summary').append(element('p','PG 환불 확인금액 '+money(payment.refunded)+' · '+(displayStates[payment.state]||payment.state)));
    get('payment-summary').append(element('p','주문 상태 '+(states[payment.orderState]||payment.orderState),'business-note'));
    get('pg-pay').disabled=busy||windowOpen||!configuration?.configured||payment.state!=='PREPARED';
    get('pg-sync').disabled=busy||!configuration?.configured||['FAILED','RELEASED'].includes(payment.state);
    get('pg-release').disabled=busy||windowOpen||payment.state!=='PREPARED';
    get('pg-cancel').disabled=busy||!payment.captured||payment.orderState!=='PAID'||payment.state==='REVIEW';
    get('pg-refund').disabled=busy||!payment.captured||!payment.refundReady||payment.refundDue<=0||payment.state==='REVIEW';
}
async function operate(action,body={}) {
    if(busy)return;
    busy=true;render();
    try{
        payment=await call(action,body);render();
        get('pg-status').textContent=(displayStates[payment.state]||payment['처리']||'PG 결과 확인 완료')+(payment.message?' · '+payment.message:'');
    }catch(e){get('pg-status').textContent=e.message;}
    finally{busy=false;render();}
}
async function loadSdk() {
    if(window.TossPayments)return;
    await new Promise((resolve,reject)=>{
        const script=document.createElement('script');
        script.src='https://js.tosspayments.com/v2/standard';
        script.onload=resolve;script.onerror=()=>reject(Error('토스 결제창 스크립트를 불러오지 못했습니다.'));
        document.head.append(script);
    });
}
get('pg-pay').onclick=async()=>{
    if(busy)return;
    busy=true;render();
    try{
        await loadSdk();
        const widgets=window.TossPayments(configuration.clientKey).widgets({customerKey:payment.customerKey});
        await widgets.setAmount({currency:'KRW',value:payment.amount});
        const windowUi=await widgets.renderPaymentWindow({orderName:payment.name.slice(0,100)});
        windowOpen=true;
        windowUi.on('cancel',()=>{windowOpen=false;windowUi.destroy();render();get('pg-status').textContent='결제창을 닫았습니다. 다시 열거나 결제 준비·예약을 해제할 수 있습니다.';});
        windowUi.on('paymentRequest',async({paymentMethod})=>{
            try{
                if(paymentMethod.method!=='CARD')throw Error('이번 연동 검증은 카드 경로로 진행하세요.');
                const base=location.origin+location.pathname+'?order='+encodeURIComponent(order)+'&org='+encodeURIComponent(org);
                await widgets.requestPayment({orderId:payment.orderId,orderName:payment.name.slice(0,100),successUrl:base+'&result=success',failUrl:base+'&result=fail'});
            }catch(e){get('pg-status').textContent=e.message;}
        });
    }catch(e){get('pg-status').textContent=e.message;}
    finally{busy=false;render();}
};
get('pg-sync').onclick=()=>operate('sync');
get('pg-release').onclick=async()=>{
    if(!window.confirm(payment.name+' · 결제 준비와 재고 예약을 해제할까요?'))return;
    await operate('release');
    if(!busy){try{payment=await call('status');render();}catch{/* The displayed result remains available. */}}
};
for(const [id,action] of [['pg-cancel','cancel'],['pg-refund','refund']]){
    get(id).onclick=()=>{
        const amount=action==='cancel'?payment.amount-payment.refunded:payment.refundDue;
        if(window.confirm(payment.name+' · '+money(amount)+' PG 테스트 환불을 요청할까요?'))operate(action);
    };
}
(async()=>{
    if(!order||!org)throw Error('거래 업무에서 결제할 주문을 선택하세요.');
    configuration=await call('config');
    if(!configuration.configured){get('pg-status').textContent=configuration.message;return;}
    // Resume the durable attempt after callbacks, refreshes or uncertain responses.
    try{payment=await call('status');}
    catch{payment=await call('prepare');}
    if(['FAILED','RELEASED'].includes(payment.state))payment=await call('prepare');
    render();
    if(callback.paymentKey){
        await operate('confirm',callback);
    }else if(query.get('result')==='fail'){
        get('pg-status').textContent='PG 인증이 완료되지 않았습니다. 결제 상태를 확인하거나 준비를 해제하세요.';
    }else{
        get('pg-status').textContent=displayStates[payment.state]||configuration.message;
    }
})().catch(e=>{get('pg-status').textContent=e.message;});
