'use strict';
(()=>{
 const F=window.SmartNFFoodFlow,A=window.SmartNFAllergy;if(!F||!A)return;
 const KEY='smartnf.confirmed-foods.v1',TTL=86400000,MAX=100,el=F.el;
 function read(){let raw;try{raw=sessionStorage.getItem(KEY);}catch{throw Error('등록 목록을 읽을 수 없습니다. 브라우저 저장 설정을 확인해 주세요.');}if(!raw)return {version:1,savedAt:Date.now(),items:[]};let s;try{s=JSON.parse(raw);}catch{throw Error('등록 목록 형식을 확인해야 합니다. 저장을 중단했습니다.');}
 if(!s||s.version!==1||!Number.isFinite(s.savedAt)||Date.now()-s.savedAt<0||!Array.isArray(s.items)||s.items.length>MAX||new Set(s.items.map(x=>x?.id)).size!==s.items.length||!s.items.every(x=>x&&typeof x.id==='string'&&/^(rda_10_4|mfds_dishes|mfds_recipes):[A-Za-z0-9_-]{1,80}$/.test(x.id)&&typeof x.name==='string'&&x.name.length<=300&&Number.isFinite(x.confirmedAt)&&x.confirmedAt<=Date.now()&&typeof x.demo==='boolean'&&F.validRelated(x.related)&&Array.isArray(x.origins)&&x.origins.length>0&&x.origins.every(o=>['manual','recommendation'].includes(o))))throw Error('등록 목록 형식을 확인해야 합니다. 저장을 중단했습니다.');
 if(Date.now()-s.savedAt>=TTL)return {version:1,savedAt:Date.now(),items:[]};return s;
 }
 function write(items){const data={version:1,savedAt:Date.now(),items};try{sessionStorage.setItem(KEY,JSON.stringify(data));}catch{throw Error('등록 변경을 저장하지 못했습니다. 기존 등록은 유지됩니다.');}window.dispatchEvent(new Event('smartnf-food-registration'));return data;}
 let busy=false;
 async function confirm(){if(busy)throw Error('확인 중입니다. 잠시 기다려 주세요.');busy=true;try{
  const draft=F.selection(),before=JSON.stringify(draft.items);if(!draft.items.length)throw Error('추가할 식품을 먼저 선택하세요.');
  const foods=await Promise.all(draft.items.map(item=>F.record(item.id)));
  if(JSON.stringify(F.selection().items)!==before)throw Error('선택 내용이 변경되었습니다. 다시 확정해 주세요.');
  for(const food of foods)if(!A.inspect(food).allowed)throw Error('알레르기 조건에서 제외되거나 구성을 확인할 수 없는 식품이 있습니다. 선택을 수정하세요.');
  const current=read(),map=new Map(current.items.map(x=>[x.id,x]));let added=0;
  draft.items.forEach((item,i)=>{if(!map.has(item.id)){map.set(item.id,{id:item.id,name:foods[i].name,confirmedAt:Date.now(),related:item.related,origins:item.origins,demo:item.demo});added++;}});
  if(map.size>MAX)throw Error('임시 확정 등록은 100개까지 가능합니다. 기존 등록을 확인하세요.');
  // An explicit confirmation is additive. Unselected prior registrations are not deleted.
  write([...map.values()]);return {added,duplicates:draft.items.length-added};
 }finally{busy=false;}}
 function remove(id){const current=read();if(!current.items.some(x=>x.id===id))return false;write(current.items.filter(x=>x.id!==id));return true;}
 function state(id){try{return read().items.some(x=>x.id===id);}catch{return false;}}
 window.SmartNFFoodRegistration={read,confirm,remove,has:state};
 let renderVersion=0;
 async function render(){const token=++renderVersion;let data;try{data=read();}catch(error){document.querySelectorAll('[data-registration-list]').forEach(n=>n.textContent=error.message);return;}
 document.querySelectorAll('[data-registration-count]').forEach(n=>n.textContent=data.items.length+'개 확정');
 const rows=await Promise.all(data.items.map(async item=>{try{return {item,food:await F.record(item.id)};}catch{return {item,food:null};}}));if(token!==renderVersion)return;
 document.querySelectorAll('[data-registration-list]').forEach(host=>{host.replaceChildren();if(!rows.length)host.append(el('p','확정 등록한 식품이 없습니다.','fn-muted'));for(const {item,food}of rows){const row=el('article',undefined,'fc-picked'),text=el('div');text.append(el('strong',item.name),el('small',item.demo?'가상 예시에서 확정 · 계정 미저장':'추가 확정 · 계정 미저장'));if(item.related.length)text.append(el('small','확정 당시 관리항목: '+item.related.map(r=>F.actionNames[r.id]).join(' · ')));if(!food)text.append(el('small','원본 자료 재확인 필요'));else{const inspection=A.inspect(food);if(!inspection.allowed)text.append(el('small','현재 제외 조건 재확인: '+inspection.reason));}const button=el('button','등록 삭제');button.type='button';button.dataset.registrationDelete=item.id;button.addEventListener('click',()=>{try{remove(item.id);message('확정 등록에서 삭제했습니다. 임시 선택과 과거 섭취 기록은 유지됩니다.');}catch(error){message(error.message);}});row.append(text,button);host.append(row);}});
 document.querySelectorAll('[data-registration-badge]').forEach(badge=>badge.hidden=!data.items.some(x=>x.id===badge.dataset.registrationBadge));
 document.querySelectorAll('[data-add-food],[data-food-select]').forEach(button=>{const id=button.dataset.addFood||button.dataset.foodSelect;button.dataset.registered=String(data.items.some(x=>x.id===id));button.title=button.dataset.registered==='true'?'이미 확정 등록한 식품입니다. 선택 해제와 등록 삭제는 별도입니다.':'';});
 }
 function message(text){document.querySelectorAll('[data-registration-status]').forEach(n=>n.textContent=text);}
 document.querySelectorAll('[data-registration-confirm]').forEach(button=>{button.addEventListener('click',async()=>{button.disabled=true;button.textContent='등록 확인 중…';try{const result=await confirm();button.textContent='✓ 추가 확정 완료';message(result.added+'개 추가 확정 · 기존 등록 '+result.duplicates+'개는 중복 추가하지 않았습니다. 같은 탭 임시 저장이며 MyPage 계정 DB에는 저장되지 않았습니다.');}catch(error){button.textContent='추가 확정 다시 시도';message(error.message);}finally{button.disabled=false;}});});
 window.addEventListener('smartnf-food-selection',()=>{document.querySelectorAll('[data-registration-confirm]').forEach(b=>b.textContent='선택 식품 추가 확정');render();});
 window.addEventListener('smartnf-food-registration',render);window.addEventListener('smartnf-allergy-change',render);render();
})();
