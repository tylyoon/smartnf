'use strict';
(() => {
 const state=document.querySelector('#health-state-form');if(!state)return;
 const root='https://health.kdca.go.kr/healthinfo/biz/health/gnrlzHealthInfo/gnrlzHealthInfo/gnrlzHealthInfoView.do?cntnts_sn=';
 const sources={body:root+'6694',bp:'https://health.kdca.go.kr/healthinfo/biz/health/ntcnInfo/healthSourc/thtimtCntnts/thtimtCntntsView.do?thtimt_cntnts_sn=124',glucose:root+'5305',lipids:root+'6709',labs:root+'5531'};
 const groups=[
  {title:'01 체격·체중',source:'body',kind:'measure',rows:[['bmi','BMI','kg/m²',[15,35],'성인 분류는 별도 BMI 구간에서 확인. 종합 건강점수 아님'],['weight','체중','kg',null,'이전 기록·개인 조건과 함께 확인'],['waist','허리둘레','cm',[50,130],'성인 복부비만 참고: 남성 90cm 이상, 여성 85cm 이상'],['bodyFat','체지방률','%',null,'측정기기·연령·성별에 따른 기준 확인 필요']]},
  {title:'02 혈압',source:'bp',kind:'measure',rows:[['sys','수축기','mmHg',[70,220],'일반 성인 참고: 120mmHg 미만'],['dia','이완기','mmHg',[40,130],'일반 성인 참고: 80mmHg 미만']],note:'두 수치와 측정 환경·반복 측정을 함께 확인합니다. 일반 참고 범위는 개인 치료 목표가 아닙니다.'},
  {title:'03 혈당',source:'glucose',kind:'lab',rows:[['glucose','공복혈당','mg/dL',[40,250],'공복 혈장 포도당의 일반 참고: 100mg/dL 미만. 공복·검사 방식 확인 필요'],['postGlucose','식후 혈당','mg/dL',null,'일반 식사와 75g 부하검사, 경과 시간을 구분해 확인'],['hba1c','당화혈색소 HbA1c','%',[4,10],'일반 참고: 5.7% 미만. 치료 목표·검사 해석은 개인 조건에 따라 다름']],note:'식후 측정값을 공복혈당 기준으로 평가하지 않습니다. 입력만으로 당뇨병을 확정하지 않습니다.'},
  {title:'04 혈중 지질',source:'lipids',kind:'lab',rows:[['totalChol','총콜레스테롤','mg/dL',[100,350],'전체 지질 항목을 함께 확인. 검사기관 기준·개인 위험도 확인'],['ldl','LDL 콜레스테롤','mg/dL',[30,250],'심혈관 위험도에 따라 개인 목표가 달라집니다'],['hdl','HDL 콜레스테롤','mg/dL',[20,100],'총콜레스테롤·LDL·중성지방과 함께 확인'],['tg','중성지방','mg/dL',[0,500],'공복 여부와 검사 조건을 함께 확인']],note:'지질 수치를 하나의 점수로 합치지 않습니다. LDL을 다른 수치에서 자동 추정하지 않습니다.'}
 ];
 const extras=[{title:'간 관련 검사',source:'labs',kind:'lab',rows:[['ast','AST','U/L'],['alt','ALT','U/L'],['ggt','γ-GTP','U/L']]},{title:'신장 관련 검사',source:'labs',kind:'lab',rows:[['creatinine','크레아티닌','mg/dL'],['egfr','eGFR','mL/min/1.73m²']]},{title:'빈혈 관련 검사',source:'labs',kind:'lab',rows:[['hemoglobin','혈색소','g/dL']]}];
 const life={title:'활동·생활 기록',kind:'life',rows:[['steps','걸음수','걸음/일'],['activeMinutes','활동 시간','분/일'],['sleepHours','수면 시간','시간/일'],['drinkingDays','최근 7일 음주','일']]};
 const fixture={
  balance:{age:35,sex:'여성',height:165,weight:60,waist:73,bodyFat:27,sys:114,dia:74,glucose:92,postGlucose:118,hba1c:5.3,totalChol:178,ldl:98,hdl:62,tg:88,ast:20,alt:18,ggt:17,creatinine:0.7,egfr:100,hemoglobin:13.2,steps:7200,activeMinutes:35,sleepHours:7.2,drinkingDays:0},
  weight:{age:45,sex:'남성',height:175,weight:82.6,waist:94,bodyFat:28,sys:134,dia:86,glucose:108,postGlucose:146,hba1c:5.8,totalChol:212,ldl:138,hdl:44,tg:185,ast:29,alt:38,ggt:43,creatinine:0.9,egfr:96,hemoglobin:15.0,steps:4100,activeMinutes:20,sleepHours:6.3,drinkingDays:2},
  condition:{age:58,sex:'여성',height:160,weight:64.1,waist:84,bodyFat:31,sys:128,dia:78,glucose:104,postGlucose:135,hba1c:5.6,totalChol:196,ldl:112,hdl:55,tg:135,ast:22,alt:21,ggt:19,creatinine:0.8,egfr:82,hemoglobin:12.8,steps:6500,activeMinutes:25,sleepHours:7,drinkingDays:0}
 };
 const make=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e;};
 function value(v){if(v===undefined||v===null||String(v).trim()==='')return null;const n=Number(v);return Number.isFinite(n)&&n>=0?n:NaN;}
 function row(config,data){
  const [key,title,unit,axis,reference]=config,v=value(data[key]),wrap=make('div','mg-row'),head=make('div','mg-row-top');
  const label=make('span','',title),number=make('strong',v===null?'mg-empty':Number.isNaN(v)?'mg-invalid':'',v===null?'미입력':Number.isNaN(v)?'입력 확인 필요':String(v));
  if(v!==null&&!Number.isNaN(v))number.append(make('small','',unit));head.append(label,number);wrap.append(head);
  if(axis&&v!==null&&!Number.isNaN(v)){
   const meter=make('div','mg-meter');meter.setAttribute('role','img');meter.setAttribute('aria-label',title+' '+v+' '+unit+'. 숫자 축 '+axis[0]+'~'+axis[1]+'. 건강 등급이 아닙니다. 축 밖 값은 끝에 표시합니다.');
   const mark=make('i');mark.style.left=Math.max(0,Math.min(100,(v-axis[0])/(axis[1]-axis[0])*100))+'%';meter.append(mark);wrap.append(meter);
   const labels=make('div','mg-axis');labels.append(make('span','',axis[0]),make('span','','숫자 축 · 건강 등급 아님'),make('span','',axis[1]));wrap.append(labels);
  }
  if(reference)wrap.append(make('div','mg-reference',reference));return wrap;
 }
 function card(group,data,demo){
  const el=make('section','mg-card');el.append(make('h4','',group.title));
  const date=group.kind==='measure'?data.measured:group.kind==='lab'?data.labMeasured:data.measured;
  const source=demo?'가상 기록':data.labSource||'출처 미입력';
  let meta=(group.kind==='lab'?'검사일: ':'측정·기록일: ')+(date||'미입력')+' · '+source;
  if(group.source==='bp')meta+=' · 측정 환경: '+(data.bpContext||'미확인');
  if(group.source==='glucose')meta+=' · 공복: '+(data.fasting||'미확인')+' · 식후: '+(data.postType||'미확인')+' / '+(data.postHours||'미입력')+'시간';
  el.append(make('p','mg-meta',meta));group.rows.forEach(r=>el.append(row(r,data)));
  if(group.kind==='life')el.append(make('p','mg-foot','흡연 기록: '+(data.smoking||'미확인')+' · 활동·수면은 건강점수로 환산하지 않습니다.'));
  if(group.note)el.append(make('p','mg-foot',group.note));
  if(group.source){const a=make('a','mg-source-link','기준·검사 설명 출처 ↗');a.href=sources[group.source];a.target='_blank';a.rel='noopener noreferrer';el.append(a);}
  return el;
 }
 function render(target,data,demo){
  const v=value(data.height),w=value(data.weight);data.bmi=v>0&&w>0?Number((w/((v/100)**2)).toFixed(1)):'';
  const root=document.getElementById(target),intro=make('div','mg-intro');intro.append(make('h3','','주요 건강 지표'),make('p','',(demo?'모든 수치는 가상 사례입니다. ':'현재 화면 입력값입니다. ')+(data.age?data.age+'세 · ':'연령 미입력 · ')+(data.sex||'성별 미선택')+' / 일반 참고 범위·또래 통계·개인 치료 목표는 서로 다릅니다.'));
  const grid=make('div','mg-grid');groups.forEach(g=>grid.append(card(g,data,demo)));
  const details=make('details','mg-extra'),summary=make('summary','','추가 검사 항목 — 간·신장·빈혈');details.append(summary,make('p','mg-foot','검사 결과가 있는 항목만 확인합니다. 검사기관의 참고 범위와 의료진 해석이 필요하며, 여기서는 수치만 표시합니다.'));
  const extraGrid=make('div','mg-grid');extras.forEach(g=>extraGrid.append(card(g,data,demo)));details.append(extraGrid);
  const living=make('div','mg-life');living.append(card(life,data,demo));root.replaceChildren(intro,grid,details,living);
 }
 function updateInput(){render('mg-input',Object.fromEntries(new FormData(state)),false);}
 function updateDemo(){const key=document.querySelector('[data-cp-profile][aria-pressed=true]')?.dataset.cpProfile||'balance';const data={...fixture[key],measured:'2026-10-22',labMeasured:'2026-10-08',fasting:'8시간 이상 공복 확인',postType:'일반 식사 후',postHours:2,bpContext:'가정',smoking:'흡연하지 않음'};render('mg-demo',data,true);}
 state.addEventListener('input',updateInput);state.addEventListener('change',updateInput);state.addEventListener('submit',updateInput);
 document.querySelector('[data-hi-sample]')?.addEventListener('click',updateInput);
 document.querySelectorAll('[data-cp-profile]').forEach(b=>b.addEventListener('click',updateDemo));
 updateDemo();updateInput();
})();
