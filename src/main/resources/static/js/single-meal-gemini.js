import {verifyBlock,periodCriteria} from './gemini-period.js?v=references232';
const keyName=value=>String(value||'').normalize('NFKC').replace(/\s+/g,'').toLowerCase();
export function prepareSingleMeal({index,anchorKey:chosenKey,recipes,plateSnapshots,sides,active,combinationType}){
 const anchorKey=chosenKey??`recipe:${index}`;
 const anchor=anchorKey.startsWith('recipe:')?recipes[Number(anchorKey.slice(7))]:anchorKey.startsWith('snapshot:')?plateSnapshots[Number(anchorKey.slice(9))]:null;
 if(!anchor||anchor.candidateExcluded&&!active.has(anchorKey)||anchorKey.startsWith('snapshot:')&&!active.has(anchorKey))throw Error('추천의 기준이 될 요리를 선택해 주세요.');
 const next=new Map(active);if(!next.has(anchorKey))next.set(anchorKey,1);
 const entries=[...next].sort(([a],[b])=>a===anchorKey?-1:b===anchorKey?1:0);
 if(entries.length>4)throw Error('현재 한 끼 음식이 4개를 넘습니다. 먼저 구성을 확인해 주세요.');
 const names=new Set();
 const fixedDishes=entries.map(([key,amount],i)=>{
  const recipe=key.startsWith('recipe:')?recipes[Number(key.slice(7))]:key.startsWith('snapshot:')?plateSnapshots[Number(key.slice(9))]:null;
  const side=recipe?null:sides.find(s=>s.id===key);if(!recipe&&!side)throw Error('현재 구성의 음식을 다시 확인해 주세요.');
  if(!Number.isFinite(amount)||amount<=0)throw Error('현재 구성의 인분·분량을 먼저 확인해 주세요.');
  const name=recipe?.name||side.name;if(names.has(keyName(name)))throw Error('현재 구성에 같은 음식이 중복되어 있습니다.');names.add(keyName(name));
  let role=combinationType(recipe||{name});if(!recipe&&role==='unknown')role='side';
  if(!['main','soup','bowl','staple','side'].includes(role))throw Error(`${name}의 조합 역할을 먼저 선택해 주세요.`);
  const items=recipe?recipe.portions.map(p=>({...p,grams:p.grams*amount/recipe.servings})):[{name,grams:amount}];
  if(!items.length||items.some(p=>!Number.isFinite(p.grams)||p.grams<=0||p.grams>5000))throw Error('현재 구성의 모든 재료에 양수 g 분량이 필요합니다. 재료·분량을 먼저 확인해 주세요.');
  const ingredients=items.map(p=>{const ingredient=p.name||String(p.text||'').replace(/\s+[\d.,]+\s*(g|그램)$/i,'').trim();const grams=Number(p.grams.toFixed(6));if(!ingredient||grams<=0)throw Error('재료명과 g 분량을 확인해 주세요.');return `${ingredient} ${grams}g`;});
  return {id:`fixed-${i+1}`,role,recipe:{name,servings:1,minutes:0,ingredients,steps:['사용자가 선택한 음식과 먹을 분량을 유지한다.']}};
 });
 const center=fixedDishes[0].role,rest=fixedDishes.slice(1);
 if(!['main','soup','bowl'].includes(center))throw Error('중심 요리의 역할을 메인·국/찌개·한그릇 중에서 선택해 주세요.');
 if(rest.some(d=>d.role==='main'||d.role==='bowl')||rest.filter(d=>d.role==='staple').length>1||rest.filter(d=>d.role==='soup').length>1||rest.filter(d=>d.role==='side').length>2||center==='bowl'&&rest.some(d=>d.role!=='side')||center==='soup'&&rest.some(d=>d.role==='soup'))throw Error('현재 구성에 중심 요리·주식·국이 겹칩니다. 음식을 직접 확인한 뒤 추천해 주세요.');
 return {fixedDishes,excludedRecipeNames:recipes.filter(r=>r.candidateExcluded).map(r=>r.name),active:next,anchorName:anchor.name};
}
// Uncertain transport outcomes reuse the same UUID while this screen remains open.
export function createSingleMealRecommender(api,uuid=()=>crypto.randomUUID()){
 let job=null;
 return async({owner,first,meal,criteria,fixedDishes,excludedRecipeNames=[]})=>{
  if(!['breakfast','lunch','dinner'].includes(meal))throw Error('아침·점심·저녁 중 끼니를 선택해 주세요.');
  const data={first,days:1,meals:[meal],criteria:periodCriteria(criteria),usePreferences:false,consent:true,previousNames:[],fixedDishes,excludedRecipeNames},signature=JSON.stringify({owner,data});
  if(!job||job.signature!==signature)job={signature,requestId:uuid()};
  try{const result=verifyBlock(await api('/api/me/meal-period/generate',{requestId:job.requestId,...data}),first,1,[meal]);job=null;return result.slots[0];}
  catch(error){if(error.terminal)job=null;throw error;}
 };
}
