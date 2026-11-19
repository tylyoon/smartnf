import {periodCriteria} from './gemini-period.js?v=add236';
export function additionRequest({mode,foodName='',parts,criteria}){
 if(!['named','compatible'].includes(mode))throw Error('음식 추가 방식을 확인해 주세요.');
 if(mode==='named'&&(!foodName.trim()||foodName.trim().length>100))throw Error('추가할 음식명을 100자 이내로 입력해 주세요.');
 if(!Array.isArray(parts)||parts.length>30||mode==='compatible'&&!parts.length)throw Error('어울리는 음식을 추천받으려면 먼저 한 끼에 음식을 담아 주세요.');
 const current=parts.map(p=>{
  if(!p.name||!Array.isArray(p.ingredients)||!p.ingredients.length)throw Error('현재 음식의 재료를 확인해 주세요.');
  const ingredients=p.ingredients.map(i=>{if(!Number.isFinite(i.grams)||i.grams<=0||i.grams>5000)throw Error('현재 음식의 재료별 g 분량을 확인해 주세요.');const name=i.name||String(i.text||'').replace(/\s+[\d.,]+\s*(g|그램)$/i,'').trim();if(!name)throw Error('재료명을 확인해 주세요.');return `${name} ${Number(i.grams.toFixed(6))}g`;});
  return {name:p.name,role:p.role||'unknown',ingredients};
 });
 return {mode,foodName:mode==='named'?foodName.trim():'',current,criteria:periodCriteria(criteria),consent:true};
}
export function additionCandidates(result){
 if(!['GEMINI','STORED'].includes(result?.provider)||!Array.isArray(result.candidates)||result.candidates.length>3)throw Error('추가 음식 후보를 확인하지 못했습니다.');
 for(const c of result.candidates){const r=c.recipe;if(!c.id||!['main','soup','bowl','staple','side'].includes(c.role)||!r||typeof r.name!=='string'||!Number.isInteger(r.servings)||r.servings<1||!Array.isArray(r.ingredients)||!r.ingredients.length||!Array.isArray(r.steps))throw Error('추가 음식 후보의 레시피를 확인하지 못했습니다.');}
 return result.candidates;
}
