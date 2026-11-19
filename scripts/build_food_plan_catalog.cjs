// Copy source IDs, classifications and raw recipe tokens; no inferred recipe or nutrients.
const fs=require('fs'),path=require('path'),vm=require('vm'),root=path.join(__dirname,'../src/main/resources/static/js'),base=path.join(root,'data');global.window=global;
vm.runInThisContext(fs.readFileSync(path.join(root,'food-identity.js'),'utf8'));
const listeners=new Map();global.addEventListener=(n,f)=>listeners.set(n,f);global.dispatchEvent=()=>{};
global.SmartNFFoodFlow={selection:()=>({items:[]}),trays:()=>{},el:()=>{}};global.SmartNFFoodDataQuality={read:async()=>JSON.parse(fs.readFileSync(path.join(base,'healthcare-quality-v1.json'))),allowed:(q,id)=>q.recipe_quality[id]?.status==='source_display_only'};
global.fetch=async()=>({ok:true,json:async()=>JSON.parse(fs.readFileSync(path.join(base,'meal-recipes/lifestyle.json')))});
vm.runInThisContext(fs.readFileSync(path.join(root,'dish-recipes.js'),'utf8'));
(async()=>{await SmartNFDishRecipes.ready();const m=JSON.parse(fs.readFileSync(path.join(base,'food-nutrition/manifest.json'))),all=[];
for(const [id,s]of Object.entries(m.sources)){if(!['rda_10_4','mfds_dishes'].includes(id))continue;for(const row of JSON.parse(fs.readFileSync(path.join(base,'food-nutrition',m.version,s.index))))all.push({...row,source:s.publisher,version:m.version});}
const guide=JSON.parse(fs.readFileSync(path.join(base,'recommendation-guide-v1.json')));for(const r of guide.foods||[])if(r.id.startsWith('mfds_recipes:'))all.push({...r,version:m.version,source:'식품안전나라 COOKRCP01 참고 원문',basis:''});
const b=s=>Buffer.from(String(s||''),'utf8').toString('base64'),rows=[];const seen=new Set();
for(const f of all){if(seen.has(f.id))throw Error('duplicate ID');seen.add(f.id);rows.push(['F',f.id,SmartNFFoodIdentity.kind(f),b(f.name),b(f.basis),b(f.source),b(f.version)].join('\t'));for(const r of SmartNFDishRecipes.candidates(f))rows.push(['L',f.id,r.recipe_id].join('\t'));}
const data=JSON.parse(fs.readFileSync(path.join(base,'meal-recipes/lifestyle.json'))),q=await SmartNFFoodDataQuality.read();for(const r of data.recipes){if(!SmartNFFoodDataQuality.allowed(q,r.recipe_id)||!r.ingredients_raw||!r.steps.length)continue;rows.push(['R',r.recipe_id,b(r.name),b(data.source_sha256),b(data.source)].join('\t'));SmartNFDishRecipes.tokens(r).forEach((t,i)=>rows.push(['T',r.recipe_id,i,b(t)].join('\t')));}
fs.writeFileSync(path.join(root,'../../food-plan-catalog.tsv'),rows.join('\n')+'\n');console.log(seen.size+' public IDs; raw recipe tokens copied');})();
