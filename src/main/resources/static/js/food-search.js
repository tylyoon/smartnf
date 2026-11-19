'use strict';
(function(scope){
 // Reviewed search aliases only. Codes, cooking state and nutrient records are never rewritten.
 const aliases=[['계란','달걀'],['칼치','갈치'],['닭가슴살','닭고기 가슴'],['닭고기가슴살','닭고기 가슴']];
 const norm=s=>String(s||'').normalize('NFKC').toLowerCase().replace(/\s+/g,'');
 function canonical(s){return String(s||'').normalize('NFKC').toLowerCase().replaceAll('계란','달걀').replaceAll('칼치','갈치');}
 function query(s){const raw=String(s||'').trim(),alias=aliases.find(([a])=>norm(a)===norm(raw));return alias?alias[1]:canonical(raw);}
 function matches(row,s){const q=query(s),name=norm(canonical(row.name));return !q||name.includes(norm(q))||q.split(/\s+/).filter(Boolean).every(w=>name.includes(norm(w)));}
 function rank(row,s){const q=norm(query(s)),name=norm(canonical(row.name)),primary=name.split(',')[0];return !q?0:name===q?0:primary===q?1:name.startsWith(q)?2:3;}
 const preparations=[['raw','생것',/생것/],['boiled','삶은 것',/삶은것|삶아서/],['blanched','데친 것',/데친것/],['grilled','구이·구운 것',/구운것|구이/],['steamed','찜·찐 것',/찐것|찜/],['fried','튀김·튀긴 것',/튀긴것|튀김/],['stirfried','볶음·볶은 것',/볶은것|볶음/],['dried','말린 것',/말린것/],['frozen','냉동',/냉동/]];
 function preparation(row){return preparations.find(([,label,re])=>re.test(String(row.name)))?.[0]||'unknown';}
 const prepLabel=Object.fromEntries([...preparations.map(([id,label])=>[id,label]),['unknown','기타·상태 미표기']]);
 function distance(a,b){a=norm(a).normalize('NFD');b=norm(b).normalize('NFD');let prev=Array.from({length:b.length+1},(_,i)=>i);for(let i=1;i<=a.length;i++){const next=[i];for(let j=1;j<=b.length;j++)next[j]=Math.min(next[j-1]+1,prev[j]+1,prev[j-1]+(a[i-1]===b[j-1]?0:1));prev=next;}return prev[b.length];}
 function suggestions(rows,input){const q=query(input);if(norm(q).length<2||norm(q).length>12)return [];const limit=norm(q).length<3?1:2;
  return [...new Set(rows.map(r=>String(r.name).split(',')[0].trim()))].filter(n=>norm(n).length>=2&&norm(n).length<=12&&Math.abs(norm(n).length-norm(q).length)<=1).map(name=>({name,distance:distance(canonical(name),q)})).filter(x=>x.distance>0&&x.distance<=limit).sort((a,b)=>a.distance-b.distance||a.name.localeCompare(b.name,'ko')).slice(0,3).map(x=>x.name);
 }
 scope.SmartNFFoodSearch={norm,canonical,query,matches,rank,preparation,prepLabel,suggestions,distance,aliases};
})(typeof window==='undefined'?globalThis:window);
