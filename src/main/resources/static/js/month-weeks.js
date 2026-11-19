// Calendar weeks start on Sunday; first/last week are clipped to dates in the plan.
export function monthWeeks(slots){
 const dates=[...new Set(slots.map(s=>s.date))].sort(),groups=[];
 for(const date of dates){const d=new Date(date+'T12:00:00Z'),anchor=new Date(d);anchor.setUTCDate(d.getUTCDate()-d.getUTCDay());const key=anchor.toISOString().slice(0,10);let group=groups.at(-1);if(!group||group.key!==key){group={key,from:date,to:date,dates:[]};groups.push(group);}group.to=date;group.dates.push(date);}
 return groups.map((g,i)=>({...g,index:i,label:(i+1)+'주차 · '+g.from.slice(5).replace('-','/')+' ~ '+g.to.slice(5).replace('-','/')}));
}
export function chooseMonthWeek(slots,selected,today){const weeks=monthWeeks(slots);return weeks.find(w=>w.from===selected)||weeks.find(w=>w.dates.includes(today))||weeks[0]||null;}
export function slotsInWeek(slots,week){return week?slots.filter(s=>week.dates.includes(s.date)):[];}
