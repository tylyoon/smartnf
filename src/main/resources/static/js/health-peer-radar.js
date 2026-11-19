'use strict';
(()=>{
 const axes=[['bmi','BMI','kg/m²',0,0],['sys','수축기 혈압','mmHg',1,0],['dia','이완기 혈압','mmHg',1,1],['glucose','공복혈당','mg/dL',2,0],['totalChol','총콜레스테롤','mg/dL',3,0],['ldl','LDL','mg/dL',3,1],['hdl','HDL','mg/dL',3,2],['tg','중성지방','mg/dL',3,3]];
 let dataset=null,promise=null,error=false,last=null,sequence=0,bpGroup='포함';
 const E=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
 const S=(tag,attrs={},text)=>{const n=document.createElementNS('http://www.w3.org/2000/svg',tag);for(const [k,v]of Object.entries(attrs))n.setAttribute(k,String(v));if(text!==undefined)n.textContent=text;return n;};
 const numeric=v=>v===null||v===undefined||String(v).trim()===''?null:Number.isFinite(Number(v))&&Number(v)>0?Number(v):null;
 function reference(data,key,age,sex,group='포함'){
  if(!Number.isInteger(age)||age<20||!['남성','여성'].includes(sex))return null;
  const found=data.records.filter(r=>r.metric===key&&r.region==='전국'&&r.sex===sex&&age>=r.age_min&&(r.age_max===null||age<=r.age_max)&&r.cohort===(['sys','dia'].includes(key)?group:'원본 집단'));
  return found.length===1&&Number.isFinite(found[0].mean)&&found[0].mean>0?found[0]:null;
 }
 function validate(data){
  if(!data||data.schema_version!==1||!data.sources||!Array.isArray(data.records)||data.records.length!==540)throw Error('REFERENCE_FORMAT');
  const seen=new Set();for(const r of data.records){const id=[r.metric,r.region,r.sex,r.age_min,r.age_max,r.cohort].join('|');if(seen.has(id)||!Number.isFinite(r.mean)||r.mean<=0||!data.sources[r.source]||r.unit!==data.sources[r.source].unit)throw Error('REFERENCE_FORMAT');seen.add(id);}
  return data;
 }
 function load(){return promise||(promise=fetch('/js/data/nhis-peer-reference-v1.json?v=20261027-radar1',{credentials:'same-origin'}).then(r=>{if(!r.ok)throw Error('REFERENCE_FETCH');return r.json();}).then(validate).then(d=>{dataset=d;return d;}).catch(()=>{error=true;return null;}));}
 function records(ctx){
  const age=numeric(ctx.d.get('age')),sex=ctx.d.get('sex');
  return axes.map(([key,label,unit,cardIndex,rowIndex])=>{
   let value;if(key==='bmi'){const h=numeric(ctx.d.get('height')),w=numeric(ctx.d.get('weight'));value=h&&w?w/(h/100)**2:null;}else value=numeric(ctx.d.get(key));
   const metric=ctx.grid.children[cardIndex]?.querySelectorAll('.sl-metric')[rowIndex],badge=metric?.querySelector('.sl-badge');
   const ref=reference(dataset,key,age,sex,bpGroup);let why='';
   if(!Number.isInteger(age)||age<20)why='20세 이상 연령 확인';else if(!['남성','여성'].includes(sex))why='성별 확인';else if(!ref)why='평균 자료 없음';else if(value===null)why='수치 미입력';
   if(!ctx.isDemoView&&value!==null){const names=key==='bmi'?['age','height','weight']:['age',key];if(names.some(name=>{const node=document.querySelector('#health-state-form')?.elements.namedItem(name);return node&&typeof node.checkValidity==='function'&&!node.checkValidity();}))why='입력 범위 확인';}
   const ratio=!why&&ref?value/ref.mean*100:null;if(value===null&&why!=='수치 미입력')why='수치 미입력 · '+why;return {key,label,unit,value,ref,why,ratio,plotValue:why==='입력 범위 확인'?null:value};
  });
 }
 const fmt=value=>value===null?'—':Number(value.toFixed(2)).toLocaleString('ko-KR',{maximumFractionDigits:2});
 // Display limits only: these are axis ranges, never clinical reference limits.
 const displayMax={bmi:40,sys:200,dia:120,glucose:200,totalChol:400,ldl:200,hdl:100,tg:300};
 function axisScale(row){
  const base=displayMax[row.key]||100,peak=Math.max(0,row.value||0,row.ref?.mean||0);let max=base;
  if(peak>base){const wanted=peak*1.1,power=10**Math.floor(Math.log10(wanted));max=[1,1.2,1.5,2,2.5,3,4,5,6,8,10].map(n=>n*power).find(n=>n>=wanted)||power*10;}
  return {min:0,max,ticks:[max/4,max/2,max*3/4,max]};
 }
 function chart(rows){
  const svg=S('svg',{viewBox:'0 0 1000 860',role:'img','aria-labelledby':'peer-chart-title peer-chart-desc'}),scales=rows.map(axisScale),cx=500,cy=420,radius=260;
  svg.append(S('title',{id:'peer-chart-title'},'지표별 실제 단위 눈금으로 보는 내 수치와 또래 평균'),S('desc',{id:'peer-chart-desc'},'축마다 표시 범위가 다릅니다. 회색 점선은 또래 평균, 초록색 점과 선은 내 수치입니다. 각 축 바깥에 내 값과 기준인 또래 평균을 숫자로 표시합니다. 범위와 도형 면적은 정상 범위나 건강 점수가 아닙니다.'));
  const angle=i=>i/8*2*Math.PI-Math.PI/2;
  const at=(i,f)=>[cx+Math.cos(angle(i))*radius*f,cy+Math.sin(angle(i))*radius*f];
  const point=(i,value)=>at(i,value/scales[i].max);
  for(const f of [.25,.5,.75,1])svg.append(S('polygon',{points:rows.map((_,i)=>at(i,f).join(',')).join(' '),fill:'none',stroke:'#d6e4dc','stroke-width':1.2}));
  rows.forEach((row,i)=>{
   const [x,y]=at(i,1);svg.append(S('line',{x1:cx,y1:cy,x2:x,y2:y,stroke:'#ceddd4','stroke-width':1}));
   for(const tick of scales[i].ticks){const [tx,ty]=point(i,tick),nx=Math.cos(angle(i)+Math.PI/2),ny=Math.sin(angle(i)+Math.PI/2);const label=S('text',{x:tx+nx*10,y:ty+ny*10,'text-anchor':nx>.2?'start':nx<-.2?'end':'middle','dominant-baseline':'middle',fill:'#617369','font-size':13,class:'peer-axis-tick','data-axis':row.key},fmt(tick));svg.append(label);}
   const [lx,ly]=at(i,1.31),group=S('g',{class:'peer-axis-label','data-axis':row.key});
   group.append(S('text',{x:lx,y:ly-7,'text-anchor':'middle',fill:'#244a39','font-size':19,'font-weight':700},(row.key==='sys'?'수축기':row.key==='dia'?'이완기':row.label)+' ('+row.unit+')'));
   group.append(S('text',{x:lx,y:ly+17,'text-anchor':'middle',fill:'#08765a','font-size':18,'font-weight':700,class:'peer-own-number'},'내 값 '+fmt(row.plotValue)));
   group.append(S('text',{x:lx,y:ly+40,'text-anchor':'middle',fill:'#65746d','font-size':17,class:'peer-reference-number'},'기준(평균) '+(row.ref?fmt(row.ref.mean):'자료 없음')));svg.append(group);
  });
  const own=rows.filter(r=>r.plotValue!==null).length;
  if(own===8)svg.append(S('polygon',{class:'peer-own-area',points:rows.map((r,i)=>point(i,r.plotValue).join(',')).join(' '),fill:'#16846420',stroke:'none'}));
  rows.forEach((row,i)=>{
   const next=(i+1)%rows.length;
   if(row.ref&&rows[next].ref){const a=point(i,row.ref.mean),b=point(next,rows[next].ref.mean);svg.append(S('line',{x1:a[0],y1:a[1],x2:b[0],y2:b[1],stroke:'#7a858a','stroke-width':2.5,'stroke-dasharray':'7 5',class:'peer-reference-line'}));}
   if(row.ref){const [x,y]=point(i,row.ref.mean);svg.append(S('rect',{x:x-3,y:y-3,width:6,height:6,fill:'#7a858a',class:'peer-reference-point'}));}
   if(row.plotValue!==null&&rows[next].plotValue!==null){const a=point(i,row.plotValue),b=point(next,rows[next].plotValue);svg.append(S('line',{x1:a[0],y1:a[1],x2:b[0],y2:b[1],stroke:'#08765a','stroke-width':3.5,class:'peer-own-line'}));}
   if(row.plotValue!==null){const [x,y]=point(i,row.plotValue),dot=S('circle',{cx:x,cy:y,r:6,fill:'#08765a',stroke:'#fff','stroke-width':2,class:'peer-own-point','data-axis':row.key,'data-max':scales[i].max});dot.append(S('title',{},row.label+' 내 값 '+fmt(row.plotValue)+' '+row.unit+' / 기준(또래 평균) '+(row.ref?fmt(row.ref.mean):'자료 없음')+' / 축 범위 0~'+fmt(scales[i].max)));svg.append(dot);}
  });
  return svg;
 }
 function draw(ctx){
  const {host,demo}=ctx;host.replaceChildren();host.classList.add('peer-overview');host.append(E('h3','종합평가 — 또래 평균과 나의 건강지표','peer-common-title'));
  host.append(E('p',document.querySelector('#sl-context')?.textContent||'','sl-overview-context'));
  if(!dataset){const msg=E('p',error?'평균 자료를 불러오지 못했습니다. 기존 상세 평가는 아래에서 확인하세요.':'공식 평균 자료를 불러오고 있습니다.','peer-message');msg.setAttribute('role','status');host.append(msg);if(error){const retry=E('button','평균 자료 다시 불러오기','hi-secondary');retry.type='button';retry.onclick=()=>{promise=null;error=false;render(last);};host.append(retry);}return;}
  const rows=records(ctx),valid=rows.filter(r=>r.ratio!==null).length;
  const missingSex=!['남성','여성'].includes(ctx.d.get('sex')),missingAge=!Number.isInteger(numeric(ctx.d.get('age')))||numeric(ctx.d.get('age'))<20;
  if(missingSex||missingAge){const message=E('div',undefined,'peer-message');message.setAttribute('role','status');message.append(E('p',(missingSex?'성별을 선택하면 같은 성별·연령대의 또래 평균과 비교할 수 있습니다. ':'')+(missingAge?'또래 평균 자료는 20세 이상 나이가 필요합니다.':'')));const edit=E('button','나의 상태 기본정보 확인','hi-secondary');edit.type='button';edit.onclick=()=>{document.querySelector('[data-hi-tab="state"]')?.click();const node=document.querySelector(missingSex?'#hi-basic-sex':'#health-state-form [name="age"]');node?.scrollIntoView({block:'center'});node?.focus({preventScroll:true});};message.append(edit);host.append(message);}

  const tools=E('div',undefined,'peer-controls'),label=E('label','혈압 평균 비교 집단 '),select=E('select');select.setAttribute('aria-label','혈압 평균 비교 집단');for(const value of ['포함','제외']){const o=E('option','고혈압약 복용자 '+value);o.value=value;o.selected=bpGroup===value;select.append(o);}select.onchange=()=>{bpGroup=select.value;draw(last);};label.append(select);tools.append(label,E('span',(demo?'가상 사용자 예시':'내 입력')+' · 내 수치 '+rows.filter(r=>r.plotValue!==null).length+'/8개 · 평균 비교 '+valid+'/8개','peer-count'));host.append(tools);
  host.append(E('p','초록색 점·선: 내 입력값 / 회색 점선: 같은 성별·연령구간의 또래 평균. 각 축은 지표별 실제 단위와 서로 다른 눈금을 사용합니다. 축 바깥의 ‘내 값’과 ‘기준(평균)’을 함께 확인하세요.','peer-note'));
  const body=E('div',undefined,'peer-layout'),visual=E('div',undefined,'peer-chart');visual.append(E('p','작은 화면에서는 그래프를 좌우로 움직여 모든 항목을 확인하세요.','peer-scroll-hint'),chart(rows));body.append(visual);
  const box=E('div',undefined,'peer-table-wrap'),table=E('table',undefined,'peer-table'),caption=E('caption','실제 수치와 평균 비교','peer-sr-only');table.append(caption);
  const head=E('thead'),tr=E('tr');for(const text of ['지표','내 수치','또래 평균','평균 대비(%)']){const th=E('th',text);th.scope='col';tr.append(th);}head.append(tr);table.append(head);const tbody=E('tbody');
  for(const row of rows){const tr=E('tr'),label=E('th',row.label);label.scope='row';label.append(E('small',row.unit));tr.append(label,E('td',fmt(row.value)),E('td',row.ref?fmt(row.ref.mean):'—'),E('td',row.ratio===null?row.why:fmt(row.ratio)));if(row.why)tr.className='peer-incomplete';tbody.append(tr);}table.append(tbody);box.append(table);body.append(box);host.append(body);const notes=E('div',undefined,'peer-common-notes');notes.append(E('p','각 축의 0~최댓값은 표시를 위한 범위이며 정상 범위가 아닙니다. 값이 범위를 넘으면 해당 축만 확장합니다. 도형의 면적·뾰족함으로 건강 상태를 판단하지 마세요. 기준(또래 평균)은 정상·질환별 치료 목표와 다릅니다. 임상 참고 기준은 아래 지표별 상세 평가에서 확인하세요. 미입력은 0으로 채우지 않으며 해당 점·연결선은 생략합니다.','peer-note'),E('p','당화혈색소·식후혈당의 대응 평균은 이번 자료에 없어 차트에서 제외했습니다. 기존 상세 평가에서 확인하세요.','peer-note'));host.append(notes);
  const details=E('details',undefined,'peer-sources'),summary=E('summary','평균의 출처·연령구간·수검연도·비교 집단');details.append(summary);
  details.append(E('p','출처: 국민건강보험공단 한국인 건강지수 참조표준. 공공누리 제2유형(출처표시·상업적 이용금지). 전국 건강검진 수검자 자료이며 전체 국민 평균·개인 치료 목표와 구분합니다. 자료별 수검연도와 포함 집단이 다를 수 있습니다.','peer-note'));
  for(const row of rows){if(!row.ref)continue;const source=dataset.sources[row.ref.source];details.append(E('p',row.label+' · '+row.ref.sex+' '+row.ref.age_label+' · '+row.ref.region+' · n='+row.ref.n.toLocaleString('ko-KR')+' · '+(source.period||'수검연도 추가 확인 필요')+' · '+(['sys','dia'].includes(row.key)?'고혈압약 복용자 '+row.ref.cohort:'원본 참조 집단')+' / '+source.file+' / '+row.ref.sheet+' '+row.ref.row+'행','peer-note'));}
  const link=E('a','공식 참조표준 제공 안내 ↗','sl-source');link.href='https://nhiss.nhis.or.kr/lp/f/h/002/lpfh002m01.do?rfrnStndCd=STND00011';link.target='_blank';link.rel='noopener noreferrer';details.append(link);host.append(details);
 }
 function render(ctx){last=ctx;const token=++sequence;draw(ctx);if(!dataset&&!error)load().then(()=>{if(token===sequence&&last.host.isConnected)draw(last);});}
 window.SmartNFPeerRadar={render,reference,validate,axisScale};
})();
