export function previousMonthDates(date){
 const first=new Date(date.slice(0,7)+'-01T12:00:00Z');first.setUTCMonth(first.getUTCMonth()-1);const year=first.getUTCFullYear(),month=first.getUTCMonth(),days=new Date(Date.UTC(year,month+1,0)).getUTCDate();return Array.from({length:days},(_,i)=>`${year}-${String(month+1).padStart(2,'0')}-${String(i+1).padStart(2,'0')}`);
}
export async function mapDates(dates,job,workers=4){const out=Array(dates.length);let index=0;await Promise.all(Array.from({length:Math.min(workers,dates.length)},async()=>{while(index<dates.length){const i=index++;out[i]=await job(dates[i]);}}));return out;}
export function averageMonth(entries,meals,keys,analyze){
 const result={values:{},coverage:{},aiCoverage:{},totalByNutrient:{},notes:{},fullDays:{}};
 for(const key of keys){let sum=0,count=0,covered=0,ai=0,total=0,partial=false;const dates=new Map();
  for(const entry of entries){if(!meals.includes(entry.meal))continue;const a=analyze(entry),v=a.values?.[key];if(!Number.isFinite(v))continue;sum+=v;count++;if((a.totalByNutrient?.[key]??a.total??0)<=0||(a.coverage?.[key]||0)<(a.totalByNutrient?.[key]??a.total??0))partial=true;covered+=a.coverage?.[key]||0;ai+=a.aiCoverage?.[key]||0;total+=a.totalByNutrient?.[key]??a.total??0;if(!dates.has(entry.date))dates.set(entry.date,new Set());dates.get(entry.date).add(entry.meal);}
  result.values[key]=dates.size?sum/dates.size:null;result.coverage[key]=covered;result.aiCoverage[key]=ai;result.totalByNutrient[key]=total;result.fullDays[key]=!partial&&dates.size>0&&[...dates.values()].every(set=>meals.every(m=>set.has(m)));result.notes[key]=`${dates.size}일 ${count}끼 · 자료 있는 날짜 기준`+(result.fullDays[key]?'':' · 끼니·성분 자료 부족, 변화량 보류');
 }return result;
}
export function compareMonths(previous,current,meals,keys,analyze){
 const old=averageMonth(previous,meals,keys,analyze),next=averageMonth(current,meals,keys,analyze);
 const plan=previous.some(e=>e.kind==='PLAN'),actual=previous.some(e=>e.kind==='ACTUAL');old.name=!previous.length?'전달 기록':plan?(actual?'전달 실제 기록·저장 계획 평균':'전달 저장 계획 평균 (실제 섭취 아님)'):'전달 실제 기록 평균';
 const notes={};for(const key of keys){notes[key]='전달 '+old.notes[key]+' / 이번 달 '+next.notes[key];if(!old.fullDays[key]||!next.fullDays[key])next.values[key]=null;}
 return {rows:[old,next],notes};
}
