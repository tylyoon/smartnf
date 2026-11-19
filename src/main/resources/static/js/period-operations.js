export function selectedMeals(scope){return scope==='all'?['breakfast','lunch','dinner']:String(scope||'').split(',').filter(m=>['breakfast','lunch','dinner'].includes(m));}
export function shoppingItems(period,partsForSlot,catalog,last){
 const totals=new Map();let missing=0;
 for(const slot of period.filter(s=>s.date<=last))for(const part of partsForSlot(slot))for(const item of part.ingredients){
  const measures=new Map((item.quantities||[]).filter(q=>Number(q.amount)>0).map(q=>[q.unit,Number(q.amount)]));if(Number.isFinite(item.grams)&&item.grams>0)measures.set('g',item.grams);
  if(!measures.size){missing++;continue;}
  const food=catalog.get(item.foodId),name=food?.name||item.name||item.text||'미확인 재료',key=item.foodId||'name:'+name;
  const entry=totals.get(key)||{id:key,name,grams:null,unlinked:!food,foodId:item.foodId||'',parts:[],count:0,totals:new Map()};entry.count++;entry.parts.push([...measures]);
  for(const [unit,amount] of measures){const m=entry.totals.get(unit)||{amount:0,count:0};m.amount+=amount;m.count++;entry.totals.set(unit,m);}totals.set(key,entry);
 }
 const items=[];for(const entry of totals.values()){
  const quantities=[...entry.totals].filter(([unit,m])=>m.count===entry.count).map(([unit,m])=>({unit,amount:m.amount,evidence:'레시피 원문·확인 수량 합산'}));
  if(!quantities.length){
   const groups=new Map();for(const values of entry.parts){const [unit,amount]=values.find(([u])=>u==='g')||values[0];groups.set(unit,(groups.get(unit)||0)+amount);}
   for(const [unit,amount]of groups)items.push({id:entry.id+':unit:'+unit,foodId:entry.foodId,name:entry.name,grams:unit==='g'?amount:null,unlinked:entry.unlinked,quantities:[{unit,amount,evidence:'서로 환산되지 않은 원문 수량 · 단위별 합산'}]});continue;
  }
  items.push({id:entry.id,foodId:entry.foodId,name:entry.name,grams:quantities.find(q=>q.unit==='g')?.amount??null,unlinked:entry.unlinked,quantities});
 }return {items,missing};
}
export function mergePeriodPlans(existing,additions,meals,planInput){
 const result=[...existing.filter(p=>!p.simulation||!meals.includes(p.simulation.input?.meal)).map(planInput),...additions];
 if(result.length>20)throw Error('이 날짜의 기존 계획과 합쳐 20개를 초과합니다. MyPage에서 기존 계획을 정리한 뒤 다시 저장해 주세요.');
 return result;
}
const signature=input=>JSON.stringify({meal:input.meal,dishes:input.dishes.map(d=>({name:d.name,servings:Number(d.servings),ingredients:d.ingredients.map(i=>({foodId:i.foodId,grams:Number(i.grams),...(i.quantities?.length?{quantities:i.quantities.map(q=>({...q,amount:Number(q.amount)})).sort((a,b)=>a.unit.localeCompare(b.unit))}:{})}))}))});
export function verifySavedDay(day,body){
 if(!day||day.date!==body.date||!Array.isArray(day.plans)||day.plans.length!==body.plans.length)throw Error(body.date+' 저장 후 조회 결과가 일치하지 않습니다. 같은 저장 버튼으로 결과를 다시 확인해 주세요.');
 const actual=day.plans.filter(p=>p.simulation).map(p=>signature(p.simulation.input));
 for(const p of body.plans.filter(p=>p.simulation))if(!actual.includes(signature(p.simulation)))throw Error(body.date+' 저장한 음식·분량을 확인하지 못했습니다. 같은 저장 버튼으로 다시 확인해 주세요.');
}
