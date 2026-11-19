'use strict';
(()=>{
 const conditionNames={'고혈압':'bp','이상지질혈증':'lipid','당뇨병':'diabetes'};
 const empty=(reason,code)=>({allowed:false,reason,code,conditions:[]});
 function plan(profile,care,allergy){
  if(!profile)return empty('건강정보에서 현재 상태와 조건을 입력하고 확정해 주세요.','profile_missing');
  const fields=profile.fields||[];if(!Array.isArray(fields)||new Set(fields.map(x=>x.name)).size!==fields.length)return empty('건강정보 입력 형식을 다시 확인해 주세요.','profile_invalid');
  const get=n=>fields.find(f=>f.name===n)?.values||[],one=n=>(get(n)[0]||'').trim(),warnings=[];const unknown=v=>!v||['미확인','선택하지 않음'].includes(v);
  const age=Number(one('age'));if(one('age')&&(!Number.isInteger(age)||age<19||age>120))return empty('현재 안내는 만 19세 이상 일반 성인 범위입니다. 나이를 확인해 주세요.','age_scope');
  if(!one('age'))warnings.push('나이 미입력 · 연령별 적합성 미확인');
  if(!unknown(one('referenceContext'))&&one('referenceContext')!=='일반 성인 참고')return empty('건강정보의 비교 기준을 확인해 주세요. 임신·수유 등 별도 기준은 자동 추천을 보류합니다.','reference_scope');
  if(unknown(one('referenceContext')))warnings.push('비교 기준 미입력 · 일반 식품 선택 정보만 표시');
  const diseases=get('conditions');if(diseases.some(x=>!Object.hasOwn(conditionNames,x)))return empty('신장질환·기타 만성질환은 병기와 개인별 식사 제한을 확인해야 하므로 추천을 보류합니다.','disease_hold');
  if(!fields.some(x=>x.name==='conditions'))warnings.push('진단 질환 정보 미입력 · 입력된 다른 조건만 사용');
  if(!unknown(one('restriction'))&&!['없음','해당 없음','제한 없음'].includes(one('restriction')))return empty('입력한 식사·운동 제한을 자동 해석할 수 없어 추천을 보류합니다.','restriction_hold');
  if(unknown(one('restriction')))warnings.push('식사·운동 제한 미입력 · 개인 제한 미반영');
  if(!unknown(one('medication'))&&one('medication')!=='해당 없음')return empty('치료·복약 중으로 입력한 경우 개인 제한 검토를 위해 자동 추천을 보류합니다.','medication_hold');
  if(unknown(one('medication')))warnings.push('복약 정보 미입력 · 약물 관련 제한 미반영');
  if(fields.some(f=>/^(care_|symptoms_)/.test(f.name)&&f.values.some(v=>!unknown(v.trim())&&!['없음','해당 없음'].includes(v.trim()))))return empty('입력한 치료·증상·개인 제한 내용을 자동 해석할 수 없어 추천을 보류합니다.','narrative_hold');
  if(allergy&&(!['none','has','unset'].includes(allergy.mode)||allergy.other||allergy.mode==='has'&&(!allergy.allergens?.length||allergy.allergens.includes('sulfite'))))return empty('건강정보에서 알레르기 없음 또는 제외할 원재료를 확인하고 적용해 주세요.','allergy_hold');
  if(!allergy||allergy.mode==='unset')warnings.push('알레르기 미입력 · 알레르기 제외 미적용');
  const conditions=[...new Set(diseases.map(x=>conditionNames[x]))];
  const goal=one('weightGoal');if(goal==='증량')return empty('증량에 필요한 개인별 영양 조건이 아직 연결되지 않아 추천을 보류합니다.','weight_gain_hold');
  if(goal==='감량'){
   const h=Number(one('height')),w=Number(one('weight'));
   if((one('height')&&(!Number.isFinite(h)||h<30||h>250))||(one('weight')&&(!Number.isFinite(w)||w<1||w>400)))return empty('입력한 키·체중의 범위를 확인해 주세요.','weight_invalid');
   if(!one('height')||!one('weight'))warnings.push('키·체중 미입력 · 감량 목표 적합성/필요 열량 미평가');
   if(one('height')&&one('weight')&&w/((h/100)**2)<18.5)return empty('저체중 범위에서는 감량 방향 추천을 보류합니다. 체중 목표를 다시 확인해 주세요.','underweight_hold');
   conditions.push('weight');
  }
  if(!conditions.length)return empty('현재 연결한 조건은 고혈압·이상지질혈증·당뇨병 또는 감량 목표입니다. 건강정보의 조건을 먼저 확인해 주세요.','no_supported_condition');
  return {allowed:true,code:'bounded_guide',conditions,warnings,demo:!!profile.demo||!!care?.demo};
 }
 function validate(data){
  if(data?.schema_version!==1||data.evidence_schema!==1||data.clinical_approval!==false||!data.condition_guidance||typeof data.nutrition_version!=='string'||!Array.isArray(data.foods)||data.foods.length>2000||new Set(data.foods.map(x=>x.id)).size!==data.foods.length)throw Error('추천 자료 형식을 확인할 수 없습니다.');
  for(const cond of Object.keys(data.conditions)){const g=data.condition_guidance[cond];if(!g?.purpose||!g.limit||!g.source_ids?.length||g.source_ids.some(id=>!data.sources[id])||!g.nutrients?.length||!Array.isArray(g.checks))throw Error('관리조건의 식품 선택 근거를 확인할 수 없습니다.');}
  const foodsById=new Map(data.foods.map(r=>[r.id,r]));
  for(const r of data.foods){
   const recipe=r.id?.startsWith('mfds_recipes:');
   if(!/^(rda_10_4|mfds_dishes|mfds_recipes):[A-Za-z0-9_-]+$/.test(r.id)||!r.name||!['ingredient','dish'].includes(r.kind)||!r.evidence||!r.nutrients)throw Error('추천 식품 자료가 일치하지 않습니다.');
   if(recipe){
    if(r.kind!=='dish'||r.scope!=='ingredient_linked_recipe_not_therapeutic'||Object.keys(r.nutrients).length||!r.related_recipe?.ingredients_raw||!r.related_recipe.steps?.length||!r.ingredient_links?.length||r.related_recipe.recipe_id!==r.id.split(':')[1])throw Error('레시피 연결 자료가 올바르지 않습니다.');
    for(const link of r.ingredient_links){if(!link.term||!link.food_ids?.length||link.food_ids.some(id=>foodsById.get(id)?.kind!=='ingredient'||foodsById.get(id).name.split(',')[0].trim()!==link.term))throw Error('추천 재료 연결을 확인할 수 없습니다.');}
   }else if(r.basis!==(r.kind==='dish'?'100g':'100g edible portion')||r.id.startsWith('mfds_dishes:')!==(r.kind==='dish'))throw Error('영양 기준량이 올바르지 않습니다.');
   for(const [c,sids] of Object.entries(r.evidence)){
    if(!data.conditions[c]||!Array.isArray(sids)||!sids.length||sids.some(s=>!data.sources[s]))throw Error('추천 근거가 누락됐습니다.');
    if(recipe){const refs=r.ingredient_links.flatMap(x=>x.food_ids).map(id=>foodsById.get(id));if(sids.some(s=>!refs.some(f=>f.evidence[c]?.includes(s))))throw Error('레시피 재료의 관리조건 근거가 일치하지 않습니다.');}
    else for(const n of data.conditions[c].required_nutrients){const x=r.nutrients[n];if(x?.status!=='numeric'||!Number.isFinite(x.value)||x.value<0)throw Error('추천에 필요한 영양 수치를 확인할 수 없습니다.');}
    const link=r.condition_links?.[c];
    if(!link||link.prescription!==false||!['named_food_reference','food_group_application','menu_example','cooking_form_example','ingredient_recipe_link'].includes(link.mode)||!link.reason||!link.limit||!Array.isArray(link.terms)||!link.terms.length||new Set(link.terms).size!==link.terms.length||!Array.isArray(link.ingredient_ids)||new Set(link.ingredient_ids).size!==link.ingredient_ids.length||!Array.isArray(link.sources)||JSON.stringify(link.sources.map(x=>x.source_id).sort())!==JSON.stringify([...sids].sort())||link.sources.some(x=>!['condition_guidance','name_reference','menu_example'].includes(x.role))||JSON.stringify(link.nutrients_to_check)!==JSON.stringify(data.condition_guidance[c].nutrients))throw Error('조건별 식품 연결 근거가 올바르지 않습니다.');
    if(link.terms.some(x=>typeof x!=='string'||!x.trim())||link.sources.some(x=>x.role!==(x.source_id==='kdca-bp-shopping'&&['lipid','weight'].includes(c)?'name_reference':x.source_id==='kdca-heart-menu'?'menu_example':'condition_guidance')))throw Error('출처의 활용 범위가 일치하지 않습니다.');
    if(recipe){
     const applicable=r.ingredient_links.filter(x=>Object.hasOwn(x.conditions,c));const terms=[...new Set(applicable.map(x=>x.term))].sort(),ids=[...new Set(applicable.flatMap(x=>x.food_ids).filter(id=>foodsById.get(id)?.evidence[c]))].sort();
     if(link.mode!=='ingredient_recipe_link'||JSON.stringify([...link.terms].sort())!==JSON.stringify(terms)||JSON.stringify([...link.ingredient_ids].sort())!==JSON.stringify(ids))throw Error('이 관리조건에 해당하지 않는 재료가 연결됐습니다.');
    }else if(r.kind==='ingredient'){if(!['named_food_reference','food_group_application'].includes(link.mode)||link.ingredient_ids.length!==1||link.ingredient_ids[0]!==r.id||link.terms.some(term=>!r.name.includes(term)))throw Error('식재료의 연결 코드가 일치하지 않습니다.');}
    else if(!['menu_example','cooking_form_example'].includes(link.mode)||link.ingredient_ids.length||link.terms.length!==1||link.terms[0]!==r.name)throw Error('음식 예시의 연결 범위를 확인할 수 없습니다.');
   }
   if(JSON.stringify(Object.keys(r.condition_links||{}).sort())!==JSON.stringify(Object.keys(r.evidence).sort()))throw Error('조건별 근거 범위가 일치하지 않습니다.');
  }
  return data;
 }
 function match(data,p,allergy,inspect){
  if(!p.allowed)return {foods:[],excluded:0};let excluded=0;
  const foods=data.foods.filter(r=>{if(!p.conditions.every(c=>r.evidence[c]))return false;const a=inspect(r,allergy);if(!a.allowed){excluded++;return false;}return true;});
  return {foods,excluded};
 }
 function explain(data,food,conditions){return conditions.filter(c=>food.evidence[c]&&food.condition_links?.[c]).map(c=>({condition:c,...food.condition_links[c]}));}
 window.SmartNFRecommendation={plan,validate,match,explain};
})();
