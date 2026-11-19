'use strict';
(()=>{
 if(window.SmartNFHealthProfile)return;
 const KEY='smartnf.health-profile.v1',TTL=86400000,account=!!document.querySelector('#health-db-bootstrap');
 const kinds=['text','number','date','month','checkbox','radio','select-one','select-multiple','textarea','tel'];
 function read(provided){let raw;try{raw=provided===undefined?sessionStorage.getItem(KEY):provided;}catch{throw Error('건강정보 저장소에 접근할 수 없습니다.');}if(!raw)return null;let p;try{p=JSON.parse(raw);}catch{throw Error('기존 건강정보 확정본의 형식을 확인해 주세요.');}
  if(!p||p.version!==1||!Number.isFinite(p.confirmedAt)||typeof p.demo!=='boolean'||!Array.isArray(p.fields)||p.fields.length>200||new Set(p.fields.map(f=>f?.name+'|'+f?.kind)).size!==p.fields.length||!p.fields.every(f=>f&&typeof f.name==='string'&&f.name.length>0&&f.name.length<=100&&kinds.includes(f.kind)&&Array.isArray(f.values)&&f.values.length<=100&&f.values.every(v=>typeof v==='string'&&v.length<=4000)))throw Error('기존 건강정보 확정본의 형식을 확인해 주세요.');
  if(Date.now()-p.confirmedAt<0||Date.now()-p.confirmedAt>=TTL)return null;return p;
 }
 window.SmartNFHealthProfile={read};
 const form=document.querySelector('#health-state-form');if(!form)return;
 const el=(tag,text,cls)=>{const node=document.createElement(tag);if(text!==undefined)node.textContent=text;if(cls)node.className=cls;return node;};
 // Preserve the existing weight control and its name for BMI and confirmed data.
 function prepareWeightFields(){
  let current=form.querySelector('input[name="weight"]'),target=form.querySelector('input[name="targetWeight"]');
  let group=target?.closest('.hi-weight-fields')||target?.closest('label')?.parentElement;
  if(!group){const section=el('section',undefined,'hi-card');section.dataset.weightInputs='true';section.append(el('h3','다이어트·체중 목표'));group=el('div',undefined,'hi-fields hi-weight-fields');section.append(group);const anchor=form.querySelector('.hi-action-row');if(anchor)anchor.before(section);else form.append(section);}
  const labelFor=input=>input.closest('label')||[...form.querySelectorAll('label')].find(label=>input.id&&label.htmlFor===input.id);
  if(!current){current=el('input');current.name='weight';current.type='number';current.min='1';current.max='400';current.step='0.1';current.placeholder='예: 70';}
  let label=labelFor(current);if(!label){label=el('label');label.append(current);}const texts=[...label.childNodes].filter(n=>n.nodeType===3);if(texts.length){texts[0].textContent='현재 체중 (kg)';texts.slice(1).forEach(n=>n.remove());}else label.prepend(document.createTextNode('현재 체중 (kg)'));
  current.inputMode='decimal';current.setAttribute('aria-label','현재 체중 (kg)');label.dataset.currentWeight='true';const targetLabel=target&&labelFor(target);if(targetLabel?.parentElement===group)targetLabel.before(label);else group.prepend(label);
  function add(name,title,type){const input=el('input');input.name=name;input.type=type;if(type==='number'){input.min='1';input.max='400';input.step='0.1';input.inputMode='decimal';}const label=el('label',title);label.append(input);group.append(label);return input;}
  if(!target)target=add('targetWeight','목표 체중 (kg)','number');
  if(!form.querySelector('[name="weightGoal"]')){const label=el('label','체중 목표 방향'),select=el('select');select.name='weightGoal';for(const title of ['선택하지 않음','감량','유지','증량'])select.append(el('option',title));label.append(select);group.prepend(label);}
  if(!form.querySelector('[name="goalStart"]'))add('goalStart','목표 기간 시작','date');
  if(!form.querySelector('[name="goalEnd"]'))add('goalEnd','목표 기간 종료','date');
  for(const node of form.querySelectorAll('p'))if(node.textContent.includes('현재 체중은 위 기본 정보의 입력값을 사용'))node.textContent='현재 체중과 목표 체중을 구분해 입력하세요. 목표 기간과 희망 체중은 개인 권장량·감량 효과가 검증된 계획이 아닙니다.';
  for(const option of form.querySelectorAll('select[name="goal"] option'))if(option.textContent.trim()==='체중 관리'){const value=option.value;option.value=value;option.textContent='다이어트';}
 }
 prepareWeightFields();
 function controls(){return [...form.querySelectorAll('input,textarea,select')].filter(node=>{if(!node.name||!kinds.includes(node.type)||node.disabled||node.readOnly||node.closest('[data-health-allergy]'))return false;const label=node.closest('label')||[...form.querySelectorAll('label')].find(l=>node.id&&l.htmlFor===node.id);return !(/allerg/i.test(node.name+' '+node.id)||/알레르기/.test(label?.textContent||''));});}
 function groups(){const map=new Map();for(const node of controls()){const key=node.name+'|'+node.type;if(!map.has(key))map.set(key,[]);map.get(key).push(node);}return map;}
 function capture(){return [...groups()].map(([,nodes])=>{const first=nodes[0],values=['checkbox','radio'].includes(first.type)?nodes.filter(n=>n.checked).map(n=>n.value):first.type==='select-multiple'?[...first.selectedOptions].map(o=>o.value):[first.value];return {name:first.name,kind:first.type,values};});}
 let saved=null,warning='';try{saved=read();}catch(error){warning=error.message;}
 function restore(){if(!saved)return;let skipped=0;const map=groups();for(const original of saved.fields){const field=original.name==='goal'?{...original,kind:'checkbox'}:original;const nodes=map.get(field.name+'|'+field.kind);if(!nodes){skipped++;continue;}const first=nodes[0];if(['checkbox','radio'].includes(field.kind)){if(field.values.some(value=>!nodes.some(n=>n.value===value))){skipped++;continue;}nodes.forEach(n=>{n.checked=field.values.includes(n.value);n.dataset.healthConfirmed='true';});}else if(field.kind.startsWith('select')){if(field.values.some(value=>![...first.options].some(o=>o.value===value))){skipped++;continue;}[...first.options].forEach(o=>o.selected=field.values.includes(o.value));first.dataset.healthConfirmed='true';}else{const previous=first.value,wanted=field.values[0]||'';first.value=wanted;if(first.value!==wanted||!first.checkValidity()||(first.maxLength>=0&&wanted.length>first.maxLength)){first.value=previous;skipped++;continue;}first.dataset.healthConfirmed='true';}}
  if(saved.demo)form.dataset.example='true';else delete form.dataset.example;if(skipped)warning='현재 양식에서 복원하지 못한 '+skipped+'개 항목이 있습니다. 내용을 확인한 뒤 다시 확정하세요.';
 }
 restore();
 // Account confirmation is handled by the single server-backed account panel.
 if(account){
  window.SmartNFHealthProfile.importDraft=()=>{saved=read(window.SmartNFUnstoredHealthDraft);if(!saved)throw Error('유효한 임시 확정본이 없습니다.');restore();for(const node of controls())node.dispatchEvent(new Event('change',{bubbles:true}));return warning;};
  return;
 }
 const panel=el('section',undefined,'hp-confirm-panel'),heading=el('h3',account?'브라우저 임시 확정':'나의 건강정보 확정'),note=el('p','입력값을 확인한 뒤 확정하면 새로고침·다시 방문할 때 확정본을 불러옵니다. 수정 후 확정하지 않으면 마지막 확정본으로 돌아갑니다.'),button=el('button','나의 건강정보 확정','hp-confirm-button'),status=el('p',undefined,'hp-confirm-status');button.type='button';button.dataset.healthConfirm='true';status.setAttribute('role','status');status.setAttribute('aria-live','polite');panel.append(heading,note,button,status,el('p',account?'같은 탭의 임시 확정입니다. 계정 DB에는 별도의 계정 저장 버튼으로 저장합니다. 알레르기는 별도 임시 조건입니다.':'같은 탭에서 최대24시간 임시 보관합니다. 로그인 전 임시 보관이며 MyPage에 저장되지 않습니다. 로그인 후 건강정보 확정으로 계정에 저장하세요. 알레르기는 별도 ‘조건 적용’ 값을 유지하며 이 버튼으로 덮어쓰지 않습니다.','hp-confirm-note'));
 const previousNote=form.querySelector('.hi-action-row > p');if(previousNote&&/저장.*로그인.*다음/.test(previousNote.textContent))previousNote.textContent='비교는 현재 입력의 미리보기입니다. 새로고침 후 유지하려면 건강정보를 확정하세요. 계정 DB 저장은 연결 전입니다.';const anchor=form.querySelector('.hi-action-row');if(anchor)anchor.before(panel);else form.append(panel);
 function same(fields){const ordered=rows=>[...rows].sort((a,b)=>(a.name+'|'+a.kind).localeCompare(b.name+'|'+b.kind));return saved&&JSON.stringify(ordered(fields))===JSON.stringify(ordered(saved.fields))&&saved.demo===(form.dataset.example==='true');}
 function refresh(){const equal=same(capture());panel.dataset.state=equal?'saved':saved?'dirty':'new';button.textContent=equal?'✓ 건강정보 확정됨 · 다시 확인':saved?'변경 내용 확정':'나의 건강정보 확정';status.textContent=warning||(equal?(saved.demo?'가상 예시 확정본 · ':'')+'마지막 확정: '+new Date(saved.confirmedAt).toLocaleString('ko-KR')+' · 새로고침 후 이 내용을 복원합니다.':saved?'변경 후 미확정 · 지금 입력은 화면 미리보기입니다. 새로고침하면 마지막 확정본으로 돌아갑니다.':'아직 확정한 건강정보가 없습니다.');}
 ['input','change'].forEach(type=>form.addEventListener(type,event=>{if(controls().includes(event.target)){warning='';refresh();}}));
 form.addEventListener('reset',()=>setTimeout(()=>{warning='';refresh();},0));
 button.addEventListener('click',()=>{
  if(!form.reportValidity()){status.textContent='입력 범위·필수 항목을 확인하세요. 기존 확정본은 유지됩니다.';return;}
  const fields=capture();if(!fields.some(f=>f.values.some(v=>v.trim()!==''&&(!f.kind.startsWith('select')||![...form.elements].some(n=>n.name===f.name&&n.options?.[0]?.value===v))))){status.textContent='건강정보를 한 항목 이상 입력한 뒤 확정해 주세요.';return;}
  const value=name=>form.elements.namedItem(name)?.value||'';if(value('goalStart')&&value('goalEnd')&&value('goalEnd')<value('goalStart')){status.textContent='목표 종료일이 시작일보다 빠릅니다. 기간을 확인해 주세요.';return;}
  const current=Number(value('weight')),target=Number(value('targetWeight')),direction=value('weightGoal');if(current>0&&target>0&&((direction==='감량'&&target>=current)||(direction==='증량'&&target<=current)||(direction==='유지'&&target!==current))){status.textContent='현재 체중·목표 체중과 감량/유지/증량 방향이 서로 맞는지 확인해 주세요.';return;}
  if(same(fields)&&!warning){refresh();status.textContent='기존 확정본과 같은 내용입니다. 마지막 확정본을 유지합니다.';return;}
  const next={version:1,confirmedAt:Date.now(),demo:form.dataset.example==='true',fields};
  try{const raw=JSON.stringify(next);if(raw.length>100000||fields.length>200||fields.some(f=>f.values.some(v=>v.length>4000)))throw Error('입력 내용이 너무 깁니다. 내용을 줄여 주세요.');sessionStorage.setItem(KEY,raw);}catch(error){panel.dataset.state='error';button.textContent='건강정보 확정 다시 시도';status.textContent=error.message?.includes('너무')?error.message:'건강정보를 저장하지 못했습니다. 입력과 기존 확정본은 유지됩니다. 브라우저 저장 설정을 확인해 주세요.';return;}
  saved=next;warning='';controls().forEach(n=>n.dataset.healthConfirmed='true');refresh();status.textContent='✓ 나의 건강정보를 임시 확정했습니다. 입력값을 저장한 것이며 건강 판정·치료 계획 확정은 아닙니다. 비교평가와 관리항목을 다시 확인하세요.';
  const summary=document.querySelector('#hg-summary');if(summary)summary.hidden=true;
  window.dispatchEvent(new Event('smartnf-health-confirmed'));
 });
 // Saved entries were restored before existing deferred comparison/guide scripts execute.
 refresh();
})();
