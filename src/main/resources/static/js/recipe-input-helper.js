// Interpret explicit search input only. Never infer calorie needs or clinical restrictions.
export function goalInput(text){
 if(/하루|일일|1일|이상|초과/.test(text)||/\d\s*[~～–-]\s*\d/.test(text))throw Error('한 끼 1인분 열량 상한을 하나로 입력해 주세요. 예: 500kcal 이하');
 const values=[...text.matchAll(/(\d+(?:\.\d+)?)\s*(?:kcal|킬로칼로리|칼로리)/gi)].map(m=>Number(m[1]));
 const extra=text.replace(/(\d+(?:\.\d+)?)\s*(?:kcal|킬로칼로리|칼로리)/gi,'').replace(/1\s*(?:인분|끼)/g,'');
 if(/\d/.test(extra)||values.length!==1||!Number.isInteger(values[0])||values[0]<1||values[0]>5000)throw Error('명시한 열량을 확인해 주세요. 예: 한 끼 500kcal 이하. 목표를 임의로 추정하지 않습니다.');
 return {calories:values[0],text:`1인분 열량 상한 ${values[0]} kcal`};
}
export function conditionInput(text,current=''){
 const aliases=[['pressure',/고혈압|혈압\s*관리/],['glucose',/당뇨(?:병)?|혈당\s*관리/],['dyslipidemia',/이상지질혈증|고지혈증/],['kidney',/신장질환|신장\s*질환/]];
 const found=aliases.filter(([,pattern])=>pattern.test(text));if(found.length>1)throw Error('질환·관리 항목은 한 가지씩 확인해 주세요.');
 const exclusions=Object.entries({'salt':'소금','soy-sauce':'간장','oil':'식용유','egg':'달걀'}).filter(([,name])=>new RegExp(name+'\\s*(?:빼기|빼고|제외)').test(text)).map(([key])=>key);
 let profile=found[0]?.[0]||'',name='';
 if(!profile){
  let remaining=text;for(const label of ['소금','간장','식용유','달걀'])remaining=remaining.replace(new RegExp(label+'\\s*(?:빼기|빼고|제외)','g'),'');remaining=remaining.replace(/[,，]/g,'').trim();
  if(!remaining){if(!current)throw Error('질환·관리 항목을 먼저 선택해 주세요.');profile=current;}
  else{if(!/^[\p{L}\p{N} ()·-]{1,60}$/u.test(remaining))throw Error('질환명만 간단히 입력해 주세요.');profile='other';name=remaining;}
 }
 const labels={pressure:'고혈압·혈압 관리',glucose:'당뇨병·혈당 관리',dyslipidemia:'이상지질혈증',kidney:'신장질환',other:name||'기타 만성질환'};
 return {profile,name,exclusions,text:labels[profile]+(exclusions.length?' · 명시한 재료 제외 조건 포함':'')};
}
export function normalizedName(mode,entities){
 if(!Array.isArray(entities)||!entities.length)throw Error('이름을 확인하지 못했습니다. 직접 입력해 주세요.');
 const clean=entities.filter(e=>typeof e.normalized_name==='string'&&e.normalized_name.trim());
 if(!clean.length)throw Error('이름을 확인하지 못했습니다.');
 const isDish=e=>e.kind==='dish'||(!e.amount_text&&['스파게티','파스타','김치찌개','비빔밥','불고기'].includes(e.normalized_name.replace(/\s/g,'')));
 if(mode==='ingredients'&&clean.every(isDish))throw Error('음식명으로 확인되었습니다. ‘음식명으로 찾기’를 선택한 뒤 다시 정리해 주세요.');
 if(mode==='food-name'){
  if(clean.length!==1)throw Error('음식명은 한 가지씩 입력해 주세요.');
  return clean[0].normalized_name.trim();
 }
 return clean.map(e=>e.normalized_name+(e.amount_text&&!e.normalized_name.includes(e.amount_text)?` ${e.amount_text}`:'')).join(', ');
}

// A bare, unambiguous ingredient needs no model interpretation. Preserve its name.
export function simpleIngredient(text){
 const value=text.normalize('NFKC').trim();
 return new Set(['소고기','쇠고기','돼지고기','닭고기','양파','대파','마늘','두부','당근','감자','고구마','달걀','계란','우유','소금','설탕','물','쌀']).has(value)?value:null;
}
