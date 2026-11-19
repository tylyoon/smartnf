import {api} from './food-studio-core.js';
import {loadCollection} from './collection-review.js?v=auto246';
const $=id=>document.getElementById(id),status=$('auto-collection-status'),start=$('auto-collection-start'),review=$('auto-collection-review'),retry=$('auto-collection-retry-status');
const params=new URLSearchParams(location.search);$('auto-collection-query').value=(params.get('ingredient')||'').split(',')[0].slice(0,100);
let active=null,pending=null,timer=null,epoch=0,starting=false;
const waiting=job=>['QUEUED','RUNNING'].includes(job.state);
const names={QUEUED:'수집 대기',RUNNING:'수집 중',REVIEW_REQUIRED:'검토 필요',EMPTY:'상품 없음',NEEDS_CONFIGURATION:'연결 설정 필요',POLICY_UNAVAILABLE:'수집 정책 확인 실패',POLICY_BLOCKED:'자동 수집 중단',SOURCE_UNAVAILABLE:'판매처 응답 오류',FORMAT_CHANGED:'전단 형식 확인 필요',EXPIRED:'전단 기간 만료',FAILED:'수집 실패',RATE_LIMITED:'잠시 후 재시도'};
function show(job){active=job;status.textContent=(names[job.state]||job.state)+' · '+job.message;start.disabled=waiting(job);$('auto-collection-provider').disabled=waiting(job);$('auto-collection-query').disabled=waiting(job);review.hidden=job.state!=='REVIEW_REQUIRED'||!job.offers?.length;retry.hidden=true;}
function pause(message){status.textContent=message+' 기존 저장 상품과 검토 내용은 유지됩니다.';start.disabled=false;retry.hidden=false;}
async function poll(id,token){if(token!==epoch)return;try{const job=await api('/api/me/product-collection-jobs/'+encodeURIComponent(id));if(token!==epoch)return;show(job);if(waiting(job))timer=setTimeout(()=>poll(id,token),1500);}catch(error){if(token!==epoch)return;pause(error.message);}}
start.addEventListener('click',async()=>{if(starting)return;const query=$('auto-collection-query').value.trim(),provider=$('auto-collection-provider').value;if(!query){status.textContent='찾을 재료를 입력하세요.';return;}
 if(pending&&(pending.query!==query||pending.provider!==provider)){status.textContent='이전 요청의 진행 상태를 먼저 확인하세요.';retry.hidden=false;return;}
 if(!pending)pending={requestId:crypto.randomUUID(),provider,query};starting=true;start.disabled=true;review.hidden=true;retry.hidden=true;clearTimeout(timer);const token=++epoch;
 try{const job=await api('/api/me/product-collection-jobs',pending);pending=null;show(job);if(waiting(job))timer=setTimeout(()=>poll(job.id,token),500);}
 catch(error){if(error.status>=400&&error.status<500)pending=null;pause(error.message+' 같은 요청은 중복 실행하지 않고 확인합니다.');}
 finally{starting=false;if(!active||!waiting(active))start.disabled=false;}
});
retry.addEventListener('click',async()=>{clearTimeout(timer);const token=++epoch;try{const result=pending?{job:await api('/api/me/product-collection-jobs',pending)}:await api('/api/me/product-collection-jobs/current');if(result.job){pending=null;show(result.job);if(waiting(result.job))poll(result.job.id,token);}else{pending=null;active=null;status.textContent='진행 중인 작업이 없습니다. 상품 가져오기를 다시 누르세요.';retry.hidden=true;start.disabled=false;}}catch(error){pause(error.message);}});
review.addEventListener('click',()=>{if(!active?.offers?.length)return;const loaded=loadCollection({schemaVersion:1,offers:active.offers,runs:[{provider:active.provider,status:'REVIEW_REQUIRED',count:active.offers.length,message:'서버에서 가져온 미승인 후보입니다.'}]});if(loaded){$('collection-file').value='';$('collection-review-panel').open=true;$('collection-review-panel').scrollIntoView?.({behavior:'smooth',block:'start'});}else status.textContent='저장 작업 완료 후 검토 결과를 불러오세요.';});
window.addEventListener('pagehide',()=>{clearTimeout(timer);epoch++;});
// Restore server-held progress for this authenticated member; never restore another account's local cache.
if(params.get('view')==='compare')api('/api/me/product-collection-jobs/current').then(result=>{if(epoch!==0||starting)return;if(result.job){show(result.job);if(waiting(result.job))poll(result.job.id,epoch);}}).catch(error=>{if(epoch===0){status.textContent='수집 진행 상태를 확인하지 못했습니다. '+error.message;retry.hidden=false;}});
