const labels={energy:['열량','kcal'],carbohydrate:['탄수화물','g'],protein:['단백질','g'],fat:['지방','g'],saturated_fat:['포화지방','g'],sugars:['당류','g'],sodium:['나트륨','mg'],fiber:['식이섬유','g']};
export function nutrientTargets(c){
 const t={};if(c.special||!['personal','clinician'].includes(c.targetSource))return t;
 if(Number.isFinite(c.energy)&&c.energy>=500&&c.energy<=6000){t.energy={min:c.energy,max:c.energy,type:'target',source:'입력한 하루 목표'};
  if(c.general)for(const [k,lo,hi,factor]of [['carbohydrate',.5,.65,4],['protein',.1,.2,4],['fat',.15,.3,9]])t[k]={min:c.energy*lo/factor,max:c.energy*hi/factor,type:'range',source:'2025 KDRI 비율 × 입력 열량'};
 }
 if(Number.isFinite(c.sodium)&&c.sodium>=100&&c.sodium<=10000)t.sodium={min:0,max:c.sodium,type:'upper',source:'입력한 하루 상한'};
 for(const [key,max]of [['carbohydrate',1500],['protein',500],['fat',500],['saturated_fat',200],['sugars',500],['fiber',150]]){const v=c.personal?.[key];if(Number.isFinite(v)&&v>0&&v<=max)t[key]={min:['saturated_fat','sugars'].includes(key)?0:v,max:v,type:['saturated_fat','sugars'].includes(key)?'upper':'target',source:'사용자가 입력한 하루 목표'};}
 return t;
}
export function assessNutrients(a,c,{divisor=1,wholeDay=false}={}){
 const personal=nutrientTargets(c),reference=generalTargets(c),targets={...reference,...personal},n=Number.isFinite(divisor)&&divisor>0?divisor:1;
 return Object.entries(labels).map(([key,[label,unit]])=>{
  const value=Number.isFinite(a.values?.[key])?a.values[key]/n:null,t=targets[key],count=a.totalByNutrient?.[key]??a.total,complete=count>0&&a.coverage?.[key]===count;
  let status='기준 미설정',state='unset',delta=null;
  if(value==null){status='영양 자료 없음';state='missing';}
  else if(!complete){status='일부 합계 · 목표 평가 보류';state='partial';}
  else if(c.special){status='일반 참고만 표시 · 별도 식사 제한은 의료진 기준 확인';state='progress';}
  else if(t){
   if(['recommended','adequate'].includes(t.type)&&value>=t.max){status=t.type==='adequate'?'충분섭취량 이상 · 과잉 판정 아님':'권장섭취량 이상 · 과잉 판정 아님';state='within';}
   else if(t.type==='reference'){status=value>t.max?'참고 필요추정량 상회':value<t.min?'참고 필요추정량 미만':'참고 필요추정량과 같음';state='progress';}
   else if(!wholeDay&&(value>t.max||(t.exclusive&&value===t.max))){status='하루 기준 초과';state='over';delta=value-t.max;}
   else if(!wholeDay){status='하루 기준 대비 사용량 · 한 끼 부족 판정 안 함';state='progress';}
   else if(value>t.max||(t.exclusive&&value===t.max)){delta=value-t.max;status=t.type==='upper'?'상한 초과':'목표 초과';state='over';}
   else if(t.type==='upper'){delta=t.max-value;status='상한 이내';state='within';}
   else if(value<t.min){delta=t.min-value;status=t.type==='adequate'?'충분섭취량 미만 · 결핍 판정 아님':'기준 미만 · 결핍 판정 아님';state='under';}
   else {status=t.type==='range'?'목표 범위 내':'목표와 같음';state='within';}
  }
  return {key,label,unit,value,target:t,reference:reference[key],personal:personal[key],status,state,delta,complete,ai:(a.aiCoverage?.[key]||0)>0,percent:t&&value!=null?value/t.max*100:null};
 });
}

// Source: MOHW/KNS, 2025 KDRIs summary pp.xi–xiii and xix; verified 2026-11-11.
export const REFERENCE_SOURCE='https://www.kns.or.kr/fileroom/fileroom_view.asp?BoardID=Kdr&idx=167';
export const AGE_BANDS=['19-29','30-49','50-64','65-74','75+'];
export const REFERENCE_ROWS={
 male:[[2600,65,30,2300],[2500,65,30,2300],[2200,60,30,2300],[2000,60,30,1900],[1900,60,30,1800]],
 female:[[2000,55,20,2300],[1900,50,20,2300],[1700,50,25,2300],[1600,50,25,1900],[1500,50,25,1800]]
};
export function generalTargets(c){
 const i=AGE_BANDS.indexOf(c.ageBand),r=REFERENCE_ROWS[c.sex]?.[i];if(!r)return {};
 const [e,protein,fiber,sodium]=r, make=(min,max,type,source,exclusive=false)=>({min,max,type,source,exclusive});
 return {energy:make(e,e,'reference','성별·연령군 에너지 필요추정량 (개인 처방 아님)'),
 carbohydrate:make(e*.5/4,e*.65/4,'range','에너지 적정비율 50~65% × 참고 열량'),
 protein:make(protein,protein,'recommended','단백질 권장섭취량'),
 fat:make(e*.15/9,e*.30/9,'range','에너지 적정비율 15~30% × 참고 열량'),
 saturated_fat:make(0,e*.07/9,'upper','포화지방산: 참고 열량의 7% 미만',true),
 sugars:make(0,e*.20/4,'upper','총당류: 참고 열량의 20% 이내 (첨가당과 구분)'),
 sodium:make(0,sodium,'upper','나트륨 만성질환위험감소섭취량 (상한섭취량 아님)'),
 fiber:make(fiber,fiber,'adequate','식이섬유 충분섭취량 (결핍 판정 기준 아님)')};
}
const fmt=n=>new Intl.NumberFormat('ko-KR',{maximumFractionDigits:1}).format(n);
function describe(t,unit){return (t.type==='range'?fmt(t.min)+'~'+fmt(t.max):fmt(t.max))+' '+unit+(t.type==='upper'?(t.exclusive?' 미만':' 이내'):'');}
export const referencePoint=t=>t.type==='range'?(t.min+t.max)/2:t.max;
export function renderGoalNutrition(root,a,c,opts={}){
 const E=(tag,text,cls)=>{const e=document.createElement(tag);if(text!=null)e.textContent=text;if(cls)e.className=cls;return e;};root.replaceChildren();
 root.append(E('p',opts.title||'현재 구성 · 하루 참고 기준과 개인 목표','ng-heading'));
 root.append(E('p','막대: 음식 성분량 · 빗금: 일부 합계 · 녹색 실선: 일반 기준 · 파란 점선: 개인 목표. 범위 눈금은 중간값이며 적정 여부는 원래 범위로 확인합니다.','ng-heading ng-explanation'));
 for(const row of assessNutrients(a,c,opts)){
  const box=E('section',null,'ng-card');box.dataset.state=row.state;
  box.append(E('strong',row.label),E('p',row.value==null?'자료 없음':fmt(row.value)+' '+row.unit+(row.ai?' · AI 자료':'')+(row.value!=null&&!row.complete?' · 일부 합계':''),'ng-value'));
  const total=a.totalByNutrient?.[row.key]??a.total,matched=a.coverage?.[row.key]||0;
  box.append(E('small','재료 영양값 반영 '+matched+'/'+(total||0)+'건'));
  if(opts.missingNames?.[row.key]?.length){const detail=E('details',null,'ng-missing');detail.append(E('summary','미반영 재료 확인'),E('p',opts.missingNames[row.key].join(', ')+' · 영양값 또는 분량을 확인하지 못했습니다.'));box.append(detail);}
  const refs=[['일반 기준',row.reference,'ng-general'],['개인 목표',row.personal,'ng-personal']].filter(x=>x[1]);
  if(refs.length){
   const axis=Math.max(...refs.map(x=>x[1].max))*1.5;
   const track=E('div',null,'ng-track');track.setAttribute('role','img');track.setAttribute('aria-label',row.label+' '+(row.value==null?'자료 없음':fmt(row.value)+' '+row.unit)+'; '+refs.map(([name,t])=>name+' '+describe(t,row.unit)+(t.type==='range'?' 중간값 '+fmt(referencePoint(t)):'')).join('; ')+(row.complete?'':' · 일부 합계'));
   const labelAt=(value,text,cls)=>{const label=E('span',text,cls);label.style.left=Math.min(75,Math.max(25,value/axis*100))+'%';return label;};
   if(row.value!=null){const fill=E('span',null,'ng-fill');fill.style.width=Math.min(100,Math.max(0,row.value)/axis*100)+'%';track.append(fill,labelAt(row.value,'음식 '+fmt(row.value)+' '+row.unit,'ng-value-label'));}
   for(const [name,t,cls]of refs){const mark=E('span',null,'ng-marker '+cls);mark.style.left=referencePoint(t)/axis*100+'%';mark.title=name+' '+describe(t,row.unit);track.append(mark);}
   box.append(track);
   const scale=E('div',null,'ng-scale');scale.append(E('span','0'),E('span',fmt(axis)+' '+row.unit));box.append(scale);
   for(const [name,t,cls]of refs){const ticks=E('div',null,'ng-tick-row '+cls);ticks.append(labelAt(referencePoint(t),name+' '+fmt(referencePoint(t))+' '+row.unit+(t.type==='range'?' (중간값)':''),'ng-tick-label'));box.append(ticks);}
   for(const [name,t,cls]of refs)box.append(E('p',name+' '+describe(t,row.unit)+' · '+t.source,'ng-legend '+cls));
   if(!row.personal)box.append(E('p','개인 목표 미입력 · 일반 기준으로 표시','fs-muted'));
  }else box.append(E('div',null,'ng-track'),E('p','일반 참고 기준의 성별·나이대를 선택해 주세요. 개인 목표 없이도 표시됩니다.','fs-muted'));
  if(row.personal&&row.reference){const g=assessNutrients(a,{...c,targetSource:'',energy:null,sodium:null,personal:{}},opts).find(g=>g.key===row.key);box.append(E('p','일반 참고: '+g.status,'fs-muted'));}
  box.append(E('p',(row.personal?'개인 목표: ':row.reference?'일반 참고: ':'')+row.status+(row.delta==null?'':' · 차이 '+fmt(row.delta)+' '+row.unit),'ng-status'));
  if(opts.previous){
   const old=opts.previous,oldValue=old.values?.[row.key],count=old.totalByNutrient?.[row.key]??old.total,complete=count>0&&old.coverage?.[row.key]===count;
   const previous=E('div',null,'ng-previous');previous.append(E('strong',old.name||'전주 기록'));
   if(Number.isFinite(oldValue)){
    previous.append(E('p',fmt(oldValue)+' '+row.unit+((old.aiCoverage?.[row.key]||0)>0?' · AI 자료':'')+(!complete?' · 일부 합계':'')));
    const axis=refs.length?Math.max(...refs.map(x=>x[1].max))*1.5:Math.max(oldValue,1)*1.5;
    const track=E('div',null,'ng-previous-track'),fill=E('span',null,'ng-previous-fill');fill.style.width=Math.min(100,Math.max(0,oldValue)/axis*100)+'%';if(!complete)fill.className+=' ng-partial';track.append(fill);previous.append(track);
    const current=opts.comparableCurrent?.values?.[row.key];if(Number.isFinite(current))previous.append(E('p',(opts.comparableLabel||'같은 날짜·끼니의 이번 계획')+' '+fmt(current)+' '+row.unit+' · 차이 '+(current-oldValue>0?'+':'')+fmt(current-oldValue)+' '+row.unit,'fs-muted'));
    if(opts.comparisonNotes?.[row.key])previous.append(E('small',opts.comparisonNotes[row.key]));
   }else previous.append(E('p',(opts.previousPeriodLabel||'전주')+'에 비교할 기록이 없거나 먹은 분량·영양 자료를 확인하지 못했습니다.','fs-muted'));
   box.append(previous);
  }
  root.append(box);
 }
}
