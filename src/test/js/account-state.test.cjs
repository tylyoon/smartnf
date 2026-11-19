const vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert/strict');
const code=fs.readFileSync('src/main/resources/static/js/account-state.js','utf8');
const health=['smartnf.health-profile.v1','smartnf.food-guide-context.v1','smartnf.food-selection.v1','smartnf.confirmed-foods.v1','smartnf.allergy-profile.v1','smartnf.month-recommendations.v1','smartnf.meal-journal.v1','smartnf.recipe-reference.v1'];
function run(previous,current,{blocked=false,bootstrap=false}={}){
 const data=new Map(health.map(k=>[k,'private-state']));data.set('unrelated','keep');
 if(previous!==null)data.set('smartnf.account-boundary.v1',previous);
 const events={},stats={cleared:0,bootstrap:0,reloaded:0,message:''};
 const main={replaceChildren(){stats.cleared++},append(n){stats.message=n.textContent}};
 const document={currentScript:{closest(){return {dataset:{accountKey:current}}}},querySelector(selector){return selector==='main'?main:selector==='#health-db-bootstrap'&&bootstrap?{replaceChildren(){stats.bootstrap++}}:null},createElement(){return {setAttribute(){}}}};
 const window={addEventListener(e,f){events[e]=f},location:{reload(){stats.reloaded++}}};
 const sessionStorage={getItem(k){if(blocked)throw Error('blocked');return data.get(k)||null},setItem(k,v){data.set(k,v)},removeItem(k){data.delete(k)}};
 let receiver;class Channel{addEventListener(event,handler){receiver=handler;}}
 vm.runInNewContext(code,{document,window,sessionStorage,BroadcastChannel:Channel,location:{pathname:'/health/info'}});return {data,events,stats,broadcast:()=>receiver()};
}
for(const [old,next,cleared] of [['anonymous','member:1',true],['member:1','member:2',true],['member:1','anonymous',true],['member:1','member:1',false],[null,'member:1',true],[null,'anonymous',false]]){
 const r=run(old,next);for(const key of health)assert.equal(r.data.has(key),!cleared);assert.equal(r.data.get('unrelated'),'keep');
}
const blocked=run('member:1','member:2',{blocked:true});blocked.events.DOMContentLoaded();assert.equal(blocked.stats.cleared,1);assert.match(blocked.stats.message,/정리에 실패/);
const cached=run('member:1','member:1');cached.events.pagehide({persisted:true});cached.events.pageshow({persisted:true});assert.equal(cached.stats.cleared,1);assert.equal(cached.stats.reloaded,1);
console.log('PASS: 6 account transitions, storage failure, BFCache restore; unrelated keys preserved.');

const personal=run('member:1','member:1',{bootstrap:true});personal.events.pagehide({persisted:true});assert.equal(personal.stats.bootstrap,1);assert.equal(personal.stats.cleared,1);
const revoked=run('member:1','member:1');revoked.broadcast();for(const key of health)assert.equal(revoked.data.has(key),false);assert.equal(revoked.data.get('unrelated'),'keep');assert.equal(revoked.stats.reloaded,1);console.log('PASS: private bootstrap scrubbing and cross-tab consent invalidation.');
