'use strict';
(()=>{
 const definitions={
 rda_10_4:[
  ['grain','🌾','곡류·감자',['곡류 및 그 제품','감자류 및 전분류']],
  ['vegetable','🥬','채소·버섯',['채소류','버섯류']],
  ['fruit','🍎','과일',['과일류']],
  ['meat','🥩','육류',['육류 및 그 제품']],
  ['seafood','🐟','수산물·해조',['어패류 및 그 제품','해조류']],
  ['egg-dairy','🥚','달걀·유제품',['난류','우유 및 그 제품']],
  ['beans-nuts','🫘','콩·견과류',['두류','견과류 및 종실류']],
  ['seasoning','🧂','양념·당류·유지',['조미료류','당류','유지류']],
  ['drink','☕','차·음료·주류',['차류','음료류','주류']],
  ['other','🍽️','가공·기타',['조리가공식품류','기타']]
 ],
 mfds_dishes:[
  ['rice','🍚','밥·죽·스프',['밥류','죽 및 스프류']],
  ['noodle','🍜','면·만두',['면 및 만두류']],
  ['soup','🥣','국·탕·찌개',['국 및 탕류','찌개 및 전골류']],
  ['side','🥗','반찬',['생채·무침류','나물·숙채류','조림류','볶음류','김치류','장아찌·절임류','젓갈류']],
  ['cooked','🍳','구이·찜·전·튀김',['구이류','찜류','전·적 및 부침류','튀김류','조리된 식재료']],
  ['bakery','🥐','빵·과자',['빵 및 과자류']],
  ['drink','🥤','음료·차',['음료 및 차류']],
  ['dairy','🍦','유제품·빙과',['유제품류 및 빙과류']],
  ['review','🔎','분류 확인 필요',['분류 확인 필요']],
  ['other','🍽️','양념·기타',['장류, 양념류','수·조·어·육류','곡류, 서류 제품','채소, 해조류','과일류','두류, 견과 및 종실류']]
 ]};
 function groups(source){return definitions[source]||[];}
 function category(source,group){return groups(source).find(x=>x[3].includes(group))?.[0]||'other';}
 function includes(source,id,group){return !id||category(source,group)===id;}
 const paths={
  '':['M10 3a7 7 0 1 0 0 14 7 7 0 0 0 0-14','m15 15 6 6'],
  grain:['M5 21 19 3','M8 17C1 17 2 9 9 12','M12 12C6 10 9 3 14 7','M13 13c6 5 10-2 4-4'],
  vegetable:['M5 20C1 9 7 3 20 3c0 13-6 19-15 17','M5 20 15 9'],
  fruit:['M12 7C3 1 1 12 7 20c2 2 3 0 5 0s3 2 5 0C23 12 21 1 12 7','M12 7V3m0 1c3 0 5-2 6-3'],
  meat:['M5 8c6-7 16-5 16 3s-7 12-14 10S0 13 5 8','M8 10c4-4 9-3 9 2s-8 7-9 2 0-4 0-4'],
  seafood:['M3 12c5-9 11-9 16 0-5 9-11 9-16 0','M19 12l4-5v10l-4-5','M8 10h.1'],
  'egg-dairy':['M12 2C8 2 3 10 3 15a9 7 0 0 0 18 0C21 10 16 2 12 2'],
  'beans-nuts':['M12 5C5-2-2 9 5 18s19 1 15-5c-2-3-4 1-7-2S16 8 12 5'],
  seasoning:['M8 3h8v4H8z','M7 7h10l2 4v10H5V11l2-4','M9 14h6m-6 3h6'],
  drink:['M4 6h13v9a6 6 0 0 1-13 0V6','M17 7h2a4 4 0 0 1 0 8h-2','M3 22h16M7 1v2m6-2v2'],
  rice:['M3 12h18c0 12-18 12-18 0','M4 11c0-9 16-9 16 0M7 8h2m3-2h2m1 3h2'],
  noodle:['M3 12h18c0 12-18 12-18 0','M7 3v8m4-10v10m4-8v8M5 4l15-2'],
  soup:['M3 12h18c0 12-18 12-18 0','M7 3c-3 3 3 3 0 6m5-8c-3 3 3 3 0 6m5-4c-3 3 3 3 0 6'],
  side:['M3 14h18c0 10-18 10-18 0','M6 12C2 3 14 1 15 3c1 7-3 11-9 9m1 0 5-6'],
  cooked:['M3 10h14v5c0 8-14 8-14 0v-5','M17 12h6M6 4v3m5-5v5'],
  bakery:['M5 10C-2 4 7 0 12 4c5-4 14 0 7 6v11H5V10','M8 11v6m4-7v7m4-6v6'],
  dairy:['M5 10h14L12 23 5 10','M4 10c-3-5 2-8 5-6 0-5 8-5 8 0 4-1 7 3 3 6H4'],
  other:['M4 2v7c0 5 6 5 6 0V2M7 2v20','M20 2c-6 2-6 10 0 10m0-10v20']
 };
 function icon(id){const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg');svg.setAttribute('viewBox','0 0 26 26');svg.setAttribute('width','28');svg.setAttribute('height','28');svg.setAttribute('fill','none');svg.setAttribute('stroke','currentColor');svg.setAttribute('stroke-width','1.6');svg.setAttribute('stroke-linecap','round');svg.setAttribute('stroke-linejoin','round');svg.setAttribute('aria-hidden','true');svg.classList.add('fn-category-icon');for(const d of paths[id]||paths.other){const p=document.createElementNS(ns,'path');p.setAttribute('d',d);svg.append(p);}return svg;}
 window.SmartNFFoodCategories={groups,category,includes,icon};
})();
