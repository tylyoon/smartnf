// Shared arithmetic: survey budget is not a checkout total.
export const won=n=>Math.round(Number(n)).toLocaleString('ko-KR')+'원';
export function koreaTime(value){if(!value)return '확인 불가';const date=new Date(value);if(!Number.isFinite(date.getTime()))return '확인 불가';return new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false}).format(date)+' (한국시간)';}
export function chooseReference(result){
 const valid=(result?.references||[]).filter(r=>['KAMIS','CHAMPRICE'].includes(r.provider)&&!r.oldData&&r.estimated!=null&&Number.isFinite(Number(r.estimated))&&Number(r.estimated)>0&&Number(r.surveyAmount??r.surveyGrams)>0);
 // Prefer current mass-convertible KAMIS; never choose the cheapest grade.
 valid.sort((a,b)=>(a.provider==='KAMIS'?0:1)-(b.provider==='KAMIS'?0:1)||String(b.surveyDate).localeCompare(String(a.surveyDate))||(a.name.includes('상품')?0:1)-(b.name.includes('상품')?0:1)||a.name.localeCompare(b.name,'ko'));
 if(valid.length)return valid[0];
 const sales=(result?.market||[]).filter(p=>!p.stale&&(p.priceVerified===true||p.verificationStatus==='VALIDATED')&&Number(p.price)>0&&Number(p.surveyAmount??p.surveyGrams)>0&&Date.now()-Date.parse(p.checkedAt)<=86400000&&Date.parse(p.checkedAt)<=Date.now()+300000);
 sales.sort((a,b)=>String(b.checkedAt).localeCompare(String(a.checkedAt))||String(a.provider).localeCompare(String(b.provider))||a.name.localeCompare(b.name));
 return sales.length?saleReference(sales[0],result.query||'',result.requiredAmount,result.unit):null;
}
export function saleReference(p,query,requiredAmount,requiredUnit){
 const amount=Number(p.surveyAmount??p.surveyGrams),needed=Number(requiredAmount),price=Number(p.price),unit=p.unit||'g',packPolicy=/후추|흑후추|백후추/.test(query),same=unit===requiredUnit&&needed>0;
 const byNeed=same&&!packPolicy&&Number(p.referenceEstimated??p.estimated)>0;
 const packs=same&&packPolicy?Math.ceil(needed/amount):1;
 const label={g:'g',ml:'mL',ea:'개',pack:'팩',bag:'봉',bottle:'병'}[unit]||unit;
 return {...p,provider:'판매가 참고 · '+p.provider,estimated:byNeed?Number(p.referenceEstimated??p.estimated):price*packs,surveyAmount:amount,saleBasis:true,referenceBasis:byNeed?'NEED':'PACKAGE',quantityNote:byNeed?needed+label+' 필요량 기준':packs+(p.name.includes('병')?'병':'포장(개)')+' 기준 · '+amount+label+'/포장',conditions:p.conditions||'배송비·쿠폰 조건 별도 확인'};
}
export function confirmedChoiceReference(choice,item){
 if(!choice||choice.stale||choice.ingredientName!==item.name||!String(choice.productId||'').startsWith('k:')||!String(choice.sourceDetails||'').includes('사용자 선택'))return null;
 const age=Date.now()-Date.parse(choice.checkedAt),amount=Number(choice.packageAmount??choice.packGrams),price=Number(choice.price);if(!Number.isFinite(age)||age< -300000||age>86400000||!(amount>0&&price>0))return null;
 const key=String(item.name).split(',')[0].trim().replace(/\s/g,''),name=String(choice.productName).replace(/\s/g,'');if(/케이크|케익|쿠키|빵|초콜릿|치즈|요구르트|요거트|아몬드|참치/.test(name)&&!/케이크|빵|치즈|요거트/.test(key))return null;if(/^(소금|정제염)$/.test(key)&&/맛소금|꽃소금|구운소금|허브/.test(name))return null;const aliases={올리브오일:'올리브유',달걀:'계란'};if(!name.includes(key)&&!name.includes(aliases[key]||key))return null;
 return saleReference({provider:'사용자 확인 상품',name:choice.productName,merchant:choice.merchant,price,surveyAmount:amount,unit:choice.quantityUnit||'g',checkedAt:choice.checkedAt,sourceUrl:choice.url,conditions:choice.sourceDetails,referenceEstimated:price*Number(choice.requiredAmount??item.grams)/amount},item.name,choice.requiredAmount??item.grams,choice.quantityUnit||'g');
}
export function budgetTotal(refs){const found=refs.filter(Boolean);return {count:found.length,total:found.reduce((n,r)=>n+Math.round(Number(r.estimated)),0),missing:refs.length-found.length};}
export function choiceTotal(choices,list){const seen=new Set();let total=0,count=0,shortage=0;for(const c of choices||[]){const i=Number(c.entryNo),item=list.items[i],packs=Number(c.packs),price=Number(c.price),weight=Number(c.packageAmount??c.packGrams);if(c.stale||!Number.isInteger(i)||!item||seen.has(i)||!Number.isInteger(packs)||packs<=0||!Number.isFinite(price)||price<=0||!Number.isFinite(weight)||weight<=0)continue;seen.add(i);total+=Math.round(price*packs);count++;if(weight*packs<Number(c.requiredAmount??item.grams))shortage++;}return {total,count,shortage};}
let current=null;
export function setReference(name,grams,result,unit='g'){current={name,unit,grams:Number(grams),reference:chooseReference({...result,query:name,requiredAmount:Number(grams),unit})};}
export function referenceFor(name,grams,unit='g'){return current?.name===name&&current.unit===unit&&current.grams===Number(grams)?current.reference:null;}
export function compareBudget(reference,needed,packGrams,price,packs){
 needed=Number(needed);packGrams=Number(packGrams);price=Number(price);packs=Number(packs);
 if(!reference||![needed,packGrams,price,packs].every(n=>Number.isFinite(n)&&n>0)||!Number.isInteger(packs))return null;
 const estimate=Number(reference.estimated),equivalent=price*needed/packGrams,total=price*packs,difference=equivalent-estimate;
 return {estimate,equivalent,total,difference,percent:difference/estimate*100,bought:packGrams*packs,left:Math.max(0,packGrams*packs-needed),shortage:Math.max(0,needed-packGrams*packs)};
}
export function comparisonText(name,needed,packGrams,price,packs,productName='',unit='g'){const primary=String(name).split(',')[0].trim();if(productName&&primary&&!String(productName).replace(/\s/g,'').includes(primary.replace(/\s/g,'')))return '상품명과 선택 재료명이 달라 조사 예산 대비 비교를 보류합니다. 같은 식재료인지 확인하세요.';const r=referenceFor(name,needed,unit);if(r?.referenceBasis==='PACKAGE')return '판매가 기반 참고금액 '+won(r.estimated)+' · '+r.quantityNote+' · 필요량 비례 예산과 기준이 달라 차액 비교는 보류합니다. 배송비·쿠폰 별도.';const c=compareBudget(r,needed,packGrams,price,packs);if(!c)return '비교 가능한 최신 조사가격이 없어 예상 비용 대비 차이를 계산하지 않습니다.';return (r.saleBasis?'필요량 판매상품 기준 예산 ':'필요량 조사 예산 ')+won(c.estimate)+' ↔ 이 상품의 필요량 환산 '+won(c.equivalent)+' · 적용 예산 대비 '+(Math.abs(c.difference)<0.5?'비슷함':won(Math.abs(c.difference))+' ('+Math.abs(c.percent).toFixed(1)+'%) '+(c.difference<0?'낮음':'높음'))+' · 포장 구매 상품금액 '+won(c.total)+' (배송비 미포함). '+r.provider+' · '+(r.saleBasis?koreaTime(r.checkedAt):r.surveyDate)+' · '+r.name+' 기준. 같은 종류·품종·등급·손질 상태인지 판매처에서 확인하세요.';}

// Failure diagnostics stay separate from a price; missing never becomes zero.
export function referenceReason(result){
 if(result?.lookupFailed)return '조회 실패 · 다시 확인해 주세요';
 const refs=result?.references||[];
 if(!refs.length)return result?.sourceErrors?.length?'가격 자료 파일 읽기 실패 · '+result.sourceErrors.join(', '):'재료명에 맞는 조사 자료 없음';
 if(refs.every(r=>r.oldData))return '조사 자료 유효기간 경과';
 if(refs.filter(r=>!r.oldData).every(r=>!(Number(r.surveyAmount??r.surveyGrams)>0)))return '조사단위가 개·mL 등으로 g 환산 불가';
 return '조사가격 단위·종류와 필요량이 일치하지 않음 · 확인한 다른 단위가 있으면 적용 가능';
}
export function selectedBudget(choice,item,now=Date.now()){
 if(!choice||choice.stale||choice.ingredientName!==item.name||Number(choice.requiredGrams)!==Number(item.grams))return null;
 const checked=Date.parse(choice.checkedAt),age=now-checked;
 // Stored flyer validity is not a current offer; recheck before reusing it as budget.
 if(!Number.isFinite(checked)||age<0||age>24*60*60*1000||String(choice.sourceDetails||'').includes('FLYER'))return null;
 const price=Number(choice.price),weight=Number(choice.packGrams),grams=Number(item.grams);
 if(![price,weight,grams].every(n=>Number.isFinite(n)&&n>0))return null;
 return {provider:'선택 판매상품',name:choice.productName,merchant:choice.merchant,surveyGrams:weight,estimated:price*grams/weight,checkedAt:choice.checkedAt,saleBasis:true};
}
