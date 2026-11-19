'use strict';
(()=>{
 const KEY='smartnf.allergy-profile.v1',TTL=86400000;
 const labels={egg:'알류(가금류)',milk:'우유',buckwheat:'메밀',peanut:'땅콩',soy:'대두',wheat:'밀',mackerel:'고등어',crab:'게',shrimp:'새우',pork:'돼지고기',peach:'복숭아',tomato:'토마토',sulfite:'아황산류',walnut:'호두',chicken:'닭고기',beef:'쇠고기',squid:'오징어',shellfish:'조개류(굴·전복·홍합 등)',pinenut:'잣'};
 const alias={달걀:'egg',계란:'egg',알류:'egg',우유:'milk',유제품:'milk',메밀:'buckwheat',땅콩:'peanut',대두:'soy',콩:'soy',밀:'wheat',고등어:'mackerel',게:'crab',새우:'shrimp',돼지고기:'pork',복숭아:'peach',토마토:'tomato',아황산류:'sulfite',호두:'walnut',닭고기:'chicken',쇠고기:'beef',소고기:'beef',오징어:'squid',조개류:'shellfish',굴:'shellfish',전복:'shellfish',홍합:'shellfish',잣:'pinenut'};
 const primitive={달걀:['egg'],오리알:['egg'],메추리알:['egg'],우유:['milk'],메밀:['buckwheat'],땅콩:['peanut'],대두:['soy'],밀:['wheat'],고등어:['mackerel'],게:['crab'],꽃게:['crab'],대게:['crab'],새우:['shrimp'],흰다리새우:['shrimp'],대하:['shrimp'],돼지고기:['pork'],복숭아:['peach'],천도복숭아:['peach'],토마토:['tomato'],호두:['walnut'],닭고기:['chicken'],소고기:['beef'],오징어:['squid'],굴:['shellfish'],전복:['shellfish'],홍합:['shellfish'],바지락:['shellfish'],가리비:['shellfish'],잣:['pinenut']};
 const plants='양파 브로콜리 당근 무 감자 고구마 가지 갓 고추 배추 양배추 상추 시금치 오이 호박 미나리 부추 마늘 마늘종 파 풋마늘 멥쌀 찹쌀 귀리 보리 수수 옥수수 기장 조 율무 사과 배 바나나 포도 딸기 감귤 오렌지 키위 참다래 수박 참외 아보카도 느타리버섯 표고버섯 팽이버섯 큰느타리버섯(새송이버섯)'.split(' ');
 const primaryMap=new Map(plants.map(x=>[x,[]]));Object.entries(primitive).forEach(([k,v])=>primaryMap.set(k,v));
 const codeContains={'rda_10_4:D0150000009a':['soy']};
 const valid=p=>p&&p.version===1&&['unset','none','has','review'].includes(p.mode)&&Number.isFinite(p.savedAt)&&Array.isArray(p.allergens)&&p.allergens.length<=19&&new Set(p.allergens).size===p.allergens.length&&p.allergens.every(x=>Object.hasOwn(labels,x))&&typeof p.other==='boolean'&&['health','food'].includes(p.source);
 function profile(){try{const p=JSON.parse(sessionStorage.getItem(KEY));if(!p){try{const legacy=JSON.parse(sessionStorage.getItem('smartnf.food-selection.v1'));if(legacy?.conditions?.includes('allergy'))return {version:1,mode:'review',allergens:[],other:true,source:'food',savedAt:0};}catch{}return {version:1,mode:'unset',allergens:[],other:false,source:'food',savedAt:0};}if(!valid(p))return {version:1,mode:'review',allergens:[],other:true,source:'food',savedAt:0};if(Date.now()-p.savedAt<0||Date.now()-p.savedAt>=TTL)return {...p,mode:'review'};return p;}catch{return {version:1,mode:'review',allergens:[],other:true,source:'food',savedAt:0};}}
 function update(mode,allergens,other,source='food'){
  const p={version:1,mode,allergens:[...new Set(allergens)],other,source,savedAt:Date.now()};
  if(mode==='none'||mode==='unset'){p.allergens=[];p.other=false;}
  if(!valid(p))throw new Error('알레르기 입력을 확인해 주세요.');
  try{sessionStorage.setItem(KEY,JSON.stringify(p));}catch{throw new Error('알레르기 조건을 저장하지 못했습니다. 브라우저 저장 설정을 확인해 주세요.');}
  window.dispatchEvent(new Event('smartnf-allergy-change'));return p;
 }
 function inspect(food,p=profile()){
  if(p.mode==='unset'||p.mode==='none')return {allowed:true,status:'not_applied',reason:p.mode==='none'?'본인 확인: 알레르기 없음':'알레르기 미입력 · 제외 미적용',tags:[]};
  if(p.mode==='review'||p.other||!p.allergens.length||p.allergens.includes('sulfite'))return {allowed:false,status:'unknown',reason:'알레르기 정보·첨가물 확인이 필요하여 제외',tags:[]};
  const id=food.id||'',name=String(food.name||'');
  if(!id.startsWith('rda_10_4:'))return {allowed:false,status:'unknown',reason:'음식 원재료·알레르기 정보 미확보로 제외',tags:[]};
  const primary=name.split(',')[0].trim(),tags=codeContains[id]||primaryMap.get(primary)||[];
  const matches=tags.filter(t=>p.allergens.includes(t));
  if(matches.length)return {allowed:false,status:'match',reason:matches.map(x=>labels[x]).join('·')+' 관련 원재료로 제외',tags};
  const single=primaryMap.has(primary)&&name.endsWith('생것')&&!/통조림|절임|튀긴|튀김|양념|소스|혼합|즙|가루/.test(name);
  if(!single)return {allowed:false,status:'unknown',reason:'단일 원재료 구성을 확인하지 못하여 제외',tags};
  return {allowed:true,status:'no_listed_match',reason:'선택 항목과 단일 원재료 식별상 일치 없음 · 교차접촉/제품 표시 별도 확인',tags};
 }
 function fromText(raw){const text=String(raw||'').normalize('NFKC').trim();if(!text)return {mode:'unset',allergens:[],other:false};if(/^(없음|해당\s*없음|알레르기\s*없음)$/.test(text))return {mode:'none',allergens:[],other:false};const tokens=text.split(/[,，;\/\n·]+/).map(x=>x.replace(/\s/g,'')).filter(Boolean);const codes=tokens.map(x=>Object.hasOwn(labels,x)?x:alias[x]);if(!tokens.length||codes.some(x=>!x))return {mode:'review',allergens:[],other:true};return {mode:'has',allergens:[...new Set(codes)],other:false};}
 const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=String(text);if(cls)n.className=cls;return n;};
 function summary(p=profile()){if(p.mode==='review')return '알레르기 정보 확인이 필요합니다. 확인 전에는 식품 선택을 보류합니다.';if(p.mode==='has'){if(p.other||!p.allergens.length||p.allergens.includes('sulfite'))return '선택한 조건은 현재 자료만으로 확인할 수 없어 식품 선택을 보류합니다.';return p.allergens.map(x=>labels[x]).join(' · ')+' 제외 적용 · 원재료 미확인 식품도 숨깁니다.';}return p.mode==='none'?'알레르기 없음으로 확인했습니다. 실제 제품 표시·개인 상태를 별도로 확인하세요.':'알레르기를 입력하지 않았습니다. 현재 목록은 알레르기 안전성을 확인한 결과가 아닙니다.';}
 const mounted=[];
 function mount(host,source='food'){
  if(host.dataset.allergyMounted)return;host.dataset.allergyMounted='true';host.classList.add('fa-panel');
  const heading=el('h2','알레르기·제외 조건');const note=el('p','건강정보 입력 여부와 관계없이 같은 조건을 적용합니다. 선택한 원재료와 미확인 구성을 제외하며, 교차접촉·실제 제품의 알레르기 안전성을 보장하지 않습니다.','fa-note');
  const label=el('label','나의 알레르기 상태');const mode=el('select');mode.setAttribute('aria-label','나의 알레르기 상태');for(const [v,t]of [['unset','아직 입력하지 않음'],['none','알레르기 없음 (본인 확인)'],['has','알레르기 항목 선택'],['review','기존 입력 확인 필요']]){const o=el('option',t);o.value=v;mode.append(o);}label.append(mode);
  const group=el('fieldset',undefined,'fa-checks');group.append(el('legend','제외할 알레르기 원재료'));const checks=[];
  Object.entries(labels).forEach(([id,text])=>{const l=el('label'),c=el('input');c.type='checkbox';c.value=id;c.dataset.allergen=id;l.append(c,document.createTextNode(text));group.append(l);checks.push(c);});
  const otherLabel=el('label'),other=el('input');other.type='checkbox';other.dataset.otherAllergy='true';otherLabel.append(other,document.createTextNode('기타 알레르기·정확한 항목 확인 필요'));group.append(otherLabel);
  const status=el('p',undefined,'fa-status');status.setAttribute('role','status');const info=el('p','‘확인 필요’·기타·아황산류는 현재 자료로 제외 여부를 검증할 수 없어 모두 보류합니다. 음식 DB에는 원재료 구성이 없어 알레르기 적용 시 숨깁니다.','fa-note');
  const applyButton=el('button','알레르기 조건 적용','fa-apply');applyButton.type='button';host.append(heading,note,label,group,applyButton,status,info);
  status.setAttribute('aria-live','polite');status.setAttribute('aria-atomic','true');
  function state(value,text){host.dataset.applyState=value;applyButton.dataset.state=value;applyButton.textContent=text;}
  const widget={refresh(){const p=profile();mode.value=p.mode;checks.forEach(c=>c.checked=p.allergens.includes(c.value));other.checked=p.other;group.hidden=!['has','review'].includes(p.mode);const pending=p.mode==='review'||(p.mode==='has'&&(p.other||!p.allergens.length||p.allergens.includes('sulfite')));state(p.mode==='unset'?'idle':pending?'review':'applied',p.mode==='unset'?'알레르기 조건 적용':pending?'! 조건 반영됨 · 확인 필요':'✓ 적용 완료');status.textContent=(p.mode!=='unset'?'현재 반영된 조건: ':'')+summary(p)+(p.source==='health'?' 건강정보에서 전달한 조건입니다.':'');}};mounted.push(widget);
  function apply(){try{update(mode.value,checks.filter(c=>c.checked).map(c=>c.value),other.checked,source);if(mode.value==='unset'){state('applied','✓ 미입력 상태 반영');status.textContent='미입력 상태를 반영했습니다. 알레르기 제외는 적용하지 않습니다.';}}catch(e){state('error','다시 적용하기');status.textContent=e.message+' 변경 내용은 적용되지 않았습니다.';}}
  function draft(){group.hidden=!['has','review'].includes(mode.value);state('draft','변경 내용 적용');status.textContent='변경 후 미적용 · 버튼을 눌러 반영하세요. 아직 기존 조건을 유지하고 있습니다.';}
  mode.addEventListener('change',draft);[...checks,other].forEach(c=>c.addEventListener('change',()=>{mode.value='has';draft();}));applyButton.addEventListener('click',apply);widget.refresh();
 }
 function compact(){document.querySelectorAll('[data-allergy-summary]').forEach(host=>{
  host.replaceChildren();host.classList.add('fa-compact');const p=profile();
  const title=el('h3','알레르기'),chips=el('div',undefined,'fa-care-chips');
  const values=p.allergens.map(id=>labels[id]);if(p.other)values.push('기타 · 확인 필요');
  if(!values.length)values.push(p.mode==='none'?'없음 (본인 확인)':p.mode==='unset'?'미등록':'확인 필요');
  values.forEach(value=>chips.append(el('span',value)));host.append(title,chips);
  if(p.mode==='review'||p.other||p.mode==='has'&&(!p.allergens.length||p.allergens.includes('sulfite')))host.append(el('p','자료 확인이 필요하여 식품 선택을 보류합니다.','fa-note'));
  else if(p.mode==='unset')host.append(el('p','알레르기 미등록 · 제외 조건이 적용되지 않았습니다.','fa-note'));
  const link=el('a','알레르기 등록·수정 ↗');link.href='/preview/health/info#health-allergy-editor';host.append(link);
 });}
 window.addEventListener('smartnf-allergy-change',compact);document.addEventListener('DOMContentLoaded',compact);
 window.SmartNFAllergy={profile,update,inspect,fromText,mount,summary,labels,valid};
 window.addEventListener('smartnf-allergy-change',()=>mounted.forEach(w=>w.refresh()));
 document.addEventListener('DOMContentLoaded',()=>document.querySelectorAll('[data-allergy-profile]').forEach(n=>mount(n,'food')));
})();
