(() => {
 const root=document.getElementById('recipe-preference');if(!root)return;
 const enabled=document.getElementById('recipe-use-preferences'),mode=document.getElementById('recipe-preference-mode'),panel=document.getElementById('recipe-preference-panel'),manual=document.getElementById('recipe-preference-manual'),status=document.getElementById('recipe-preference-status'),consent=document.getElementById('recipe-ai-consent');
 const labels={spicy:'매운맛',sweet:'단맛',salty:'짠맛',sour:'신맛',umami:'감칠맛',rich:'기름진 정도'};
 let loading=false,loaded=false,targets={},version=0;
 const reset=()=>{consent.checked=false;};
 const fields=[...root.querySelectorAll('[data-taste-axis]')];
 function draw(){panel.hidden=!enabled.checked;manual.hidden=mode.value!=='manual';fields.forEach(f=>f.disabled=!enabled.checked||mode.value!=='manual');
  if(!enabled.checked)return;
  status.textContent=loading?'저장한 맛 취향을 확인하고 있습니다…':mode.value==='manual'?'이번 추천에 사용할 맛을 하나 이상 선택하세요. 선택하지 않은 맛은 제한하지 않습니다.':Object.keys(targets).length?`저장한 취향: ${Object.entries(targets).map(([k,v])=>`${labels[k]} ${Number(v).toFixed(1)}/5`).join(' · ')}`:'아직 사용할 맛 평가가 부족합니다. 직접 선택으로 시작해 보세요.';
 }
 async function load(){
  if(loading||loaded)return;loading=true;const requestVersion=++version;draw();
  try{
   const account=document.querySelector('header[data-account-key]')?.dataset.accountKey;
   const response=await fetch('/api/me/recipes/preferences',{headers:{Accept:'application/json',...(account?{'X-SmartNF-Account':account}:{})},signal:AbortSignal.timeout(10000)});
   if(response.redirected||!response.ok||!response.headers.get('content-type')?.includes('application/json'))throw Error('취향 정보를 확인하지 못했습니다. 직접 선택을 사용할 수 있습니다.');
   const data=await response.json();if(requestVersion!==version)return;
   targets=data.targets||{};loaded=true;if(!Object.keys(targets).length&&mode.value==='saved')mode.value='manual';
  }catch(error){if(requestVersion===version){mode.value='manual';targets={};status.textContent=error.message;}}
  finally{if(requestVersion===version){loading=false;reset();draw();}}
 }
 enabled.addEventListener('change',()=>{reset();draw();if(enabled.checked)load();});mode.addEventListener('change',()=>{reset();draw();});fields.forEach(f=>f.addEventListener('change',reset));
 window.smartnfRecipePreferences={payload(){
  if(!enabled.checked)return {usePreferences:false,manualTasteEnabled:false};
  if(mode.value==='saved'){
   if(loading||!loaded)throw Error('취향 정보를 확인한 뒤 다시 추천해 주세요.');
   if(!Object.keys(targets).length)throw Error('직접 선택에서 맛 선호를 하나 이상 골라 주세요.');
   return {usePreferences:true,manualTasteEnabled:false};
  }
  const preferredTaste=Object.fromEntries(fields.filter(f=>f.value!=='').map(f=>[f.dataset.tasteAxis,Number(f.value)]));
  if(!Object.keys(preferredTaste).length)throw Error('맛 선호를 하나 이상 선택하거나 내 취향 반영을 해제해 주세요.');
  return {usePreferences:true,manualTasteEnabled:true,preferredTaste};
 }};draw();
})();
