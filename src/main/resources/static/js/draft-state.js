'use strict';
(()=>{
 if(window.SmartNFDraftState)return;
 const KEY='smartnf.food-selection.v1';let reload=false,resetFailed=false;
 try{reload=performance.getEntriesByType('navigation')[0]?.type==='reload';if(!performance.getEntriesByType('navigation').length)reload=performance.navigation?.type===1;}catch{}
 function clearSelection(){try{sessionStorage.removeItem(KEY);}catch{resetFailed=true;}}
 clearSelection();
 window.addEventListener('pagehide',clearSelection);
 // Only draft forms present in this document are reset; never clear all storage or account forms.
 const controls=reload?[...document.querySelectorAll('#health-state-form input,#health-state-form textarea,#health-state-form select,#fn-search-form input,#fn-search-form select,#fc-search input,#fc-search select')].filter(node=>{
  if(['hidden','button','submit','reset'].includes(node.type)||node.hasAttribute('data-preserve-on-reload'))return false;
  const label=node.closest('label')||[...document.querySelectorAll('label')].find(l=>node.id&&l.htmlFor===node.id);
  return !(/allerg/i.test((node.name||'')+' '+(node.id||''))||/알레르기/.test(label?.textContent||''));
 }):[];
 function resetInputs(){for(const node of controls){if(node.dataset.healthConfirmed==='true')continue;if(node.tagName==='SELECT'){const options=[...node.options];node.selectedIndex=Math.max(0,options.findIndex(o=>o.defaultSelected));}else if(['checkbox','radio'].includes(node.type))node.checked=node.defaultChecked;else node.value=node.defaultValue;}}
 resetInputs();
 window.SmartNFDraftState={isReload:reload,get resetFailed(){return resetFailed;},draftSaved(){resetFailed=false;}};
 window.addEventListener('pageshow',event=>{if(event.persisted){clearSelection();location.reload();return;}if(reload&&!event.persisted){resetInputs();window.dispatchEvent(new Event('smartnf-draft-inputs-reset'));}});
 document.addEventListener('DOMContentLoaded',()=>{if(resetFailed)document.querySelectorAll('[data-flow-status]').forEach(node=>node.textContent='임시 선택을 초기화하는 중 저장소 접근에 실패했습니다. 이전 선택은 표시하지 않으며, 저장 설정 확인 후 다시 선택해 주세요.');});
})();

// Shared confirmed care-item contract. Draft UI never writes confirmed selections implicitly.
(()=>{
 if(window.SmartNFCareState)return;
 const KEY='smartnf.food-guide-context.v1',TTL=86400000;
 const supported={bmi:['weightcare','balanced','regular','sugar','movement'],bp:['salt','balanced','movement','weightcare','alcohol','smoking'],glucose:['regular','sugar','balanced','movement','weightcare'],lipid:['fat','sugar','balanced','movement','weightcare','alcohol'],habits:['regular','balanced','sugar','salt','late'],activity:['movement','balanced','weightcare','alcohol','smoking']};
 function valid(items){return Array.isArray(items)&&items.length>0&&items.length<=10&&new Set(items.map(x=>x?.id)).size===items.length&&items.every(x=>x&&typeof x.id==='string'&&Array.isArray(x.scopes)&&x.scopes.length>0&&x.scopes.length<=6&&new Set(x.scopes).size===x.scopes.length&&x.scopes.every(s=>supported[s]?.includes(x.id)));}
 function read(){let raw;try{raw=sessionStorage.getItem(KEY);}catch{throw Error('관리항목 저장소를 읽을 수 없습니다.');}if(!raw)return null;let c;try{c=JSON.parse(raw);}catch{return null;}
  if(!c||c.version!==1||typeof c.demo!=='boolean'||!Number.isFinite(c.confirmedAt)||Date.now()-c.confirmedAt<0||Date.now()-c.confirmedAt>=TTL||!valid(c.items))return null;
  const profile=window.SmartNFHealthProfile?.read();if(profile?.confirmedAt>c.confirmedAt)return null;return c;
 }
 function changed(){window.dispatchEvent(new Event('smartnf-care-change'));}
 function clear(){try{sessionStorage.removeItem(KEY);}catch{throw Error('이전 관리항목 전달을 해제하지 못했습니다. 저장 설정을 확인하고 다시 시도하세요.');}changed();}
 function confirm(items,demo){if(!valid(items)||typeof demo!=='boolean')throw Error('선택한 관리항목과 평가 분야를 확인하세요.');const next={version:1,confirmedAt:Date.now(),demo,items:items.map(x=>({id:x.id,scopes:[...x.scopes]}))};try{sessionStorage.setItem(KEY,JSON.stringify(next));}catch{throw Error('관리항목을 확정하지 못했습니다. 브라우저 저장 설정을 확인하세요.');}changed();return next;}
 window.SmartNFCareState={read,clear,confirm,valid,supported};
})();
