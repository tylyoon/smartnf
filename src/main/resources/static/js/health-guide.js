'use strict';
(() => {
 const form=document.querySelector('#health-state-form'),grid=document.querySelector('#sl-grid');if(!form||!grid)return;
 const el=(tag,cls,text)=>{const node=document.createElement(tag);if(cls)node.className=cls;if(text!==undefined)node.textContent=text;return node;};
 const selected=new Set(),selectionScopes=new Map(),marked=new Set();let active='bmi';let signature='';let confirmed=null,saveError='',draftChanged=false;
 const sourceRoot='https://health.kdca.go.kr/healthinfo/biz/health/gnrlzHealthInfo/gnrlzHealthInfo/gnrlzHealthInfoView.do?cntnts_sn=';
 const actions={
  salt:{title:'짜게 먹는 습관 줄이기',why:'나트륨 섭취를 줄이는 식생활은 혈압 관리에 활용됩니다.',steps:['국·찌개의 국물은 덜 먹고 건더기 위주로 선택하기','양념은 따로 두고 필요한 만큼 사용하기','가공식품의 나트륨 표시를 비교해 선택하기'],track:'선택한 실천·실천 여부·식사 메모',measure:'혈압·측정일·측정 환경',source:'6855',kind:'food'},
  balanced:{title:'균형 잡힌 식사 실천하기',why:'다양한 식품을 자신의 필요량에 맞게 구성하는 식생활은 건강 관리의 기본입니다.',steps:['한 끼의 식품 구성이 한쪽에 치우치지 않았는지 살펴보기','개인 식이 제한에 맞는 식품을 고르기','식품 영양성분과 분량을 함께 확인하기'],track:'식사 구성·분량·실천 여부',measure:'선택한 관리 분야의 검사·측정값',source:'6547',kind:'food'},
  movement:{title:'걷기 등 신체활동 실천하기',why:'규칙적인 신체활동은 혈압·혈당·지질과 체중을 관리하는 생활요법에 포함됩니다.',steps:['현재 상태에서 가능한 활동인지 먼저 확인하기','허용된 활동을 무리하지 않는 범위에서 실천하기','실천한 활동과 불편 여부를 돌아보기'],track:'활동 종류·시간·횟수·불편 여부',measure:'관련 측정값·측정 조건',source:'6765',kind:'movement'},
  weightcare:{title:'적정 체중 관리하기',why:'적정 체중을 유지하는 것은 여러 대사 지표의 관리와 연결됩니다. 감량이 필요한지는 별도로 확인해야 합니다.',steps:['현재 체중과 관리 방향을 확인하기','개인 조건에 맞는 식사·활동 습관을 선택하기','체중 변화와 실천을 함께 돌아보기'],track:'식사·활동 실천·사용자가 정한 관리 방향',measure:'체중·허리둘레·측정일',source:'6547',kind:'weight'},
  alcohol:{title:'음주 줄이기·피하기',why:'음주 습관은 혈압과 중성지방 관리에서 확인하는 생활 요인입니다.',steps:['현재 음주 여부와 상황을 돌아보기','음주를 줄이거나 피할 방법을 선택하기','실천한 날과 어려웠던 상황을 확인하기'],track:'음주 여부·양·실천 여부',measure:'혈압·중성지방 검사값과 검사일',source:'6765',kind:'habit'},
  smoking:{title:'금연 실천하기',why:'금연은 고혈압 등에서 심혈관 건강을 위해 함께 관리하는 생활습관입니다.',steps:['흡연 중인지와 금연에 필요한 도움을 확인하기','금연을 위한 실천과 지원 방법을 정하기','금연 실천과 어려웠던 상황을 기록하기'],track:'흡연 여부·금연 실천·지원 필요 사항',measure:'개인 건강 상태·진료 시 확인 내용',source:'6765',kind:'habit'},
  regular:{title:'규칙적인 식사 실천하기',why:'식사 시간과 섭취량을 일정하게 관리하는 것은 혈당 관리 등에서 살펴보는 습관입니다.',steps:['생활에 맞는 식사 시간을 정하기','끼니를 거르거나 한 번에 몰아 먹는 상황을 돌아보기','치료 중이라면 의료진의 식사 지침을 우선하기'],track:'끼니·식사 시간·누락·실천 여부',measure:'공복/식후 혈당과 측정 조건',source:'3388',kind:'food'},
  sugar:{title:'단 음료·첨가당 줄이기',why:'당류가 많은 음식과 음료의 과다 섭취를 줄이는 방향은 혈당·체중·중성지방 관리와 연결됩니다.',steps:['자주 먹는 음료·간식의 당류 표시 확인하기','단 음료·간식을 덜 먹는 방법 선택하기','개인 식이 제한에 맞는 대안 확인하기'],track:'음료·간식 종류·분량·대체 실천',measure:'혈당·중성지방·체중과 측정일',source:'3388',kind:'food'},
  fat:{title:'포화지방 줄이고 지방 종류 살펴보기',why:'포화지방을 과다하게 섭취하지 않도록 식품을 고르는 것은 LDL 관리에 관련된 식사 방법입니다.',steps:['식품 표시의 포화지방과 1회 분량 확인하기','고지방 육류·가공식품을 먹는 습관 살펴보기','지방을 무조건 없애기보다 종류와 식품 구성을 비교하기'],track:'선택한 식품·분량·대체 식품·실천 여부',measure:'LDL 등 지질 검사값·검사일',source:'6714',kind:'food'},
  late:{title:'야식·늦은 과식 줄이기',why:'늦게 몰아 먹는 상황을 돌아보면 규칙적인 식사와 섭취량 관리에 활용할 수 있습니다.',steps:['야식이나 늦은 과식이 생기는 상황 확인하기','끼니 구성과 시간을 함께 조정할 방법 찾기','음식·시간과 실천 여부 돌아보기'],track:'야식/과식 여부·시간·상황·실천',measure:'체중·선택한 관련 지표',source:'3388',kind:'food'}
 };
 const evidence=window.SmartNFHealthGuideEvidence;
 function actionData(id,scope=active){const reviewed=evidence?.scopes[scope]?.[id];return reviewed?{...actions[id],...reviewed,reviewedEvidence:true}:actions[id];}
 function appendEvidence(container,action,includeSteps){
  if(!action.reviewedEvidence){const a=el('a','ui-link','공식 실천 정보 확인 ↗');a.href=sourceRoot+action.source;a.target='_blank';a.rel='noopener noreferrer';container.append(a);return;}
  if(includeSteps){container.append(el('h4','','실천할 방법'));const steps=el('ul','hg-action-steps');action.steps.forEach(step=>steps.append(el('li','',step)));container.append(steps);}
  container.append(el('h4','','함께 확인할 사항'));const cautions=el('ul','hg-action-steps hg-cautions');action.cautions.forEach(text=>cautions.append(el('li','',text)));container.append(cautions);
  const sources=el('div','hg-evidence-sources');sources.append(el('h4','','공식 참고자료'));
  action.sources.forEach(id=>{const source=evidence.sources[id];if(!source)return;const a=el('a','ui-link',source.title+' ↗');a.href=sourceRoot+id;a.target='_blank';a.rel='noopener noreferrer';sources.append(a,el('small','hi-caption',source.updated?'자료 업데이트 '+source.updated:'수집 본문 확인 '+evidence.checkedAt));});
  container.append(sources);
 }
 const catalog={
  bmi:{title:'BMI·체중',index:0,why:'현재 체중 수준과 식사·활동을 함께 살펴보고, 감량·유지·증량 중 필요한 방향을 먼저 확인하세요.',items:['weightcare','balanced','regular','sugar','movement']},
  bp:{title:'혈압',index:1,why:'혈압이 높게 확인되면 나트륨·식사 구성·활동·체중·음주·흡연 등 바꿀 수 있는 생활 요인을 함께 살펴봅니다. 한 번의 측정으로 고혈압을 진단하지 않습니다.',items:['salt','balanced','movement','weightcare','alcohol','smoking']},
  glucose:{title:'혈당',index:2,why:'혈당 수치와 검사 조건을 확인한 뒤 규칙적인 식사·당류 섭취·활동 등 실천할 생활습관을 살펴봅니다. 약물과 저혈당 위험을 함께 확인해야 합니다.',items:['regular','sugar','balanced','movement','weightcare']},
  lipid:{title:'혈중 지질',index:3,why:'LDL·중성지방 등 어떤 항목을 관리하는지 구분하고, 식품의 지방·당류·음주·활동 등 관련 습관을 확인합니다.',items:['fat','sugar','balanced','movement','weightcare','alcohol']},
  habits:{title:'식습관',why:'현재 응답을 바탕으로 유지하거나 바꾸고 싶은 식사 습관을 선택하세요. 섭취 일수만으로 영양 충족도를 판정하지 않습니다.',items:['regular','balanced','sugar','salt','late']},
  activity:{title:'활동·개인 조건',why:'현재 활동 수준과 질환·복약·운동 제한을 먼저 확인하고, 허용된 범위의 실천을 선택하세요.',items:['movement','balanced','weightcare','alcohol','smoking']}
 };
 const itemById=new Map(Object.entries(actions));
 const summary=document.querySelector('#hg-summary');
 const bulk=summary.querySelector('.hg-summary-actions')||el('div','hg-summary-actions'),removeMarked=el('button','hi-secondary','선택 항목 해제'),markCount=el('span','hi-caption'),removeStatus=el('p','hi-caption hg-removal-status');removeMarked.type='button';removeMarked.dataset.careRemove='true';removeStatus.setAttribute('role','status');bulk.prepend(removeMarked);summary.querySelector('.hg-save-note').before(bulk,removeStatus);
 function refreshMarks(){for(const id of marked)if(!selected.has(id))marked.delete(id);removeMarked.disabled=!marked.size;markCount.hidden=true;removeMarked.textContent='선택 항목 해제'+(marked.size?' ('+marked.size+')':'');}
 removeMarked.addEventListener('click',()=>{const count=marked.size;for(const id of marked){selected.delete(id);selectionScopes.delete(id);}marked.clear();invalidate(true);renderOptions();updateSelection();removeStatus.textContent=count+'개 항목을 목록에서 해제했습니다. MyPage에 저장하면 계정에 반영됩니다.';});

 function isDemo(){return document.querySelector('#sl-demo').getAttribute('aria-pressed')==='true'||form.dataset.example==='true';}
 function context(){return document.querySelector('#sl-context').textContent;}
 function snapshot(key){const group=catalog[key];if(group.index!==undefined){const card=grid.children[group.index];return card?[...card.querySelectorAll('.sl-metric')].map(row=>({label:[row.querySelector('.sl-metric-head span')?.textContent,row.querySelector('.sl-metric-head strong')?.textContent].filter(Boolean).join(' · '),status:row.querySelector('.sl-badge').textContent,tone:row.querySelector('.sl-badge').className,note:row.querySelector('.sl-meaning')?.textContent||''})):[];}
 if(isDemo())return [{label:'개인 조건·식습관 예시 없음',status:'본인 응답과 구분',tone:'sl-badge sl-pending',note:'가상 건강 수치와 본인의 식습관·개인 조건은 구분합니다. 비교·평가에서 내 입력 결과로 전환해 확인하세요.'}];
 const d=new FormData(form);if(key==='habits')return [['breakfast','아침 식사'],['vegetables','채소'],['sugary','단 음료'],['late','야식']].map(([name,label])=>({label:label+' · '+(d.get(name)===''?'미입력':d.get(name)+' / 7일'),status:'빈도 응답 · 수준 판정 전',tone:'sl-badge sl-pending',note:''}));
 return [{label:'활동 수준: '+d.get('activity'),status:'운동 가능 여부 판정 전',tone:'sl-badge sl-pending',note:'운동 제한: '+d.get('exerciseLimit')+' · 복약: '+d.get('medication')}];
 }
 const store=window.SmartNFCareState;
 function selectionItems(){return [...selected].map(id=>({id,scopes:[...(selectionScopes.get(id)||[])]}));}
 function notify(){window.dispatchEvent(new Event('smartnf-care-draft-change'));}
 function invalidate(clearContext=false){draftChanged=true;if(clearContext){try{store.clear();confirmed=null;saveError='';}catch(error){confirmed=null;saveError=error.message;}}}
 function updateSelection(){
  const button=document.querySelector('#hg-build');button.disabled=selected.size===0;button.textContent=confirmed&&!draftChanged?'✓ 관리항목 확정됨':'선택한 관리항목 확정';
  document.querySelector('#hg-count').textContent=saveError||(selected.size?selected.size+'개 선택 · '+(confirmed&&!draftChanged?'확정한 항목을 식품 가이드에 전달합니다.':'아직 미확정입니다. 확인 후 확정하세요.'):'아직 선택한 항목이 없습니다.');
  const chips=document.querySelector('#hg-selected');chips.replaceChildren();selected.forEach(id=>{const button=el('button','hg-chip',itemById.get(id).title+' ×');button.type='button';button.setAttribute('aria-label',itemById.get(id).title+' 전체 분야 선택 해제');button.addEventListener('click',()=>{selected.delete(id);selectionScopes.delete(id);invalidate(true);renderOptions();updateSelection();});chips.append(button);});renderSummary();notify();
 }
 function actionNote(id,scope=active){
  const action=actionData(id,scope);if(isDemo())return '가상 예시 · 실제 적용 전 개인 조건 확인';
  const d=new FormData(form),conditions=d.getAll('conditions');
  if(action.reviewedEvidence){
   const notes=[];
   if(d.get('referenceContext')!=='일반 성인 참고'||Number(d.get('age'))<18)notes.push('연령·임신 등 별도 기준과 개인 적용 조건을 먼저 확인하세요.');
   if(action.kind==='movement'&&d.get('exerciseLimit')!=='없음')notes.push('운동 제한이 있거나 미확인입니다. 허용 범위를 먼저 확인하세요.');
   if((action.kind==='food'||action.kind==='movement')&&conditions.includes('당뇨병'))notes.push('당뇨병 선택: 복약·저혈당 위험과 식사/활동 지침을 함께 확인하세요.');
   if(action.kind==='food'&&conditions.includes('신장질환'))notes.push('신장질환 선택: 나트륨·칼륨·단백질·수분의 개인 제한을 먼저 확인하세요.');
   if((action.kind==='food'||action.kind==='movement')&&String(d.get('restriction')||'').trim())notes.push('입력한 식사·운동 제한이 있습니다. 의료진 안내를 우선 확인하세요.');
   if((id==='salt'||action.kind==='movement')&&snapshot('bp').some(row=>row.status.includes('낮은 측정값')))notes.push('낮은 혈압 수치가 표시됩니다. 현재 상태에 맞는 적용 여부를 확인하세요.');
   if((id==='sugar'||action.kind==='movement')&&snapshot('glucose').some(row=>row.status.includes('낮은 수치')))notes.push('낮은 혈당이 표시됩니다. 현재 저혈당 대처와 평소 식사·운동 실천을 구분해 확인하세요.');
   if(action.kind==='weight'&&snapshot('bmi').some(row=>row.status.includes('저체중')))notes.push('저체중 참고 구간입니다. 적정 영양과 체중 관리 방향을 먼저 확인하세요.');
   if(action.kind==='weight'&&d.get('weightGoal')==='선택하지 않음')notes.push('감량·유지·증량 중 원하는 관리 방향을 먼저 확인하세요.');
   if(id==='smoking'&&d.get('smoking')==='흡연하지 않음')notes.push('현재 비흡연 응답입니다. 유지할 습관인지 확인하고 선택하세요.');
   return notes.length?notes.join(' '):'내 상태에 맞는 식사·활동 제한과 개인 목표를 함께 확인하세요.';
  }
  if((id==='sugar'||action.kind==='movement')&&snapshot('glucose').some(row=>row.status.includes('낮은 수치')))return '낮은 혈당이 표시됩니다. 평소 생활습관 실천과 현재 저혈당 대처는 구분해 확인';
  if(action.kind==='movement'&&d.get('exerciseLimit')!=='없음')return '운동 제한이 있거나 미확인입니다. 허용 범위 확인 후 실천';
  if(action.kind==='weight'&&snapshot('bmi').some(row=>row.status.includes('저체중')))return '저체중 참고 구간입니다. 감량 대신 적정 영양·체중 방향 확인';
  if(id==='salt'&&snapshot('bp').some(row=>row.status.includes('낮은 측정값')))return '낮은 혈압 수치가 표시되어 저염 실천의 개인 적용은 확인 필요';
  if(action.kind==='food'&&conditions.includes('신장질환'))return '신장질환 선택: 나트륨·칼륨·단백질·수분 등 개인 식이 제한 우선 확인';
  if((action.kind==='food'||action.kind==='movement')&&conditions.includes('당뇨병'))return '당뇨병 선택: 복약·저혈당 위험·의료진 식사/활동 지침 확인';
  return '생활습관 실천 예시 · 개인 목표와 적용 조건 확인';
 }
 function renderOptions(){const box=document.querySelector('#hg-options');box.replaceChildren(el('legend','hg-sr',catalog[active].title+' 실천할 관리 항목'));catalog[active].items.forEach(id=>{const action=actionData(id),label=el('label','hg-option'),input=el('input');input.type='checkbox';input.value=id;input.checked=selectionScopes.get(id)?.has(active)||false;input.addEventListener('change',()=>{if(input.checked){selected.add(id);if(!selectionScopes.has(id))selectionScopes.set(id,new Set());selectionScopes.get(id).add(active);}else{const scopes=selectionScopes.get(id);scopes?.delete(active);if(!scopes?.size){selected.delete(id);selectionScopes.delete(id);}}invalidate(true);renderOptions();updateSelection();});const text=el('span');text.append(el('strong','',action.title),el('small','',action.steps[0]),el('small','hg-condition',actionNote(id)));const other=[...(selectionScopes.get(id)||[])].filter(scope=>scope!==active);if(other.length)text.append(el('small','hg-shared','다른 연결 분야: '+other.map(scope=>catalog[scope].title).join(' · ')));label.append(input,text);box.append(label);});}
 function renderReason(){const box=document.querySelector('#hg-reason');box.replaceChildren(el('h4','',catalog[active].title));box.append(el('p','',catalog[active].why),el('p','hi-caption','개선·유지를 위해 살펴볼 실천 예시입니다. 개인에게 필요한 목표·강도·적용 여부를 확정하거나 수치 개선을 보장하지 않습니다.'));
 if(evidence?.scopes[active])box.append(el('p','hg-source-note',catalog[active].title+' 생활관리 참고 정보 · 본문 확인 '+evidence.checkedAt));
 catalog[active].items.forEach(id=>{const action=actionData(id),detail=el('details','hg-action-reason');detail.dataset.action=id;detail.append(el('summary','',action.title+' · 왜 필요한가요?'),el('p','',action.why));appendEvidence(detail,action,true);box.append(detail);});
 const links=el('div','hg-links');const current=grid.children[catalog[active].index]?.querySelector('.sl-source');if(current){const source=current.cloneNode(true);source.textContent='비교 기준 원문 확인 ↗';links.append(source);}box.append(links,el('p','hi-caption','실천항목을 확정하면 평가 분야와 함께 식품 선택 가이드에 전달합니다.'));}
 function render(){const buttons=document.querySelector('#hg-results');buttons.replaceChildren();Object.entries(catalog).forEach(([key,group])=>{const b=el('button','hg-result');b.type='button';b.setAttribute('aria-pressed',String(key===active));const rows=snapshot(key);b.append(el('strong','',group.title),el('small','',rows.map(row=>row.label+' · '+row.status).join('\n')));b.addEventListener('click',()=>{active=key;render();});buttons.append(b);});document.querySelector('#hg-context').textContent=context()+' / '+(isDemo()?'가상 예시로 관리 항목 선택 흐름을 살펴보세요.':'내 입력을 바탕으로 관심 관리 항목을 선택하세요.');renderReason();renderOptions();updateSelection();}
 function renderSummary(focus=false){
  const list=document.querySelector('#hg-summary-list');list.replaceChildren();
  selected.forEach(id=>{
   const scopes=[...(selectionScopes.get(id)||[])],action=actions[id],card=el('details','hg-item');
   card.dataset.action=id;card.dataset.scope=scopes[0];card.dataset.scopes=scopes.join(' ');
   const heading=el('summary','hg-item-title'),badges=el('span','hg-evaluation-badges');
   heading.append(el('span','',action.title));badges.append(el('span','hg-evaluation-label','관련 평가: '));
   scopes.forEach(scope=>badges.append(el('span','hg-evaluation-badge',catalog[scope].title)));
   heading.append(badges);card.append(heading,el('h4','','공통 실천 방법'));
   const steps=el('ul','hg-action-steps');action.steps.forEach(step=>steps.append(el('li','',step)));card.append(steps);
   scopes.forEach(scope=>{
    const guide=actionData(id,scope),section=el('section','hg-scope-guide');section.dataset.scope=scope;
    section.append(el('h4','hg-scope-heading',catalog[scope].title+' · 관리 이유'),el('p','',guide.why),el('p','hg-condition',actionNote(id,scope)));
    const points=guide.steps.filter(step=>!action.steps.includes(step));
    if(points.length){section.append(el('h4','','이 평가에서 살펴볼 실천 포인트'));const ul=el('ul','hg-action-steps');points.forEach(step=>ul.append(el('li','',step)));section.append(ul);}
    section.append(el('h4','','실천 확인'),el('p','',guide.track),el('h4','','변화를 살펴볼 보조 기록'),el('p','',guide.measure));
    appendEvidence(section,guide,false);card.append(section);
   });
   card.append(el('p','hi-caption','직접 선택한 평가 분야만 표시합니다. 같은 기간의 실천과 수치를 함께 확인하되 변화가 이 행동 때문이라고 단정하지 않습니다.'));
   const wrapper=el('article','hg-selected-card'),pick=el('label','hg-card-select'),check=el('input');check.type='checkbox';check.checked=marked.has(id);check.setAttribute('aria-label',action.title+' 해제 대상으로 선택');pick.append(check,el('span','','선택'));
   const toggle=()=>{if(check.disabled)return;if(check.checked)marked.add(id);else marked.delete(id);wrapper.classList.toggle('is-selected',check.checked);refreshMarks();};check.addEventListener('change',toggle);wrapper.classList.toggle('is-selected',check.checked);wrapper.addEventListener('click',event=>{if(check.disabled)return;if(event.target.closest('button,a,input,label,summary'))return;check.checked=!check.checked;toggle();});wrapper.dataset.careItem=id;wrapper.append(pick,card);list.append(wrapper);

  });
  refreshMarks();
  if(!selected.size)list.append(el('p','hg-empty','실천항목을 선택하면 이곳에 바로 표시됩니다.'));
  if(confirmed&&!draftChanged&&!saveError){const foodLink=el('a','ui-button','확정한 항목으로 식품 선택 가이드 보기 →');foodLink.href='/preview/health/recommendations';foodLink.dataset.careFoodLink='true';foodLink.addEventListener('click',event=>{try{const current=store.read();if(!current||current.confirmedAt!==confirmed?.confirmedAt){event.preventDefault();confirmed=null;draftChanged=true;saveError='확정 전달이 만료되었거나 변경되었습니다. 다시 확인하고 확정하세요.';updateSelection();}}catch(error){event.preventDefault();saveError=error.message;confirmed=null;draftChanged=true;updateSelection();}});list.append(foodLink);}
  document.querySelector('#hg-summary-context').textContent=(confirmed&&!draftChanged?'확정됨':'선택 중 · 미확정')+' · '+selected.size+'개 실천항목'+(isDemo()?' · 가상 예시':' · 내 선택')+(saveError?' · '+saveError:'');
  summary.dataset.state=confirmed&&!draftChanged?'confirmed':'draft';summary.hidden=false;
  if(focus){const title=document.querySelector('#hg-summary-title');title.tabIndex=-1;title.focus({preventScroll:true});summary.scrollIntoView({block:'start'});}
 }
 function confirmCurrent(){
   const profilePanel=form.querySelector('.hp-confirm-panel');
   const hasEntered=[...form.elements].some(node=>{if(!node.name||node.disabled||/allerg/i.test(node.name)||node.closest('[data-health-allergy]')||['hidden','button','submit','reset'].includes(node.type))return false;if(['checkbox','radio'].includes(node.type))return node.checked;if(node.tagName==='SELECT'){const initial=[...node.options].find(o=>o.defaultSelected)||node.options[0];return node.value!==initial?.value;}return String(node.value||'').trim()!=='';});
   if(!isDemo()&&hasEntered&&profilePanel&&profilePanel.dataset.state!=='saved')throw Error('나의 상태에서 입력한 건강정보를 먼저 확정하세요.');
   if(!selected.size)return {items:[],demo:isDemo()};
   confirmed=store.confirm(selectionItems(),isDemo());saveError='';draftChanged=false;updateSelection();return confirmed;
 }
 document.querySelector('#hg-build').addEventListener('click',()=>{try{confirmCurrent();if(confirmed)renderSummary(true);}catch(error){confirmed=null;saveError=error.message;draftChanged=true;updateSelection();}});
 window.SmartNFHealthGuide={confirmForSave:confirmCurrent,saved:()=>{removeStatus.textContent='';}};
 document.querySelector('#hg-edit').addEventListener('click',()=>{document.querySelector('#hg-options').scrollIntoView({block:'start'});document.querySelector('#hg-options input')?.focus({preventScroll:true});});
 // Restore only valid, fresh confirmed selections. Draft selections are never restored.
 try{confirmed=store.read();if(confirmed){active=confirmed.items[0].scopes[0];for(const item of confirmed.items){selected.add(item.id);selectionScopes.set(item.id,new Set(item.scopes));}document.querySelector(confirmed.demo?'#sl-demo':'#sl-input').click();}}catch(error){saveError=error.message;}
 signature=context()+grid.textContent;
 const observer=new MutationObserver(()=>{const next=context()+grid.textContent;if(next!==signature){signature=next;invalidate(true);render();}});observer.observe(grid,{childList:true,subtree:true,characterData:true});
 window.addEventListener('pageshow',()=>{if(confirmed){try{const current=store.read();if(!current||current.confirmedAt!==confirmed.confirmedAt){confirmed=null;draftChanged=true;render();}}catch(error){confirmed=null;draftChanged=true;saveError=error.message;render();}}});
 window.addEventListener('smartnf-health-confirmed',()=>{invalidate(true);render();});
 ['input','change'].forEach(event=>form.addEventListener(event,e=>{if(!e.target.name)return;invalidate(true);render();}));
 render();
})();
