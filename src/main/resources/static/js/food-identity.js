'use strict';
(()=>{
 const normalize=s=>String(s||'').normalize('NFKC').replace(/\s+/g,'').toLowerCase();
 const primary=food=>String(food?.name||'').split(',')[0].trim();
 // Display grouping only; never an ingredient-code or allergy-safety assessment.
 function foodState(food){
  if(!food)return 'review';if(food.id?.startsWith('mfds_dishes:')||food.id?.startsWith('mfds_recipes:'))return 'dish';if(!food.id?.startsWith('rda_10_4:'))return 'review';
  const head=primary(food),name=String(food.name||'');
  if(food.group==='조리가공식품류'||['김치','밥','빵','떡','과자','케이크','피자','햄버거','샌드위치','도넛','호떡','핫도그','쿠키','김밥','비빔밥'].includes(head)||/샐러드|코울슬로/.test(head))return 'dish';
  if(/구운것|삶은것|삶아서|데친것|찐것|볶은것|튀긴것|끓인것|조린것|훈제|통조림|염장|젓갈|조미하여|조미된|절임|레토르트/.test(name)||/(?:^|,)\s*(?:밥|죽|잼|캔)(?:,|$)/.test(name))return 'dish';
  if(/(?:^|,)\s*생것(?:,|$)/.test(name))return 'raw';
  if(['두부','연두부','순두부','간장','된장','고추장','소금','설탕','식초','참기름','들기름','올리브유','올리브오일','식용유','밀가루','전분'].includes(head)||['조미료류','당류','유지류'].includes(food.group))return 'processed_ingredient';
  if(/말린것|가루|냉동/.test(name)&&!['육류 및 그 제품','기타'].includes(food.group))return 'processed_ingredient';
  return 'review';
 }
 const stateLabel={raw:'식재료 · 생것',processed_ingredient:'식재료 · 가공 재료',dish:'음식 · 조리·가공',review:'분류 확인 필요'};
 function kind(food){const state=foodState(food);return ['raw','processed_ingredient'].includes(state)?'ingredient':state;}
 function primarySearch(rows,words){if(!words.length)return null;const first=words[0];return rows.some(row=>normalize(primary(row))===first)?first:null;}
 function matches(row,words,exactPrimary){return (!exactPrimary||normalize(primary(row))===exactPrimary)&&words.every(word=>normalize(row.name).includes(word));}
 window.SmartNFFoodIdentity={normalize,primary,kind,foodState,stateLabel,primarySearch,matches};
})();
