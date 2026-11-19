'use strict';
(()=>{
 const root=document.getElementById('health-living'),F=window.SmartNFFoodFlow,R=window.SmartNFSelectedRecipes;const D=window.SmartNFSelectedLivingData;if(!F)return;const E=F.el;
 let configPromise,sdkPromise,map,markers=[];
 const config=()=>configPromise||(configPromise=fetch('/api/places/config',{credentials:'same-origin'}).then(r=>{if(!r.ok)throw Error();return r.json();}).catch(()=>({keyId:'',searchConfigured:false})));
 function sdk(key){if(window.naver?.maps?.Service?.geocode&&window.naver?.maps?.Service?.reverseGeocode)return Promise.resolve();if(!/^[A-Za-z0-9_-]{4,100}$/.test(key))return Promise.reject(Error());return sdkPromise||(sdkPromise=new Promise((ok,no)=>{const s=document.createElement('script');let settled=false,poll;const finish=error=>{if(settled)return;settled=true;clearTimeout(timer);clearTimeout(poll);error?no(Error()):ok();};const timer=setTimeout(()=>finish(true),12000);const ready=()=>{if(settled)return;if(window.naver?.maps?.Service?.geocode&&window.naver?.maps?.Service?.reverseGeocode)finish(false);else poll=setTimeout(ready,50);};s.src='https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId='+encodeURIComponent(key)+'&submodules=geocoder';s.onload=ready;s.onerror=()=>finish(true);document.head.append(s);}).catch(e=>{sdkPromise=null;throw e;}));}

 window.SmartNFLivingPlaces={mount(host,isOut){return window.SmartNFPlaceSearch?.mount(host,isOut,{E,config,sdk});}};
 if(!root||!R||!D)return;
 const summary=E('section',undefined,'fn-search-panel'),tabs=E('div',undefined,'lf-tabs'),panels={};root.append(summary,tabs);summary.dataset.selectedSummary='true';
 let active=location.hash==='#cook-recipe'?'cook':'shop';
 for(const [key,title]of [['shop','장보기'],['cook','조리하기'],['out','외식하기']]){const b=E('button',title);b.type='button';b.dataset.livingTab=key;b.setAttribute('aria-pressed',String(active===key));const panel=E('section',undefined,'fn-search-panel');panel.dataset.livingPanel=key;panel.hidden=key!==active;panels[key]=panel;b.onclick=()=>{active=key;for(const [k,p]of Object.entries(panels))p.hidden=k!==key;for(const q of tabs.children)q.setAttribute('aria-pressed',String(q===b));};tabs.append(b);root.append(panel);}
 function advice(panel,stage){const box=E('details'),sum=E('summary','관리항목에 따른 활용 안내·근거'),body=E('div');box.dataset.advice=stage;box.append(sum,body);panel.append(box);}
 const placeWidgets={};
 for(const [key,isOut]of [['shop',false],['out',true]]){if(window.SmartNFPlaceSearch)placeWidgets[key]=window.SmartNFPlaceSearch.mount(panels[key],isOut,{E,config,sdk});advice(panels[key],isOut?'eating_out':'shopping');}
 const cook=panels.cook;cook.id='cook-recipe';cook.append(E('h2','선택한 음식의 조리 방법'));
 const cookBody=E('div');cookBody.dataset.selectedCook='true';const referencePicker=E('section');referencePicker.dataset.ingredientRecipePicker='true';cook.append(referencePicker,cookBody);advice(cook,'cooking');
 const shopBody=E('section',undefined,'hl-selected-guide');shopBody.dataset.selectedShop='true';panels.shop.prepend(shopBody);
 const outBody=E('section',undefined,'hl-selected-guide');outBody.dataset.selectedOut='true';panels.out.prepend(outBody);
 let refreshVersion=0,focusId='',currentFood=null,currentRecipeName='',referenceId='';const checked=new Map();
 const message=text=>E('p',text,'fn-muted');
 function outLink(){const link=outBody.querySelector('[data-selected-menu-map]');if(!link||!currentFood)return;const region=placeWidgets.out?.region()||'';link.href=D.mapQuery(region,currentRecipeName||currentFood.name);}
 panels.out.addEventListener('smartnf-region-change',outLink);
 function adviceRefresh(){for(const d of root.querySelectorAll('[data-advice]')){const body=d.lastElementChild;body.replaceChildren();const rows=(window.SmartNFLifestyleGuides||[]).filter(r=>r.stage===d.dataset.advice&&F.care()?.items.some(x=>x.id===r.action_id));for(const r of rows){body.append(E('strong',F.actionNames[r.action_id]),E('p',r.instruction));const a=E('a','근거: '+r.source_title);a.href=r.source_url;a.target='_blank';a.rel='noopener noreferrer';body.append(a);}if(!rows.length)body.append(message('연결된 일반 실천 안내가 없습니다.'));}}
 function noRecipe(food){const text=food?'선택한 항목에는 검토한 원문 레시피가 연결되어 있지 않습니다. 이름이 비슷한 조리법을 자동으로 적용하지 않습니다.':'음식이나 식재료를 선택하면 이곳에서 관련 안내를 확인할 수 있습니다.';for(const node of [shopBody,cookBody,outBody]){node.replaceChildren();node.append(message(text));}shopBody.prepend(E('h2','선택한 음식으로 장보기'));outBody.prepend(E('h2','선택한 음식으로 외식하기'));if(food){shopBody.append(E('h3',food.name),message('이름과 상태·표시량을 확인해 장보세요. 실제 재료·양념 목록은 원문 확인이 필요합니다.'));outBody.append(E('h3',food.name),message('매장에 원재료·양념·분량을 확인하세요. 같은 이름이어도 구성은 다를 수 있습니다.'));const link=E('a','네이버 지도에서 이 음식 검색 ↗');link.dataset.selectedMenuMap='true';link.target='_blank';link.rel='noopener noreferrer';outBody.append(link);outLink();}cookBody.append(message('검토한 재료와 조리법이 있는 음식은 식품 선택 가이드의 ‘추천 재료 활용’ 카드에서 고를 수 있습니다.'));const link=E('a','음식 선택하러 가기 →');link.href='/preview/health/recommendations';cookBody.append(link);}
 function recipeView(food,recipe){
  currentRecipeName=recipe.name;
  const parts=D.shoppingParts(recipe.ingredients_raw,recipe.name),key=food.id+'|'+recipe.ingredients_raw;let checks=checked.get(key);if(!checks){checks=new Set();checked.set(key,checks);}
  shopBody.replaceChildren();shopBody.append(E('h2','선택한 음식으로 장보기'),E('h3',recipe.name),message('원문에 적힌 재료·중량입니다. 체크하며 준비하세요. 원문 배합 기준이며 개인 권장량은 아닙니다.'));
  const itemCount=parts.filter(value=>!D.isHeading(value)).length;const progress=E('p');progress.dataset.shoppingProgress='true';progress.setAttribute('role','status');const list=E('div',undefined,'hl-shopping-list');
  parts.forEach((value,i)=>{if(D.isHeading(value)){list.append(E('h4',value));return;}const label=E('label'),box=E('input');box.type='checkbox';box.checked=checks.has(i);box.dataset.shoppingItem=String(i);label.append(box,E('span',value));box.addEventListener('change',()=>{if(box.checked)checks.add(i);else checks.delete(i);progress.textContent=checks.size+' / '+itemCount+'개 재료 구간 준비 확인';});list.append(label);});progress.textContent=checks.size+' / '+itemCount+'개 재료 구간 준비 확인';shopBody.append(progress,list,message('장보기 체크는 이 화면에서 임시로 유지합니다. 인분·중량 합산이나 단위 변환은 하지 않습니다.'));
  const raw=E('details');raw.append(E('summary','전체 재료 원문 확인'),E('p',D.text(recipe.ingredients_raw),'lf-raw'));shopBody.append(raw);
  cookBody.replaceChildren();cookBody.append(E('h3',recipe.name),message('선택한 레시피 ID '+recipe.recipe_id+' · '+(recipe.cooking_method||'조리법 표기 없음')+' · 식품안전나라 보유 원본'));
  cookBody.append(E('h4','재료·양념'),E('p',D.text(recipe.ingredients_raw),'lf-raw'),E('h4','만드는 방법'));
  const steps=E('ol');for(const step of recipe.steps){const li=E('li',D.stepText(step.text));li.value=Number(step.number);steps.append(li);}cookBody.append(steps);
  const seasonings=D.seasoningParts(recipe);if(seasonings.length){cookBody.append(E('h4','이 레시피에서 확인할 양념·소스'));const rows=E('ul');seasonings.forEach(x=>rows.append(E('li',x)));cookBody.append(rows,message('실제 제품의 원재료·영양표시와 넣는 양을 확인하세요. 여기서 변경한 조리 배합을 계산하거나 적정량을 처방하지는 않습니다.'));}
  cookBody.append(message('원문 1인분 중량: '+(recipe.portion_weight_raw||'미제공')+' · 재료 원문의 인분 표기와 전체 배합을 함께 확인하세요. 영양 기준량 미검토로 영양 합계·예상 건강 효과는 표시하지 않습니다.'));
  outBody.replaceChildren();outBody.append(E('h2','선택한 음식으로 외식하기'),E('h3',recipe.name),message('아래 내용은 선택한 레시피를 참고한 확인사항입니다. 특정 음식점의 실제 메뉴나 조리법을 확인한 결과가 아닙니다.'));
  outBody.append(E('h4','주문 전에 물어볼 내용'));const asks=E('ul');for(const text of ['이 음식의 실제 원재료와 함께 나오는 소스·고명은 무엇인가요?','양념·소스를 따로 제공하거나 넣는 양을 조절할 수 있나요?','제공되는 양과 조리 방식은 어떻게 되나요?'])asks.append(E('li',text));outBody.append(asks);
  if(seasonings.length)outBody.append(message('선택한 레시피에 적힌 확인 대상: '+seasonings.join(' / ')));
  const ingredients=E('details');ingredients.append(E('summary','비교할 레시피의 재료 목록'),E('p',D.text(recipe.ingredients_raw),'lf-raw'));outBody.append(ingredients);
  const mapLink=E('a','네이버 지도에서 이 음식 검색 ↗');mapLink.dataset.selectedMenuMap='true';mapLink.target='_blank';mapLink.rel='noopener noreferrer';outBody.append(mapLink,message('아래 지역 입력값을 지도 검색어에 반영합니다. 지역을 비우면 음식명으로 검색합니다. 판매 여부·재고·메뉴 적합성은 확인된 정보가 아닙니다.'));outLink();
  for(const node of [shopBody,cookBody,outBody])node.append(message('자료 출처: 식품안전나라 COOKRCP01 · 원본 레시피 ID '+recipe.recipe_id));
 }
 async function ingredientView(food,token){
  if(window.SmartNFFoodIdentity?.kind(food)!=='ingredient')return;
  shopBody.replaceChildren();shopBody.append(E('h2','선택한 식재료로 장보기'),E('h3',food.name),message('상태·부위·원재료 표시가 같은지 확인하세요. 아래 영양값은 실제 구매량이나 개인 권장량이 아닙니다.'));
  const basis=food.basis_raw==='100g edible portion'?'가식부 100g':food.basis_raw;shopBody.append(message('영양 표시 기준: '+basis));
  const facts=E('ul');for(const [key,label]of [['energy','열량'],['sodium','나트륨'],['potassium','칼륨'],['phosphorus','인']]){const n=food.nutrients?.[key];facts.append(E('li',label+': '+(n?.status==='numeric'?n.raw+' '+n.unit:'미측정·미량 등 원본 상세 확인')));}shopBody.append(facts);
  const detail=E('a','영양정보와 출처 자세히 보기 →');detail.href='/preview/health/foods?food='+encodeURIComponent(food.id);shopBody.append(detail);
  if(R.blocked()){referencePicker.append(message('알레르기 원재료 확인이 되지 않은 복합 조리법은 소개를 보류합니다.'));return;}
  const recipes=await R.read();if(token!==refreshVersion)return;const candidates=D.ingredientRecipes(food,recipes);referencePicker.append(E('h3','선택 재료 활용 참고 조리법'),message('재료명 원문이 일치하는 조리법 '+candidates.length+'건입니다. 질환 적합성·정확한 식품코드 일치 판정은 아니며, 다른 재료와 양념을 확인하세요.'));
  if(!candidates.length){referencePicker.append(message('원문 재료에서 이름을 확인한 조리법이 없습니다. 비슷한 이름으로 임의 연결하지 않습니다.'));return;}
  const label=E('label','확인할 참고 조리법 '),select=E('select'),empty=E('option','조리법을 선택하세요');empty.value='';select.setAttribute('aria-label','확인할 참고 조리법');select.append(empty);
  for(const recipe of candidates){const option=E('option',recipe.name+' · '+recipe.cooking_method);option.value=String(recipe.recipe_id);select.append(option);}
  if(!candidates.some(r=>String(r.recipe_id)===referenceId))referenceId='';select.value=referenceId;
  select.onchange=()=>{referenceId=select.value;refresh();};label.append(select);referencePicker.append(label,message('이 선택은 안내용입니다. 나의 선택 식품이나 MyPage에 자동 등록하지 않습니다.'));
  const recipe=candidates.find(r=>String(r.recipe_id)===referenceId);if(recipe){recipeView({id:'reference:'+recipe.recipe_id},recipe);for(const body of [shopBody,cookBody,outBody])body.prepend(message('선택 재료 '+food.name+'를 활용한 참고 레시피입니다. 원래 선택 식품의 영양값을 이 요리에 적용하지 않습니다.'));}
 }
 async function refresh(){
  const token=++refreshVersion;currentRecipeName='';referencePicker.replaceChildren();summary.replaceChildren();summary.append(E('h2','나의 관리 기준과 선택 식품'),E('p',(F.care()?.items||[]).map(x=>F.actionNames[x.id]).join(' · ')||'확정 관리항목 없음'),E('p',window.SmartNFAllergy?.summary()||''));adviceRefresh();
  for(const node of [shopBody,cookBody,outBody]){node.replaceChildren();node.append(message('선택한 식품의 자료를 확인하고 있습니다…'));}
  try{
   const selection=F.selection(),loaded=await Promise.all(selection.items.map(async item=>{try{return {food:await F.record(item.id),id:item.id};}catch{return {food:null,id:item.id};}}));if(token!==refreshVersion)return;
   const foods=loaded.map(x=>x.food).filter(Boolean),eligible=foods.filter(x=>!window.SmartNFAllergy||window.SmartNFAllergy.inspect(x).allowed);
   summary.append(E('p',foods.map(x=>x.name).join(' · ')||'선택 식품 없음'));
   if(loaded.some(x=>!x.food))summary.append(message('원본 자료를 불러오지 못한 선택 항목이 있습니다. 선택 목록에서 확인해 주세요.'));
   if(eligible.length<foods.length)summary.append(message('현재 알레르기 조건에서 확인할 수 없는 식품은 안내에서 제외했습니다.'));
   const link=E('a','선택 식품 변경 →');link.href='/preview/health/recommendations';summary.append(link);
   if(!eligible.some(x=>x.id===focusId)){referenceId='';focusId=(eligible.find(x=>D.recipeId(x))||eligible[0])?.id||'';}
   currentFood=eligible.find(x=>x.id===focusId)||null;for(const widget of Object.values(placeWidgets))widget.setFood(currentFood);
   if(eligible.length){const label=E('label','안내를 볼 선택 식품 '),select=E('select');select.setAttribute('aria-label','안내를 볼 선택 식품');for(const food of eligible){const option=E('option',food.name);option.value=food.id;select.append(option);}select.value=focusId;select.addEventListener('change',()=>{focusId=select.value;referenceId='';refresh();});label.append(select);summary.append(label,message('하나를 고르면 장보기·조리하기·외식하기가 같은 식품을 기준으로 바뀝니다.'));}
   if(!currentFood){noRecipe(null);return;}
   if(!D.recipeId(currentFood)){noRecipe(currentFood);await ingredientView(currentFood,token);return;}
   const recipes=await R.read();if(token!==refreshVersion)return;const recipe=D.checkedRecipe(currentFood,recipes);recipeView(currentFood,recipe);
  }catch(error){if(token!==refreshVersion)return;for(const widget of Object.values(placeWidgets))widget.setFood(null);referencePicker.replaceChildren();for(const node of [shopBody,cookBody,outBody]){node.replaceChildren();node.append(message(error.message||'선택한 레시피 자료를 불러오지 못했습니다.'));const retry=E('button','자료 다시 불러오기');retry.type='button';retry.addEventListener('click',refresh);node.append(retry);}}
 }
 window.SmartNFLivingPlaces={mount(host,isOut){return window.SmartNFPlaceSearch?.mount(host,isOut,{E,config,sdk});}};
 for(const event of ['smartnf-food-selection','smartnf-allergy-change','smartnf-health-confirmed'])window.addEventListener(event,refresh);refresh();
})();
