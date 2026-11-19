'use strict';
(()=>{
 const management={bp:'혈압 관리',diabetes:'혈당 관리',lipid:'혈중 지질 관리',weight:'체중 관리'},types={CHOICE:'오늘의 선택',SHOPPING:'장보기',DINING:'외식'};
 function validDate(d){return typeof d==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(d)&&d>='1900-01-01'&&d<='2100-12-31'&&!isNaN(Date.parse(d+'T00:00:00Z'))&&new Date(d+'T00:00:00Z').toISOString().slice(0,10)===d;}
 const foodId=id=>typeof id==='string'&&/^(rda_10_4|mfds_dishes|mfds_recipes):[A-Za-z0-9_-]{1,80}$/.test(id),str=(s,max)=>typeof s==='string'&&s.length<=max;
 function validateDay(day,date){
  if(!validDate(date)||day?.date!==date||!Number.isSafeInteger(day.revision)||day.revision<0||!Array.isArray(day.plans)||day.plans.length>20)throw Error('저장 계획 형식을 확인할 수 없습니다. MyPage에서 다시 확인하세요.');
  let count=0;for(const p of day.plans){const scope=p?.scope||'GENERAL',codes=p?.management||[];
   if(!Object.hasOwn(types,p?.type)||!['GENERAL','HEALTH'].includes(scope)||!Array.isArray(codes)||codes.length>4||new Set(codes).size!==codes.length||codes.some(k=>!Object.hasOwn(management,k))||scope==='HEALTH'&&!codes.length||scope==='GENERAL'&&codes.length||!str(p.note||'',500)||!Array.isArray(p.items)||p.items.length>30)throw Error('계획 구분을 확인할 수 없습니다.');
   const ids=new Set();for(const f of p.items){if(!f||!foodId(f.foodId)||ids.has(f.foodId)||!str(f.name,500)||!['dish','ingredient','review'].includes(f.kind)||!str(f.basis,200)||!str(f.version,100)||!str(f.source,500)||!str(f.recipeId,20)||!str(f.recipeVersion,100)||f.recipeId&&!/^\d{1,12}$/.test(f.recipeId)||!Array.isArray(f.ingredients)||f.ingredients.length>100||!f.recipeId&&f.ingredients.length)throw Error('저장 식품 자료를 확인할 수 없습니다.');ids.add(f.foodId);const indices=new Set();for(const i of f.ingredients){if(!i||!Number.isInteger(i.index)||i.index<0||indices.has(i.index)||!str(i.text,10000))throw Error('저장 재료 자료를 확인할 수 없습니다.');indices.add(i.index);}if(++count>100)throw Error('계획 항목이 너무 많습니다.');}
  }return day;
 }
 function checkedRecipe(food,data,candidates,tokens){if(!food.recipeId)return null;if(!data||food.recipeVersion!==data.source_sha256)throw Error('레시피 원문 버전이 바뀌었습니다. 저장한 재료는 그대로 두고 MyPage·영양정보에서 연결을 다시 확인하세요.');const r=candidates.find(x=>x.recipe_id===food.recipeId);if(!r||!Array.isArray(r.steps)||!r.steps.length)throw Error('현재 검토된 자료에서 연결한 레시피를 확인할 수 없습니다.');const raw=tokens(r);if(food.ingredients.some(i=>raw[i.index]!==i.text))throw Error('저장한 재료와 현재 원문이 다릅니다. 임의로 다시 연결하지 않습니다.');return r;}
 function title(p,index){return (p.scope==='HEALTH'?'건강관리 · '+p.management.map(k=>management[k]).join(' · '):'일반 계획')+' / '+types[p.type]+' · '+(index+1)+'번';}
 window.SmartNFLivingPlanData={validDate,validateDay,checkedRecipe,title,management,types};
})();
