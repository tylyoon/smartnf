'use strict';
(()=>{
 // Segment original text for display; never normalize units, ingredient codes or totals.
 function text(value){return String(value||'').replace(/<br\s*\/?>/gi,'\n').replace(/<[^>]*>/g,'').replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').trim();}
 function stepText(value){return text(value).replace(/^\s*[1-9]\d?\s*[.)．](?!\d)\s*/, '').trim();}
 function shoppingParts(raw,name=''){
  const input=text(raw).replace(/(\[(?:소스소개|양념장|양념|주재료|필수재료|소스)\])/g,'\n$1\n'),items=[];let chunk='',depth=0;
  const flush=()=>{const value=chunk.trim();chunk='';if(!value||value.replace(/\s/g,'')===String(name).replace(/\s/g,''))return;items.push(value);};
  for(let i=0;i<input.length;i++){const char=input[i];if('([（［'.includes(char))depth++;if(')]）］'.includes(char))depth=Math.max(0,depth-1);if((char===':'||char==='：')&&depth===0){chunk+=char;flush();continue;}if((char===','&&depth===0&&!(/\d/.test(input[i-1]||'')&&/\d/.test(input[i+1]||'')))||char==='\n'){flush();continue;}chunk+=char;}flush();
  return items;
 }
 function isHeading(value){return /^\[(?:소스소개|양념장|양념|주재료|필수재료|소스)\]$/.test(value.trim())||/[:：]$/.test(value.trim())||/^(?:[●•·]\s*)?(?:고명|양념장|소스|주재료|필수재료|육수|양념|부재료)\s*[:：]?$/.test(value.trim());}
 function recipeId(record){const match=/^mfds_recipes:(\d{1,12})$/.exec(record?.id||'');return match?match[1]:null;}
 function checkedRecipe(food,recipes){const id=recipeId(food);if(!id)return null;const recipe=recipes.find(r=>String(r.recipe_id)===id);if(!recipe||recipe.name!==food.name||typeof recipe.ingredients_raw!=='string'||!recipe.ingredients_raw.trim()||!Array.isArray(recipe.steps)||!recipe.steps.length||recipe.steps.some(s=>!s||typeof s.text!=='string'))throw Error('선택한 음식의 원문 레시피를 확인할 수 없습니다.');if(food.related_recipe?.ingredients_raw!==recipe.ingredients_raw)throw Error('추천 자료와 레시피 원문이 달라 재확인이 필요합니다.');return recipe;}
 function seasoningParts(recipe){return shoppingParts(recipe.ingredients_raw,recipe.name).filter(x=>!isHeading(x)&&/소금|간장|된장|고추장|설탕|시럽|물엿|요리당|기름|식용유|올리브유|오일|마요네즈|케첩|버터|소스|드레싱|액젓|꿀|생크림|치즈/.test(x));}
 function mapQuery(region,name){return 'https://map.naver.com/p/search/'+encodeURIComponent([String(region||'').trim(),String(name||'').trim()].filter(Boolean).join(' '));}
 function ingredientRecipes(food,recipes){
  if(!food?.id?.startsWith('rda_10_4:'))return [];
  const name=String(food.name||'').split(',')[0].trim();if(name.length<2)return [];
  const escape=value=>value.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  const pattern=new RegExp('(^|[^가-힣A-Za-z])'+escape(name)+'(?=$|[^가-힣A-Za-z])','i');
  return recipes.filter(r=>r.ingredients_raw&&r.steps?.length&&shoppingParts(r.ingredients_raw,r.name).some(part=>!isHeading(part)&&pattern.test(part))).sort((a,b)=>String(a.recipe_id).localeCompare(String(b.recipe_id),undefined,{numeric:true}));
 }
 window.SmartNFSelectedLivingData={text,stepText,shoppingParts,isHeading,recipeId,checkedRecipe,seasoningParts,mapQuery,ingredientRecipes};
})();
