const cuisines=['미분류','한식','중식','일식','이탈리아식','프랑스식','동남아식','인도식','멕시코식','미국식','기타','퓨전'];
const roles=['미분류','메인','사이드','겸용','기타'];
const axes={spicy:'매운맛',sweet:'단맛',salty:'짠맛',sour:'신맛',umami:'감칠맛',rich:'기름진 정도'};
const adjustments=['너무 매워요','너무 달아요','너무 짜요','너무 셔요','너무 기름져요'];
const $=id=>document.getElementById(id);
const el=(tag,text,cls)=>{const n=document.createElement(tag); if(text!=null)n.textContent=text;if(cls)n.className=cls;return n;};
function btn(text,fn){const b=el('button',text);b.type='button';b.addEventListener('click',fn);return b;}
function select(label,values,value){const wrap=el('label',label),s=el('select');values.forEach(v=>{const o=el('option',v===''?'미입력':v);o.value=v;s.append(o);});s.value=value??'';wrap.append(s);return {wrap,s};}
async function api(url,body){
 const token=document.querySelector('meta[name="_csrf"]')?.content,header=document.querySelector('meta[name="_csrf_header"]')?.content;
 const headers={Accept:'application/json'};if(body!==undefined){headers['Content-Type']='application/json';if(!token||!header)throw Error('화면을 새로고침한 뒤 다시 시도해 주세요.');headers[header]=token;}
 const account=document.querySelector('header[data-account-key]')?.dataset.accountKey||state?.account;if(account)headers['X-SmartNF-Account']=account;
 const r=await fetch(url,{method:body===undefined?'GET':'POST',headers,body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(45000)});
 if(r.redirected||!r.headers.get('content-type')?.includes('application/json'))throw Error('로그인 상태를 확인해 주세요.');
 if(!r.ok)throw Error(r.status===409?'다른 화면에서 수정되었습니다. 새로고침 후 다시 시도해 주세요.':'요청을 완료하지 못했습니다. 잠시 후 다시 시도해 주세요.');return r.json();
}
let state,matched=null;const cards=new Map();
const country=select('나라·문화권',['전체',...cuisines],'전체'),role=select('한 끼 역할',['전체',...roles],'전체'),sort=select('정렬',['최근 저장순','취향순'],'최근 저장순');
const query=el('input');query.placeholder='예: 두부 들어간 한식, 돼지고기 없는 요리';query.maxLength=200;query.setAttribute('aria-label','저장 레시피 자연어 검색');
const status=$('rt-status');
function order(){
 if(!state)return;let visible=0;
 const list=[...state.recipes];if(sort.s.value==='취향순')list.sort((a,b)=>(a.distance??Infinity)-(b.distance??Infinity)||b.number-a.number);
 for(const item of list){const card=cards.get(item.number);if(!card)continue;const f=item.features;
 card.hidden=!(country.s.value==='전체'||country.s.value===f.cuisine)||!(role.s.value==='전체'||role.s.value===f.role||f.role==='겸용'&&['메인','사이드'].includes(role.s.value))||matched!==null&&!matched.has(item.number);
 if(!card.hidden)visible++;const root=$('rt-list'),ordered=[...root.querySelectorAll(':scope > [data-recipe-number]')],at=list.indexOf(item);if(ordered[at]!==card)root.insertBefore(card,ordered[at]||null);}
 status.textContent=`${visible}개 레시피${sort.s.value==='취향순'?' · 예상 맛 자료가 없는 음식은 뒤에 표시합니다.':''}`;
}
function profile(){const root=$('rt-profile');root.replaceChildren(el('h2','나의 맛 취향'),el('p',`${state.evaluated}개 음식 평가 · ${state.message}`));const box=el('div',null,'rt-taste-grid');
 for(const [key,value] of Object.entries(state.profile)){const row=el('div',`${axes[key]} ${value.toFixed(1)} / 5`),meter=el('meter');meter.min=0;meter.max=5;meter.value=value;meter.setAttribute('aria-label',`${axes[key]} 선호 평균 ${value.toFixed(1)}`);row.append(meter);box.append(row);}root.append(box);}
function stars(label,initial){
 let value=initial||0;const root=el('div',null,'rt-star-row'),title=el('span',label,'rt-star-label'),group=el('div',null,'rt-stars');
 group.setAttribute('role','radiogroup');group.setAttribute('aria-label',label);const text=el('span',null,'rt-sr-only');text.id=`rt-rating-${Math.random().toString(36).slice(2)}`;group.setAttribute('aria-describedby',text.id);
 const buttons=[];let onChange=()=>{};
 function paint(){buttons.forEach((b,i)=>{b.textContent=i<value?'★':'☆';b.dataset.filled=String(i<value);b.setAttribute('aria-checked',String(value===i+1));b.tabIndex=value===i+1||!value&&i===0?0:-1;});text.textContent=value?`${value} / 5`:'미평가';}
 function choose(next){value=next;paint();onChange();}
 for(let i=1;i<=5;i++){
  const b=btn('☆',e=>{e.preventDefault();e.stopPropagation();choose(value===i?0:i);});b.setAttribute('role','radio');b.setAttribute('aria-label',`${label} ${i}점`);
  b.addEventListener('keydown',e=>{let next;if(['ArrowRight','ArrowUp'].includes(e.key))next=Math.min(5,(value||1)+1);else if(['ArrowLeft','ArrowDown'].includes(e.key))next=Math.max(1,(value||1)-1);else if(e.key==='Home')next=1;else if(e.key==='End')next=5;else return;e.preventDefault();e.stopPropagation();choose(next);buttons[next-1].focus();});buttons.push(b);group.append(b);
 }
 root.title='선택한 별을 다시 누르면 평가가 해제됩니다.';
 root.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();});root.append(title,group,text);paint();
 return {root,get value(){return value;},onChange(fn){onChange=fn;}};
}
function tasteSlider(label){
 const wrap=el('div',null,'rt-slider-row'),caption=el('label',label),input=el('input'),value=el('output');
 input.type='range';input.min='0';input.max='5';input.step='1';input.value='0';input.dataset.known='false';
 const id=`rt-slider-${Math.random().toString(36).slice(2)}`;input.id=id;caption.htmlFor=id;value.htmlFor=id;
 function paint(){const known=input.dataset.known==='true';value.value=known?input.value:'미확인';input.setAttribute('aria-valuetext',known?`${input.value} / 5`:'자료 없음');input.style.setProperty('--rt-fill',known?`${Number(input.value)*20}%`:'0%');}
 function set(v){input.dataset.known=String(v!=null);input.value=v==null?'0':String(v);paint();}
 const clear=btn('×',()=>{set(null);input.dataset.clearing='true';input.dispatchEvent(new Event('input',{bubbles:true}));delete input.dataset.clearing;});clear.className='rt-slider-clear';clear.setAttribute('aria-label',`${label} 자료 없음으로 변경`);clear.title='자료 없음으로 변경';
 input.addEventListener('input',()=>{if(input.dataset.clearing!=='true')input.dataset.known='true';paint();});
 // Choosing the leftmost point must register a known zero even when the native value was already zero.
 input.addEventListener('pointerup',()=>{if(input.dataset.known!=='true'){input.dataset.known='true';paint();input.dispatchEvent(new Event('input',{bubbles:true}));}});
 input.addEventListener('keydown',event=>{if(['Delete','Backspace'].includes(event.key)){event.preventDefault();clear.click();}});
 input.addEventListener('keyup',event=>{if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End','PageUp','PageDown'].includes(event.key)){input.dataset.known='true';paint();input.dispatchEvent(new Event('input',{bubbles:true}));}});
 wrap.append(caption,input,value,clear);paint();return {wrap,input,set,paint};
}
function featureEditor(item,card){
 const root=card.querySelector('.rt-tools');root.replaceChildren();card.open=true;
 let baseline=structuredClone(item.features.source==='RULE'&&item.prediction?item.prediction:item.features),dirty=false,saving=false,fieldsDirty=false,metadataDirty=false;
 const heading=card.querySelector('summary');
 const badge=card.querySelector('.rt-badge')||el('span',null,'rt-badge');badge.textContent=`${baseline.cuisine} · ${baseline.role}`;heading.append(badge);
 const ratingBox=el('div',null,'rt-heading-ratings');
 const old=item.feedback;
 const liking=stars('내 입맛',old?.likingStars??(old?.liking===3?5:old?.liking===2?3:old?.liking===1?1:0));
 const again=stars('다시 먹고 싶은 정도',old?.againStars??(old?.again===true?5:old?.again===false?1:0));
 ratingBox.append(liking.root,again.root);heading.append(ratingBox);
 const section=el('section',null,'rt-unified-editor');section.append(el('h3','AI 분류·예상 맛'));
 const countryField=select('나라·문화권',cuisines,baseline.cuisine),roleField=select('한 끼 역할',roles,baseline.role),fields=el('div',null,'rt-fields');fields.append(countryField.wrap,roleField.wrap);section.append(fields);
 const note=el('p',null,'rt-note');section.append(note,el('p','0=거의 없음 · 5=매우 강함 · 미확인=자료 없음','rt-note'));
 const bars=el('div',null,'rt-slider-list'),tasteInputs={},sliders={};
 for(const [key,label]of Object.entries(axes)){const field=tasteSlider(label);sliders[key]=field;tasteInputs[key]=field.input;bars.append(field.wrap);}
 const texture=el('input'),aroma=el('input');texture.maxLength=80;aroma.maxLength=80;
 const tlabel=el('label','식감'),alabel=el('label','향');tlabel.append(texture);alabel.append(aroma);section.append(bars,tlabel,alabel);
 const tasted=el('input');tasted.type='checkbox';tasted.checked=!!old&&(Object.keys(old.actual||{}).length>0||old.texture!=null||old.aroma!=null);
 const tastedLabel=el('label',null,'rt-check');tastedLabel.append(tasted,document.createTextNode('먹어본 뒤 수정한 평가'));section.append(tastedLabel);
 section.append(el('p','먹어본 뒤 수정했다면 체크 후 저장하세요.','rt-note'));
 const message=el('p',null,'rt-note');message.setAttribute('role','status');
 function updateSliders(){Object.values(sliders).forEach(slider=>slider.paint());}
 function display(){countryField.s.value=baseline.cuisine;roleField.s.value=baseline.role;const values=tasted.checked?{...baseline.taste,...(item.feedback?.actual||{})}:baseline.taste;
  for(const k in axes)sliders[k].set(values[k]);
  texture.value=tasted.checked?(item.feedback?.texture??baseline.texture):baseline.texture;aroma.value=tasted.checked?(item.feedback?.aroma??baseline.aroma):baseline.aroma;
  updateSliders();note.textContent=tasted.checked?'먹어본 뒤 수정한 맛 평가입니다. AI의 예상값은 별도로 보관합니다.':baseline.source==='LOCAL_LLM'?'AI 예상 맛 · 실제 맛은 재료와 조리에 따라 달라집니다.':baseline.source==='USER'?'사용자가 수정한 예상값입니다.':'AI 맛 자료를 준비하고 있습니다.';
 }
 display();section.addEventListener('input',event=>{dirty=true;if(event.target!==tasted)fieldsDirty=true;if(event.target===countryField.s||event.target===roleField.s)metadataDirty=true;updateSliders();});
 tasted.addEventListener('change',()=>{dirty=true;note.textContent=tasted.checked?'현재 입력값을 먹어본 뒤의 평가로 저장합니다.':'현재 입력값을 예상값으로 저장합니다.';});
 const changed=()=>{dirty=true;message.textContent='변경한 내용을 분류 및 평가 저장으로 저장해 주세요.';};liking.onChange(changed);again.onChange(changed);
 const read=()=>Object.fromEntries(Object.entries(tasteInputs).filter(([,input])=>input.dataset.known==='true').map(([key,input])=>[key,Number(input.value)]));
 const save=btn('분류 및 평가 저장',async()=>{
  if(saving)return;saving=true;save.disabled=true;message.textContent='저장 중…';
  try{
   const features={...baseline,cuisine:countryField.s.value,role:roleField.s.value,taste:tasted.checked?baseline.taste:read(),texture:tasted.checked?baseline.texture:texture.value,aroma:tasted.checked?baseline.aroma:aroma.value,source:metadataDirty||fieldsDirty&&!tasted.checked?'USER':baseline.source};
   const feedback=(liking.value||again.value||tasted.checked)?{liking:liking.value===0?0:liking.value<=2?1:liking.value===3?2:3,again:again.value===0?null:again.value>=3,likingStars:liking.value||null,againStars:again.value||null,actual:tasted.checked?read():{},texture:tasted.checked?texture.value:null,aroma:tasted.checked?aroma.value:null,adjustments:[]}:null;
   const r=await api(`/api/me/recipes/taste/${item.number}`,{features,feedback,revision:item.revision});item.revision=r.revision;item.features=features;item.feedback=feedback;baseline=structuredClone(features);dirty=false;fieldsDirty=false;metadataDirty=false;display();badge.textContent=`${features.cuisine} · ${features.role}`;
   const fresh=await api('/api/me/recipes/taste').catch(()=>null);if(fresh){state.profile=fresh.profile;state.evaluated=fresh.evaluated;state.message=fresh.message;fresh.recipes.forEach(v=>{const x=state.recipes.find(a=>a.number===v.number);if(x){x.distance=v.distance;x.prediction=v.prediction;}});profile();}order();message.textContent='저장했습니다. MyPage의 레시피와 별점에 반영됩니다.';
  }catch(e){message.textContent=e.message;}finally{saving=false;save.disabled=false;}
 });root.append(section,save,message);
 return async()=>{
  if(item.prediction||baseline.source==='LOCAL_LLM')return;
  message.textContent='AI 분류·예상 맛을 자동으로 준비하고 있습니다…';
  try{
   const result=await api(`/api/me/recipes/taste/${item.number}/analyze`,{});
   if(result.source!=='LOCAL_LLM'){message.textContent='AI 맛 자료를 불러오지 못했습니다. 현재 값은 유지되며 다음 방문 때 다시 확인합니다.';return;}
   item.prediction=result;
   if(!dirty&&!saving&&baseline.source==='RULE'){baseline=structuredClone(result);item.features=result;display();badge.textContent=`${result.cuisine} · ${result.role}`;order();message.textContent='AI 분류·예상 맛을 표시했습니다. 수정 후 저장할 수 있어요.';}
   else message.textContent='AI 예상값을 준비했습니다. 편집 중인 내용은 그대로 유지했습니다.';
  }catch(e){message.textContent=e.message;}
 };
}
async function init(){
 const toolbar=$('rt-toolbar');if(!toolbar)return;
 document.querySelectorAll('.recipe-saved-heading img').forEach(image=>image.addEventListener('error',()=>{image.hidden=true;}));
 toolbar.append(country.wrap,role.wrap,sort.wrap);const search=el('form',null,'rt-search');const find=el('button','검색');find.type='submit';search.append(query,find,btn('검색 해제',()=>{query.value='';matched=null;order();}));
 search.addEventListener('submit',async e=>{e.preventDefault();if(!query.value.trim()){matched=null;order();return;}find.disabled=true;status.textContent='검색 조건을 해석하고 있습니다…';try{const r=await api('/api/me/recipes/taste/search',{query:query.value.trim()});matched=new Set(r.numbers);order();status.textContent+=r.mode==='LITERAL'?' · AI 연결을 확인하지 못해 입력 문구 그대로 검색했습니다.':` · 조건: ${[r.conditions.cuisine,r.conditions.role,r.conditions.include.length?'포함 '+r.conditions.include.join(', '):'',r.conditions.exclude.length?'제외 '+r.conditions.exclude.join(', '):'',r.conditions.minutes?r.conditions.minutes+'분 이내':''].filter(Boolean).join(' · ')||'전체'}`;}catch(err){status.textContent=err.message;}finally{find.disabled=false;}});
 toolbar.append(search);[country.s,role.s,sort.s].forEach(s=>s.addEventListener('change',order));
 try{state=await api('/api/me/recipes/taste');const pageAccount=document.querySelector('header[data-account-key]')?.dataset.accountKey;if(pageAccount&&pageAccount!==state.account)throw Error('계정이 변경되었습니다. 화면을 새로고침해 주세요.');document.querySelectorAll('[data-recipe-number]').forEach(card=>cards.set(Number(card.dataset.recipeNumber),card));const automatic=[];for(const item of state.recipes){const card=cards.get(item.number);if(card)automatic.push(featureEditor(item,card));}profile();order();for(const load of automatic)await load();}catch(e){status.textContent=e.message;}
}
init();
