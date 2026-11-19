const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('src/main/resources/static/js/health-api.js','utf8');
(async()=>{
 const calls=[],signals=[],data=new Map([['smartnf.health-profile.v1','private'],['unrelated','keep']]);
 const window={},document={querySelector(selector){if(selector.includes('header['))return {dataset:{accountKey:'member:7'}};return {content:selector.includes('_csrf_header')?'X-CSRF-TOKEN':'token'};}};
 let code=200,payload={profile:null};
 class Channel{postMessage(value){signals.push(value)}}
 const fetch=async(url,options)=>{calls.push({url,options});return {ok:code===200,status:code,headers:{get:()=> 'application/json'},json:async()=>payload};};
 const sessionStorage={removeItem:key=>data.delete(key)};
 vm.runInNewContext(source,{window,document,fetch,sessionStorage,BroadcastChannel:Channel,AbortController,setTimeout,clearTimeout});
 const api=window.SmartNFHealthAPI;await api.request('/profile');assert.equal(calls[0].options.method,'GET');assert.equal(calls[0].options.headers['X-SmartNF-Account'],'member:7');
 await api.request('/profiles',{requestId:'same-retry-id'});assert.equal(calls[1].options.headers['X-CSRF-TOKEN'],'token');assert.equal(JSON.parse(calls[1].options.body).requestId,'same-retry-id');
 code=409;payload={message:'changed'};await assert.rejects(api.request('/profile'),e=>e.status===409&&e.message==='changed');
 api.clear();assert.equal(data.has('smartnf.health-profile.v1'),false);assert.equal(data.get('unrelated'),'keep');api.broadcast();assert.deepEqual(signals,['revalidate']);
 console.log('PASS: API CSRF/account preconditions, error status, value-free consent signals and scoped cache clearing.');
})().catch(error=>{console.error(error);process.exitCode=1});
