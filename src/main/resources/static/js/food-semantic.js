'use strict';
(()=>{
 let pending;
 function floats(s){const bytes=Uint8Array.from(atob(s),c=>c.charCodeAt(0));if(bytes.byteLength%4)throw Error('Invalid vector');const data=new DataView(bytes.buffer),out=new Float32Array(bytes.length/4);for(let i=0;i<out.length;i++){out[i]=data.getFloat32(i*4,true);if(!Number.isFinite(out[i]))throw Error('Invalid number');}return out;}
 async function model(version){
  if(!pending)pending=fetch('/js/data/food-nutrition/semantic-lsa.json',{credentials:'same-origin',cache:'no-cache'}).then(r=>{if(!r.ok)throw Error('Unavailable');return r.json();}).then(m=>{
   if(m.method!=='LSA-TFIDF-char-1-3'||m.dimensions!==96||!Array.isArray(m.ids)||new Set(m.ids).size!==m.ids.length)throw Error('Invalid model');
   m.idf=floats(m.idf);m.projection=floats(m.projection);m.vectors=floats(m.vectors);if(m.projection.length!==m.idf.length*96||m.vectors.length!==m.ids.length*96)throw Error('Invalid shape');return m;
  }).catch(e=>{pending=null;throw e;});
  const m=await pending;if(m.version!==version)throw Error('Version mismatch');return m;
 }
 async function search(input,rows,version){
  const S=window.SmartNFFoodSearch,stop=new Set(['식품','재료','부위','먹는','먹을','음식','관련','종류','추천','찾기','찾아줘','것','거']);
  const words=S.canonical(input).split(/\s+/).filter(w=>w&&!stop.has(w));
  const anchors=words.filter(w=>rows.some(r=>S.norm(S.canonical(r.name)).includes(S.norm(w))));
  // LSA is a local corpus model: require lexical evidence rather than return unrelated foods.
  if(!anchors.length)return [];
  const candidates=rows.filter(r=>anchors.every(w=>S.norm(S.canonical(r.name)).includes(S.norm(w))));
  const text=words.map(w=>w==='닭'?'닭고기':w).join('');
  const m=await model(version),s=S.norm(text),counts=new Map(),q=new Float32Array(96);
  for(const n of [1,2,3])for(let i=0;i+n<=s.length;i++){const token=s.slice(i,i+n),index=m.vocabulary[token];if(Number.isInteger(index)&&index>=0&&index<m.idf.length)counts.set(index,(counts.get(index)||0)+1);}
  for(const [index,count] of counts){const weight=(1+Math.log(count))*m.idf[index];for(let d=0;d<96;d++)q[d]+=weight*m.projection[index*96+d];}
  const length=Math.hypot(...q);if(length<1e-12)return [];for(let d=0;d<96;d++)q[d]/=length;
  const allowed=new Map(candidates.map(row=>[row.id,row])),scores=[];m.ids.forEach((id,i)=>{if(!allowed.has(id))return;let score=0;for(let d=0;d<96;d++)score+=q[d]*m.vectors[i*96+d];if(score>=0.4)scores.push({row:allowed.get(id),score});});
  return scores.sort((a,b)=>b.score-a.score||a.row.id.localeCompare(b.row.id)).slice(0,8);
 }
 window.SmartNFFoodSemantic={search};
})();
