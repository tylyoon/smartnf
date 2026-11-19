import {purchaseAmounts} from './product-purchase.js?actions267';
export function purchaseCost(q,needed){
 const a=purchaseAmounts(needed,q.grams,Math.ceil(Number(needed)/Number(q.grams)),q.price,q.quantityUnit||'g');
 const known=q.shipping!==''&&q.shipping!==undefined&&q.shipping!==null;
 const shipping=known?Number(q.shipping):null;
 if(known&&(!Number.isFinite(shipping)||shipping<0||shipping>1e7))throw Error('배송비를 확인하세요. 미확인이면 비워 두세요.');
 const threshold=q.freeFrom===''||q.freeFrom==null?null:Number(q.freeFrom);
 if(threshold!==null&&(!Number.isFinite(threshold)||threshold<=0||threshold>1e8))throw Error('무료배송 기준금액을 확인하세요.');
 const fee=shipping===null?null:(threshold!==null&&a.total>=threshold?0:shipping);
 const conditional=q.conditional===''||q.conditional==null?null:Number(q.conditional);
 if(conditional!==null&&(!Number.isFinite(conditional)||conditional<=0||conditional>1e8||!q.conditions?.trim()))throw Error('조건부 가격과 쿠폰·카드 조건을 함께 입력하세요.');
 return {...q,...a,packs:Math.ceil(a.needed/Number(q.grams)),shippingFee:fee,totalWithShipping:fee===null?null:a.total+fee,conditionalTotal:conditional===null?null:conditional*Math.ceil(a.needed/Number(q.grams)),discount:conditional!==null||Number(q.regular)>Number(q.price)};
}
export function totalOrder(a,b){return (a.totalWithShipping??Infinity)-(b.totalWithShipping??Infinity)||a.total-b.total;}
export function referenceKey(r){return [r.provider,r.name,r.surveyDate].join('|');}
