"use strict";
(() => {
  const root = document.getElementById('fn-results');
  if (!root) return;
  const $ = id => document.getElementById(id);
  const C=window.SmartNFFoodCategories,S=window.SmartNFFoodSearch,U=window.SmartNFIngredientSubcategories,D=window.SmartNFDishClassification;
  const recipeMatch=row=>state.source!=='mfds_dishes'||window.SmartNFDishRecipes.matchesFilter(row,$('fn-recipe-filter').value);
  const subAPI=()=>state.source==='rda_10_4'?U:D;
  let semanticRequest=0,searching=false;
  const labels = {energy:'열량',carbohydrate:'탄수화물',protein:'단백질',fat:'지방',sugars:'당류',fiber:'식이섬유',sodium:'나트륨',potassium:'칼륨',phosphorus:'인',saturated_fat:'포화지방',trans_fat:'트랜스지방',cholesterol:'콜레스테롤',calcium:'칼슘',iron:'철',vitamin_c:'비타민 C',vitamin_d:'비타민 D',vitamin_b12:'비타민 B12'};
  const statuses = {blank:'자료 없음',unmeasured:'미측정',trace:'미량 (Tr)',invalid:'원문 확인 필요',quoted_or_calculated:'인용·산출값',numeric:'원본 수치'};
  const state = {manifest:null,source:'rda_10_4',index:[],filtered:[],page:0,selected:null,category:'',cuisine:'',subcategory:'',beefGrade:'',riceType:'',ricePart:'',load:0,detail:0};
  let requestedId = new URLSearchParams(location.search).get('food');
  if(requestedId && !/^(rda_10_4|mfds_dishes):[A-Za-z0-9_-]{1,80}$/.test(requestedId))requestedId=null;
  if(requestedId)state.source=requestedId.split(':')[0];
  document.querySelectorAll('[data-source]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.source===state.source)));
  const cache = new Map();
  const pageSize = 20;
  const norm = text => String(text || '').normalize('NFKC').replace(/\s+/g,'').toLowerCase();
  function el(tag,text,cls) { const node=document.createElement(tag); if(text!==undefined) node.textContent=String(text); if(cls)node.className=cls; return node; }
  function basis(text) { return text === '100g edible portion' ? '가식부 100g (먹을 수 있는 부분)' : String(text); }
  function basisType(text) { return /100\s*m[lL]/i.test(text) ? 'ml' : /100\s*g/i.test(text) ? 'g' : ''; }
  async function json(path) { const response=await fetch(path,{credentials:'same-origin'});if(!response.ok)throw new Error('DATA_UNAVAILABLE');return response.json(); }
  function dataUrl(file) {
    if (!/^[a-z0-9_-]+\.json$/.test(file) || !/^v-[a-f0-9]{20}$/.test(state.manifest.version)) throw new Error('INVALID_DATA_PATH');
    return '/js/data/food-nutrition/'+state.manifest.version+'/'+file;
  }
  function status(text) {$('fn-status').textContent=text;}
  function resetDetail() {
    state.detail++;state.selected=null;
    $('fn-detail-heading').textContent='식품을 선택해 주세요';
    $('fn-detail').querySelector('.fn-muted').textContent='목록에서 식품을 선택하면 영양성분과 출처를 확인할 수 있습니다.';
    $('fn-detail-body').replaceChildren();
  }
  async function loadSource() {
    const token=++state.load;semanticRequest++;$('fn-semantic').hidden=true;$('fn-semantic-results').replaceChildren();$('fn-spelling').replaceChildren();state.category='';state.cuisine='';$('fn-cuisine').value='';$('fn-recipe-filter').value='';state.subcategory='';state.beefGrade='';state.riceType='';state.ricePart='';closeSubmenu();$('fn-classification').hidden=true;state.index=[];state.filtered=[];state.page=0;resetDetail();
    $('fn-retry').hidden=true;status('자료를 불러오고 있습니다.');render();
    try {
      const indexes=await Promise.all(['rda_10_4','mfds_dishes'].map(async source=>{const meta=state.manifest.sources[source],key=dataUrl(meta.index);if(!cache.has(key))cache.set(key,json(key).catch(error=>{cache.delete(key);throw error;}));const rows=await cache.get(key);if(!Array.isArray(rows)||rows.length!==meta.count)throw Error('INVALID_INDEX');return rows;}));
      if(token!==state.load)return;
      const I=window.SmartNFFoodIdentity,all=indexes.flat();
      if(requestedId){const requested=all.find(r=>r.id===requestedId);if(requested){state.source=I.kind(requested)==='ingredient'?'rda_10_4':'mfds_dishes';document.querySelectorAll('[data-source]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.source===state.source)));}}
      const rows=all.filter(row=>state.source==='rda_10_4'?I.kind(row)==='ingredient':I.kind(row)!=='ingredient').map(row=>({...row,group:state.source==='mfds_dishes'&&row.id.startsWith('rda_10_4:')?(I.kind(row)==='dish'?'조리된 식재료':'분류 확인 필요'):row.group}));
      if(state.source==='mfds_dishes'){
        try{const provenance=await json('/js/data/dish-search-details.json');if(token!==state.load)return;if(provenance.nutrition_version===state.manifest.version)for(const row of rows)row.dishDetail=provenance.details[row.id]||'';}catch{/* Original index and code detail remain available. */}
      }
      if(token!==state.load)return;
      state.index=rows;$('fn-cuisine-wrap').hidden=state.source!=='mfds_dishes';$('fn-cuisine-note').hidden=state.source!=='mfds_dishes';$('fn-recipe-filter-wrap').hidden=state.source!=='mfds_dishes';syncRecipeFilter();
      populateGroups();
      $('fn-classification').hidden=false;$('fn-group-label').hidden=!!C;
      $('fn-source-note').textContent=(state.source==='rda_10_4'?'생것과 조리용 가공 재료만 표시합니다. 구이·삶기 등 조리된 항목은 음식에서 조회합니다.':'조리·가공 음식과 분류 확인이 필요한 자료입니다. 원본 제공처와 표시 기준은 상세에서 확인하세요.')+' · '+rows.length.toLocaleString('ko-KR')+'건';
      filter();
      if(requestedId){const row=rows.find(r=>r.id===requestedId);requestedId=null;if(row){state.filtered=[row];render();status('선택한 식품의 성분과 출처를 보여드립니다.');detail(row);}else status('선택한 식품 자료를 찾지 못했습니다. 이름으로 다시 검색해 주세요.');}
    } catch(error) {if(token!==state.load)return;status('자료를 불러오지 못했습니다. 화면 데이터 준비와 서버 실행 상태를 확인해 주세요.');$('fn-retry').hidden=false;}
  }
  function populateGroups(){
    const previous=$('fn-group').value;$('fn-group').replaceChildren(el('option','전체 세부 분류'));$('fn-group').firstChild.value='';
    [...new Set(state.index.filter(r=>!C||C.includes(state.source,state.category,r.group)).map(r=>r.group))].sort((a,b)=>a.localeCompare(b,'ko')).forEach(group=>{const option=el('option',group);option.value=group;$('fn-group').append(option);});
    if([...$('fn-group').options].some(o=>o.value===previous))$('fn-group').value=previous;
  }
  function chooseCategory(id){state.category=state.category===id?'':id;state.subcategory='';state.beefGrade='';state.riceType='';state.ricePart='';closeSubmenu();$('fn-group').value='';populateGroups();resetDetail();filter();}
  function renderCategories(){
    if(!C||!state.index.length)return;const A=window.SmartNFAllergy,profile=A?.profile(),all=state.index.filter(r=>recipeMatch(r)&&S.matches(r,$('fn-query').value)&&(state.source!=='mfds_dishes'||!state.cuisine||D.cuisine(r)===state.cuisine)&&(!$('fn-basis').value||basisType(r.basis)===$('fn-basis').value)&&(!$('fn-preparation').value||S.preparation(r)===$('fn-preparation').value)),allowed=all.filter(row=>!A||A.inspect(row,profile).allowed);
    const grid=$('fn-categories');grid.replaceChildren();const definitions=[['','🔎','전체',[]],...C.groups(state.source)];
    definitions.forEach(([id,icon,title])=>{const total=all.filter(row=>C.includes(state.source,id,row.group)).length;if(!total&&id&&state.category!==id)return;const count=allowed.filter(row=>C.includes(state.source,id,row.group)).length;
      const button=el('button');button.type='button';button.dataset.category=id;button.setAttribute('aria-pressed',String(state.category===id));button.setAttribute('aria-controls','fn-results');const picture=C.icon(id);picture.setAttribute('aria-hidden','true');button.append(picture,el('strong',title),el('small',count===total?count.toLocaleString('ko-KR')+'개':count.toLocaleString('ko-KR')+'개 조회 가능 / 원본 '+total.toLocaleString('ko-KR')+'개'));button.addEventListener('click',()=>chooseCategory(id));grid.append(button);
    });
    $('fn-subgroups').replaceChildren();
    const category=C.groups(state.source).find(x=>x[0]===state.category)?.[2]||'전체',sub=subAPI().label(state.category,state.subcategory)+(state.beefGrade?' · '+(U.gradeOptions.find(x=>x[0]===state.beefGrade)?.[1]||''):'');$('fn-subcategory-hint').hidden=false;$('fn-subcategory-chip').hidden=!state.subcategory;$('fn-subcategory-label').textContent='선택 분류: '+sub;renderSubmenu();$('fn-browse-context').textContent=(state.source==='rda_10_4'?'식재료':'음식')+' › '+category+(sub?' › '+sub:'')+(hierarchyActive()&&state.riceType?' › '+state.riceType:'')+(hierarchyActive()&&state.ricePart?' › '+state.ricePart:'')+($('fn-group').value?' › '+$('fn-group').value:'');$('fn-category-note').textContent=state.source==='rda_10_4'?'큰 분류를 고른 뒤 식품 이름 입력란을 누르면 하위 분류를 선택할 수 있습니다. 직접 이름을 입력해도 됩니다.':'큰 분류 → 식품 이름 입력란의 하위 분류 → 식품 종류 → 출처·세부 구분 순서로 좁혀 보세요. 계열은 탐색용 분류이며 원산지·조리법을 보증하지 않습니다.';
    $('fn-query').placeholder=state.category?(sub||category)+' 안에서 이름 검색':'예: 두부, 양파, 닭고기 가슴살';$('fn-search-wide').hidden=!state.category&&!$('fn-group').value;
  }
  let returningToQuery=false;
  function closeSubmenu(){ $('fn-subcategory-menu').hidden=true;$('fn-query').setAttribute('aria-expanded','false'); }
  function openSubmenu(){if(!state.index.length)return;renderSubmenu();$('fn-subcategory-menu').hidden=false;$('fn-query').setAttribute('aria-expanded','true');}
  function selectSubcategory(id,grade=''){state.subcategory=id;state.beefGrade=id==='beef'?grade:'';state.riceType='';state.ricePart='';closeSubmenu();resetDetail();filter();returningToQuery=true;$('fn-query').focus();returningToQuery=false;}
  function renderSubmenu(){
    const menu=$('fn-subcategory-menu');menu.replaceChildren();
    if(!state.category){menu.append(el('p','위에서 큰 분류를 먼저 선택해 주세요. 이름을 바로 입력해 검색할 수도 있습니다.'));return;}
    const A=window.SmartNFAllergy,profile=A?.profile(),rows=state.index.filter(r=>recipeMatch(r)&&C.includes(state.source,state.category,r.group)&&(state.source!=='mfds_dishes'||!state.cuisine||D.cuisine(r)===state.cuisine)&&(!$('fn-basis').value||basisType(r.basis)===$('fn-basis').value)&&(!$('fn-preparation').value||S.preparation(r)===$('fn-preparation').value)&&(!A||A.inspect(r,profile).allowed));
    menu.append(el('p','하위 분류 선택 · 건수는 검색어 적용 전이며 상태·기준량·알레르기 조건을 반영합니다.'));
    for(const [id,title] of [['','전체 하위 분류'],...subAPI().groups(state.category)]){
      const count=id?rows.filter(r=>subAPI().classify(r,state.category)===id).length:rows.length;
      const button=el('button',title+' · '+count.toLocaleString('ko-KR')+'건');button.type='button';button.dataset.ingredientSubcategory=id;button.setAttribute('aria-pressed',String(state.subcategory===id&&!state.beefGrade));button.disabled=count===0&&!!id;if(button.disabled)button.title='현재 탭과 선택 조건에 해당하는 자료가 없습니다.';button.addEventListener('click',()=>selectSubcategory(id));menu.append(button);
      if(state.source==='rda_10_4'&&state.category==='meat'&&id==='beef'){
        for(const [grade,gradeLabel] of U.gradeOptions){
          const n=rows.filter(r=>U.classify(r,'meat')==='beef'&&U.beefGrade(r)===grade).length;
          const option=el('button','소고기 · '+gradeLabel+' · '+n.toLocaleString('ko-KR')+'건','fn-grade-option');option.type='button';option.dataset.beefGrade=grade;option.disabled=n===0;option.setAttribute('aria-pressed',String(state.subcategory==='beef'&&state.beefGrade===grade));option.addEventListener('click',()=>selectSubcategory('beef',grade));menu.append(option);
        }
      }

    }
  }
  $('fn-query').addEventListener('focus',()=>{if(!returningToQuery)openSubmenu();});$('fn-query').addEventListener('click',openSubmenu);
  $('fn-query').addEventListener('keydown',e=>{if(e.key==='ArrowDown'){e.preventDefault();openSubmenu();$('fn-subcategory-menu').querySelector('button:not(:disabled)')?.focus();}else if(e.key==='Escape'){if(!$('fn-subcategory-menu').hidden)e.preventDefault();closeSubmenu();}else if(e.key==='Enter')closeSubmenu();});
  $('fn-subcategory-menu').addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();closeSubmenu();returningToQuery=true;$('fn-query').focus();returningToQuery=false;return;}const buttons=[...$('fn-subcategory-menu').querySelectorAll('button:not(:disabled)')],i=buttons.indexOf(document.activeElement);if(['ArrowDown','ArrowUp','Home','End'].includes(e.key)){e.preventDefault();const n=e.key==='Home'?0:e.key==='End'?buttons.length-1:(i+(e.key==='ArrowDown'?1:-1)+buttons.length)%buttons.length;buttons[n]?.focus();}});
  $('fn-query-wrap').addEventListener('focusout',e=>{if(!$('fn-query-wrap').contains(e.relatedTarget))closeSubmenu();});document.addEventListener('pointerdown',e=>{if(!$('fn-query-wrap').contains(e.target))closeSubmenu();});
  $('fn-subcategory-clear').addEventListener('click',()=>selectSubcategory(''));
  function hierarchyActive(){return !!state.category&&!!state.subcategory;}
  function hierarchyFields(row){return state.source==='rda_10_4'?U.hierarchyFields(row,state.category,state.subcategory,{grade:state.beefGrade}):D.fields(row);}
  function renderRiceControls(){
    const ingredient=state.source==='rda_10_4',active=hierarchyActive(),rice=state.category==='grain'&&state.subcategory==='rice',meat=state.category==='meat'&&['beef','pork'].includes(state.subcategory);
    $('fn-rice-type-label').firstChild.textContent=rice?'세부 분류 1 · 쌀 종류':meat?'세부 분류 1 · 부위':'세부 분류 1 · 식품 종류';$('fn-rice-part-label').firstChild.textContent=rice?'세부 분류 2 · 도정·부분':meat?'세부 분류 2 · 세부 조건':(ingredient?'세부 분류 2 · 품종·부위·세부 구분':'세부 분류 2 · 출처·세부 구분');$('fn-search-form').dataset.ingredient='true';
    for(const id of ['fn-rice-type-label','fn-rice-part-label'])$(id).hidden=false;
    for(const id of ['fn-rice-type','fn-rice-part'])$(id).disabled=!active;
    const rows=active?scopedRows(false,true).filter(r=>S.matches(r,$('fn-query').value)):[];
    function options(id,values,current,title,field){const select=$(id);select.replaceChildren();const all=el('option',active?title:'하위 분류 선택 후 이용');all.value='';select.append(all);if(active)for(const value of values){const count=rows.filter(r=>hierarchyFields(r)[field]===value&&(field!=='part'||!state.riceType||hierarchyFields(r).type===state.riceType)).length;const option=el('option',value+' · '+count+'건');option.value=value;option.disabled=count===0;select.append(option);}select.value=current;}
    const types=[...new Set(rows.map(r=>hierarchyFields(r).type))];if(state.riceType&&!types.includes(state.riceType))types.push(state.riceType);types.sort((a,b)=>a.localeCompare(b,'ko'));
    options('fn-rice-type',types,state.riceType,rice?'전체 쌀 종류':meat?'전체 부위':'전체 식품 종류','type');
    const parts=[...new Set(rows.filter(r=>!state.riceType||hierarchyFields(r).type===state.riceType).map(r=>hierarchyFields(r).part))];if(state.ricePart&&!parts.includes(state.ricePart))parts.push(state.ricePart);
    parts.sort((a,b)=>rice?['백미','현미','칠분도미','쌀눈'].indexOf(a)-['백미','현미','칠분도미','쌀눈'].indexOf(b):a.localeCompare(b,'ko'));
    options('fn-rice-part',parts,state.ricePart,rice?'전체 도정·부분':'전체 세부 구분','part');
  }
  $('fn-rice-type').addEventListener('change',()=>{state.riceType=$('fn-rice-type').value;state.ricePart='';closeSubmenu();resetDetail();filter();});
  $('fn-rice-part').addEventListener('change',()=>{state.ricePart=$('fn-rice-part').value;closeSubmenu();resetDetail();filter();});
  function scopedRows(ignorePreparation=false,ignoreRice=false){
    const A=window.SmartNFAllergy,profile=A?.profile();
    return state.index.filter(row=>recipeMatch(row)&&(state.source!=='rda_10_4'||state.category!=='meat'||state.subcategory!=='beef'||!state.beefGrade||U.beefGrade(row)===state.beefGrade)&&(ignoreRice||!hierarchyActive()||((!state.riceType||hierarchyFields(row).type===state.riceType)&&(!state.ricePart||hierarchyFields(row).part===state.ricePart)))&&(!state.subcategory||subAPI().classify(row,state.category)===state.subcategory)&&(state.source!=='mfds_dishes'||!state.cuisine||D.cuisine(row)===state.cuisine)&&(!C||C.includes(state.source,state.category,row.group))&&(!$('fn-group').value||row.group===$('fn-group').value)&&(!$('fn-basis').value||basisType(row.basis)===$('fn-basis').value)&&(ignorePreparation||!$('fn-preparation').value||S.preparation(row)===$('fn-preparation').value)&&(!A||A.inspect(row,profile).allowed));
  }
  function filter() {
    if(!searching){const button=$('fn-search-form').querySelector('button[type="submit"]');button.textContent='검색';button.classList.remove('search-complete');}
    semanticRequest++;$('fn-semantic-results').replaceChildren();$('fn-semantic-status').textContent='';$('fn-semantic-run').disabled=false;
    renderRiceControls();
    const input=$('fn-query').value,query=S.query(input),scope=scopedRows(),matched=scope.filter(row=>S.matches(row,input));
    state.filtered=matched.sort((a,b)=>S.rank(a,input)-S.rank(b,input)||a.name.localeCompare(b.name,'ko')||a.id.localeCompare(b.id));
    const previous=$('fn-preparation').value,counts=new Map();for(const row of scopedRows(true).filter(row=>S.matches(row,input))){const k=S.preparation(row);counts.set(k,(counts.get(k)||0)+1);}
    $('fn-preparation').replaceChildren(el('option','전체 상태'));$('fn-preparation').firstChild.value='';
    for(const [key,label] of Object.entries(S.prepLabel)){if(!counts.has(key)&&key!==previous)continue;const option=el('option',label+' · '+(counts.get(key)||0)+'건');option.value=key;$('fn-preparation').append(option);}$('fn-preparation').value=previous;
    $('fn-query-note').textContent=input.trim()&&S.norm(input)!==S.norm(query)?'“'+input.trim()+'” → “'+query+'” 명칭으로 함께 검색합니다.':'';
    const spelling=$('fn-spelling');spelling.replaceChildren();if(input.trim()&&state.filtered.length<5){for(const name of S.suggestions(scope,input)){const button=el('button','“'+name+'” 검색');button.type='button';button.addEventListener('click',()=>{$('fn-query').value=name;filter();});spelling.append(button);}}
    $('fn-semantic').hidden=!input.trim()||state.filtered.length>=5;
    state.page=0;if(state.selected&&!state.filtered.some(r=>r.id===state.selected))resetDetail();renderCategories();render();status(state.filtered.length.toLocaleString('ko-KR')+'건을 찾았습니다. 이름·식품군·조리 상태를 확인해 선택하세요.');
  }
  $('fn-semantic-run').addEventListener('click',async()=>{
    const token=++semanticRequest,input=$('fn-query').value,rows=scopedRows();$('fn-semantic-run').disabled=true;$('fn-semantic-status').textContent='관련 후보를 찾고 있습니다.';$('fn-semantic-results').replaceChildren();
    try{const candidates=await window.SmartNFFoodSemantic.search(input,rows,state.manifest.version);if(token!==semanticRequest)return;
      $('fn-semantic-status').textContent=candidates.length?'의미가 비슷한 참고 후보입니다. 같은 식품·알레르기 안전성을 뜻하지 않습니다. 이름·조리 상태·출처를 직접 확인하세요.':'현재 조건에서 관련 후보를 찾지 못했습니다. 이름이나 분류를 바꿔 보세요.';
      for(const {row} of candidates){const li=el('li'),button=el('button');button.type='button';button.dataset.semanticFoodId=row.id;button.append(el('strong',row.name),el('span',row.group+' · '+basis(row.basis)));button.addEventListener('click',()=>detail(row));li.append(button);$('fn-semantic-results').append(li);}
    }catch(e){if(token===semanticRequest)$('fn-semantic-status').textContent='의미 검색 자료를 불러오지 못했습니다. 일반 검색은 계속 이용할 수 있으며 다시 시도할 수 있습니다.';}
    finally{if(token===semanticRequest)$('fn-semantic-run').disabled=false;}
  });
  function render() {
    root.replaceChildren();
    const count=state.filtered.length;const pages=Math.ceil(count/pageSize);
    $('fn-result-count').textContent=count.toLocaleString('ko-KR')+'건';$('fn-empty').hidden=!!count;
    $('fn-page').textContent=pages ? (state.page+1)+' / '+pages : '0 / 0';
    $('fn-prev').disabled=state.page===0;$('fn-next').disabled=(state.page+1)*pageSize>=count;
    state.filtered.slice(state.page*pageSize,(state.page+1)*pageSize).forEach(row=>{
      const li=el('li');const button=el('button');button.type='button';button.dataset.foodId=row.id;
      button.setAttribute('aria-pressed',String(row.id===state.selected));
      button.append(el('strong',row.name),el('span',window.SmartNFFoodIdentity.stateLabel[window.SmartNFFoodIdentity.foodState(row)]+' · '+row.group+' · '+basis(row.basis)),el('small',row.id.split(':').slice(1).join(':')));
      if(state.source==='mfds_dishes'&&window.SmartNFDishRecipes?.candidates(row).length)button.append(el('small','참고 레시피 있음','fn-recipe-badge'));
      button.addEventListener('click',()=>{if(state.selected===row.id){resetDetail();render();}else detail(row);});li.append(button);root.append(li);
    });
  }
  async function detail(row) {
    const token=++state.detail;state.selected=row.id;render();
    $('fn-detail-heading').textContent=row.name;$('fn-detail').querySelector('.fn-muted').textContent='상세정보를 불러오고 있습니다.';$('fn-detail-body').replaceChildren();
    try {
      const key=dataUrl(row.chunk);
      if(!cache.has(key))cache.set(key,json(key).catch(error=>{cache.delete(key);throw error;}));
      const chunk=await cache.get(key);if(token!==state.detail)return;
      const record=chunk[row.id];if(!record||record.id!==row.id)throw new Error('DETAIL_NOT_FOUND');
      const body=$('fn-detail-body');
      body.dataset.photoFoodId=record.id;
      import('/js/common-food-photo.js').then(module=>{if(token===state.detail)module.mountPhoto(record,body);}).catch(()=>{});
      $('fn-detail').querySelector('.fn-muted').textContent=record.group+' · '+basis(record.basis_raw);
      const badges=el('div',undefined,'fn-badges');badges.append(el('span',window.SmartNFFoodIdentity.stateLabel[window.SmartNFFoodIdentity.foodState(record)]));badges.append(el('span','기준 '+basis(record.basis_raw)),el('span','식품코드 '+record.source_code));body.append(badges);
      if(window.SmartNFFoodFlow){const flow=window.SmartNFFoodFlow;const button=el('button',flow.selection().items.some(x=>x.id===record.id)?'✓ 선택됨 · 해제':'나의 선택에 담기','fc-primary');button.type='button';const registrationBadge=el('small','확정 등록됨 · 임시 연동');registrationBadge.dataset.registrationBadge=record.id;registrationBadge.hidden=!window.SmartNFFoodRegistration?.has(record.id);body.append(registrationBadge);button.dataset.foodSelect=record.id;button.dataset.selected=String(flow.selection().items.some(x=>x.id===record.id));button.setAttribute('aria-pressed',button.dataset.selected);const allergy=window.SmartNFAllergy?.inspect(record);if(allergy&&!allergy.allowed){button.disabled=true;button.textContent='현재 알레르기 조건에서 제외';body.append(el('p',allergy.reason,'fa-filter-note'));}button.addEventListener('click',()=>{try{const selected=flow.toggle(record,'manual',[]);flow.message(selected?'선택 목록에 담았습니다. 다시 누르면 해제됩니다.':'선택을 해제했습니다.');}catch(error){flow.message(error.message);}});body.append(button);}
      if(state.source==='mfds_dishes')window.SmartNFDishRecipes?.mount(record,body,$('fn-detail-heading'));
      if(record.portion_raw)body.append(el('p','식품중량 원문: '+record.portion_raw+' · 1인분 확정값이 아니며 아래 영양값의 기준량과 구분해 주세요.','fn-muted'));
      const grid=el('dl',undefined,'fn-nutrients');
      Object.entries(labels).forEach(([key,label])=>{
        const item=record.nutrients[key];const tile=el('div');tile.append(el('dt',label));
        const kind=item?.status||'blank';
        const value=kind==='numeric'||kind==='quoted_or_calculated' ? String(item.raw)+' '+(item.unit||'') : statuses[kind]||'원문 확인 필요';
        tile.append(el('dd',value),el('small',statuses[kind]||kind));grid.append(tile);
      });body.append(grid);
      const missing=Object.values(record.nutrients).filter(x=>!['numeric','quoted_or_calculated'].includes(x.status)).length;body.append(el('p','영양항목 '+Object.keys(labels).length+'개 중 일반 수치·인용값 외 '+missing+'개 · 자료 없음·미측정·미량은 0이 아닙니다.','fn-small-note'));
      body.append(el('p','기준량에 대한 원본 값입니다. 실제 섭취량으로 환산하거나 개인 권장량으로 판정하지 않습니다.','fn-small-note'));
      const source=el('details');source.open=true;source.append(el('summary','자료 출처와 기준 확인'));
      const dl=el('dl',undefined,'fn-provenance');
      const entries=[['제공 자료',state.manifest.sources[record.id.split(':')[0]].publisher],['원본 출처',record.source_attribution||'미기재'],['시트',record.source_sheet],['원본 행',record.excel_row],['표시 기준',basis(record.basis_raw)]];
      const metaLabels={index:'자료 순번',version:'성분표 버전',state_description:'식품 상태 원문'};
      Object.entries(record.source_metadata||{}).forEach(([key,value])=>entries.push([metaLabels[key]||key,String(value)]));
      entries.forEach(([key,value])=>{dl.append(el('dt',key),el('dd',value??'미기재'));});source.append(dl);body.append(source);
      if(window.matchMedia('(max-width: 760px)').matches){$('fn-detail').scrollIntoView({block:'start',behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});$('fn-detail').focus({preventScroll:true});}
    } catch(error) {if(token!==state.detail)return;$('fn-detail').querySelector('.fn-muted').textContent='상세정보를 불러오지 못했습니다. 목록에서 다시 선택해 주세요.';}
  }
  document.querySelectorAll('[data-source]').forEach(button=>button.addEventListener('click',()=>{
    if(button.dataset.source===state.source)return;state.source=button.dataset.source;
    document.querySelectorAll('[data-source]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
    $('fn-basis').value='';$('fn-preparation').value='';$('fn-group').value='';loadSource();
  }));
  for(const [value,label] of D.cuisines){const option=el('option',label);option.value=value;$('fn-cuisine').append(option);}
  $('fn-cuisine').addEventListener('change',()=>{state.cuisine=$('fn-cuisine').value;state.subcategory='';state.beefGrade='';state.riceType='';state.ricePart='';closeSubmenu();resetDetail();filter();});
  function syncRecipeFilter(){const status=window.SmartNFDishRecipes.status;$('fn-recipe-filter').disabled=status!=='ready';$('fn-recipe-filter-note').textContent=status==='ready'?'현재 보유 자료의 참고 후보 유무입니다. 내가 선택했는지와는 다릅니다.':status==='error'?'레시피 자료를 확인하지 못했습니다. 유무 필터를 사용할 수 없습니다.':'참고 레시피 유무를 확인하고 있습니다.';$('fn-recipe-filter-retry').hidden=status!=='error';}
  for(const event of ['smartnf-recipes-ready','smartnf-recipes-error','smartnf-recipes-loading'])window.addEventListener(event,()=>{syncRecipeFilter();if(state.index.length)filter();});
  $('fn-recipe-filter').addEventListener('change',()=>{state.riceType='';state.ricePart='';closeSubmenu();resetDetail();filter();});
  $('fn-recipe-filter-retry').addEventListener('click',()=>{window.SmartNFDishRecipes.ready().catch(()=>{});});syncRecipeFilter();
  let timer;
  $('fn-query').addEventListener('input',()=>{closeSubmenu();clearTimeout(timer);timer=setTimeout(filter,180);});
  $('fn-group').addEventListener('change',()=>{resetDetail();filter();});$('fn-search-wide').addEventListener('click',()=>{state.category='';state.subcategory='';state.beefGrade='';state.riceType='';state.ricePart='';closeSubmenu();$('fn-group').value='';populateGroups();resetDetail();filter();});$('fn-basis').addEventListener('change',filter);$('fn-preparation').addEventListener('change',filter);
  $('fn-search-form').addEventListener('submit',async event=>{event.preventDefault();if(searching)return;clearTimeout(timer);const button=$('fn-search-form').querySelector('button[type="submit"]'),token=state.load;searching=true;button.disabled=true;button.textContent='검색 중…';button.setAttribute('aria-busy','true');status('검색 조건을 적용하고 있습니다.');try{await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));if(token!==state.load||!state.index.length){button.textContent='검색';return;}filter();const count=state.filtered.length.toLocaleString('ko-KR');button.textContent='✓ 검색 완료 · '+count+'건';button.classList.add('search-complete');status('✓ 검색 완료 · '+count+'건. 이름·식품군·조리 상태를 확인해 선택하세요.');}finally{searching=false;button.disabled=false;button.removeAttribute('aria-busy');}});
  $('fn-prev').addEventListener('click',()=>{if(state.page>0){state.page--;render();}});
  $('fn-next').addEventListener('click',()=>{if((state.page+1)*pageSize<state.filtered.length){state.page++;render();}});
  async function init() {try{state.manifest=await json('/js/data/food-nutrition/manifest.json');await loadSource();}catch(error){status('식품 자료가 아직 준비되지 않았습니다. 화면 데이터 준비 후 다시 불러와 주세요.');$('fn-retry').hidden=false;}}
  window.addEventListener('smartnf-allergy-change',()=>{resetDetail();filter();});
  window.addEventListener('smartnf-food-selection',()=>{const flow=window.SmartNFFoodFlow;if(flow)document.querySelectorAll('[data-food-select]').forEach(button=>{if(button.disabled)return;const selected=flow.selection().items.some(x=>x.id===button.dataset.foodSelect);button.textContent=selected?'✓ 선택됨 · 해제':'나의 선택에 담기';button.dataset.selected=String(selected);button.setAttribute('aria-pressed',String(selected));});});
  window.addEventListener('smartnf-draft-inputs-reset',()=>{if(state.index.length)filter();});$('fn-retry').addEventListener('click',init);init();
})();
