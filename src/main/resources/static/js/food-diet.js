'use strict';
(()=>{
 const F=window.SmartNFFoodFlow;if(!F||!document.getElementById('fd-roles'))return;const $=id=>document.getElementById(id),el=F.el;
 const tips={salt:'선택한 식품에 더하는 양념·소스와 국물까지 함께 살펴보세요. 추가 간을 하기 전에 맛을 확인하고 소스는 따로 둘 수 있습니다.',balanced:'선택 목록에 주식·단백질 식품·채소 등 서로 다른 식품군이 있는지 살펴보세요. 한 식품만으로 끼니 전체를 대신하지 않습니다.',regular:'선택한 식품을 언제 먹을지 생활 일정과 함께 정해 보세요. 식사·간식의 시간과 실제 먹은 내용을 따로 기록할 수 있도록 준비하세요.',sugar:'식사 외에 먹는 음료·간식도 함께 확인하세요. 당류만으로 판단하지 말고 총 탄수화물과 실제 먹는 분량을 함께 살펴보세요.',fat:'선택한 식품과 조리용 기름·소스의 포화지방·트랜스지방을 함께 확인하세요. 기름도 실제 사용하는 양을 구분합니다.',weightcare:'선택한 식품의 표시 기준량과 실제 먹는 양을 구분하세요. 이 목록을 개인의 필요 열량이나 감량 목표로 사용하지 않습니다.',late:'선택한 식품을 늦은 시간에 몰아 먹는지 하루 식사 흐름과 함께 돌아보세요. 시간을 정하는 것과 실제 섭취량 기록을 구분합니다.',alcohol:'선택한 식품과 별도로 음주 여부와 먹는 상황을 돌아보세요. 특정 식품이 음주의 영향을 상쇄하는 것으로 해석하지 않습니다.'};
 const roles=[['주식으로 살펴볼 식품',/곡류|감자|전분/,'기준 자료가 생것이면 조리한 식품의 중량과 혼용하지 마세요. 조리 후 분량은 별도로 확인합니다.'],['단백질 식품으로 살펴볼 식품',/두류|육류|난류|어패|어류|수산/,'선택한 부위와 생것·가공 상태를 확인하고, 제품 안내와 안전 조리 기준에 맞게 준비하세요.'],['채소·과일로 살펴볼 식품',/채소|과실|과일|버섯/,'세척·손질과 개인 제한을 확인하고, 추가하는 양념이나 드레싱도 함께 살펴보세요.'],['조리용 유지로 살펴볼 식품',/유지류/,'먹는 분량과 조리 시 사용량을 구분하고 지방 종류를 확인하세요.'],['음식·기타 선택',/.*/,'완성 음식이나 복합 식품은 한 식품군으로 단정하지 말고 실제 원재료·조리법·기준량을 확인하세요.']];
 let version=0;
 async function render(){const token=++version,s=F.selection();$('fd-retry').hidden=true;$('fd-roles').replaceChildren();$('fd-actions').replaceChildren();$('fd-everyday').replaceChildren();
  const careNow=F.care(),limited=s.conditions.some(x=>x!=='allergy')||['review'].includes(window.SmartNFAllergy?.profile().mode);
  const requested=limited?[]:(careNow?.items||[]),rules=window.SmartNFLifestyleGuides||[];
  const fallback={shopping:'구매할 제품의 원재료와 영양표시 기준량을 확인하세요.',cooking:'실제 사용하는 재료·양념과 먹는 분량을 구분해 확인하세요.',eating_out:'주문 전에 원재료와 조리방법을 확인하세요.'};
  for(const [stage,title] of [['shopping','장보기'],['cooking','조리하기'],['eating_out','외식하기']]){
   const card=el('article',undefined,'fc-card');card.dataset.guideStage=stage;card.append(el('h3',title));
   const found=rules.filter(r=>r.stage===stage&&requested.some(x=>x.id===r.action_id));
   if(careNow?.demo)card.append(el('small','가상 예시 관리항목 기준'));
   if(found.length){for(const r of found){const block=el('section');block.dataset.guideRule=r.id;block.append(el('strong',F.actionNames[r.action_id]),el('p',r.instruction),el('small','이유: '+r.why));const a=el('a','근거 · '+r.source_title+' / '+r.source_section);a.href=r.source_url;a.target='_blank';a.rel='noopener noreferrer';block.append(a);card.append(block);}}
   else card.append(el('p',fallback[stage]),el('small',limited?'개인 제한 조건이 있어 맞춤 행동 안내를 보류합니다.':'연결 가능한 확정 관리항목이 없어 일반 확인사항을 표시합니다.'));
   const missing=requested.filter(x=>!rules.some(r=>r.stage===stage&&r.action_id===x.id));
   if(missing.length)card.append(el('small','상세 안내 준비 중: '+missing.map(x=>F.actionNames[x.id]).join(' · ')));
   $('fd-everyday').append(card);
  }
  if(!s.items.length){$('fd-note').textContent='아직 선택한 식품이 없습니다. 식품 선택 가이드나 영양정보에서 먼저 골라 주세요.';return;}
  try{const rows=await Promise.all(s.items.map(async item=>{try{return {item,food:await F.record(item.id)};}catch{return {item,food:null};}}));if(token!==version)return;const excluded=rows.filter(x=>x.food&&window.SmartNFAllergy&&!window.SmartNFAllergy.inspect(x.food).allowed).length;for(const row of rows){if(row.food&&window.SmartNFAllergy&&!window.SmartNFAllergy.inspect(row.food).allowed)row.food=null;}const failed=rows.filter(x=>!x.food).length,restricted=s.conditions.some(x=>x!=='allergy')||['review'].includes(window.SmartNFAllergy?.profile().mode);
   $('fd-note').textContent=(restricted?'별도 관리조건이 있어 개인 맞춤 조리·실천 안내는 보류합니다. 아래는 선택한 자료의 분류와 기준을 확인하는 목록입니다.':'선택한 식품의 원본 분류를 바탕으로 구성과 조리 시 확인할 점을 안내합니다. 식단 완성도나 섭취량을 판정하지 않습니다.')+(failed?' 자료를 다시 확인해야 하는 선택이 '+failed+'개 있습니다.':'');
   if(!restricted){const usable=rows.filter(x=>x.food);if(usable.length){for(const card of $('fd-everyday').children){card.append(el('small','현재 선택: '+usable.map(x=>x.food.name).slice(0,3).join(' · ')+(usable.length>3?' 외 '+(usable.length-3)+'개':'')),el('small','선택 식품명은 활용 맥락이며 위 조리법의 적합성·영양 충족을 개별 판정한 것은 아닙니다.'));}}}
   const grouped=new Map();for(const {food} of rows){if(!food)continue;const role=food.id.startsWith('mfds_dishes:')?roles[4]:roles.find(r=>r[1].test(food.group||''));if(!grouped.has(role))grouped.set(role,[]);grouped.get(role).push(food);}
   for(const [role,foods]of grouped){const card=el('article',undefined,'fc-card');card.append(el('h3',role[0]));const list=el('ul');foods.forEach(food=>{const li=el('li');li.append(el('strong',food.name),el('small',(food.basis_raw==='100g edible portion'?'가식부 100g':food.basis_raw)+' · '+food.source_code));list.append(li);});card.append(list);if(!restricted)card.append(el('p',role[2]));$('fd-roles').append(card);}
   const care=F.care();if(restricted){$('fd-actions').append(el('p','개인 식이 지침·알레르기·복약 관련 조건을 먼저 확인하세요. 현재 선택을 치료식이나 안전 식품으로 확정하지 않습니다.','fc-warn'));}
   else if(care){if(care.demo)$('fd-actions').append(el('p','가상 예시 관리항목에 따른 안내입니다.','fc-warn'));const actions=care.items.filter(x=>tips[x.id]);if(!actions.length)$('fd-actions').append(el('p','현재 관리항목은 식품 실천 항목과 직접 연결되지 않습니다. 선택한 식품의 구성과 실제 섭취 기록을 따로 확인하세요.'));actions.forEach(r=>{const card=el('article',undefined,'fc-card');card.append(el('h3',F.actionNames[r.id]),el('small','관련 평가: '+r.scopes.map(s=>F.scopeNames[s]).join(' · ')),el('p',tips[r.id]));$('fd-actions').append(card);});}
   else{const card=el('article',undefined,'fc-card');card.append(el('h3','직접 선택한 식품의 일반 식생활 가이드'),el('p',tips.balanced),el('p','건강정보에서 관리항목을 선택하면 그 항목에 관한 일반 실천 안내도 함께 볼 수 있습니다.'));$('fd-actions').append(card);}
   if(failed)$('fd-retry').hidden=false;
  }catch{if(token!==version)return;$('fd-note').textContent='선택한 자료를 불러오지 못했습니다. 다시 확인해 주세요.';$('fd-retry').hidden=false;}
 }
 $('fd-retry').addEventListener('click',render);window.addEventListener('smartnf-food-selection',render);window.addEventListener('smartnf-allergy-change',render);window.addEventListener('smartnf-health-confirmed',render);render();
})();
