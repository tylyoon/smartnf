export function compareQuote(quote,needed){
 const grams=Number(quote.grams),price=Number(quote.price),amount=Number(needed),regular=quote.regular===''||quote.regular==null?null:Number(quote.regular);
 if(!Number.isFinite(grams)||grams<=0||grams>1e7||!Number.isFinite(price)||price<1||price>1e8||!Number.isFinite(amount)||amount<=0||amount>1e7)throw Error('상품 용량·가격·필요량을 확인하세요.');
 if(regular!==null&&(!Number.isFinite(regular)||regular<price||regular>1e8))throw Error('정상가는 판매가 이상으로 입력하세요.');
 const packs=Math.ceil(amount/grams);return {...quote,grams,price,regular,packs,unit:price/grams*100,total:packs*price,surplus:packs*grams-amount,discount:regular!==null&&regular>price};
}
export function safeSellerURL(raw){if(!raw)return '';const url=new URL(raw);if(url.protocol!=='https:'||url.username||url.password)throw Error('판매처 주소는 계정 정보가 없는 https 주소로 입력하세요.');return url.href;}
