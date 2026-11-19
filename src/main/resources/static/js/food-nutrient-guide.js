'use strict';
(()=>{
 const definitions={sodium:['나트륨','mg',2000],carbohydrate:['탄수화물','g',324],sugars:['당류','g',100],fiber:['식이섬유','g',25],protein:['단백질','g',55],fat:['지방','g',54],saturated_fat:['포화지방','g',15],trans_fat:['트랜스지방','g',null],energy:['열량','kcal',2000]};
 const keys={bp:['sodium','potassium'],diabetes:['carbohydrate','sugars','fiber'],lipid:['saturated_fat','trans_fat','fiber'],weight:['energy','protein','fat','carbohydrate']};
 const titles={bp:'혈압 관리',diabetes:'혈당 관리',lipid:'혈중 지질 관리',weight:'체중 관리'};
 const sources={general:['식약처 · 1일 영양성분 기준치','https://www.law.go.kr/법령/식품등의표시ㆍ광고에관한법률시행규칙'],bp:['질병관리청 · 고혈압 환자의 식이요법','https://health.kdca.go.kr/healthinfo/biz/health/gnrlzHealthInfo/gnrlzHealthInfo/gnrlzHealthInfoView.do?cntnts_sn=6855'],lipid:['질병관리청 · 이상지질혈증 식사요법','https://health.kdca.go.kr/healthinfo/biz/health/gnrlzHealthInfo/gnrlzHealthInfo/gnrlzHealthInfoView.do?cntnts_sn=6714'],diabetes:['대한당뇨병학회 · 식사요법','https://www.diabetes.or.kr/general/dietary/dietary_06.php?con=5']};
 definitions.potassium=['칼륨','mg',3500];
 const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
 function reference(key,conditions){
  const active=conditions.filter(c=>keys[c]?.includes(key));
  if(key==='sodium'&&active.includes('bp'))return {value:2000,text:'하루 제한 기준 2,000mg 이하',source:'bp',limit:true};
  if(key==='fiber'&&active.includes('lipid'))return {value:25,text:'하루 섭취 권고 25g 이상',source:'lipid'};
  if(key==='saturated_fat'&&active.includes('lipid'))return {energyPercent:7,text:'하루 총열량의 7% 미만 · 고정 g 기준으로 환산하지 않음',source:'lipid'};
  if(key==='trans_fat')return {text:'가능한 한 섭취하지 않기 · 수치 비율 없음',source:'lipid'};
  if(key==='potassium')return {text:'식품 함량 확인 · 콩팥 기능·복약에 따라 제한이 달라질 수 있음',source:'bp'};
  if(active.includes('diabetes'))return {text:'탄수화물의 양·가당 여부·식이섬유를 함께 확인 · 일률적인 하루 g 기준 없음',source:'diabetes'};
  return {text:'체중 관리 시 실제 식사량·조리 방법과 함께 확인 · 일률적인 하루 기준 없음'};
 }
 const relevant=conditions=>[...new Set(conditions.flatMap(c=>keys[c]||[]))];
 function baseLabel(r){const b=String(r.basis||r.basis_raw||'');return /100\s*ml/i.test(b)?'100mL 기준':/100\s*g/i.test(b)?(r.kind==='ingredient'?'가식부 100g 기준':'100g 기준'):null;}
 function number(r,key){const n=r.nutrients?.[key];return n&&['numeric','quoted_or_calculated'].includes(n.status)&&Number.isFinite(n.value)&&n.value>=0&&n.unit===definitions[key]?.[1]?n.value:null;}
 function sourceLinks(host,conditions){const details=el('details');details.append(el('summary','기준 출처·적용 범위'));details.append(el('p','일반 기준은 식품 표시용 공통 비교 기준이며, 연령·성별 권장섭취량이나 개인 치료 목표가 아닙니다. 열량 2,000kcal는 공통 비교용 참고값입니다. 당류 100g은 권장 목표·첨가당 허용량이 아닙니다. 기준 확인일: 2026-11-04.'));
  for(const key of ['general',...new Set(conditions)].filter(x=>sources[x])){const a=el('a',sources[key][0]+' ↗');a.href=sources[key][1];a.target='_blank';a.rel='noopener noreferrer';details.append(a);}host.append(details);
 }
 const format=n=>n.toLocaleString('ko-KR',{maximumFractionDigits:4});
 function positions(general,managed,food=null){
  const valid=n=>typeof n==='number'&&Number.isFinite(n)&&n>=0,points=[];
  if(valid(general)&&valid(managed)&&general===managed)points.push({kind:'combined',label:'일반·질환별 관리 기준',value:general});
  else{if(valid(general))points.push({kind:'general',label:'일반 기준',value:general});if(valid(managed))points.push({kind:'managed',label:'질환별 관리 기준',value:managed});}
  if(valid(food))points.push({kind:'food',label:'이 식품',value:food});
  const largest=Math.max(0,...points.map(p=>p.value)),step=largest>0?Math.pow(10,Math.floor(Math.log10(largest)))/5:1,max=largest>0?Math.ceil(largest*1.12/step)*step:1;
  return {max,points:points.map(p=>({...p,percent:p.value/max*100}))};
 }
 function positionChart(host,general,managed,unit,food=null){
  const model=positions(general,managed,food);if(!model.points.some(p=>p.kind!=='food'))return;
  const chart=el('div',undefined,'ng-position-chart'),plot=el('div',undefined,'ng-position-plot'),rail=el('div',undefined,'ng-position-rail');chart.dataset.unit=unit;plot.append(rail);plot.setAttribute('role','img');plot.setAttribute('aria-label','눈금 0~'+format(model.max)+' '+unit+' · '+model.points.map(p=>p.label+' '+format(p.value)+' '+unit).join(' · '));
  const legend=el('div',undefined,'ng-position-legend');
  for(const point of model.points){const mark=el('span',undefined,'ng-position-mark ng-point-'+point.kind);mark.style.left=point.percent+'%';mark.dataset.kind=point.kind;mark.dataset.value=String(point.value);mark.setAttribute('aria-hidden','true');plot.append(mark);const line=el('div',undefined,'ng-position-key ng-key-'+point.kind);line.append(el('span',undefined,'ng-position-symbol'),el('span',point.label),el('strong',format(point.value)+' '+unit));legend.append(line);}
  const axis=el('div',undefined,'ng-position-axis');axis.append(el('span','0'),el('span',format(model.max)+' '+unit));chart.append(plot,axis,legend);host.append(chart);
 }
 function standardNotes(row,key,value,ref){
  row.append(el('p','일반 기준: '+(value===null?'수치 기준 없음':format(value)+' '+definitions[key][1]+(key==='energy'?' · 비교용 참고 열량':' · 영양표시 기준치')),'fn-muted'),el('p','질환별 관리 기준: '+ref.text,'fn-muted'));
  if(value!==null&&ref.value===value)row.append(el('p','일반 기준과 관리 기준은 수치가 같아 하나로 표시합니다. 기준의 의미는 서로 다를 수 있습니다.','ng-same'));
 }
 function renderStandards(host,conditions){host.replaceChildren(el('h3','일반 기준 · 질환별 관리 기준'),el('p',conditions.map(c=>titles[c]).join(' · '),'fn-muted'),el('p','하나의 눈금에 하루 기준 위치를 표시합니다. 식품 함량은 아래 식품 상세에서 확인하세요.','fn-muted'));
  for(const key of relevant(conditions)){const [label,unit,value]=definitions[key],ref=reference(key,conditions),row=el('section',undefined,'ng-standard');row.dataset.standardNutrient=key;row.append(el('strong',label));positionChart(row,value,ref.value,unit);standardNotes(row,key,value,ref);host.append(row);}
  sourceLinks(host,conditions);
 }
 function renderFood(host,r,conditions){host.replaceChildren(el('h3',r.name));const basis=baseLabel(r);host.append(el('p',basis||'영양 기준량 미확인','ng-basis'));
  if(r.scope==='ingredient_linked_recipe_not_therapeutic'||!basis){host.append(el('p','참고 레시피는 음식 전체의 영양 기준량이 확인되지 않아 비율 그래프를 표시하지 않습니다. 원문 재료와 조리법을 확인하세요.'));return;}
  host.append(el('p','식품 기준량 비교이며 실제 하루 섭취량이 아닙니다. 막대가 높을수록 좋은 의미는 아닙니다.','fn-muted'));
  for(const key of relevant(conditions)){const [label,unit,target]=definitions[key],value=number(r,key),ref=reference(key,conditions),row=el('section',undefined,'ng-nutrient');row.append(el('strong',label+' · '+(value===null?({trace:'미량 · 정확한 수치 없음',unmeasured:'미측정'}[r.nutrients?.[key]?.status]||'정보 없음'):value.toLocaleString()+' '+unit+(r.nutrients?.[key]?.status==='quoted_or_calculated'?' (인용·계산값)':''))));
   row.dataset.foodNutrient=key;positionChart(row,target,ref.value,unit,value);
   if(target===null&&!ref.value)row.append(el('p','수치 기준이 없어 함량만 표시합니다.','fn-muted'));
   if(value===null)row.append(el('p','식품의 정확한 함량 정보가 없어 식품 위치는 표시하지 않습니다.','fn-muted'));
   if(value!==null&&target!==null)row.append(el('p','일반 기준 대비 '+(value/target*100).toFixed(1)+'%','fn-muted'));
   if(value!==null&&ref.value&&ref.value!==target)row.append(el('p','질환별 관리 기준 대비 '+(value/ref.value*100).toFixed(1)+'%','fn-muted'));
   if(value!==null&&ref.limit&&ref.value&&value>ref.value)row.append(el('p','이 식품 기준량의 함량이 하루 관리 제한 기준을 초과합니다.','fc-warn'));
   standardNotes(row,key,target,ref);host.append(row);
  }sourceLinks(host,conditions);
 }
 window.SmartNFNutrientGuide={renderStandards,renderFood,reference,number,baseLabel,relevant,positions};
})();
