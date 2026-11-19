'use strict';
(() => {
  const state = document.querySelector('#health-state-form');
  if (!state) return;
  let sample = false;
  function show(name, focus = true) {
    document.querySelectorAll('[data-hi-panel]').forEach(el => { el.hidden = el.dataset.hiPanel !== name; });
    document.querySelectorAll('[data-hi-tab]').forEach(el => el.setAttribute('aria-pressed', String(el.dataset.hiTab === name)));
    if (focus) {
      const heading = document.querySelector('[data-hi-panel="' + name + '"] h2');
      heading.setAttribute('tabindex', '-1'); heading.focus({preventScroll:true});
      document.querySelector('.hi-steps').scrollIntoView({block:'start',behavior:'auto'});
    }
  }
  document.querySelectorAll('[data-hi-tab]').forEach(el => el.addEventListener('click', () => show(el.dataset.hiTab)));
  document.querySelectorAll('[data-hi-go]').forEach(el => el.addEventListener('click', () => show(el.dataset.hiGo)));
  const topics = {
    '당뇨병': ['혈당 검사 항목 이해', '식사 구성·탄수화물 관련 지침', '운동·복약 관련 주의사항'],
    '고혈압': ['혈압 측정과 기록 방법', '나트륨·식생활 관리 지침', '운동 시 확인할 조건'],
    '이상지질혈증': ['지질 검사 항목 이해', '지방·식품 선택 관련 지침', '활동·체중 관리와의 연결'],
    '신장질환': ['신장 기능·검사 지표 이해', '개인별 영양 제한 확인', '활동·운동 제한 확인'],
    '기타 만성질환': ['정확한 질환명·관리 조건 확인', '해당 질환의 공식 지침 확보', '전문가의 개별 제한 확인']
  };
  function topicCard(title, items, target) {
    const card = document.createElement('details'); card.className = 'hi-topic-card';
    const heading = document.createElement('summary'); heading.textContent = title;
    const list = document.createElement('ul');
    items.forEach(text => { const li = document.createElement('li'); li.textContent = text; list.append(li); });
    const note = document.createElement('p'); note.className = 'hi-caption'; note.textContent = '안내 주제 시안 · 질환별 지침·검사 기준 연결 전';
    card.append(heading,list,note); target.append(card);
  }
  function updateCare(data, conditions) {
    document.querySelectorAll('[data-hi-disease]').forEach(el => { el.hidden = !conditions.includes(el.dataset.hiDisease); });
    document.querySelector('#hi-disease-empty').hidden = conditions.length > 0;
    const guides = document.querySelector('#hi-disease-guides');
    guides.replaceChildren();
    if (!conditions.length) {
      const p = document.createElement('p'); p.textContent = '진단받은 질환을 선택하면 관련 관리·지식 주제가 표시됩니다. 현재는 질환 정보 미선택 상태입니다.';
      guides.append(p);
    }
    conditions.forEach(c => {
      topicCard(c, topics[c], guides);
    });
    if(conditions.length > 1) {
      const p=document.createElement('p');p.className='hi-caption';p.textContent='복합 질환 선택: 지침 간 충돌과 의료진의 개별 목표를 확인해야 합니다. 개별 목표는 자동 확정하지 않습니다.';guides.append(p);
    }
    const current = Number(data.get('weight')), target = Number(data.get('targetWeight'));
    const direction = data.get('weightGoal'), start = data.get('goalStart'), end = data.get('goalEnd');
    const chosen = direction !== '선택하지 않음';
    const text = (chosen ? direction : '방향 미선택') + ' · 현재 ' + (current > 0 ? current + 'kg' : '미입력') + ' → 희망 ' + (target > 0 ? target + 'kg' : '미입력') + ' · 기간 ' + (start || '미입력') + ' ~ ' + (end || '미입력');
    document.querySelector('#hi-diet-context').textContent = text + ' / 희망 목표이며 적절성이 검증된 계획은 아닙니다.';
    const messages=[];
    if(start && end && end < start) messages.push('종료일이 시작일보다 빠릅니다. 기간을 확인해 주세요.');
    if(current > 0 && target > 0 && ((direction === '감량' && target >= current) || (direction === '증량' && target <= current) || (direction === '유지' && target !== current))) messages.push('선택한 관리 방향과 목표 체중을 확인해 주세요.');
    if(conditions.length && chosen) messages.push('만성질환 선택: 일반 다이어트 목표를 그대로 적용하지 않고 질환별 제한·의료진 목표를 먼저 확인합니다.');
    document.querySelector('#hi-weight-validation').textContent = messages.join(' ');
  }
  function update() {
    const data = new FormData(state);
    const conditions = data.getAll('conditions');
    updateCare(data, conditions);
    document.querySelector('#hi-condition-summary').textContent = (sample ? '가상 예시 · ' : '') + (conditions.length ? '선택한 질환: ' + conditions.join(', ') : '선택한 질환 없음 (질환이 없다는 판정은 아닙니다)') + ' · 치료·복약: ' + data.get('medication') + ' · 운동 제한: ' + data.get('exerciseLimit') + ' / 개인별 식생활·운동 가이드는 연결 전입니다.';
  }
  state.addEventListener('input', event => { if(!event.target.name)return; sample = false; delete state.dataset.example; update(); });
  state.addEventListener('change', event => { if(!event.target.name)return; sample = false; delete state.dataset.example; update(); });
  state.addEventListener('submit', event => { event.preventDefault(); update(); renderHabits(); document.querySelector('#hi-input-status').textContent = '현재 화면에서만 확인했습니다. 전송·저장하지 않습니다.'; show('results'); });
  document.querySelector('[data-hi-sample]').addEventListener('click', () => {
    const retainedHabits = ['breakfast','vegetables','sugary','late','regular'].map(name => [name,state.elements.namedItem(name).value]);
    state.reset();
    retainedHabits.forEach(([name,value]) => {state.elements.namedItem(name).value=value;});
    const values = {age:'45',height:'170',weight:'69',waist:'84',sex:'남성',referenceContext:'일반 성인 참고',sys:'118',dia:'76',glucose:'94',hba1c:'5.4',totalChol:'195',ldl:'120',hdl:'48',tg:'132',measured:'2026-10-22',labMeasured:'2026-10-22',fasting:'8시간 이상 공복 확인',glucoseMethod:'검사실 혈장',bpContext:'진료실',labSource:'가상 검진기관',medication:'미확인',activity:'미확인',exerciseLimit:'미확인'};
    Object.entries(values).forEach(([name,value]) => {state.elements.namedItem(name).value = value;});
    state.dataset.example = 'true';
    sample = true; update();
    document.querySelector('#hi-input-status').textContent = '가상 인물 예시를 채웠습니다. 실제 사용자 정보가 아닙니다.';
  });
  function renderHabits() {
    const rows = [['breakfast','아침 식사'],['vegetables','채소 섭취'],['sugary','단 음료'],['late','야식']];
    const data = new FormData(state), box = document.querySelector('#hi-habit-bars');
    box.replaceChildren();
    rows.forEach(([key,title]) => {
      const value = data.get(key), row = document.createElement('div'); row.className='hi-habit-row';
      const label = document.createElement('span'); label.textContent = title;
      const track = document.createElement('div'); track.className='hi-habit-track'; track.setAttribute('aria-hidden','true');
      const fill = document.createElement('span');fill.style.width = value === '' ? '0%' : (Number(value)/7*100)+'%';track.append(fill);
      const count = document.createElement('strong');count.textContent = value === '' ? '미입력' : value+' / 7일';
      row.append(label,track,count);box.append(row);
    });
    const note=document.createElement('p');note.className='hi-caption';note.textContent='입력한 빈도를 그대로 표시합니다. 막대 길이는 건강 수준이나 우열이 아닙니다. 전송·저장하지 않습니다.';box.append(note);
    const regular=document.createElement('p');regular.className='hi-caption';regular.textContent='식사 시간 규칙성: '+data.get('regular');box.append(regular);
  }
  update(); renderHabits();
})();
