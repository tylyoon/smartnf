const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.join(__dirname,'../../main/resources/static/js');global.window=global;
for(const file of ['food-categories','food-identity','ingredient-subcategories'])vm.runInThisContext(fs.readFileSync(path.join(root,file+'.js'),'utf8'));
const U=SmartNFIngredientSubcategories,C=SmartNFFoodCategories,b=path.join(root,'data/food-nutrition'),m=JSON.parse(fs.readFileSync(path.join(b,'manifest.json'))),rows=JSON.parse(fs.readFileSync(path.join(b,m.version,'rda_10_4-index.json'))).filter(r=>SmartNFFoodIdentity.kind(r)==='ingredient');
test('every existing ingredient remains in exactly one valid subcategory without mutating source',()=>{
 assert.equal(rows.length,1989);const before=JSON.stringify(rows),counts={};for(const row of rows){const category=C.category('rda_10_4',row.group),id=U.classify(row,category);assert.ok(U.groups(category).some(x=>x[0]===id));counts[category+':'+id]=(counts[category+':'+id]||0)+1;}assert.equal(JSON.stringify(rows),before);assert.equal(Object.values(counts).reduce((a,b)=>a+b,0),1989);assert.equal(counts['grain:rice'],91);assert.equal(counts['seafood:fish'],307);
});
test('rice excludes noodles/flour and rice oats/barley; cultivar Hangaru remains rice',()=>{
 const r=name=>({name,group:'곡류 및 그 제품'});for(const name of ['멥쌀, 백미, 한가루, 생것','찹쌀, 백미, 생것'])assert.equal(U.classify(r(name),'grain'),'rice');assert.equal(U.classify(r('멥쌀, 백미, 가루'),'grain'),'flour');assert.equal(U.classify(r('귀리, 쌀귀리, 도정, 생것'),'grain'),'barley-wheat-oat');assert.equal(U.classify(r('보리, 쌀보리, 생것'),'grain'),'barley-wheat-oat');assert.equal(U.classify(r('멥쌀 국수, 말린것'),'grain'),'review');
});
test('parts and source groups prevent cross-category keyword mistakes',()=>{
 assert.equal(U.classify({name:'무, 잎, 생것',group:'채소류'},'vegetable'),'leaf');assert.equal(U.classify({name:'고구마, 줄기, 생것',group:'채소류'},'vegetable'),'stem-flower');assert.equal(U.classify({name:'시금치, 뿌리, 생것',group:'채소류'},'vegetable'),'root');assert.equal(U.classify({name:'백합, 생것',group:'채소류'},'vegetable'),'review');assert.equal(U.classify({name:'백합, 생것',group:'어패류 및 그 제품'},'seafood'),'shellfish');assert.equal(U.classify({name:'미확인 이름',group:'채소류'},'vegetable'),'review');
});
test('rice hierarchy uses exact source type/part and preserves the full 91-record partition',()=>{
 const rice=rows.filter(r=>C.category('rda_10_4',r.group)==='grain'&&U.classify(r,'grain')==='rice'),counts={};
 for(const row of rice){const {type,part}=U.riceFields(row);counts[type+':'+part]=(counts[type+':'+part]||0)+1;}
 assert.deepEqual(counts,{'멥쌀:백미':39,'멥쌀:쌀눈':1,'멥쌀:칠분도미':1,'멥쌀:현미':35,'찹쌀:백미':7,'찹쌀:현미':8});assert.equal(Object.values(counts).reduce((a,b)=>a+b,0),91);
});
test('every ingredient subgroup has two source-backed detail levels with no missing or duplicate IDs',()=>{
 const buckets=new Map();for(const row of rows){const c=C.category('rda_10_4',row.group),sub=U.classify(row,c),f=U.hierarchyFields(row,c,sub);assert.ok(f.type&&f.part);const key=JSON.stringify([c,sub,f.type,f.part]);if(!buckets.has(key))buckets.set(key,[]);buckets.get(key).push(row.id);if(!(c==='grain'&&sub==='rice')&&!(c==='meat'&&['beef','pork'].includes(sub))){assert.equal(f.type,row.name.split(',')[0].trim());if(!f.part.startsWith('기본 자료'))for(const descriptor of f.part.split(' · '))assert.ok(row.name.split(',').map(x=>x.trim()).includes(descriptor));}}
 const ids=[...buckets.values()].flat();assert.equal(ids.length,1989);assert.equal(new Set(ids).size,1989);
 assert.deepEqual(U.hierarchyFields({name:'갈치, 생것'},'seafood','fish'),{type:'갈치',part:'기본 자료 · 추가 구분 미표기'});
 assert.deepEqual(U.hierarchyFields({name:'소고기, 한우, 갈비, 생것'},'meat','beef'),{type:'갈비',part:'한우'});
});

test('beef grades partition source codes and never merge plus grades or guess missing grade',()=>{
 const beef=rows.filter(r=>C.category('rda_10_4',r.group)==='meat'&&U.classify(r,'meat')==='beef'),counts={};for(const r of beef)counts[U.beefGrade(r)]=(counts[U.beefGrade(r)]||0)+1;
 assert.deepEqual(counts,{'1++':45,'1+':45,'1':45,'2':45,'3':10,unmarked:27});assert.equal(beef.length,217);
 assert.equal(U.beefGrade({name:'소고기, 한우(11등급), 생것'}),'other');assert.equal(U.beefGrade({name:'소고기, 한우, 생것'}),'unmarked');
});
test('meat cuts narrow groups while retaining subcuts, origins and all source IDs',()=>{
 for(const sub of ['beef','pork']){const meat=rows.filter(r=>C.category('rda_10_4',r.group)==='meat'&&U.classify(r,'meat')===sub),groups=new Map();for(const r of meat){const grade=sub==='beef'?U.beefGrade(r):'',f=U.hierarchyFields(r,'meat',sub,{grade});assert.ok(f.type&&f.part);const key=JSON.stringify([grade,f.type,f.part]);if(!groups.has(key))groups.set(key,[]);groups.get(key).push(r.id);}assert.equal(new Set([...groups.values()].flat()).size,meat.length);assert.equal(meat.length,sub==='beef'?217:44);}
 const r={name:'소고기, 한우(1등급), 갈비(꽃갈비), 생것'};assert.deepEqual(U.hierarchyFields(r,'meat','beef',{grade:'1'}),{type:'갈비',part:'한우 · 꽃갈비'});assert.ok(U.hierarchyFields(r,'meat','beef').part.includes('1등급'));
 assert.deepEqual(U.hierarchyFields({name:'돼지 부산물, 간, 생것'},'meat','pork'),{type:'기타·부위 미표기',part:'돼지 부산물 · 간'});
});
