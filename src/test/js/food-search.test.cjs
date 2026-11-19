const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const dir=path.join(__dirname,'../../main/resources/static/js');vm.runInThisContext(fs.readFileSync(path.join(dir,'food-search.js'),'utf8'));const S=global.SmartNFFoodSearch;
test('reviewed aliases and whitespace match without rewriting source identity',()=>{
 const row={id:'a',name:'달걀, 삶은것'};assert.ok(S.matches(row,'계란'));assert.ok(S.matches(row,'달 걀'));assert.equal(row.name,'달걀, 삶은것');assert.ok(S.matches({name:'갈치, 생것'},'칼치'));assert.ok(S.matches({name:'닭고기, 가슴, 생것'},'닭 가슴살'));assert.ok(!S.matches({name:'계란덮밥'},'달걀 삶은것'));
});
test('Hangul typo suggestions require user choice and do not force ambiguous matches',()=>{
 assert.ok(S.suggestions([{name:'고등어, 생것'},{name:'갈치, 생것'}],'고등아').includes('고등어'));assert.equal(S.distance('고등아','고등어'),1);assert.deepEqual(S.suggestions([{name:'고등어'}],'우'),[]);assert.deepEqual(S.suggestions([{name:'고등어'}],'완전히없는긴식품명'),[]);
});
test('preparation derives only visible name labels; unspecified remains unknown',()=>{
 assert.equal(S.preparation({name:'달걀, 삶은것'}),'boiled');assert.equal(S.preparation({name:'갈치구이'}),'grilled');assert.equal(S.preparation({name:'우유'}),'unknown');assert.equal(S.preparation({name:'닭고기, 생것'}),'raw');
});
