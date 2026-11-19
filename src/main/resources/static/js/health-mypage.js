'use strict';
(()=>{
 const api=window.SmartNFHealthAPI,status=document.querySelector('#health-page-status');if(!api||!status)return;
 const $=id=>document.querySelector('#'+id),el=(tag,text)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;return n;};
 const titles={salt:'짜게 먹는 습관 줄이기',balanced:'균형 잡힌 식사 실천하기',movement:'걷기 등 신체활동 실천하기',weightcare:'적정 체중 관리하기',alcohol:'음주 줄이기·피하기',smoking:'금연 실천하기',regular:'규칙적인 식사 실천하기',sugar:'단 음료·첨가당 줄이기',fat:'포화지방 줄이고 지방 종류 살펴보기',late:'야식·늦은 과식 줄이기'};
 const scopeNames={bmi:'BMI·체중',bp:'혈압',glucose:'혈당',lipid:'혈중 지질',habits:'식습관',activity:'활동·개인 조건'};
 let consent=null,catalog=null,page=0,loading=false;
 const localTime=value=>new Date(value).toLocaleString('ko-KR');
 function showProfile(profile){
  $('health-current').hidden=false;$('health-fields').replaceChildren();
  $('health-record-meta').textContent=profile?'저장본 #'+profile.id+' · 계정 저장일 '+localTime(profile.savedAt)+' (측정일과 다를 수 있습니다.)':'저장된 건강정보가 없습니다. 건강정보 입력·수정에서 직접 저장해 주세요.';
  if(!profile)return;
  for(const [key,values]of Object.entries(profile.fields)){
   if(!values.length||values.every(v=>!v))continue;const row=el('tr');let label=catalog.fields[key]?.label||key;
   if(/_\d$/.test(key))label=['당뇨병','고혈압','이상지질혈증','신장질환','기타 만성질환'][Number(key.slice(-1))]+' · '+label;
   const heading=el('th',label);heading.scope='row';row.append(heading,el('td',values.join(' · ')));$('health-fields').append(row);
  }
 }
 async function history(){
  const rows=await api.request('/history?page='+page);$('health-history').hidden=false;$('health-history-list').replaceChildren();
  for(const row of rows){const li=el('li'),button=el('button','저장본 #'+row.id+' · '+localTime(row.savedAt));button.type='button';button.addEventListener('click',async()=>{try{showProfile(await api.request('/profiles/'+row.id));$('health-current').scrollIntoView({block:'start'});}catch(error){status.textContent=error.message;}});li.append(button);$('health-history-list').append(li);}
  if(!rows.length)$('health-history-list').append(el('li','이 페이지에 저장 이력이 없습니다.'));
  $('health-history-prev').disabled=page===0;$('health-history-next').disabled=rows.length<20;
 }
 async function load(){
  if(loading)return;loading=true;status.textContent='계정 기록을 확인하고 있습니다.';
  try{
   consent=await api.request('/consent');$('health-consent').hidden=false;$('health-consent-state').textContent=consent.agreed?'현재 건강정보 저장에 동의한 상태입니다.':'현재 건강정보 저장에 동의하지 않은 상태입니다.';
   $('health-consent-form').hidden=consent.agreed;$('health-withdraw').disabled=false;
   for(const id of ['health-current','health-care','health-history'])$(id).hidden=true;
   if(!consent.agreed){$('health-fields').replaceChildren();$('health-care-items').replaceChildren();$('health-history-list').replaceChildren();status.textContent='저장 동의 후 건강정보 입력·수정 화면을 이용해 주세요.';return;}
   catalog=await api.request('/catalog');const profile=await api.request('/profile');showProfile(profile.profile);
   const {care}=await api.request('/care');$('health-care').hidden=false;$('health-care-items').replaceChildren();
   $('health-care-meta').textContent=care?'확정본 #'+care.id+' · '+localTime(care.savedAt)+(care.profileId==null?' · 건강정보 연결 없는 일반 실천 선택':'')+(care.needsReview?' · 건강정보가 변경되어 재확인이 필요합니다.':''):'계정에 확정한 관리항목이 없습니다.';
   for(const item of care?.items||[])$('health-care-items').append(el('li',(titles[item.id]||item.id)+' · '+item.scopes.map(s=>scopeNames[s]||s).join(' / ')));
   if(care&&!care.items.length)$('health-care-items').append(el('li','전체 해제한 확정본입니다.'));
   await history();status.textContent='본인 계정의 저장 기록을 확인했습니다.';
  }catch(error){for(const id of ['health-current','health-care','health-history'])$(id).hidden=true;$('health-fields').replaceChildren();$('health-care-items').replaceChildren();$('health-history-list').replaceChildren();status.textContent=error.message;}finally{loading=false;}
 }
 $('health-consent-form').addEventListener('submit',async event=>{
  event.preventDefault();if(!$('health-agree-check').checked||!consent)return;
  const button=event.submitter||$('health-consent-form').querySelector('button');button.disabled=true;
  try{await api.request('/consent',{documentVersion:consent.version,decision:'AGREED',expectedEventId:consent.eventId});$('health-agree-check').checked=false;api.broadcast();await load();}catch(error){status.textContent=error.message;}finally{button.disabled=false;}
 });
 $('health-withdraw').addEventListener('click',async()=>{
  if(!consent||!await window.SmartNFActionConfirm('건강정보 저장 동의를 철회하고 이 기능의 모든 건강정보·관리항목·일일 기록을 삭제할까요? 복원할 수 없습니다.'))return;
  $('health-withdraw').disabled=true;
  try{await api.request('/consent',{documentVersion:consent.version,decision:'WITHDRAWN',expectedEventId:consent.eventId});try{api.clear();}finally{api.broadcast();}page=0;await load();status.textContent='동의를 철회하고 계정의 건강 기록을 삭제했습니다. 회원 계정은 유지됩니다.';}catch(error){status.textContent=error.message;$('health-withdraw').disabled=false;}
 });
 $('health-history-prev').addEventListener('click',async()=>{if(page>0)page--;try{await history();}catch(e){status.textContent=e.message;}});
 $('health-history-next').addEventListener('click',async()=>{page++;try{await history();}catch(e){status.textContent=e.message;}});
 window.addEventListener('focus',()=>load());load();
})();
