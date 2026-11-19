'use strict';
(()=>{
 const definitions={
  grain:[['rice','쌀'],['barley-wheat-oat','보리·밀·귀리'],['other-grain','기타 곡물'],['potato','감자·고구마'],['flour','가루·전분']],
  vegetable:[['leaf','잎채소'],['root','뿌리채소'],['fruit-veg','열매채소'],['stem-flower','줄기·꽃채소'],['mushroom','버섯']],
  fruit:[['apple-pear','사과·배'],['citrus','감귤·오렌지'],['grape-berry','포도·베리류'],['peach-plum','복숭아·자두'],['tropical','열대과일'],['other-fruit','기타 과일']],
  meat:[['beef','소고기'],['pork','돼지고기'],['chicken','닭고기'],['duck','오리고기'],['other-meat','기타 육류']],
  seafood:[['fish','생선'],['shellfish','조개'],['crustacean','새우·게'],['cephalopod','오징어·문어'],['other-seafood','기타 수산물'],['seaweed','해조류']],
  'egg-dairy':[['egg','달걀'],['other-egg','메추리알·기타 알'],['milk','우유'],['yogurt','요구르트'],['cheese','치즈'],['other-dairy','기타 유제품']],
  'beans-nuts':[['beans','콩류'],['tofu','두부류'],['nuts','견과류'],['seeds','씨앗류'],['bean-product','기타 콩 가공품']],
  seasoning:[['salt','소금'],['paste','장류'],['spice','향신료'],['sauce','소스·조미료'],['sugar','설탕·꿀·시럽'],['oil','기름·지방']],
  drink:[['tea','차'],['coffee','커피'],['juice','과채음료'],['other-drink','기타 음료'],['alcohol','주류']],
  other:[]
 };
 const sets={};function names(key,list){sets[key]=new Set(list.split('|'));}
 names('fish','가라지|가물치|가시망둑|가오리|가자미|갈치|강달이|게르치|고등어|괴도라치|군평선이|기름종개|까나리|꺽저기|꼬치고기|꼼치|꽁치|날치|납지리|넙치(광어)|네동가리|노랑촉수|노래미|놀래기|농어|누치|눈볼대|눈퉁멸|능성어|다금바리|다랑어|달강어|달고기|대구|대구횟대|대두어(흑연)|도다리|도도바리|도루묵|도치|독가시치|돔|동사리|동자개(빠가사리)|둑중개|드렁허리|등가시치|만새기|망둑어(풀망둑)|매퉁이|메기|멸치|명태|모래무지|몽치다래|문절망둑|물치다래|미꾸리|민달고기|민어|민태|박대|방어|백연|밴댕이|뱅어|베도라치|베로치|베스|벤자리|병어|보구치|보리멸|복어|볼기우럭|볼락|부세|부시리|부치|붉바리|붕어|블루길|빙어|산천어|살살치|삼세기|삼치|상어|새다래|샛멸|서대|성대|송어|숭어|쌍동가리|쌍뿔달재|쏘가리|쏨뱅이|쑤기미|쑥감펭|아귀|아홉동가리|애꼬치|양미리|양태|얼룩통구멍|여덟동가리|연어|열쌍동가리|우각바리|웅어|은어|인상어|임연수어|잉어|장갱이|장문볼락|장어|전갱이|전어|점감펭|점줄우럭|정어리|조기(참조기)|준치|쥐치|참마자|청새치|청어|초어|통치|투라치|틸라피아|푸렁통구멍|풀반지|피라미|학공치|향어|홍감펭|홍어|홍치|황매퉁이|황새치|황어|횟대|히메치');
 names('shellfish','가리비|각시수랑|고둥|굴|꼬막|다슬기|담치|대수리|대합|동죽|맛|바지락|백합|소라|수랑|오분자기|우렁이|재첩|전복|조개');
 names('crustacean','가재|게|새우|크릴');names('cephalopod','꼴뚜기|낙지|문어|오징어|주꾸미|한치');names('other-seafood','개불|군소|멍게(우렁쉥이)|멍게|미더덕|성게|해삼|해파리');
 names('leaf','갓|비름|갯기름나물|갯나물|겨자|경수채|고들빼기|고려엉겅퀴(곤드레)|고수(향채)|고춧잎|곤달비|공심채|근대|냉이|누리장나무잎|는쟁이냉이|돌나물|들깻잎|루꼴라|모링가(드럼스틱)|무청|무순|물냉이|물쑥|미나리|민들레|바질|방가지똥|방울다다기양배추|배암차즈기(곰보배추)|배초향(방아)|배추|뽕잎|부지깽이(섬쑥부쟁이)|부추|비타민채(다채)|산마늘(명이나물)|삼나물|삼붕냐와|상추|소리쟁이|수리취(떡취)|시금치|신선초(명일엽)|쌈추|쑥|쑥갓|쑥부쟁이|씀바귀|아욱|아이비카|아주까리|알팔파|어수리|엉겅퀴|열대비름(아마란스)|열무|영아자|원추리|유채|질경이|참나물|참죽나물|청경채|취나물|치커리|케일|콩잎|토스카노(잎브로콜리)|파드득나물(삼엽채)|파슬리');
 names('root','게걸무|고추냉이|당근|더덕|도라지|마늘|무|무말랭이|비트|사탕무|삼채|생강|쇠귀나물|순무|양파|연근|염교(락교)|우엉|울금|잔대|적양무|초석잠|총각무|콜라비');
 names('fruit-veg','가지|고추|날개콩|동아|박|박고지|여주(고야)|오이|오크라|옥수수|토마토|파프리카|미니파프리카|피망|호박');
 names('stem-flower','고비|고사리|국화꽃|꽃양배추(콜리플라워)|대나무순(죽순)|두릅|리크|마늘종|풋마늘|브로콜리|사탕수수|셀러리|숙주나물|아스파라거스|아티초크|양하|줄나물|진달래꽃|콩나물|토란대|파');
 names('citrus','귤|금귤|라임|레몬|오렌지|유자|자몽|탱자');names('grape-berry','포도|구스베리|딸기|라즈베리|머루|복분자|블랙베리|블랙커런트|블루베리|산딸기|아로니아|엘더베리|오디|크랜베리');names('peach-plum','복숭아|자두|살구|매실|버찌|체리|앵두|플럼코트');names('tropical','구아바|대추야자|두리안|롱안|리치|망고|망고스틴|바나나|백향과(패션프루트)|아떼모야|아보카도|아세로라|오렴자(카람볼라)|용과|잭프루트|키위|파인애플|파파야');
 names('nuts','개암|땅콩|밤|브라질너트|아몬드|은행|잣|코코넛|피스타치오|피칸|호두');names('seeds','들깨|머루씨|삼씨(대마씨)|수박씨|연씨|참깨|치아씨|해바라기씨|호박씨');
 names('paste','간장|고추장|된장|두반장|미소|쌈장|청국장|초고추장|해선장');names('spice','강황|겨자|계피|고추냉이|고춧가루|골든세이지|라벤더|레몬그라스(시트로넬라)|로즈메리|민트|애플민트|사프란|산초|생강|오레가노|올스파이스|울금|월계수|육두구|정향|칠리|타라곤|타임|파슬리|파프리카|페퍼민트|후추');names('sugar','과당|꿀|당밀|물엿|설탕|시럽|포도당|조청');
 const has=(key,head)=>sets[key]?.has(head);
 function classify(row,category){
  const fields=String(row.name||'').split(',').map(x=>x.trim()),head=fields[0],group=row.group;
  if(category==='grain'){
   if(group==='감자류 및 전분류'&&head==='전분')return 'flour';
   if(fields.some(x=>/^(?:가루|전분|밀가루|쌀가루|부침가루|튀김가루|빵가루)$/.test(x))||head==='미숫가루')return 'flour';
   if(group==='감자류 및 전분류')return ['감자','고구마','아피오스감자','돼지감자'].includes(head)?'potato':'review';
   if(['멥쌀','찹쌀'].includes(head))return 'rice';
   if(['보리','밀','귀리'].includes(head))return 'barley-wheat-oat';
   if(['기장','메밀','수수','아마란스','옥수수','율무','잡곡','조','퀴노아','피','호밀'].includes(head))return 'other-grain';
  }
  if(category==='vegetable'){
   if(group==='버섯류')return 'mushroom';
   if(fields.some(x=>/^(?:잎|잎줄기|어린잎)$/.test(x)))return 'leaf';
   if(fields.some(x=>/^(?:줄기|꽃|꽃봉오리|순)$/.test(x)))return 'stem-flower';
   if(fields.some(x=>/^(?:뿌리|덩이뿌리|뿌리줄기|구근|비늘줄기)$/.test(x)))return 'root';
   for(const key of ['leaf','root','fruit-veg','stem-flower'])if(has(key,head))return key;
  }
  if(category==='fruit'&&group==='과일류'){
   if(['사과','배'].includes(head))return 'apple-pear';
   for(const key of ['citrus','grape-berry','peach-plum','tropical'])if(has(key,head))return key;
   return 'other-fruit';
  }
  if(category==='meat'&&group==='육류 및 그 제품'){
   if(['소고기','소 부산물','송아지고기','송아지 부산물'].includes(head))return 'beef';
   if(['돼지고기','돼지 부산물','돼지불고기'].includes(head))return 'pork';
   if(['닭고기','닭 부산물'].includes(head))return 'chicken';
   if(head==='오리고기')return 'duck';
   return 'other-meat';
  }
  if(category==='seafood'){
   if(group==='해조류')return 'seaweed';
   for(const key of ['fish','shellfish','crustacean','cephalopod','other-seafood'])if(has(key,head))return key;
  }
  if(category==='egg-dairy'){
   if(group==='난류')return head==='달걀'?'egg':'other-egg';
   if(group==='우유 및 그 제품'){
    if(/요구르트|요거트/.test(head))return 'yogurt';if(/치즈/.test(head))return 'cheese';if(head==='우유')return 'milk';return 'other-dairy';
   }
  }
  if(category==='beans-nuts'){
   if(group==='두류'){
    if(['두부','순두부','연두부'].includes(head))return 'tofu';
    if(fields.some(x=>/가루|분리단백|단백질|페이스트/.test(x))||['녹두 빈대떡가루','대체식품'].includes(head))return 'bean-product';
    if(['강낭콩','녹두','대두','동부','리마콩','렌즈콩(렌틸콩)','밤콩','병아리콩','완두','작두(도두)','잠두','쥐눈이콩(검정소립콩)','팥'].includes(head))return 'beans';
   }
   if(group==='견과류 및 종실류'){if(has('nuts',head))return 'nuts';if(has('seeds',head))return 'seeds';}
  }
  if(category==='seasoning'){
   if(group==='유지류')return 'oil';if(has('sugar',head)&&group==='당류')return 'sugar';
   if(head==='소금')return 'salt';if(has('paste',head))return 'paste';if(has('spice',head))return 'spice';
   if(group==='조미료류'&&/소스|양념|조미료|시즈닝|스프|스톡|식초|마요네즈|케첩|맛술|페이스트|육수|하이라이스/.test(head))return 'sauce';
  }
  if(category==='drink'){
   if(group==='주류')return 'alcohol';if(/커피|카페라테/.test(head))return 'coffee';
   if(group==='차류'&&/차$/.test(head))return 'tea';
   if(group==='음료류'&&/주스|쥬스|과즙/.test(row.name))return 'juice';
   if(['음료류','차류'].includes(group))return 'other-drink';
  }
  return 'review';
 }
 function groups(category){return [...(definitions[category]||[]),['review','분류 확인 필요']];}
 function label(category,id){return groups(category).find(x=>x[0]===id)?.[1]||'';}
 function riceFields(row){const f=String(row.name||'').split(',').map(x=>x.trim());return {type:['멥쌀','찹쌀'].includes(f[0])?f[0]:'',part:f[1]||'세부 표기 없음'};}
 const gradeOptions=[['1++','1++등급'],['1+','1+등급'],['1','1등급'],['2','2등급'],['3','3등급'],['other','기타 등급'],['unmarked','등급 미표기']];
 function beefGrade(row){const name=String(row.name||''),match=name.match(/(?:^|[\s(,])(1\+\+|1\+|1|2|3)\s*등급/);return match?match[1]:/등급/.test(name)?'other':'unmarked';}
 const cuts={beef:['갈비','등심','목심','사태','설도','안심','앞다리','양지','우둔','채끝'],pork:['갈비','뒷다리','등심','목심','사태','삼겹살','안심','앞다리']};
 const cooked=/^(?:생것|삶은것|데친것|구운것(?:\(팬\))?|찐것|튀긴것|볶은것|말린것|냉동|끓인것|조린것|삶아서 말린것|데쳐서 말린것)$/;
 function meatFields(row,subcategory,grade=''){
  const fields=String(row.name||'').split(',').map(x=>x.trim()).filter(Boolean),detail=fields.slice(1).filter(x=>!cooked.test(x));
  const cut=detail.find(x=>(cuts[subcategory]||[]).includes(x.split('(')[0].trim()));
  const type=cut?cut.split('(')[0].trim():'기타·부위 미표기',remaining=[];
  if(!['소고기','돼지고기'].includes(fields[0]))remaining.push(fields[0]);
  for(let value of detail){
   if(value===cut){const inner=value.match(/^[^(]+\((.*)\)$/)?.[1];if(inner&&inner!==type)remaining.push(inner);continue;}
   if(subcategory==='beef'&&grade&&grade!=='other'&&grade!=='unmarked')value=value.replace(/\((?:1\+\+|1\+|1|2|3)\s*등급\)/g,'').trim();
   if(value)remaining.push(value);
  }
  return {type,part:remaining.join(' · ')||'기본 자료 · 추가 구분 미표기'};
 }
 // Exact original descriptors or their explicit parent/parenthesized cut labels only.
 function hierarchyFields(row,category,subcategory,context={}){
  if(category==='grain'&&subcategory==='rice')return riceFields(row);
  if(category==='meat'&&['beef','pork'].includes(subcategory))return meatFields(row,subcategory,context.grade||'');
  const fields=String(row.name||'').split(',').map(x=>x.trim()).filter(Boolean);
  const detail=fields.slice(1).filter(x=>!cooked.test(x));
  return {type:fields[0]||'이름 미표기',part:detail.join(' · ')||'기본 자료 · 추가 구분 미표기'};
 }
 window.SmartNFIngredientSubcategories={groups,classify,label,riceFields,hierarchyFields,beefGrade,gradeOptions,meatFields};
})();
