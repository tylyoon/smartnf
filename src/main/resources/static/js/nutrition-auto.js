import {api,accountKey,normalizeName,nutrients} from './food-studio-core.js';
const status=document.getElementById('nutrition-auto-status');
export const automaticNutritionEnabled=()=>{try{return !!accountKey()&&sessionStorage.getItem(`smartnf.nutrition-auto-consent.v2:${accountKey()}`)==='yes';}catch{return false;}};
window.addEventListener('smartnf-nutrition-authorized',()=>window.dispatchEvent(new Event('smartnf-auto-nutrition-changed')));
let queue=Promise.resolve();const requests=new Map();
const ingredientName=s=>String(s||'').replace(/\s*\d+(?:\.\d+)?\s*(?:g|ml)$/i,'').trim();
const aliases=s=>{const n=normalizeName(s),names=new Set(['모짜렐라치즈','모차렐라치즈','치즈, 모차렐라','치즈, 모짜렐라'].map(normalizeName));return names.has(n)?names:new Set([n]);};
const usable=e=>['USER_CONFIRMED','AUTO_APPLIED'].includes(e.status);
const asFood=e=>({id:e.id,name:e.name,basis:'100g',source:'AI 추정 자료',version:`${e.model} · ${e.createdAt}`,nutrients:e.nutrients,ai:true,aiKeys:e.aiKeys,referenceFoodId:e.referenceFoodId});
export function completeNutrition(items,catalog,current=()=>true,options={}){
 const owner=accountKey();
 const job=async()=>{
  const valid=()=>current()&&accountKey()===owner;
  const result={reused:0,requested:0,applied:0,issues:[]};
  if(!valid())return result;
  for(const item of items)if(!item.foodId){const names=aliases(item.name||ingredientName(item.text));const publicMatches=[...catalog.values()].filter(f=>!f.ai&&names.has(normalizeName(f.name)));if(publicMatches.length===1){item.foodId=publicMatches[0].id;item.matchStatus='exact';}}
  const eligible=items.filter(item=>{const f=catalog.get(item.foodId);return !f||f.ai||Object.keys(nutrients).some(k=>f.nutrients[k]==null);});
  if(!eligible.length)return result;
  let saved;
  try{saved=await api('/api/me/ai-nutrition',undefined,AbortSignal.timeout(12000));if(!Array.isArray(saved))throw Error('AI 자료 목록 형식 오류');}
  catch(error){result.issues.push({message:'저장된 AI 영양 자료 조회 실패: '+error.message});if(status)status.textContent=result.issues[0].message;return result;}
  if(!valid())return result;
  const groups=new Map();
  for(const item of eligible){
   const food=catalog.get(item.foodId),name=food?.name||item.name||(item.text||'').replace(/\s*\d+(?:\.\d+)?\s*(?:g|ml)$/i,'').trim();
   const ref=food?.ai?(food.referenceFoodId||''):(item.foodId?.startsWith('ai:')?'':item.foodId||'');
   const key=JSON.stringify([normalizeName(name),ref]);if(!groups.has(key))groups.set(key,{name,ref,items:[]});groups.get(key).items.push({item,expected:item.foodId});
  }
  for(const [fingerprint,group]of groups){
   if(!valid())break;
   const report=message=>result.issues.push({name:group.name,message});
   if(status)status.textContent=`영양 DB·AI 자료 확인 중 · ${result.applied}/${groups.size}종`;
   try{
    const direct=saved.find(e=>group.items.some(({expected})=>expected===e.id));
    const candidates=saved.filter(e=>(e.referenceFoodId||'')===group.ref&&(group.ref||normalizeName(e.name)===normalizeName(group.name)));
    let e=direct||candidates.find(usable)||candidates.find(e=>e.status==='UNREVIEWED')||candidates[0];
    if(e?.status==='EXCLUDED'){report('사용자가 제외한 AI 자료입니다.');continue;}
    if(e?.status==='GENERATING'){report('AI 자료 생성 중입니다. 잠시 후 다시 확인하세요.');continue;}
    let freshRetry=false;
    if(e?.status==='FAILED'){if(options.retryFailed&&automaticNutritionEnabled()){e=null;freshRetry=true;}else{report('이전 AI 요청이 실패했습니다. 영양 계산 또는 식단 저장을 다시 눌러 재시도하세요.');continue;}}
    if(!e){
     if(!automaticNutritionEnabled()){report('새 AI 자료 생성 동의가 필요합니다. ‘이 구성으로 영양 확인’을 눌러주세요.');continue;}
     let key=freshRetry?crypto.randomUUID():requests.get(fingerprint);const storageKey=`smartnf.nutrition-request:${owner}:${fingerprint}`;
     if(!key){try{key=sessionStorage.getItem(storageKey);}catch{}key||=crypto.randomUUID();requests.set(fingerprint,key);try{sessionStorage.setItem(storageKey,key);}catch{}}
     if(freshRetry){requests.set(fingerprint,key);try{sessionStorage.setItem(storageKey,key);}catch{}}
     if(status)status.textContent=`Gemini 영양 보완 중 · ${group.name}`;
     e=await api('/api/me/ai-nutrition',{key,name:group.name,referenceFoodId:group.ref,consent:true},AbortSignal.timeout(55000));saved.unshift(e);result.requested++;
    }else result.reused++;
    if(!valid())break;
    if(e.status==='UNREVIEWED'){
     if(!automaticNutritionEnabled()){report('AI 자료 적용 동의가 필요합니다. ‘이 구성으로 영양 확인’을 눌러주세요.');continue;}
     e=await api(`/api/me/ai-nutrition/${e.id}/review`,{action:'AUTO_APPLY',revision:e.revision});
    }
    if(!usable(e)){report(e.status==='FAILED'?'AI 재요청이 실패했습니다. 서버/Gemini 연결 상태를 확인한 뒤 다시 시도하세요.':'AI 자료가 아직 사용 가능한 상태가 아닙니다.');continue;}
    if(!valid())break;
    catalog.set(e.id,asFood(e));for(const {item,expected}of group.items)if(item.foodId===expected){item.foodId=e.id;item.matchStatus='ai_estimate';}result.applied++;
   }catch(error){report(error.message||'AI 보완 요청 실패');if([429,503].includes(error.status))break;}
  }
  if(valid()&&status)status.textContent=`저장 AI 재사용 ${result.reused}종 · Gemini 신규 ${result.requested}종 · 적용 ${result.applied}종${result.issues.length?' · '+result.issues.map(i=>(i.name?i.name+': ':'')+i.message).join(' / '):' · AI 자료로 표시합니다.'}`;
  return result;
 };
 const result=queue.then(job,job);queue=result.catch(()=>{});return result;
}
