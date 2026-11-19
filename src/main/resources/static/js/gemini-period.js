export function createPeriodApi(accountKey,doc=document,fetcher=fetch){
 return async(url,data)=>{
  if(!['/api/me/meal-period/generate','/api/me/meal-additions/recommend'].includes(url))throw Error('식단 요청 경로를 확인해 주세요.');
  const owner=accountKey(),header=doc.querySelector('meta[name="_csrf_header"]')?.content,token=doc.querySelector('meta[name="_csrf"]')?.content;
  if(!owner||owner==='anonymous'||!header||!token)throw Error('로그인 상태를 확인하고 화면을 다시 열어 주세요.');
  const response=await fetcher(url,{method:'POST',credentials:'same-origin',cache:'no-store',headers:{Accept:'application/json','Content-Type':'application/json','X-SmartNF-Account':owner,[header]:token},body:JSON.stringify(data),signal:AbortSignal.timeout(90000)});
  if(owner!==accountKey())throw Error('계정이 변경되어 결과를 적용하지 않았습니다.');
  if(response.redirected||[401,403].includes(response.status)){const e=Error('로그인 상태를 확인하고 화면을 다시 열어 주세요.');e.status=response.status;throw e;}
  let body;try{body=await response.json();}catch{const e=Error('식단 서버의 응답 형식을 확인하지 못했습니다.');e.status=response.status;throw e;}
  if(!response.ok){const e=Error(typeof body.message==='string'?body.message:'식단 요청을 처리하지 못했습니다.');e.status=response.status;e.terminal=body.terminal===true;throw e;}
  return body;
 };
}
const mealsAllowed=['breakfast','lunch','dinner'];
export function periodCriteria(input){
 const personal=Object.fromEntries(Object.entries(input.personal||{}).filter(([,v])=>Number.isFinite(v)));
 return {general:Boolean(input.general),special:Boolean(input.special),lowerSodium:Boolean(input.lowerSodium),fiber:Boolean(input.fiber),energy:input.energy??null,sodium:input.sodium??null,targetSource:input.targetSource||'',excluded:(input.excluded||[]).map(x=>x.trim()).filter(Boolean),personal};
}
export function jobSignature(first,days,meals,criteria,usePreferences){return JSON.stringify({first,days,meals,criteria,usePreferences});}
export function verifyBlock(value,first,days,meals){
 if(value?.provider!=='GEMINI'||!Array.isArray(value.slots)||value.slots.length!==days*meals.length)throw Error('Gemini 식단 응답의 기간을 확인하지 못했습니다.');
 const seen=new Set();for(const slot of value.slots){const offset=(Date.parse(slot.date+'T12:00:00Z')-Date.parse(first+'T12:00:00Z'))/86400000;
  if(!Number.isInteger(offset)||offset<0||offset>=days||!meals.includes(slot.meal)||seen.has(slot.date+':'+slot.meal)||!Array.isArray(slot.recommended)||slot.recommended.length<2||slot.recommended.length>4)throw Error('Gemini 식단의 날짜·끼니가 올바르지 않습니다.');seen.add(slot.date+':'+slot.meal);
  for(const p of slot.recommended)if(typeof p.name!=='string'||!p.name||p.servings!==1||!Array.isArray(p.ingredients)||!p.ingredients.length||p.ingredients.some(i=>!Number.isFinite(i.grams)||i.grams<=0||typeof i.text!=='string'))throw Error('Gemini 식단의 재료·분량을 확인하지 못했습니다.');
 }
 return value;
}
// A failed month resumes completed blocks; a successful new click starts a new recommendation.
export async function generateGeminiPeriod({first,days,meals,criteria,usePreferences=false,job,api,addDays,onProgress=()=>{},onJob=()=>{},isCurrent=()=>true,uuid=()=>crypto.randomUUID()}){
 if(!Number.isInteger(days)||days<1||days>31||!meals.length||new Set(meals).size!==meals.length||meals.some(m=>!mealsAllowed.includes(m)))throw Error('기간과 끼니를 확인해 주세요.');
 const signature=jobSignature(first,days,meals,criteria,usePreferences);
 if(!job||job.signature!==signature||job.complete)job={signature,complete:false,blocks:Array.from({length:Math.ceil(days/7)},(_,i)=>({first:addDays(first,i*7),days:Math.min(7,days-i*7),requestId:uuid(),state:'new'}))};
 onJob(job);
 for(let i=0;i<job.blocks.length;i++){
  if(!isCurrent())throw Error('계정 또는 추천 조건이 변경되어 결과를 적용하지 않았습니다.');
  const block=job.blocks[i];if(block.result){verifyBlock(block.result,block.first,block.days,meals);continue;}
  if(block.state==='failed')block.requestId=uuid();
  const previousNames=[...new Set(job.blocks.slice(0,i).flatMap(b=>b.result?.slots.flatMap(s=>s.recommended.map(p=>p.name))||[]))].slice(-100);
  block.state='pending';onJob(job);onProgress(i+1,job.blocks.length);
  try{
   const result=await api('/api/me/meal-period/generate',{requestId:block.requestId,first:block.first,days:block.days,meals,criteria,usePreferences,consent:true,previousNames});
   if(!isCurrent())throw Error('계정이 변경되어 결과를 적용하지 않았습니다.');
   block.result=verifyBlock(result,block.first,block.days,meals);block.state='done';onJob(job);
  }catch(error){
   // A network/5xx/processing outcome may be uncertain: retain the UUID for a safe replay.
   block.state=error.terminal||error.status&&![409,502,503,504].includes(error.status)?'failed':'uncertain';
   onJob(job);error.message=`${i+1}/${job.blocks.length}구간 추천을 완료하지 못했습니다. ${error.message}${error.message.includes('기존 식단은 유지됩니다.')?'':' 기존 식단은 유지됩니다.'}`;throw error;
  }
 }
 const slots=job.blocks.flatMap(b=>b.result.slots);job.complete=true;onJob(job);
 return {slots,criteria,notes:[...new Set(job.blocks.flatMap(b=>b.result.notes||[]))],provider:'GEMINI',model:job.blocks[0].result.model,fullDay:meals.length===3};
}
