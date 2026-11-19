'use strict';
(()=>{
 const root=document.querySelector('#health-db-bootstrap'),form=document.querySelector('#health-state-form');if(!root||!form)return;
 const api=window.SmartNFHealthAPI,el=(tag,text)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;return n;};
 let profileId=root.dataset.profileId?Number(root.dataset.profileId):null,careId=root.dataset.careId?Number(root.dataset.careId):null;
 const consentEventId=root.dataset.consentEvent?Number(root.dataset.consentEvent):null;let pendingProfile=null,pendingCare=null;
 const panel=el('section');panel.className='health-account-panel';panel.append(el('h2','나의 건강정보 확정'));
 panel.append(el('p','입력을 확인하고 건강정보를 확정하면 로그인한 계정의 MyPage에 저장합니다. 알레르기는 별도 조건이며 이 저장에 포함되지 않습니다.'));
 const link=el('a','건강정보 저장 동의·철회');link.href='/mypage/consent';panel.append(link);
 const label=el('label'),ack=el('input');ack.type='checkbox';label.append(ack,document.createTextNode(' 입력 내용을 확인했으며 이 계정에 저장합니다. 개발 검증에는 직접 입력한 가상 값을 사용하세요.'));
 const save=el('button','건강정보 확정 · MyPage에 저장'),status=el('p');save.dataset.healthConfirm='true';save.type='button';status.setAttribute('role','status');panel.append(label,save,status);
 const anchor=form.querySelector('.hi-action-row');if(anchor)anchor.before(panel);else form.append(panel);
 const mypage=el('a','MyPage에서 저장 정보 확인 →');mypage.href='/mypage/health';panel.append(mypage);
 const actionNote=anchor?.querySelector('p');if(actionNote)actionNote.textContent='비교는 미리보기입니다. 계정에 보관하려면 건강정보를 확정하세요.';
 const note=document.querySelector('.hi-preview-note');if(note)note.textContent='회원 건강정보 · 저장한 최신 정보를 불러옵니다. 수정한 내용은 ‘건강정보 확정 · MyPage에 저장’을 눌러야 계정에 반영됩니다.';
 if(root.dataset.failed==='true'){save.disabled=true;status.textContent='계정 저장본을 준비하지 못했습니다. 새로고침 후 다시 확인하세요.';return;}
 if(root.dataset.agreed!=='true'){save.disabled=true;status.textContent='건강정보 저장 동의 후 이 화면을 다시 열어 주세요.';}
 else status.textContent=profileId?'계정 저장본 #'+profileId+'을 불러왔습니다. 수정 후에는 다시 저장해야 합니다.':'계정에 저장한 건강정보가 없습니다.';
 for(const type of ['input','change'])form.addEventListener(type,event=>{if(!panel.contains(event.target))ack.checked=false;});
 function fields(){const data={};for(const n of form.querySelectorAll('input,select,textarea')){
  if(!n.name||n.disabled||n.readOnly||n.closest('[data-health-allergy]')||['hidden','button','submit','reset'].includes(n.type)||/allerg/i.test(n.name))continue;
  if(n.type==='checkbox'){data[n.name]??=[];if(n.checked)data[n.name].push(n.value);}
  else if(n.type!=='checkbox'&&n.type!=='radio')data[n.name]=[n.value];
 }return data;}
 function canonical(data){const out={};for(const key of Object.keys(data).sort()){if(/_\d$/.test(key)&&!(data.conditions||[]).includes(['당뇨병','고혈압','이상지질혈증','신장질환','기타 만성질환'][Number(key.slice(-1))]))continue;const node=form.elements.namedItem(key);out[key]=data[key].map(v=>node?.type==='number'&&v.trim()!==''?String(Number(v)):v.trim());if(['conditions','goal'].includes(key))out[key].sort();}return JSON.stringify(out);}
 const initialSignature=canonical(fields());let savedSignature=profileId?initialSignature:null;
 if(!profileId&&window.SmartNFUnstoredHealthDraft){
  const restore=el('button','이 탭의 이전 임시 확정본 불러오기');restore.type='button';panel.prepend(restore);
  restore.addEventListener('click',async()=>{if(!await window.SmartNFActionConfirm('이 탭에 남은 임시 정보입니다. 현재 계정의 저장본이 아니므로 본인 입력인지 확인한 뒤 불러오세요. 불러오기만으로 계정에 저장하지 않습니다.'))return;
   try{const warning=window.SmartNFHealthProfile.importDraft();status.textContent=warning||'임시 확정본을 불러왔습니다. 본인 입력을 확인하고 체크한 뒤 확정하면 MyPage에 저장됩니다.';restore.disabled=true;}catch(error){status.textContent=error.message;}
  });
 }

 function req(previous,body){const serialized=JSON.stringify(body);return previous?.serialized===serialized?previous:{serialized,body:{...body,requestId:crypto.randomUUID()}};}
 let blocked=false,frozen=[];
 function freeze(){if(frozen.length)return;for(const node of document.querySelectorAll('[data-hi-panel="state"] input,[data-hi-panel="state"] select,[data-hi-panel="state"] textarea,[data-hi-panel="state"] button'))if(!panel.contains(node)&&!node.disabled){node.disabled=true;frozen.push(node);}}
 function thaw(){frozen.forEach(n=>n.disabled=false);frozen=[];}
 let profileBusy=false,careBusy=false,careFlow=null,extraFrozen=[];
 function validateCurrent(){
  if(!form.checkValidity()){document.querySelector('[data-hi-tab="state"]')?.click();form.reportValidity();throw Error('입력 범위와 날짜를 확인해 주세요.');}
  const value=name=>form.elements.namedItem(name)?.value||'';
  if(value('goalStart')&&value('goalEnd')&&value('goalEnd')<value('goalStart'))throw Error('목표 종료일이 시작일보다 빠릅니다.');
  const current=Number(value('weight')),target=Number(value('targetWeight')),direction=value('weightGoal');
  if(current>0&&target>0&&((direction==='감량'&&target>=current)||(direction==='증량'&&target<=current)||(direction==='유지'&&target!==current)))throw Error('현재·목표 체중과 목표 방향을 확인해 주세요.');
 }
 function acceptProfile(result,request){
  savedSignature=canonical(request.body.fields);profileId=result.id;root.dataset.profileId=String(profileId);
  const entries=Object.entries(result.fields).flatMap(([name,values])=>{const node=[...form.elements].find(n=>n.name===name);return node?[{name,kind:node.type,values}]:[];});
  try{sessionStorage.setItem('smartnf.health-profile.v1',JSON.stringify({version:1,confirmedAt:Date.now(),demo:false,fields:entries}));sessionStorage.removeItem('smartnf.food-guide-context.v1');}catch{}
  status.textContent='✓ MyPage에 저장 완료 · '+new Date(result.savedAt).toLocaleString('ko-KR')+' · 저장본 #'+profileId;
 }
 function holdCare(){
  freeze();ack.disabled=true;save.disabled=true;document.querySelector('#hg-summary-list').inert=true;
  for(const n of document.querySelectorAll('[data-hi-panel="guide"] button,[data-hi-panel="guide"] input,[data-hi-tab],#sl-demo,#sl-input'))if(n!==careSave&&!n.disabled){n.disabled=true;extraFrozen.push(n);}
 }
 function releaseCare(){thaw();ack.disabled=false;save.disabled=blocked;extraFrozen.forEach(n=>n.disabled=false);extraFrozen=[];document.querySelector('#hg-summary-list').inert=false;}
 save.addEventListener('click',async()=>{
  if(blocked||profileBusy||careFlow)return;
  try{
   if(!pendingProfile){validateCurrent();if(!ack.checked||form.dataset.example==='true')throw Error('입력 확인 체크를 확인해 주세요. 가상 예시는 계정에 저장하지 않습니다.');
    if(profileId&&canonical(fields())===savedSignature){status.textContent='이미 MyPage에 저장된 내용입니다.';return;}
    pendingProfile=req(null,{expectedCurrentProfileId:profileId,consentEventId,demo:false,confirmedByUser:true,fields:fields()});
   }
   profileBusy=true;freeze();ack.disabled=true;save.disabled=true;status.textContent='MyPage에 저장 중입니다…';
   const result=await api.request('/profiles',pendingProfile.body);acceptProfile(result,pendingProfile);pendingProfile=null;ack.checked=false;thaw();ack.disabled=false;window.dispatchEvent(new Event('smartnf-health-confirmed'));save.textContent='건강정보 확정 · MyPage에 저장';
  }catch(error){
   if([400,401,403,409].includes(error.status)){pendingProfile=null;blocked=[401,403,409].includes(error.status);}
   if(!pendingProfile){thaw();ack.disabled=false;}
   status.textContent=error.message+(pendingProfile?' 저장 완료를 확인하지 못했습니다. 같은 요청으로 재시도하세요.':blocked?' 새로고침하여 최신 계정 상태를 확인하세요.':'');
   if(pendingProfile)save.textContent='같은 내용으로 저장 다시 시도';
  }finally{profileBusy=false;save.disabled=blocked;}
 });
 // Care confirmation remains a separate explicit account action.
 const carePanel=el('div');carePanel.className='hg-account-actions';
 const careSave=el('button','MyPage에 저장'),careStatus=el('p');careSave.type='button';careSave.className='ui-button';careStatus.setAttribute('role','status');careStatus.setAttribute('aria-live','polite');carePanel.append(careSave,careStatus);document.querySelector('#hg-summary .hg-summary-actions').append(carePanel);
 careSave.disabled=root.dataset.agreed!=='true';
 if(root.dataset.careReview==='true')careStatus.textContent='이전 선택은 변경 전 건강정보 기준입니다. 다시 확인하고 저장해 주세요.';
 async function storeCare(){
  if(careBusy||profileBusy||blocked)return;careBusy=true;careSave.disabled=true;
  try{
   if(!careFlow){
    if(pendingProfile)throw Error('건강정보의 이전 저장 결과를 먼저 확인하거나 같은 요청으로 재시도하세요.');
    if(form.dataset.example==='true'||document.querySelector('#sl-demo')?.getAttribute('aria-pressed')==='true')throw Error('가상 예시는 계정에 저장하지 않습니다. 내 입력 결과로 전환하세요.');
    validateCurrent();const selected=window.SmartNFHealthGuide.confirmForSave();if(selected.demo)throw Error('가상 예시는 계정에 저장하지 않습니다.');
    if(!selected.items.length&&!await window.SmartNFActionConfirm('관리항목이 없는 목록을 MyPage에 저장할까요? 건강정보와 이전 이력은 유지됩니다.'))return;
    const data=fields(),changed=canonical(data)!==(savedSignature??initialSignature);
    careFlow={items:structuredClone(selected.items),profile:changed?req(null,{expectedCurrentProfileId:profileId,consentEventId,demo:false,confirmedByUser:true,fields:data}):null,profileDone:false,care:null};
   }
   holdCare();careSave.textContent='저장 중…';
   if(careFlow.profile&&!careFlow.profileDone){careStatus.textContent='1/2 변경된 건강정보를 저장하고 있습니다…';const result=await api.request('/profiles',careFlow.profile.body);acceptProfile(result,careFlow.profile);careFlow.profileDone=true;}
   if(!careFlow.care)careFlow.care=req(null,{expectedCurrentSetId:careId,profileId,consentEventId,demo:false,confirmedByUser:true,items:careFlow.items});
   careStatus.textContent='관리항목을 저장하고 결과를 확인하고 있습니다…';
   const result=await api.request('/care',careFlow.care.body),check=await api.request('/care');if(check.care?.id!==result.id)throw Error('최신 관리항목 저장 결과를 확인하지 못했습니다.');
   careId=result.id;root.dataset.careId=String(careId);const count=careFlow.items.length,profileSaved=careFlow.profileDone;careFlow=null;
   releaseCare();if(profileSaved)window.dispatchEvent(new Event('smartnf-health-confirmed'));
   if(count)window.SmartNFHealthGuide.confirmForSave();else window.SmartNFCareState.clear();
   window.SmartNFHealthGuide.saved?.();careStatus.textContent='✓ MyPage 저장 완료 · '+(profileSaved?'건강정보와 ':'')+count+'개 관리항목';
  }catch(error){
   const partial=careFlow?.profileDone;
   if(error.status&&error.status<500){careFlow=null;if([401,403,409].includes(error.status))blocked=true;}
   if(!careFlow&&!pendingProfile)releaseCare();
   careStatus.textContent=error.message+(careFlow?(partial?' 건강정보는 저장됐습니다. 관리항목 저장 확인은 같은 요청으로 재시도하세요.':'저장 결과가 불확실합니다. 입력을 유지하고 같은 요청으로 재시도하세요.'):blocked?' 새로고침하여 계정·동의·최신 저장본을 확인하세요.':'');
  }finally{careBusy=false;careSave.textContent=careFlow?'저장 결과 확인·재시도':'MyPage에 저장';careSave.disabled=blocked||root.dataset.agreed!=='true';}
 }
 careSave.addEventListener('click',storeCare);
 const careLink=el('a','MyPage 나의 관리항목 확인 →');careLink.href='/mypage#care';carePanel.append(careLink);
 const summaryNote=document.querySelector('.hg-save-note');if(summaryNote)summaryNote.textContent='카드를 선택하고 ‘선택 항목 해제’로 제외할 수 있습니다. ‘MyPage에 저장’을 누르면 건강정보 변경분과 최종 관리항목을 함께 저장합니다.';
 document.addEventListener('DOMContentLoaded',()=>{document.querySelector('#sl-input')?.click();});
 window.addEventListener('smartnf-care-draft-change',()=>{if(!careBusy&&!careFlow)careStatus.textContent='현재 목록과 건강정보 변경분을 함께 저장할 수 있습니다.';});
 window.addEventListener('beforeunload',event=>{if(careFlow||pendingProfile){event.preventDefault();event.returnValue='';}});
 // An open old tab must revalidate after logout/account switch before submitting a body.
 window.addEventListener('focus',async()=>{try{const c=await api.request('/consent');if(!c.agreed||c.eventId!==consentEventId){save.disabled=careSave.disabled=true;api.clear();location.reload();}}catch(error){save.disabled=careSave.disabled=true;status.textContent='로그인 상태를 다시 확인하고 화면을 새로고침해 주세요.';if([401,403,409].includes(error.status)){api.clear();location.reload();}}});
})();
