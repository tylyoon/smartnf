'use strict';
(()=>{
 const KEY='smartnf.food-selection.v1',CARE='smartnf.food-guide-context.v1',TTL=86400000;
 const actionNames={salt:'짜게 먹는 습관 줄이기',balanced:'균형 잡힌 식사 실천하기',movement:'걷기 등 신체활동 실천하기',weightcare:'적정 체중 관리하기',alcohol:'음주 줄이기·피하기',smoking:'금연 실천하기',regular:'규칙적인 식사 실천하기',sugar:'단 음료·첨가당 줄이기',fat:'포화지방 줄이고 지방 종류 살펴보기',late:'야식·늦은 과식 줄이기'};
 const scopeNames={bmi:'BMI·체중',bp:'혈압',glucose:'혈당',lipid:'혈중 지질',habits:'식습관',activity:'활동·개인 조건'};
 const supported=window.SmartNFCareState?.supported||{bmi:['weightcare','balanced','regular','sugar','movement'],bp:['salt','balanced','movement','weightcare','alcohol','smoking'],glucose:['regular','sugar','balanced','movement','weightcare'],lipid:['fat','sugar','balanced','movement','weightcare','alcohol'],habits:['regular','balanced','sugar','salt','late'],activity:['movement','balanced','weightcare','alcohol','smoking']};
 const allowedConditions=['kidney','diabetes','allergy','special'];
 const validRelated=r=>Array.isArray(r)&&r.length<=10&&new Set(r.map(x=>x.id)).size===r.length&&r.every(x=>Object.hasOwn(actionNames,x.id)&&Array.isArray(x.scopes)&&x.scopes.length>0&&x.scopes.length<=6&&new Set(x.scopes).size===x.scopes.length&&x.scopes.every(s=>supported[s]?.includes(x.id)));
 const validId=id=>typeof id==='string'&&/^(rda_10_4|mfds_dishes|mfds_recipes):[A-Za-z0-9_-]{1,80}$/.test(id);
 const fresh=t=>Number.isFinite(t)&&Date.now()-t>=0&&Date.now()-t<TTL;
 function care(){if(window.SmartNFCareState){try{return window.SmartNFCareState.read();}catch{return null;}}try{const c=JSON.parse(sessionStorage.getItem(CARE));if(window.SmartNFHealthProfile?.read()?.confirmedAt>c?.confirmedAt)return null;if(c&&c.version===1&&typeof c.demo==='boolean'&&fresh(c.confirmedAt)&&validRelated(c.items)&&c.items.length)return c;}catch{}return null;}
 function empty(){return {version:1,savedAt:Date.now(),items:[],conditions:[]};}
 function selection(){try{const s=JSON.parse(sessionStorage.getItem(KEY));if(!s)return empty();
  if(s.version===1&&fresh(s.savedAt)&&Array.isArray(s.items)&&s.items.length<=30&&new Set(s.items.map(x=>x.id)).size===s.items.length&&Array.isArray(s.conditions)&&s.conditions.length<=4&&s.conditions.every(x=>allowedConditions.includes(x))&&s.items.every(x=>validId(x.id)&&typeof x.demo==='boolean'&&validRelated(x.related)&&Array.isArray(x.origins)&&x.origins.length>0&&x.origins.length<=2&&x.origins.every(o=>['manual','recommendation'].includes(o)))){if(window.SmartNFDraftState?.resetFailed)s.items=[];return s;}
  sessionStorage.removeItem(KEY);
 }catch{}return empty();}
 function save(s){s.savedAt=Date.now();try{sessionStorage.setItem(KEY,JSON.stringify(s));}catch{throw new Error('현재 브라우저에서 선택을 저장할 수 없습니다. 저장 설정을 확인해 주세요.');}window.SmartNFDraftState?.draftSaved();window.dispatchEvent(new Event('smartnf-food-selection'));}
 function add(record,origin,related=[]){if(window.SmartNFAllergy){const check=window.SmartNFAllergy.inspect(record);if(!check.allowed)throw new Error(check.reason+' · 알레르기 조건과 자료를 확인해 주세요.');}if(!validId(record.id)||!['manual','recommendation'].includes(origin)||!validRelated(related))throw new Error('INVALID_SELECTION');const s=selection();let item=s.items.find(x=>x.id===record.id);const c=care();
  if(!item){if(s.items.length>=30)throw new Error('선택 목록은 30개까지 담을 수 있습니다.');item={id:record.id,origins:[],related:[],demo:false};s.items.push(item);}
  item.origins=[...new Set([...item.origins,origin])];
  for(const r of related){const old=item.related.find(x=>x.id===r.id);if(old)old.scopes=[...new Set([...old.scopes,...r.scopes])];else item.related.push({id:r.id,scopes:[...r.scopes]});}
  item.demo=item.demo||!!c?.demo;save(s);
 }
 function toggle(record,origin,related=[]){if(selection().items.some(x=>x.id===record.id)){remove(record.id);return false;}add(record,origin,related);return true;}
 function remove(id){const s=selection();s.items=s.items.filter(x=>x.id!==id);save(s);}
 function conditions(values){if(!Array.isArray(values)||values.some(v=>!allowedConditions.includes(v)))throw new Error('INVALID_CONDITIONS');const s=selection();s.conditions=[...new Set(values)];save(s);}
 const memo=new Map();let manifestPromise;
 async function get(url){if(!memo.has(url))memo.set(url,fetch(url,{credentials:'same-origin'}).then(r=>{if(!r.ok)throw new Error('자료를 불러올 수 없습니다.');return r.json();}).catch(e=>{memo.delete(url);throw e;}));return memo.get(url);}
 async function manifest(){if(!manifestPromise)manifestPromise=get('/js/data/food-nutrition/manifest.json').then(m=>{if(!/^v-[a-f0-9]{20}$/.test(m.version))throw new Error('INVALID_MANIFEST');return m;}).catch(e=>{manifestPromise=null;throw e;});return manifestPromise;}
 async function file(name){if(!/^[a-z0-9_-]+\.json$/.test(name))throw new Error('INVALID_FILE');const m=await manifest();return get('/js/data/food-nutrition/'+m.version+'/'+name);}
 async function index(source='rda_10_4'){if(!['rda_10_4','mfds_dishes'].includes(source))throw new Error('INVALID_SOURCE');const m=await manifest();return file(m.sources[source].index);}
 async function record(id){if(!validId(id))throw new Error('INVALID_ID');if(id.startsWith('mfds_recipes:')){const m=await manifest(),d=await get('/js/data/recommendation-guide-v1.json'),r=d.foods?.find(x=>x.id===id);if(d.nutrition_version!==m.version||r?.scope!=='ingredient_linked_recipe_not_therapeutic'||r.related_recipe?.recipe_id!==id.split(':')[1]||!r.related_recipe.ingredients_raw)throw new Error('레시피 원본을 확인할 수 없습니다.');return r;}const rows=await index(id.split(':')[0]);const row=rows.find(x=>x.id===id);if(!row)throw new Error('선택한 식품의 최신 자료를 찾지 못했습니다.');const chunk=await file(row.chunk);if(chunk[id]?.id!==id)throw new Error('INVALID_RECORD');return chunk[id];}
 const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=String(text);if(cls)n.className=cls;return n;};
 function message(text){document.querySelectorAll('[data-flow-status]').forEach(n=>n.textContent=text);}
 let trayVersion=0;
 async function trays(){const token=++trayVersion,s=selection();const lists=[...document.querySelectorAll('[data-selection-list]')];if(!lists.length)return;
 const rows=await Promise.all(s.items.map(async item=>{try{return {item,food:await record(item.id)};}catch{return {item,food:null};}}));if(token!==trayVersion)return;
 lists.forEach(list=>{list.replaceChildren();const groups=[['ingredient','선택한 식재료'],['dish','선택한 음식'],['review','자료 확인이 필요한 선택']];const grid=el('div',undefined,'fc-selection-groups');
 for(const [kind,title]of groups){const picked=rows.filter(row=>(window.SmartNFFoodIdentity?.kind(row.food)||'review')===kind);if(kind==='review'&&!picked.length)continue;const section=el('section',undefined,'fc-selection-group');section.dataset.selectionKind=kind;const heading=el('h3',kind==='ingredient'&&window.SmartNFDishRecipes?title:title+' · '+picked.length+'개');section.append(heading);if(kind==='ingredient'&&window.SmartNFDishRecipes)section.append(el('h4','직접 선택한 식재료 · '+picked.length+'개'));if(!picked.length)section.append(el('p','아직 선택한 항목이 없습니다.','fn-muted'));
  picked.forEach(({item,food})=>{const row=el('div',undefined,'fc-picked');const text=el('div');text.append(el('strong',food?.name||'자료 확인이 필요한 선택'),el('small',item.origins.map(o=>o==='manual'?'직접 선택':'추천에서 선택').join(' · ')));
   if(item.related.length)text.append(el('small','선택 당시 관리항목: '+item.related.map(r=>actionNames[r.id]+' ['+r.scopes.map(s=>scopeNames[s]).join('·')+']').join(' / ')));
   if(food&&window.SmartNFAllergy){const a=window.SmartNFAllergy.inspect(food);if(!a.allowed)text.append(el('small','가이드 제외: '+a.reason));}
   if(item.demo)text.append(el('small','가상 예시 관리항목에서 선택'));
   const button=el('button','제외');button.type='button';button.setAttribute('aria-label',(food?.name||'자료 확인이 필요한 선택')+' 선택 제외');button.addEventListener('click',()=>{try{remove(item.id);message((food?.name||'선택 식품')+'을 선택 목록에서 제외했습니다.');}catch{message('선택 목록을 변경할 수 없습니다. 브라우저 저장 설정을 확인해 주세요.');}});row.append(text,button);section.append(row);
  });if(kind==='ingredient')window.SmartNFDishRecipes?.grouped(section);grid.append(section);
 }list.append(grid);
 });document.querySelectorAll('[data-selection-count]').forEach(n=>n.textContent=s.items.length+'개');
 }
 let pruning=0;
 async function pruneAllergy(){const A=window.SmartNFAllergy;if(!A)return;const p=A.profile();if(p.mode!=='has'||!p.allergens.length||p.other||p.allergens.includes('sulfite')){trays();return;}
  const token=++pruning,at=p.savedAt,s=selection(),removed=[];const checked=await Promise.all(s.items.map(async item=>{try{const food=await record(item.id);const result=A.inspect(food,p);if(!result.allowed)removed.push({id:item.id,name:food.name,reason:result.reason});return result.allowed?item:null;}catch{return item;}}));
  if(token!==pruning||(A.profile().savedAt!==at||A.profile().mode!==p.mode))return;const current=selection();if(JSON.stringify(current.items)!==JSON.stringify(s.items)){pruneAllergy();return;}
  if(removed.length){current.items=checked.filter(Boolean);try{save(current);message('알레르기 조건으로 '+removed.length+'개 식품을 선택 목록에서 제외했습니다: '+removed.map(r=>r.name+' ('+r.reason+')').join(' / '));}catch{message('알레르기 제외 대상을 저장하지 못했습니다. 식품을 선택하거나 가이드에 사용하지 마세요.');}}else trays();
 }
 window.addEventListener('smartnf-allergy-change',pruneAllergy);
 window.SmartNFFoodFlow={care,selection,add,remove,toggle,conditions,index,record,el,actionNames,scopeNames,message,trays,validRelated};
 window.addEventListener('smartnf-food-selection',()=>{trays();});
 document.addEventListener('DOMContentLoaded',()=>{trays();pruneAllergy();});
})();
