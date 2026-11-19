'use strict';
(() => {
 const form=document.querySelector('#health-state-form');if(!form)return;
 const root='https://health.kdca.go.kr/healthinfo/biz/health/gnrlzHealthInfo/gnrlzHealthInfo/gnrlzHealthInfoView.do?cntnts_sn=';
 const sources={bmi:root+'6774',bp:'https://www.amc.seoul.kr/health/personal/checkInformation.do?checkno=44',glucose:root+'5305',lipid:root+'6715',lab:root+'5531',lowbp:root+'5259',lowglucose:root+'6900'};
 const make=(tag,cls,text)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(text!==undefined)el.textContent=text;return el;};
 const num=(d,key)=>{const raw=d.get(key);if(raw===null||String(raw).trim()==='')return null;const n=Number(raw);return Number.isFinite(n)&&n>0?n:NaN;};
 const state=(label,tone='pending',note='')=>({label,tone,note});
 function gate(d,keys,lab=false){
  if(keys.some(k=>num(d,k)===null))return state('평가 전','pending','필요한 수치를 먼저 입력하세요.');
  if(keys.some(k=>!Number.isFinite(num(d,k))))return state('입력 확인 필요','pending','0 이하이거나 유효하지 않은 값입니다.');
  if(!(num(d,'age')>=19)||d.get('referenceContext')!=='일반 성인 참고')return state('기준 확인 필요','pending','일반 성인 참고 적용 상태를 확인하세요. 소아·임신 등 별도 기준은 연결 전입니다.');
  const date=d.get(lab?'labMeasured':'measured');
  if(!date)return state(lab?'검사일 확인 필요':'측정일 확인 필요');
  const today=new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Seoul'}).format(new Date());
  if(date>today)return state('날짜 확인 필요','pending','미래 날짜의 측정·검사값으로 평가할 수 없습니다.');
  return null;
 }
 const unitValue=(v,unit)=>v===null?'미입력':!Number.isFinite(v)?'입력 확인 필요':v+' '+unit;
 function metric(title,value,unit,result,reference,range,cuts){
  const el=make('div','sl-metric');const head=make('div','sl-metric-head');head.append(make('span','',title),make('strong','',unitValue(value,unit)));el.append(head);
  const badge=make('span','sl-badge sl-'+result.tone,result.label);el.append(badge);
  if(range&&Number.isFinite(value)){
   // Display existing reference boundaries only; evaluation rules below are unchanged.
   const references=cuts||({'BMI':[18.5,23,25,30],'수축기':[120,130,140,160],'이완기':[80,90,100],'공복혈당':[70,100,126],'당화혈색소':[5.7,6.5]}[title]||[]);
   const points=[...new Set(references)].filter(v=>Number.isFinite(v)&&v>range[0]&&v<range[1]).sort((a,b)=>a-b);
   const position=v=>Math.max(0,Math.min(100,(v-range[0])/(range[1]-range[0])*100));
   const chart=make('div','sl-visual'),meter=make('div','sl-meter sl-meter-visual');
   meter.setAttribute('role','img');meter.setAttribute('aria-label',title+' '+value+' '+unit+', '+result.label+'. 숫자 축 '+range[0]+'~'+range[1]+(points.length?'. 기존 참고선 '+points.join(', '):'')+'. 축 밖은 끝에 표시.');
   let left=range[0];for(const right of [...points,range[1]]){const band=make('span','sl-range-band');band.style.left=position(left)+'%';band.style.width=(position(right)-position(left))+'%';meter.append(band);left=right;}
   for(const [index,point] of points.entries()){const tick=make('span','sl-threshold');tick.style.left=position(point)+'%';tick.title='일반 참고선 '+point+' '+unit;const text=make('span','sl-threshold-label',String(point));text.style.top=index%2?'-38px':'-23px';tick.append(text);meter.append(tick);}
   const mark=make('i','sl-value-marker');mark.style.left=position(value)+'%';meter.append(mark);const own=make('span','sl-own-label','내 수치 '+value);own.style.left=Math.max(15,Math.min(85,position(value)))+'%';meter.append(own);chart.append(meter);
   const axis=make('div','sl-axis');axis.append(make('span','',range[0]),make('span','','표시 범위'),make('span','',range[1]));chart.append(axis);
   const legend=make('p','sl-visual-key','진한 표시: 내 수치  |  세로선: 일반 참고 기준'+(points.length?' '+points.join(' · '):'은 본문 확인')+(result.tone==='pending'?' · 개인 적용 조건 미확인, 건강 판정 보류':''));chart.append(legend);
   if(value<range[0]||value>range[1])chart.append(make('p','sl-axis-overflow','표시 축 '+(value<range[0]?'아래':'위')+'의 값입니다. 실제 수치는 '+value+' '+unit+'입니다.'));
   el.append(chart);
  }else el.append(make('p','sl-no-visual',value===null?'입력하면 내 수치 위치를 확인할 수 있어요.':!Number.isFinite(value)?'유효한 수치를 확인해 주세요.':'검사 방식에 맞는 기준 확인이 필요한 항목입니다.'));
  el.append(make('p','sl-reference',reference));if(result.note)el.append(make('p','sl-meaning',result.note));return el;
 }
 function card(title,source,date){const el=make('article','sl-card');el.append(make('h3','',title),make('p','sl-date',date));const a=make('a','sl-source','기준·출처 확인 ↗');a.href=sources[source];a.target='_blank';a.rel='noopener noreferrer';el.append(a);return el;}
 function add(card,row){card.insertBefore(row,card.lastChild);}
 let view='demo';
 const example={age:'45',height:'170',weight:'69',sex:'남성',referenceContext:'일반 성인 참고',sys:'118',dia:'76',glucose:'94',hba1c:'5.4',postGlucose:'126',postType:'일반 식사 후',postHours:'2',totalChol:'195',ldl:'120',hdl:'48',tg:'132',measured:'2026-10-22',labMeasured:'2026-10-22',fasting:'8시간 이상 공복 확인',glucoseMethod:'검사실 혈장',bpContext:'진료실',labSource:'가상 검진기관',ast:'24',alt:'21',ggt:'28',creatinine:'0.9',egfr:'95',hemoglobin:'14.2'};
 function renderOverview(d,demo){
  const host=document.querySelector('#sl-overview');if(!host)return;
  if(window.SmartNFPeerRadar)window.SmartNFPeerRadar.render({host,d,demo,isDemoView:view==='demo',grid:document.querySelector('#sl-grid')});
  else{host.replaceChildren();host.append(make('h3','','종합평가'),make('p','','비교 차트 파일을 불러오지 못했습니다. 새로고침 후 다시 확인하세요.'));}
 }
 function render(){
  const d=view==='demo'?new FormData():new FormData(form);if(view==='demo')Object.entries(example).forEach(([key,value])=>d.set(key,value));
  const age=num(d,'age'),sex=d.get('sex')||'성별 미선택',demo=view==='demo'||form.dataset.example==='true';
  document.querySelector('#sl-demo').setAttribute('aria-pressed',String(view==='demo'));document.querySelector('#sl-input').setAttribute('aria-pressed',String(view==='input'));
  document.querySelector('#sl-context').textContent=(demo?'가상 예시 · ':'현재 입력 · ')+(age?age+'세':'연령 미입력')+' · '+sex+' · '+(d.get('referenceContext')||'기준 미확인')+' / 출처: '+(d.get('labSource')||'미입력');
  const grid=document.querySelector('#sl-grid');grid.replaceChildren();
  const body=card('BMI 지수','bmi','측정일: '+(d.get('measured')||'미입력'));
  const h=num(d,'height'),w=num(d,'weight'),bmi=h>0&&w>0?w/(h/100)**2:null;
  let b=gate(d,['height','weight']);
  if(!b){b=bmi<18.5?state('저체중 구간','attention'):bmi<23?state('정상 체중 구간','reference'):bmi<25?state('비만 전 단계 구간','attention'):bmi<30?state('1단계 비만 구간','attention'):bmi<35?state('2단계 비만 구간','attention'):state('3단계 비만 구간','attention');b.note='BMI 참고 분류이며 체성분·질환·종합 건강 상태를 확정하지 않습니다.';}
  add(body,metric('BMI',bmi===null?null:Number(bmi.toFixed(1)),'kg/m²',b,'성인: <18.5 / 18.5~<23 / 23~<25 / 25~<30 / 30~<35 / ≥35',[15,35]));
  add(body,make('p','sl-meaning','계산 근거: 체중(kg) ÷ 키(m)². 분류는 반올림 전 계산값으로 적용합니다.'));grid.append(body);
  const bp=card('혈압','bp','측정일: '+(d.get('measured')||'미입력')+' · 환경: '+d.get('bpContext'));
  const sys=num(d,'sys'),dia=num(d,'dia');let br=gate(d,['sys','dia']);
  if(!br&&sys<=dia)br=state('입력 조합 확인','pending','수축기·이완기 순서를 확인하세요.');
  if(!br&&d.get('bpContext')!=='진료실')br=state('측정 조건 확인','pending','이 표는 진료실 참고 분류입니다. 가정·미확인 측정에 그대로 적용하지 않습니다.');
  if(!br){br=sys>=160||dia>=100?state('높은 수치 범위 · 확인 필요','attention'):sys>=140||dia>=90?state('140/90 이상 참고 구간','attention'):sys>=130||dia>=80?state('고혈압 전단계 참고 구간','attention'):sys>=120?state('주의혈압 참고 구간','attention'):sys<90||dia<60?state('낮은 측정값 · 확인 필요','attention'):state('정상혈압 참고 구간','reference');br.note=(sys<90||dia<60?'낮은 측정값도 함께 확인하세요. ':'')+'두 값 중 높은 분류를 확인합니다. 한 번의 측정으로 고혈압을 진단하거나 약물을 조정하지 않습니다.';}
  add(bp,metric('수축기',sys,'mmHg',br,'진료실 참고: <120 / 120~129 / 130~139 / 140~159 / ≥160',[70,220]));
  add(bp,metric('이완기',dia,'mmHg',br,'수축기와 함께 확인: <80 / 80~89 / 90~99 / ≥100',[40,130]));grid.append(bp);
  const glucose=card('혈당','glucose','검사일: '+(d.get('labMeasured')||'미입력'));
  const g=num(d,'glucose');let gr=gate(d,['glucose'],true);
  if(!gr&&(d.get('fasting')!=='8시간 이상 공복 확인'||d.get('glucoseMethod')!=='검사실 혈장'))gr=state('검사 조건 확인','pending','8시간 이상 공복·검사실 혈장 여부를 확인하세요. 자가혈당계 값은 같은 진단 기준으로 확정하지 않습니다.');
  if(!gr)gr=g<70?state('낮은 수치 · 확인 필요','attention'):g<100?state('공복 참고선 미만','reference','참고선 미만이라는 비교이며 종합 정상 판정은 아닙니다.'):g<126?state('공복혈당장애 참고 구간','attention'):state('높은 수치 · 추가 확인 필요','attention','진단에는 반복 검사와 전문가 확인이 필요합니다.');
  add(glucose,metric('공복혈당',g,'mg/dL',gr,'공복 혈장: <100 / 100~<126 / ≥126',[40,250]));
  const a=num(d,'hba1c');let ar=gate(d,['hba1c'],true);
  if(!ar&&d.getAll('conditions').includes('신장질환'))ar=state('개인 해석 확인','pending','신장질환 등에서는 검사 해석에 별도 확인이 필요합니다.');
  if(!ar)ar=a<4?state('검사기관 해석 확인','pending','표시 축 하한(4%) 미만의 값은 이 시안에서 분류를 보류합니다. 임상적 저혈당 판정 기준이 아닙니다.'):a<5.7?state('일반 참고선 미만','reference'):a<6.5?state('전단계 참고 구간','attention'):state('높은 수치 · 추가 확인 필요','attention');
  add(glucose,metric('당화혈색소',a,'%',ar,'일반 참고: <5.7 / 5.7~<6.5 / ≥6.5. 치료 목표는 개인별 확인',[4,10]));
  add(glucose,metric('식후 혈당',num(d,'postGlucose'),'mg/dL',state(num(d,'postGlucose')===null?'평가 전':'검사별 기준 확인','pending','일반 식사와 75g 부하검사, 경과 시간을 구분해야 합니다.'),'검사: '+d.get('postType')+' · 경과: '+(d.get('postHours')||'미입력')+'시간'));grid.append(glucose);
  const lipid=card('혈중 지질','lipid','검사일: '+(d.get('labMeasured')||'미입력'));
  const defs=[['totalChol','총콜레스테롤',200,[100,350]],['ldl','LDL 콜레스테롤',130,[30,250]],['hdl','HDL 콜레스테롤',sex==='남성'?40:sex==='여성'?50:null,[20,100]],['tg','중성지방',150,[0,500]]];
  defs.forEach(([key,label,line,axis])=>{
   const v=num(d,key);let r=gate(d,[key],true);
   if(!r&&line===null)r=state('성별 기준 확인','pending','HDL의 성별 참고선을 선택하려면 기준 적용 성별이 필요합니다.');
   if(!r&&key==='tg'&&d.get('fasting')!=='8시간 이상 공복 확인')r=state('공복 조건 확인','pending','중성지방은 검사 조건의 영향을 받습니다.');
   if(!r){const flag=key==='hdl'?v<line:v>=line;r=state(flag?(key==='hdl'?'낮은 참고 범위':'참고선 이상'):(key==='hdl'?'참고선 이상':'참고선 미만'),flag?'attention':'reference','일반 참고선 비교입니다. 심혈관 위험도·복약·질환에 따른 개인 목표는 별도 확인합니다.');}
   add(lipid,metric(label,v,'mg/dL',r,key==='hdl'?'낮은 HDL 참고: 남성 <40 / 여성 <50':'참고선: '+line+'mg/dL. 개인 치료 목표와 구분',axis,key==='hdl'&&line===null?[40,50]:[line]));
  });grid.append(lipid);
  const extra=document.querySelector('#sl-extra');extra.replaceChildren();
  [['간 관련 검사',[['ast','AST','U/L'],['alt','ALT','U/L'],['ggt','γ-GTP','U/L']]],['신장 관련 검사',[['creatinine','크레아티닌','mg/dL'],['egfr','eGFR','mL/min/1.73m²']]],['빈혈 관련 검사',[['hemoglobin','혈색소','g/dL']]]].forEach(([title,rows])=>{const c=make('article','sl-card');c.append(make('h3','',title));rows.forEach(([key,label,unit])=>addExtra(c,metric(label,num(d,key),unit,state(num(d,key)===null?'평가 전':'검사기관 기준 확인'),'검사기관 참고 범위·개인 조건 확인 필요')));extra.append(c);});
  renderOverview(d,demo);
 }
 function addExtra(card,row){card.append(row);}
 const showInput=()=>{view='input';render();};form.addEventListener('input',showInput);form.addEventListener('change',showInput);form.addEventListener('submit',showInput);
 document.querySelector('[data-hi-sample]').addEventListener('click',showInput);
 document.querySelector('#sl-demo').addEventListener('click',()=>{view='demo';render();});
 document.querySelector('#sl-input').addEventListener('click',showInput);
 const box=document.querySelector('#sl-sources');Object.entries({bmi:'BMI: 국가건강정보포털 / 대한비만학회 2022 참고',bp:'혈압: 서울아산병원 / 대한고혈압학회 2018 참고',glucose:'혈당: 국가건강정보포털 당뇨병',lipid:'혈중 지질: 국가건강정보포털 이상지질혈증',lab:'추가 검사: 국가건강정보포털 임상 화학 검사',lowbp:'낮은 혈압: 국가건강정보포털 저혈압',lowglucose:'낮은 혈당: 국가건강정보포털 저혈당'}).forEach(([key,title])=>{const a=make('a','sl-source',title+' ↗');a.href=sources[key];a.target='_blank';a.rel='noopener noreferrer';box.append(a);});
 render();
})();
