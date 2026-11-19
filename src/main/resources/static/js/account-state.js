'use strict';
// Runs in the shared header before deferred health scripts read session data.
(()=>{
 const header=document.currentScript?.closest('[data-account-key]');
 const current=header?.dataset.accountKey;
 if(!current)return;
 const marker='smartnf.account-boundary.v1';
 const keys=['smartnf.health-profile.v1','smartnf.food-guide-context.v1','smartnf.food-selection.v1',
  'smartnf.confirmed-foods.v1','smartnf.allergy-profile.v1','smartnf.month-recommendations.v1','smartnf.meal-journal.v1',
  'smartnf.recipe-reference.v1'];
 // Consent changes are value-free signals. All healthcare tabs drop stale caches.
 if(typeof BroadcastChannel==='function'){
  const channel=new BroadcastChannel('smartnf-health-consent-v1');
  channel.addEventListener('message',()=>{
   try{for(const key of keys)sessionStorage.removeItem(key);}finally{
    if(location.pathname==='/health/info'||location.pathname.startsWith('/mypage')||location.pathname.startsWith('/preview/health')){document.querySelector('main')?.replaceChildren();window.location.reload();}
   }
  });
 }
 // Cached pages contain form values and rendered results in memory. Revalidate via
 // a full server render on history restoration rather than trusting the cached key.
 window.addEventListener('pagehide',event=>{
  if(event.persisted){document.querySelector('main')?.replaceChildren();document.querySelector('#health-db-bootstrap')?.replaceChildren();}
 });
 window.addEventListener('pageshow',event=>{
  if(event.persisted)window.location.reload();
 });
 try{
  const previous=sessionStorage.getItem(marker);
  if(previous!==current && (previous!==null || current!=='anonymous'))for(const key of keys)sessionStorage.removeItem(key);
  sessionStorage.setItem(marker,current);
 }catch{
  // Stop rendering stale health forms when account isolation cannot be guaranteed.
  window.addEventListener('DOMContentLoaded',()=>{
   const main=document.querySelector('main');
   if(main){main.replaceChildren();const message=document.createElement('p');
    message.setAttribute('role','alert');
    message.textContent='계정별 임시 정보 정리에 실패했습니다. 이 탭을 닫고 브라우저 저장소 사용 설정을 확인한 뒤 다시 접속하세요.';main.append(message);}
  },{once:true});
 }
})();
