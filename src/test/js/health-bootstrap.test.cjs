const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const bootstrap=fs.readFileSync('src/main/resources/static/js/health-account-bootstrap.js','utf8');
const profile=fs.readFileSync('src/main/resources/static/js/health-profile.js','utf8');
function run({review=false,empty=false,blocked=false}={}){
 const data=new Map([['smartnf.health-profile.v1','old-health'],['smartnf.food-guide-context.v1','old-care'],['unrelated','keep']]);
 const root={dataset:empty?{agreed:'false'}:{profileId:'12',careId:'13',careReview:String(review)},querySelectorAll(selector){
  if(selector==='[data-db-field]')return [{name:'diagnosed_1',value:'2020-05',dataset:{kind:'month'}},{name:'weight',value:'70',dataset:{kind:'number'}}];
  return [{dataset:{dbAction:'balanced'},querySelectorAll(){return [{value:'bp'},{value:'bmi'}]}}];
 }};
 const document={querySelector:s=>s==='#health-db-bootstrap'?root:null};
 const sessionStorage={getItem:k=>data.get(k)||null,setItem(k,v){if(blocked)throw Error('blocked');data.set(k,v)},removeItem(k){if(blocked)throw Error('blocked');data.delete(k)}};
 const window={};const context=vm.createContext({document,window,sessionStorage,Date});vm.runInContext(bootstrap,context);vm.runInContext(profile,context);return {data,root,window};
}
const restored=run(),saved=restored.window.SmartNFHealthProfile.read();assert.equal(saved.demo,false);
assert.equal(saved.fields.find(f=>f.name==='diagnosed_1').kind,'month');assert.equal(saved.fields.find(f=>f.name==='diagnosed_1').values[0],'2020-05');
assert.equal(saved.fields.find(f=>f.name==='conditions').values.length,0);assert.equal(JSON.parse(restored.data.get('smartnf.food-guide-context.v1')).items[0].scopes.length,2);
assert.equal(restored.data.get('unrelated'),'keep');assert.equal(run({review:true}).data.has('smartnf.food-guide-context.v1'),false);
const empty=run({empty:true});assert.equal(empty.data.has('smartnf.health-profile.v1'),false);assert.equal(empty.data.has('smartnf.food-guide-context.v1'),false);
assert.equal(run({blocked:true}).root.dataset.failed,'true');
console.log('PASS: month/empty-condition server restoration, multi-scope care, stale-care exclusion, consent-empty and storage failure.');
