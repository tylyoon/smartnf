'use strict';
// Synchronous server snapshot precedes all deferred comparison/guide scripts.
(()=>{
 const root=document.querySelector('#health-db-bootstrap');if(!root)return;
 const stamp=Date.now();
 try{
  if(!root.dataset.profileId)window.SmartNFUnstoredHealthDraft=sessionStorage.getItem('smartnf.health-profile.v1');
  sessionStorage.removeItem('smartnf.health-profile.v1');sessionStorage.removeItem('smartnf.food-guide-context.v1');
  if(root.dataset.profileId){
   const fields=new Map();for(const input of root.querySelectorAll('[data-db-field]')){const key=input.name;if(!fields.has(key))fields.set(key,{name:key,kind:input.dataset.kind,values:[]});fields.get(key).values.push(input.value);}
   // Empty condition list must actively uncheck all controls on restoration.
   if(!fields.has('conditions'))fields.set('conditions',{name:'conditions',kind:'checkbox',values:[]});
   sessionStorage.setItem('smartnf.health-profile.v1',JSON.stringify({version:1,confirmedAt:stamp,demo:false,fields:[...fields.values()]}));
  }
  if(root.dataset.careId&&root.dataset.careReview!=='true'){
   const items=[...root.querySelectorAll('[data-db-action]')].map(row=>({id:row.dataset.dbAction,scopes:[...row.querySelectorAll('input')].map(input=>input.value)}));
   if(items.length)sessionStorage.setItem('smartnf.food-guide-context.v1',JSON.stringify({version:1,confirmedAt:stamp,demo:false,items}));
  }
 }catch{root.dataset.failed='true';}
})();
