'use strict';
(()=>{
 async function request(path,body){
  const headers={Accept:'application/json','X-SmartNF-Account':document.querySelector('header[data-account-key]')?.dataset.accountKey||''};if(body!==undefined){headers['Content-Type']='application/json';const name=document.querySelector('meta[name="_csrf_header"]')?.content,token=document.querySelector('meta[name="_csrf"]')?.content;if(!name||!token)throw Error('화면을 새로고침한 뒤 다시 시도하세요.');headers[name]=token;}
  const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),15000);
  try{
   const response=await fetch('/api/me/health'+path,{method:body===undefined?'GET':'POST',headers,body:body===undefined?undefined:JSON.stringify(body),credentials:'same-origin',cache:'no-store',signal:controller.signal});
   const type=response.headers.get('content-type')||'';let data=null;if(type.includes('json'))data=await response.json();
   if(!response.ok){const error=Error(data?.message||(response.status===401?'로그인이 만료되었습니다. 다시 로그인해 주세요.':response.status===403?'저장 동의·로그인 상태를 확인하거나 화면을 새로고침해 주세요.':'요청을 완료하지 못했습니다. 입력은 유지됩니다.'));error.status=response.status;throw error;}
   if(data===null)throw Error('응답을 확인하지 못했습니다. 입력은 유지됩니다.');return data;
  }catch(error){if(error.name==='AbortError')throw Error('응답 시간이 초과되었습니다. 저장 여부를 확인하거나 같은 내용으로 다시 시도하세요.');throw error;}finally{clearTimeout(timeout);}
 }
 const keys=['smartnf.health-profile.v1','smartnf.food-guide-context.v1','smartnf.food-selection.v1','smartnf.confirmed-foods.v1','smartnf.allergy-profile.v1','smartnf.month-recommendations.v1','smartnf.meal-journal.v1','smartnf.recipe-reference.v1'];
 function clear(){for(const key of keys)sessionStorage.removeItem(key);}
 const channel=typeof BroadcastChannel==='function'?new BroadcastChannel('smartnf-health-consent-v1'):null;
 window.SmartNFHealthAPI={request,clear,broadcast:()=>channel?.postMessage('revalidate')};
})();
