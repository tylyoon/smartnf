'use strict';
(()=>{
 const purposes=['bp','diabetes','lipid','weight'],holdPurposes=['kidney','other'];
 const holds={kidney:'신장질환은 병기와 개인별 식사 제한 확인이 필요하여 개인별 식품 추천을 보류합니다. 영양정보를 확인해 직접 선택할 수 있습니다.',other:'기타 만성질환은 구체적인 질환과 개인별 식사 제한 확인이 필요하여 개인별 식품 추천을 보류합니다. 영양정보를 확인해 직접 선택할 수 있습니다.'};
 function resolve(base,selected='all',context={},secondary=null){
  const warnings=[...(base.warnings||[])];
  if(context.diseases?.includes('신장질환'))warnings.push('신장질환도 등록되어 있습니다. 개인 식사 제한을 별도로 확인하세요. 이 목록은 신장질환 적합성을 확인한 결과가 아닙니다.');
  if(context.diseases?.includes('기타 만성질환'))warnings.push('기타 만성질환도 등록되어 있습니다. 구체적인 질환과 개인 식사 제한을 함께 확인하세요.');
  if(holdPurposes.includes(selected))return {...base,allowed:false,code:'selected_disease_hold',conditions:[],general:true,holdCard:selected,reason:holds[selected],warnings:[]};
  const purpose=purposes.includes(selected)?selected:'all';
  // Inspect remaining eligibility rules after separating the two unsupported diseases.
  if(base.code==='disease_hold'&&secondary){base=secondary;warnings.push(...(secondary.warnings||[]));}
  if(!base.allowed&&!['profile_missing','no_supported_condition'].includes(base.code))return {...base,general:false,warnings:[...new Set(warnings)]};
  if(purpose!=='all')return {...base,allowed:true,code:'selected_card_browse',conditions:[purpose],general:true,reason:'선택한 관리 항목의 일반 식품 후보입니다.',warnings:[...new Set([...warnings,'선택한 관리 항목의 일반 정보입니다. 복합 질환을 포함한 개인별 적합성 판정은 아닙니다.'])]};
  const general=!base.allowed,conditions=general?['bp']:[...base.conditions];
  return {...base,allowed:true,code:general?'general_browse':base.code,conditions,general,warnings:general?['일반 정보 둘러보기입니다. 개인 질환·목표에 맞는 추천으로 확인한 결과가 아닙니다.']:[...new Set(warnings)]};
 }
 const kind=food=>food.scope==='ingredient_linked_recipe_not_therapeutic'?'recipe':food.kind==='dish'?'dish':'ingredient';
 window.SmartNFFoodGuidePolicy={resolve,kind,purposes,holdPurposes};
})();
