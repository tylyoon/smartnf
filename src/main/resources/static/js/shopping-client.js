import {api,accountKey,element,button} from './food-studio-core.js';
const prefix='smartnf.shopping.pending.v1:';
let lastResult=null;
let busy=false,plannedDate=new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Seoul'}).format(new Date()),receipt=null,cartMessage='';
export function pendingShopping(){try{const p=JSON.parse(sessionStorage.getItem(prefix+accountKey()));return p?.owner===accountKey()&&p?.body?.requestId&&/^\/api\/me\/shopping-lists(?:\/[0-9a-f-]{36}\/delete)?$/.test(p.url||'')?p:null;}catch{return null;}}
export function shoppingBody({id=crypto.randomUUID(),revision=0,shoppingDate,from,to,kind,items}){if(!shoppingDate||!items.length)throw Error('장보기 예정일과 선택한 재료를 확인해 주세요.');return {id,requestId:crypto.randomUUID(),expectedRevision:revision,shoppingDate,sourceFrom:from,sourceTo:to,sourceKind:kind,items:items.map(i=>({foodId:i.foodId||i.id?.replace(/^name:.*/, '')||'',name:i.name,grams:i.grams==null?null:Number(Number(i.grams).toFixed(3)),...(i.quantities?.length?{quantities:i.quantities.map(q=>({amount:Number(Number(q.amount).toFixed(3)),unit:q.unit,evidence:q.evidence||'레시피 원문'}))}:{})}))};}
async function perform(p){
 if(busy)throw Error('저장 결과를 확인하고 있습니다.');if(p.owner!==accountKey())throw Error('로그인 계정을 확인하세요.');busy=true;
 try{
  sessionStorage.setItem(prefix+p.owner,JSON.stringify(p));
  const saved=await api(p.url,p.body);if(accountKey()!==p.owner)throw Error('계정이 변경되었습니다. 다시 확인하세요.');
  if(!saved?.deleted){const verified=await api('/api/me/shopping-lists/'+saved.id);if(verified.revision!==saved.revision||JSON.stringify(verified.items)!==JSON.stringify(saved.items))throw Error('저장 후 조회가 일치하지 않습니다. 이전 저장 결과를 다시 확인하세요.');}
  sessionStorage.removeItem(prefix+p.owner);if(window.parent!==window)window.parent.postMessage({type:'smartnf-shopping-changed'},location.origin);return saved;
 }catch(e){if(e.status>=400&&e.status<500)sessionStorage.removeItem(prefix+p.owner);throw e;}finally{busy=false;}
}
export async function saveShopping(body){if(pendingShopping())throw Error('이전 저장 결과 확인 버튼을 먼저 눌러주세요.');return perform({owner:accountKey(),url:'/api/me/shopping-lists',body});}
export async function deleteShopping(id,revision){if(pendingShopping())throw Error('이전 저장 결과를 먼저 확인하세요.');return perform({owner:accountKey(),url:'/api/me/shopping-lists/'+id+'/delete',body:{requestId:crypto.randomUUID(),expectedRevision:revision}});}
export async function retryShopping(){const pending=pendingShopping();if(!pending)throw Error('확인할 이전 저장 요청이 없습니다.');return perform(pending);}
export function shoppingLink(saved){const a=element('a','저장한 장보기 목록 보기 →');a.href='/mypage/plans?shopping=1&date='+encodeURIComponent(saved.shoppingDate||'')+'#plans';return a;}
export function mountShoppingSave(root,{items,from,to,kind,refresh}){
 const box=element('section',undefined,'shopping-save'),label=element('label','장보기 예정일'),date=element('input');Object.assign(date,{type:'date',min:'1900-01-01',max:'2100-12-31',value:plannedDate});label.append(date);
 const fingerprint=()=>JSON.stringify([date.value,from,to,kind,items.map(i=>[i.id,i.name,i.grams,i.quantities])]),status=element('p');status.setAttribute('role','status');status.textContent=cartMessage;if(lastResult&&cartMessage)status.append(shoppingLink(lastResult));
 const save=button('장보기 목록 저장',async()=>{if(busy)return;if(date.validity&&!date.validity.valid){status.textContent='장보기 예정일을 확인하세요.';return;}const fp=fingerprint();lastResult=null;cartMessage='';try{save.disabled=true;status.textContent='장보기 목록을 저장하고 있습니다…';const saved=await saveShopping(shoppingBody({shoppingDate:date.value,from,to,kind,items}));lastResult=saved;cartMessage='';receipt={fingerprint:fp,saved};status.replaceChildren(element('span','저장했습니다. '),shoppingLink(saved));}catch(e){cartMessage=e.message;status.textContent=e.message;}finally{refresh?.();}});
 const update=()=>{plannedDate=date.value;save.disabled=busy||!!pendingShopping()||!items.length||receipt?.fingerprint===fingerprint();};date.addEventListener('input',update);update();
 box.append(label,element('p','식단 재료 기간: '+from+' ~ '+to,'fs-muted'),element('p','예정일·선택한 재료 이름·분량을 본인 계정에 저장합니다. 식단 계획과 별도이며 외부 AI로 보내지 않습니다.','fs-muted'),save,status);
 if(receipt?.fingerprint===fingerprint())status.replaceChildren(element('span','저장한 목록입니다. '),shoppingLink(receipt.saved));
 if(pendingShopping())box.append(button('이전 저장 결과 확인',async()=>{try{status.textContent='이전 요청을 확인하고 있습니다…';const saved=await retryShopping();lastResult=saved;cartMessage=saved.deleted?'삭제 결과를 확인했습니다.':'저장 결과를 확인했습니다.';status.replaceChildren(element('span','저장 결과를 확인했습니다. '),shoppingLink(saved));}catch(e){cartMessage=e.message;status.textContent=e.message;}finally{refresh?.();}}));
 const link=element('a','MyPage 장보기 목록');link.href='/mypage/plans?shopping=1#plans';if(!(receipt?.fingerprint===fingerprint())&&!(lastResult&&cartMessage))box.append(link);root.append(box);
}
