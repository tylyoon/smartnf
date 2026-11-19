'use strict';
(() => {
  const panel = document.querySelector('[data-hi-panel="results"]');
  if (!panel) return;
  
  // Entirely fictional records. No personal data, requests, or persistent storage.
  const cases = {
    balance: {name:'가상 사례 A',age:35,sex:'여성',height:165,condition:'선택 질환 없음',weights:[60.4,60.2,60.3,60.5,60.4,60.1,60.2,60.3,60.1,60.2,60.0,60.2,60.1,60.3,60.1,60.2,60.0,60.1,60.2,60.0,60.1,60.0,60.1,60.0,60.2,60.1,60.0,60.1,60.0,60.0],habits:[6,5,2,1],title:'식사의 규칙성을 살펴보세요',description:'아침 식사·채소 섭취·야식 등의 빈도를 함께 비교하는 화면 예시입니다. 건강한 식습관의 종합 점수는 계산하지 않습니다.'},
    weight: {name:'가상 사례 B',age:45,sex:'남성',height:175,condition:'체중 관리 관심',weights:[84.2,84.0,84.1,83.9,84.0,83.8,83.9,83.7,83.6,83.8,83.5,83.6,83.5,83.4,83.6,83.3,83.4,83.2,83.1,83.3,83.0,83.1,82.9,83.0,82.8,82.9,82.6,82.7,82.5,82.6],habits:[3,4,4,3],title:'체중 기록과 식습관을 함께 보세요',description:'측정값의 흐름과 최근 식사 빈도를 나란히 확인합니다. 체중이 줄었다는 이유만으로 건강이 좋아졌거나 목표를 달성했다고 판정하지 않습니다.'},
    condition: {name:'가상 사례 C',age:58,sex:'여성',height:160,condition:'고혈압 관리 사례',weights:[64.5,64.4,64.6,64.4,64.3,64.5,64.4,64.3,64.5,64.3,64.2,64.4,64.3,64.2,64.4,64.3,64.1,64.2,64.3,64.2,64.1,64.3,64.2,64.1,64.2,64.0,64.2,64.1,64.0,64.1],habits:[7,6,1,1],title:'질환의 관리 조건을 먼저 확인하세요',description:'만성질환 사례에서는 치료·복약과 의료진이 정한 식사·운동 제한을 함께 확인하는 흐름을 보여줍니다. 질환의 중증도나 치료 목표를 자동 판단하지 않습니다.'}
  };
  let selected = 'balance', days = 7;
  const $ = id => document.getElementById(id);
  function text(id,value) { $(id).textContent = value; }
  function mode(value) {
    $('cp-demo').hidden = value !== 'demo'; $('cp-input').hidden = value !== 'input';
    panel.querySelectorAll('[data-cp-mode]').forEach(b => b.setAttribute('aria-pressed',String(b.dataset.cpMode === value)));
  }
  function category(bmi) { return bmi < 18.5 ? '저체중' : bmi < 23 ? '정상' : bmi < 25 ? '비만 전 단계' : '비만'; }
  function svgNode(tag,attrs={},value) {
    const el = document.createElementNS('http://www.w3.org/2000/svg',tag);
    Object.entries(attrs).forEach(([k,v]) => el.setAttribute(k,String(v)));
    if(value !== undefined) el.textContent = value; return el;
  }
  function records(c) {
    return c.weights.slice(-days).map((weight,i)=>({weight,date:new Date(Date.UTC(2026,9,22-days+1+i)).toISOString().slice(5,10).replace('-','/')}));
  }
  function chart(c) {
    const data = records(c), first = data[0].weight, last = data.at(-1).weight, change = last - first;
    $('cp-trend-summary').replaceChildren();
    const delta = document.createElement('strong');delta.textContent=(change>0?'+':'')+change.toFixed(1)+' kg';
    $('cp-trend-summary').append(delta,document.createTextNode('  · '+days+'일 기록의 첫·마지막 차이'));
    const width=500,height=224,left=45,right=14,top=22,bottom=40;
    const min=Math.floor(Math.min(...data.map(x=>x.weight))*2)/2-0.5,max=Math.ceil(Math.max(...data.map(x=>x.weight))*2)/2+0.5;
    const x=i=>left+i/(data.length-1)*(width-left-right),y=v=>top+(max-v)/(max-min)*(height-top-bottom);
    const svg=svgNode('svg',{viewBox:'0 0 '+width+' '+height,role:'img','aria-labelledby':'cp-chart-title cp-chart-description'});
    svg.append(svgNode('title',{id:'cp-chart-title'},c.name+'의 가상 체중 변화'),svgNode('desc',{id:'cp-chart-description'},days+'일간 '+first.toFixed(1)+'kg에서 '+last.toFixed(1)+'kg. 가상 기록입니다. 아래 표에서 모든 값을 확인할 수 있습니다.'));
    for(let i=0;i<4;i++) {
      const value=min+(max-min)*i/3,py=y(value);
      svg.append(svgNode('line',{x1:left,y1:py,x2:width-right,y2:py,stroke:'#e4ece3','stroke-dasharray':'4 5'}));
      svg.append(svgNode('text',{x:left-10,y:py+4,'text-anchor':'end',fill:'#859587','font-size':11},value.toFixed(1)));
    }
    svg.append(svgNode('text',{x:9,y:12,fill:'#859587','font-size':10},'kg'));
    const points=data.map((d,i)=>x(i)+','+y(d.weight)).join(' ');
    const area=left+','+(height-bottom)+' '+points+' '+x(data.length-1)+','+(height-bottom);
    svg.append(svgNode('polygon',{points:area,fill:'#e7f2e8'}),svgNode('polyline',{points,fill:'none',stroke:'#427b59','stroke-width':2.5,'stroke-linecap':'round','stroke-linejoin':'round'}));
    [0,Math.floor((data.length-1)/2),data.length-1].forEach(i=>svg.append(svgNode('text',{x:x(i),y:height-12,'text-anchor':i===0?'start':i===data.length-1?'end':'middle',fill:'#859587','font-size':11},data[i].date)));
    data.forEach((d,i)=>{const dot=svgNode('circle',{cx:x(i),cy:y(d.weight),r:days===7?3.5:2,fill:'#427b59',stroke:'white','stroke-width':1.5});dot.append(svgNode('title',{},d.date+' '+d.weight.toFixed(1)+' kg · 가상 기록'));svg.append(dot);});
    $('cp-trend-chart').replaceChildren(svg);
    const rows=data.map(d=>{const tr=document.createElement('tr');for(const val of [d.date,d.weight.toFixed(1)]){const td=document.createElement('td');td.textContent=val;tr.append(td);}return tr;});
    $('cp-trend-table').replaceChildren(...rows);
  }
  function render() {
    const c=cases[selected],weight=c.weights.at(-1),bmi=weight/((c.height/100)**2),label=category(bmi);
    text('cp-person',c.name+' · '+c.age+'세 '+c.sex+' · '+c.condition);
    text('cp-bmi',bmi.toFixed(1)+' kg/m²'); text('cp-bmi-label',label+' · 참고 분류');
    text('cp-weight',weight.toFixed(1)+' kg');text('cp-breakfast',c.habits[0]+' / 7일');text('cp-days',days+'일');
    text('cp-gauge-value',bmi.toFixed(1));text('cp-gauge-label',label+' 구간 · 가상 사용자');
    $('cp-pointer').style.left=Math.max(0,Math.min(100,(bmi-15)/20*100))+'%';
    $('cp-bmi-chart').setAttribute('aria-label','가상 사용자 BMI '+bmi.toFixed(1)+', 성인 참고 기준 '+label+' 구간. 표시 범위 15~35.');
    const names=['아침 식사','채소 섭취','단 음료','야식'];
    $('cp-habits').replaceChildren(...c.habits.map((v,i)=>{const row=document.createElement('div');row.className='cp-habit';const label=document.createElement('span');label.textContent=names[i];const track=document.createElement('div');track.setAttribute('aria-hidden','true');const fill=document.createElement('i');fill.style.width=v/7*100+'%';track.append(fill);const count=document.createElement('strong');count.textContent=v+' / 7일';row.append(label,track,count);return row;}));
    text('cp-next-title',c.title);text('cp-next-description',c.description);
    panel.querySelectorAll('[data-cp-profile]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.cpProfile===selected)));
    panel.querySelectorAll('[data-cp-period]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.cpPeriod)===days)));
    chart(c);
  }
  panel.querySelectorAll('[data-cp-mode]').forEach(b=>b.addEventListener('click',()=>mode(b.dataset.cpMode)));
  panel.querySelectorAll('[data-cp-profile]').forEach(b=>b.addEventListener('click',()=>{selected=b.dataset.cpProfile;render();}));
  panel.querySelectorAll('[data-cp-period]').forEach(b=>b.addEventListener('click',()=>{days=Number(b.dataset.cpPeriod);render();}));
  $('cp-use-input').addEventListener('click',()=>mode('input'));
  // Existing form handlers render the user's transient entries; show only those results.
  for(const id of ['health-state-form','health-habits-form']) $(id)?.addEventListener('submit',()=>mode('input'));
  render(); mode('demo');
})();
