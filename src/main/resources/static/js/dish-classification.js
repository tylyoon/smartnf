'use strict';
(()=>{
 const groups={rice:[['rice','밥'],['fried-rice','볶음밥'],['mixed-rice','비빔밥·덮밥'],['porridge','죽'],['soup','스프']],noodle:[['soup-noodle','국물면'],['mixed-noodle','비빔·볶음면'],['pasta','파스타'],['dumpling','만두'],['other-noodle','기타 면']],soup:[['soup','국'],['tang','탕'],['stew','찌개'],['hotpot','전골']],side:[['namul','나물'],['salad','생채·무침'],['stirfry','볶음'],['braise','조림'],['kimchi','김치'],['pickle','절임·장아찌'],['jeotgal','젓갈']],cooked:[['grill','구이'],['steam','찜'],['pancake','전·부침'],['fry','튀김'],['cooked-ingredient','조리된 식재료']],bakery:[['bread','일반 빵'],['sandwich','샌드위치·버거'],['cake','케이크'],['ricecake','떡'],['snack','과자·쿠키'],['other','기타']],drink:[['coffee','커피'],['tea','차'],['juice','과채음료'],['soda','탄산음료'],['other','기타 음료']],dairy:[['milk','우유·유음료'],['yogurt','요구르트'],['cheese','치즈'],['ice','아이스크림·빙과'],['other','기타']],other:[['paste','장류'],['sauce','소스·양념'],['other','기타']]};
 const norm=s=>String(s||'').normalize('NFKC').replace(/\s+/g,'').toLowerCase();
 const cuisines=[['','전체'],['korean','한식'],['chinese','중식'],['japanese','일식'],['western','양식'],['southeast','동남아식'],['southasia','인도·남아시아식'],['common','공통 식품'],['mixed','기타·복합'],['unknown','분류 미확인']];
 // Editable navigation dictionary; these labels are not certified geographical origins.
 const named={korean:'김치찌개|된장찌개|순두부찌개|비빔밥|불고기|떡국|삼계탕|잡채|떡볶이|김밥',chinese:'짜장면|자장면|짬뽕|탕수육|마파두부|팔보채|깐풍기',japanese:'우동|초밥|라멘|소바|규동|일식돈가스',western:'스파게티|파스타|리조또|스테이크|피자',southeast:'베트남쌀국수|팟타이|똠얌꿍',southasia:'인도커리|인도카레|탄두리치킨|난'};
 function cuisine(row){const n=norm(row.name).split('_')[0];const explicit=[['korean',/\(한식\)|^한식(?:요리|메뉴)/],['chinese',/\((?:중식|중국식)\)|^중국식/],['japanese',/\((?:일식|일본식)\)|^일본식/],['western',/\((?:양식|서양식)\)|^서양식/],['southeast',/\((?:베트남식|태국식|동남아식)\)|^(?:베트남식|태국식|동남아식)/],['southasia',/\((?:인도식|남아시아식)\)|^(?:인도식|남아시아식)/]];const hits=explicit.filter(([,re])=>re.test(n));if(hits.length>1)return 'mixed';if(hits.length===1)return hits[0][0];for(const [id,words]of Object.entries(named))if(words.split('|').some(w=>n===w||n.startsWith(w+'(')))return id;if(/퓨전|복합/.test(n))return 'mixed';if(['음료 및 차류','유제품류 및 빙과류','음료류','차류','우유 및 그 제품'].includes(row.group))return 'common';return 'unknown';}
 function classify(row,cat){const n=norm(row.name),g=row.group;
  if(cat==='rice'){if(/스프|수프/.test(n))return 'soup';if(/죽/.test(n))return 'porridge';if(/볶음밥/.test(n))return 'fried-rice';if(/비빔밥|덮밥/.test(n))return 'mixed-rice';if(/밥/.test(n))return 'rice';}
  if(cat==='noodle'){if(/만두/.test(n))return 'dumpling';if(/스파게티|파스타|마카로니/.test(n))return 'pasta';if(/비빔|볶음|짜장|자장|쟁반/.test(n))return 'mixed-noodle';if(/우동|짬뽕|칼국수|잔치국수|라멘|라면/.test(n))return 'soup-noodle';return 'other-noodle';}
  if(cat==='soup'){if(/전골/.test(n)||g==='찌개 및 전골류'&&/전골/.test(n))return 'hotpot';if(/찌개/.test(n))return 'stew';if(/탕/.test(n))return 'tang';if(/국/.test(n))return 'soup';}
  const source={'나물·숙채류':'namul','생채·무침류':'salad','볶음류':'stirfry','조림류':'braise','김치류':'kimchi','장아찌·절임류':'pickle','젓갈류':'jeotgal','구이류':'grill','찜류':'steam','전·적 및 부침류':'pancake','튀김류':'fry','조리된 식재료':'cooked-ingredient'};
  if(['side','cooked'].includes(cat)&&source[g])return source[g];
  if(cat==='bakery'){if(/샌드위치|햄버거|버거/.test(n))return 'sandwich';if(/케이크|케익|카스텔라/.test(n))return 'cake';if(/떡/.test(n))return 'ricecake';if(/쿠키|과자|크래커|비스킷|스낵|초콜릿|사탕/.test(n))return 'snack';if(/빵|베이글|바게트|크루아상|토스트/.test(n))return 'bread';return 'other';}
  if(cat==='drink'){if(/커피|라테|라떼|카푸치노|에스프레소/.test(n))return 'coffee';if(/주스|쥬스|과즙/.test(n))return 'juice';if(/탄산|콜라|사이다/.test(n))return 'soda';if(/차$|녹차|홍차|허브티/.test(n))return 'tea';return 'other';}
  if(cat==='dairy'){if(/요구르트|요거트/.test(n))return 'yogurt';if(/치즈/.test(n))return 'cheese';if(/아이스크림|빙과|샤베트|셔벗|빙수/.test(n))return 'ice';if(/우유|유음료/.test(n))return 'milk';return 'other';}
  if(cat==='other'){if(/된장|고추장|간장|청국장|쌈장/.test(n))return 'paste';if(/소스|양념|드레싱|케첩|마요네즈/.test(n))return 'sauce';return 'other';}return 'review';
 }
 function options(cat){return [...(groups[cat]||[]),['review','분류 확인 필요']];}
 function label(cat,id){return options(cat).find(x=>x[0]===id)?.[1]||'';}
 function fields(row){const [name,...tail]=String(row.name).split('_');return {type:name.trim(),part:[tail.join(' · '),row.dishDetail||'추가 구분 미표기',row.basis].filter(Boolean).join(' · ')};}
 window.SmartNFDishClassification={groups:options,classify,label,fields,cuisines,cuisine,norm};
})();
