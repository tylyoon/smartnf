export const POLICY_VERSION='SmartNF-period-20261111-v3';
export const COMBINATION_TYPES={bowl:'한 그릇 · 면/덮밥/죽',soup:'국·찌개',main:'메인',staple:'주식 · 밥/빵',side:'채소·반찬',unknown:'분류 확인 필요'};
// Recipe-name heuristics are editable ordering hints, not nutrition or allergy facts.
export function combinationType(r){
 if(Object.hasOwn(COMBINATION_TYPES,r.combinationType))return r.combinationType;
 const n=String(r.name||'').replace(/\s+/g,'');
 if(/스파게티|파스타|리조[또토]|덮밥|볶음밥|비빔밥|김밥|국수|라면|우동|[야채소고기닭전복]죽$/.test(n))return 'bowl';
 if(/찌개|전골|국$|탕$|수프|스프/.test(n))return 'soup';
 if(/^(백미밥|현미밥|잡곡밥|흑미밥|쌀밥|보리밥|공깃밥|식빵|바게트)$/.test(n))return 'staple';
 if(/나물|무침|샐러드|김치|장아찌|겉절이|브로콜리|시금치|버섯볶음|애호박볶음/.test(n))return 'side';
 if(r.features?.role==='사이드')return 'side';
 if(r.features?.role==='메인'||/구이|불고기|스테이크|커틀릿|돈[까가]스|찜|볶음|조림/.test(n))return 'main';
 return 'unknown';
}
export function composeMeal(anchor,candidates,recipeParts,counts=new Map(),used=[]){
 const picked=[anchor],missing=[],type=combinationType(anchor.r);
 const wants=type==='bowl'?['side']:['soup','main'].includes(type)?['staple','side']:[];
 const identity=x=>norm(x.r.name);
 for(const wanted of wants){
  const options=candidates.filter(x=>combinationType(x.r)===wanted&&!picked.some(p=>identity(p)===identity(x))
   &&!(/매운|매콤|칠리|고추장/.test(anchor.r.name)&&/매운|매콤|칠리|고추장/.test(x.r.name)));
  const cuisine=anchor.r.features?.cuisine;
  options.sort((a,b)=>{
   const score=x=>(counts.get(x.index)||0)*0.7+(used.includes(x.index)?3:0)+(cuisine&&x.r.features?.cuisine&&cuisine!==x.r.features.cuisine?0.5:0);
   return score(a)-score(b)||a.index-b.index;
  });
  if(options.length)picked.push(options[0]);else missing.push(wanted==='staple'?'주식':'반찬');
 }
 return {indices:picked.map(x=>x.index),parts:picked.flatMap(x=>structuredClone(recipeParts(x.index))),
  reason:'SmartNF 조합 규칙 · '+COMBINATION_TYPES[type]+(missing.length?' · '+missing.join('·')+' 후보 없음':'')};
}
export const SOURCES=[
 {id:'KDRI2025',title:'보건복지부·한국영양학회 · 2025 한국인 영양소 섭취기준',url:'https://www.kns.or.kr/fileroom/fileroom_view.asp?BoardID=Kdr&idx=167',section:'에너지적정비율 개정 안내',checked:'2026-11-11'},
 {id:'KDCA-BP',title:'질병관리청 · 고혈압 환자의 식이요법',url:'https://health.kdca.go.kr/healthinfo/biz/health/gnrlzHealthInfo/gnrlzHealthInfo/gnrlzHealthInfoView.do?cntnts_sn=6855',section:'실천 방법 · 소금 섭취 제한',checked:'2026-11-11'},
 {id:'KDA2025',title:'대한당뇨병학회 · 2025 당뇨병 진료지침',url:'https://www.diabetes.or.kr/bbs/?code=guide&mode=view&number=2078',section:'의학영양요법 · 개인별 적용',checked:'2026-11-11'}
];
const KEYS=['energy','protein','carbohydrate','fat','sodium','fiber'];
export function validateCriteria(c){
 for(const [key,min,max]of [['energy',500,6000],['sodium',100,10000]])if(c[key]!=null&&(!Number.isFinite(c[key])||c[key]<min||c[key]>max))throw Error('입력한 목표·조리시간의 단위와 범위를 확인하세요.');
 if((c.energy!=null||c.sodium!=null)&&!['personal','clinician'].includes(c.targetSource))throw Error('개인 목표의 출처를 선택하세요.');
 if(c.special&&(c.general||c.energy!=null||c.sodium!=null||c.lowerSodium||c.fiber))throw Error('소아·임신/수유·신장질환·별도 식사 제한이 있으면 자동 영양 기준은 적용하지 않습니다. 영양 조건을 해제하고 메뉴 배치만 이용하세요.');
 return {...c,excluded:(c.excluded||[]).map(x=>x.trim()).filter(Boolean)};
}
const norm=s=>String(s||'').normalize('NFKC').replace(/\s+/g,'').toLowerCase();
function known(a,key){return a.total>0&&a.coverage[key]===a.total&&Number.isFinite(a.values[key]);}
function combine(a,b){if(!a)return b;return {total:a.total+b.total,values:Object.fromEntries(KEYS.map(k=>[k,(a.values[k]??0)+(b.values[k]??0)])),coverage:Object.fromEntries(KEYS.map(k=>[k,(a.coverage[k]||0)+(b.coverage[k]||0)])),aiCoverage:Object.fromEntries(KEYS.map(k=>[k,(a.aiCoverage?.[k]||0)+(b.aiCoverage?.[k]||0)]))};}
function outside(x,min,max){return x<min?(min-x)/min:x>max?(x-max)/max:0;}
export function eligibleRecipes(recipes,c){
 return recipes.map((r,index)=>({r,index})).filter(({r})=>!r.candidateExcluded
  && !(c.excluded.length&&(!Array.isArray(r.ingredients)||!r.ingredients.length))
  && !c.excluded.some(word=>(r.ingredients||[]).some(text=>norm(text).includes(norm(word)))));
}
export function recommendSingleMeal({index,recipes,criteria,recipeParts}){
 const c=validateCriteria(criteria),candidates=eligibleRecipes(recipes,c),anchor=candidates.find(x=>x.index===index);
 if(!anchor)throw Error('선택한 메인이 제외 조건에 해당하거나 후보에서 제외되어 있습니다.');
 if(['side','staple'].includes(combinationType(anchor.r)))throw Error('메인 또는 한 그릇 요리를 선택해 주세요.');
 return composeMeal(anchor,candidates,recipeParts);
}
export function recommendPeriod({first,days,meals,recipes,previous=[],criteria,recipeParts,slotParts,analyze,addDays}){
 const c=validateCriteria(criteria), fullDay=meals.length===3&&['breakfast','lunch','dinner'].every(m=>meals.includes(m));
 const candidates=eligibleRecipes(recipes,c).map(x=>({...x,a:analyze(recipeParts(x.index))}));
 if(!candidates.length)throw Error('제외 재료 조건에 맞는 후보가 없습니다. AI 레시피 추천에서 후보를 더 골라주세요.');
 const locked=new Map(),counts=new Map(),daily=new Map(),slots=[],notes=[];
 // Locked meals count toward day totals before choosing the remaining meals, even when later in the day.
 for(let d=0;d<days;d++)for(const meal of meals){const date=addDays(first,d),s=locked.get(date+':'+meal);if(s){daily.set(date,combine(daily.get(date),analyze(slotParts(s))));counts.set(s.recipe,(counts.get(s.recipe)||0)+1);}}
 for(let d=0;d<days;d++)for(const meal of meals){const date=addDays(first,d),key=date+':'+meal,keep=locked.get(key);if(keep){slots.push(structuredClone(keep));continue;}
  const used=slots.filter(s=>s.date===date).flatMap(s=>s.recipeIndices||[s.recipe]),prev=slots.at(-1)?.recipe;
  const mains=candidates.filter(x=>!['staple','side'].includes(combinationType(x.r)));
  const anchors=mains.length?mains:candidates;
  const scored=anchors.map(x=>{
   const combo=composeMeal(x,candidates,recipeParts,counts,used);
   // Weights are SmartNF ordering policy, not clinical guideline thresholds.
   let score=(counts.get(x.index)||0)*0.7+(prev===x.index?4:0)+(used.includes(x.index)?3:0);
   const a=analyze(combo.parts),day=combine(daily.get(date),a),reasons=['후보 내 반복 완화'];
   if(c.general){if(['energy','protein','carbohydrate','fat'].every(k=>known(day,k))&&day.values.energy>0){score+=outside(day.values.carbohydrate*4/day.values.energy,0.5,0.65)+outside(day.values.protein*4/day.values.energy,0.1,0.2)+outside(day.values.fat*9/day.values.energy,0.15,0.3);reasons.push('일반 성인 에너지 비율 참고');}else score+=1;}
   if(c.lowerSodium){score+=known(a,'sodium')&&known(a,'energy')&&a.values.energy>0?Math.min(4,a.values.sodium/a.values.energy/4):4;reasons.push('나트륨 밀도 낮은 후보 우선');}
   if(c.fiber){score+=known(a,'fiber')&&known(a,'energy')&&a.values.energy>0?1/(1+a.values.fiber*1000/a.values.energy):1;reasons.push('식이섬유 밀도 참고');}
   if(fullDay&&c.energy!=null&&known(day,'energy')){const filled=slots.filter(s=>s.date===date&&!s.locked).length+previous.filter(s=>s.date===date&&s.locked&&meals.includes(s.meal)).length+1;score+=Math.abs(day.values.energy-c.energy*Math.min(filled,3)/3)/c.energy;reasons.push('입력한 하루 열량 참고');}
   if(fullDay&&c.sodium!=null&&known(day,'sodium')){score+=Math.max(0,day.values.sodium/c.sodium-1)*2;reasons.push('입력한 나트륨 상한 참고');}
   score+=combo.indices.slice(1).reduce((n,i)=>n+(counts.get(i)||0)*0.1,0);
   return {...x,a,combo,score,reasons};
  }).sort((a,b)=>a.score-b.score||a.index-b.index);
  const chosen=scored[0];slots.push({date,meal,recipe:chosen.index,custom:null,locked:false,recipeIndices:chosen.combo.indices,recommended:chosen.combo.parts,policy:POLICY_VERSION,reason:[chosen.combo.reason,...chosen.reasons].join(' · ')});daily.set(date,combine(daily.get(date),chosen.a));for(const i of chosen.combo.indices)counts.set(i,(counts.get(i)||0)+1);
 }
 if(fullDay&&(c.energy!=null||c.sodium!=null))notes.push('하루 목표와 선택한 3끼 계획 합계를 비교합니다. 간식·음료와 실제 섭취는 별도입니다.');
 if(!fullDay&&(c.energy!=null||c.sodium!=null))notes.push('하루 3끼 구성이 아니므로 하루 목표의 충족 여부는 평가하지 않습니다.');
 if(candidates.length<3)notes.push('후보가 적어 같은 음식이 반복될 수 있습니다.');
 if(c.excluded.length)notes.push('제외는 기재된 재료명 기준입니다. 소스·제품의 숨은 알레르기 성분은 원문에서 확인하세요.');
 notes.push('다시 추천하면 직접 바꾼 끼니도 포함해 전체를 새로 배치합니다.');
 if(candidates.some(x=>KEYS.some(k=>!known(x.a,k))))notes.push('일부 후보는 영양 자료가 부족해 해당 성분의 평가를 보류합니다.');
 notes.push('저장된 후보 안에서 요리 유형별 조합을 만듭니다. 분류는 요리 카드에서 수정할 수 있습니다. 후보가 없으면 구성을 억지로 채우지 않으며 개인별 영양 충족을 보장하지 않습니다.');
 return {slots,notes,criteria:c,fullDay};
}
export function reviewDay(a,c,fullDay){
 const out=[];
 for(const [key,label,target,kind]of [['energy','열량',c.energy,'target'],['sodium','나트륨',c.sodium,'max']])if(target!=null){if(!fullDay)out.push(label+': 하루 전체 미구성');else if(!known(a,key))out.push(label+': 자료 부족으로 목표 평가 보류');else out.push(`${label}: ${Math.round(a.values[key])} / ${target}${key==='energy'?' kcal':' mg'}${kind==='max'?' 상한':''}${a.aiCoverage?.[key]?' · AI 추정 포함':''}`);}
 if(c.general){if(['energy','protein','carbohydrate','fat'].every(k=>known(a,k))&&a.values.energy>0)out.push(`탄수화물 ${Math.round(a.values.carbohydrate*400/a.values.energy)}% · 단백질 ${Math.round(a.values.protein*400/a.values.energy)}% · 지방 ${Math.round(a.values.fat*900/a.values.energy)}% (일반 성인 참고)${['energy','protein','carbohydrate','fat'].some(k=>a.aiCoverage?.[k])?' · AI 추정 포함':''}`);else out.push('에너지 비율: 자료 부족으로 평가 보류');}
 return out;
}
