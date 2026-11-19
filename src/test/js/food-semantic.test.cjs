const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const dir=path.join(__dirname,'../../main/resources/static/js'),base=path.join(dir,'data/food-nutrition');global.window=global;for(const name of ['food-search','food-identity','food-semantic'])vm.runInThisContext(fs.readFileSync(path.join(dir,name+'.js'),'utf8'));
const manifest=JSON.parse(fs.readFileSync(path.join(base,'manifest.json'))),rows=Object.values(manifest.sources).flatMap(s=>JSON.parse(fs.readFileSync(path.join(base,manifest.version,s.index)))).filter(r=>SmartNFFoodIdentity.kind(r)==='ingredient');
let calls=0;global.fetch=async(url,options)=>{calls++;assert.equal(url,'/js/data/food-nutrition/semantic-lsa.json');assert.ok(!options.body);return {ok:true,json:async()=>JSON.parse(fs.readFileSync(path.join(base,'semantic-lsa.json')))};};
test('local embedding retrieves a source-backed chicken breast and respects allowed IDs',async()=>{
 const found=await SmartNFFoodSemantic.search('닭 가슴 부위',rows,manifest.version);assert.ok(found.length>0);assert.ok(found.every(x=>x.row.name.includes('닭')&&x.row.name.includes('가슴')));assert.ok(found.every(x=>rows.some(r=>r.id===x.row.id)));
 assert.deepEqual(await SmartNFFoodSemantic.search('닭 가슴 부위',rows.filter(r=>!r.name.includes('닭')),manifest.version),[]);
 assert.deepEqual(await SmartNFFoodSemantic.search('존재하지않는어쩌구',rows,manifest.version),[]);assert.equal(calls,1);
 await assert.rejects(()=>SmartNFFoodSemantic.search('닭 가슴 부위',rows,'wrong-version'));
});
