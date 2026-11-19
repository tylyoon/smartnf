'use strict';
(()=>{
 const A=window.SmartNFAllergy,form=document.querySelector('#health-state-form');if(!A||!form)return;
 const candidates=[...form.querySelectorAll('input,textarea,select')].filter(e=>{const named=[e.name,e.id].some(value=>/^(allerg(y|ies)|food_?allerg(y|ies)|allergy(Notes|Text|Input|Food|Foods))$/i.test(value||''));const associated=e.closest('label')||[...form.querySelectorAll('label')].find(l=>l.htmlFor===e.id&&e.id);const text=associated?.textContent||'';return named||(/알레르기/.test(text)&&!/복약|질환|식이.?제한|기타.?메모/.test(text));});
 const fields=candidates.filter(e=>!['hidden','submit','button'].includes(e.type));
 const host=document.createElement('section');host.dataset.healthAllergy='true';
 const anchor=fields[0]?.closest('label')||form.querySelector('[name="restriction"]')?.closest('label');
 const disclosure=document.createElement('details');disclosure.id='health-allergy-editor';disclosure.className='fa-editor-disclosure';const toggle=document.createElement('summary');toggle.textContent='알레르기 등록·수정';disclosure.append(toggle,host);if(anchor)anchor.insertAdjacentElement('afterend',disclosure);else form.append(disclosure);function openEditor(){if(location.hash==='#health-allergy-editor'){disclosure.open=true;disclosure.scrollIntoView({block:'start'});}}window.addEventListener('hashchange',openEditor);openEditor();
 A.mount(host,'health');
 let timer;
 function sync(){
  let texts=fields.filter(e=>!['checkbox','radio'].includes(e.type)||e.checked).map(e=>e.value).filter(Boolean);
  if(!texts.length)return;
  const parsed=A.fromText(texts.join(','));
  try{A.update(parsed.mode,parsed.allergens,parsed.other,'health');}catch(error){const status=host.querySelector('.fa-status');if(status)status.textContent=error.message;}
 }
 fields.forEach(e=>{e.addEventListener('change',sync);e.addEventListener('input',()=>{clearTimeout(timer);timer=setTimeout(sync,350);});});
 // A prefilled explicit field is authoritative on first load; broad restriction notes are never parsed.
 if(fields.length&&A.profile().mode==='unset')sync();
 // Keep exclusion conditions separate from clinical actions and their saved contract.
 const guide=document.querySelector('[data-hi-panel="guide"]'),summary=document.querySelector('#hg-summary'),list=document.querySelector('#hg-summary-list');
 if(guide){
  const card=document.createElement('article');card.className='fa-care-item';card.dataset.allergyCareItem='true';
  function renderCare(){
   const p=A.profile();card.replaceChildren();card.hidden=p.mode==='unset';
   const title=document.createElement('h3');title.textContent='알레르기 · 추가 제외 조건';
   const chips=document.createElement('div');chips.className='fa-care-chips';
   const values=p.allergens.map(id=>A.labels[id]);if(p.other)values.push('기타 · 확인 필요');
   if(!values.length)values.push(p.mode==='none'?'본인 확인: 알레르기 없음':'알레르기 정보 확인 필요');
   values.forEach(value=>{const chip=document.createElement('span');chip.textContent=value;chips.append(chip);});
   const description=document.createElement('p');description.textContent=A.summary(p);
   const note=document.createElement('p');note.className='fa-note';note.textContent='관리항목과 함께 식품 선택에 반영합니다. 같은 탭의 임시 조건이며 MyPage 계정 저장은 후속 단계입니다.';
   card.append(title,chips,description,note);placeCare();
  }
  function placeCare(){
   const target=summary&&!summary.hidden&&list?list:guide;
   if(card.parentElement!==target){if(target===guide&&summary)summary.before(card);else target.append(card);}
  }
  window.addEventListener('smartnf-allergy-change',renderCare);
  if(summary)new MutationObserver(placeCare).observe(summary,{attributes:true,attributeFilter:['hidden']});
  if(list)new MutationObserver(placeCare).observe(list,{childList:true});
  renderCare();
 }
})();
