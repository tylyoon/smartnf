import {estimate} from './meal-plan-state.js';
const labels={breakfast:'아침',lunch:'점심',dinner:'저녁',snack:'간식'};
export function planInput(plan){return {type:plan.type,scope:plan.scope||'GENERAL',management:plan.management||[],restaurant:plan.restaurant||'',time:plan.time||'',note:plan.note||'',items:plan.items.map(f=>({foodId:f.foodId,recipeId:f.recipeId||'',recipeVersion:f.recipeVersion||'',ingredientIndices:f.ingredients.map(i=>i.index)})),simulation:plan.simulation?.input||null};}
export function toSimulationPlan(slot,parts){
 if(!labels[slot.meal]||!parts.length)throw Error('저장할 끼니와 요리를 확인해 주세요.');let count=0;
 const dishes=parts.map(part=>({name:part.name,servings:Number(Number(part.servings||1).toFixed(3)),ingredients:part.ingredients.map(item=>{
  if(++count>600||!item.foodId||!Number.isFinite(item.grams)||item.grams<=0||item.grams>50000)throw Error(`${parts.find(p=>p.ingredients.includes(item))?.name||'요리'} · ${item.name||item.text||'재료'}의 영양 연결·분량을 확인해 주세요.`);
  const grams=Number(item.grams.toFixed(6));if(grams<=0)throw Error('너무 작은 분량입니다. 먹을 양을 다시 확인해 주세요.');return {foodId:item.foodId,grams,...(item.quantities?.some(q=>q.unit!=='g')?{quantities:item.quantities.filter(q=>q.unit!=='g').map(q=>({...q,amount:Number(Number(q.amount).toFixed(3))}))}:{})};
 })}));
 return {type:'CHOICE',scope:'GENERAL',management:[],note:`[식단 계획 · ${labels[slot.meal]}] ${parts.map(p=>p.name).join(' + ').slice(0,420)}`,items:[],simulation:{meal:slot.meal,dishes}};
}
export function snapshotAnalysis(snapshots,keys){
 const values={},coverage={},aiCoverage={};for(const key of keys){let known=false,sum=0;coverage[key]=0;aiCoverage[key]=0;
  for(const s of snapshots){if(Number.isFinite(s.nutrients[key])){sum+=s.nutrients[key];known=true;}coverage[key]+=s.coverage[key]||0;aiCoverage[key]+=s.aiCoverage[key]||0;}values[key]=known?sum:null;
 }return {values,coverage,aiCoverage,total:snapshots.reduce((n,s)=>n+s.total,0)};
}
export function compareSavedWeek(period,baseline,partsForSlot,catalog,keys){
 const previous={values:{},coverage:{},aiCoverage:{},totalByNutrient:{}},current={values:{},coverage:{},aiCoverage:{},totalByNutrient:{}},notes=[];let planUsed=false,actualUsed=false;
 for(const key of keys){const pairs=[];
  for(const slot of period){const entry=baseline.get(`${slot.date}:${slot.meal}`),parts=partsForSlot(slot);if(!entry||!parts.length)continue;
   const old=entry.kind==='PLAN'?snapshotAnalysis(entry.snapshots,keys):estimate([{ingredients:entry.ingredients}],catalog,keys),next=estimate(parts,catalog,keys);
   if(!Number.isFinite(old.values[key])||!Number.isFinite(next.values[key]))continue;pairs.push({old,next,date:slot.date,kind:entry.kind});if(entry.kind==='PLAN')planUsed=true;else actualUsed=true;
  }
  const days=new Set(pairs.map(p=>p.date)).size;
  for(const [target,field]of [[previous,'old'],[current,'next']]){target.values[key]=days?pairs.reduce((n,p)=>n+p[field].values[key],0)/days:null;target.coverage[key]=pairs.reduce((n,p)=>n+p[field].coverage[key],0);target.aiCoverage[key]=pairs.reduce((n,p)=>n+(p[field].aiCoverage[key]||0),0);target.totalByNutrient[key]=pairs.reduce((n,p)=>n+p[field].total,0);}
  if(days)notes.push(`${key}: ${days}일 ${pairs.length}끼 기준`);
 }
 previous.name=planUsed?(actualUsed?'전주 기록·계획 · 하루 평균':'전주 저장 계획 · 하루 평균 (실제 섭취 아님)'):'전주 확인한 식사 · 하루 평균';current.name='같은 끼니의 추천안 · 하루 평균';
 return {rows:[previous,current],notes,planUsed};
}
