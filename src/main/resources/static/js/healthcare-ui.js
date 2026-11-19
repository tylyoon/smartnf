'use strict';
(()=>{
 function start(){
  const pages=[['info','건강정보','상태 확인·관리항목 선택'],['foods','식재료·식품 영양정보','직접 검색·영양 확인'],['recommendations','건강별 식품 선택 가이드','관리조건에 따른 추가 선택'],['diet','건강 식생활 관리 가이드','장보기·조리하기·외식하기']];
  const key=location.pathname.replace(/\/$/,'').split('/').pop();
  const current=pages.findIndex(p=>p[0]===key),main=document.querySelector('main');
  if(current<0||!main||document.querySelector('.hc-workspace'))return;
  document.body.classList.add('hc-page');
  const E=(tag,text,cls)=>{const n=document.createElement(tag);if(text)n.textContent=text;if(cls)n.className=cls;return n;};
  const host=main.querySelector(':scope > .container')||main;
  const nav=E('nav',null,'hc-workspace');nav.setAttribute('aria-label','헬스케어 서비스');
  const intro=E('div',null,'hc-workspace-title');intro.append(E('strong','헬스케어'),E('span','필요한 서비스부터 이용하세요.'));nav.append(intro);
  const links=E('div',null,'hc-service-links');
  pages.forEach(([route,title,note],i)=>{const a=E('a');a.href='/preview/health/'+route;if(i===current)a.setAttribute('aria-current','page');a.append(E('span',title),E('small',note));links.append(a);});nav.append(links);
  // Remove only duplicate service navigation; keep the in-page state/result/guide tabs.
  for(const old of host.querySelectorAll('.fn-tabs,.health-tabs,nav[aria-label="건강 식생활 서비스"]')){
   const routes=new Set([...old.querySelectorAll('a[href]')].map(a=>a.getAttribute('href')?.replace(/\/$/,'')));
   if(pages.every(([route])=>routes.has('/preview/health/'+route)))old.remove();
  }
  // Normalize differing original breadcrumb classes before placing the shared header.
  for(const old of host.querySelectorAll('[class*="breadcrumb"],nav[aria-label="현재 위치"]'))old.remove();
  const breadcrumb=E('nav',null,'hc-breadcrumb');breadcrumb.setAttribute('aria-label','현재 위치');
  const home=E('a','홈');home.href='/';const health=E('a','헬스케어');health.href='/preview/health';
  const here=E('span',key==='info'?'건강관리':pages[current][1]);here.setAttribute('aria-current','page');
  const slash=()=>{const n=E('span','/');n.setAttribute('aria-hidden','true');return n;};
  breadcrumb.append(home,slash(),health,slash(),here);host.prepend(breadcrumb);breadcrumb.after(nav);
  const hero=host.querySelector('.fn-hero');if(hero)hero.classList.add('hc-compact-hero');
  const summary=E('aside',null,'hc-state-summary');summary.setAttribute('aria-label','현재 선택과 저장 상태');
  const values=E('div',null,'hc-state-values'),note=E('p',document.querySelector('#health-db-bootstrap')?'건강정보 확정 시 MyPage 계정 저장 · 수정 후 다시 확정하세요.':'같은 탭 임시 보관 · 로그인 계정 저장 전','hc-storage-note');summary.append(values,note);nav.after(summary);
  function refresh(){values.replaceChildren();const cards=[];
   try{const p=window.SmartNFHealthProfile?.read();cards.push(['건강정보',p?(p.demo?'예시 확정본':'확정본 있음'):'확정 전']);}catch{cards.push(['건강정보','저장 상태 확인 필요']);}
   const F=window.SmartNFFoodFlow;
   try{const c=window.SmartNFCareState?.read()||F?.care();cards.push(['확정 관리항목',(c?.items?.length||0)+'개']);}catch{cards.push(['확정 관리항목','상태 확인 필요']);}
   if(F){try{cards.push(['임시 선택',(F.selection()?.items?.length||0)+'개']);}catch{cards.push(['식품 선택','상태 확인 필요']);}}
   const reg=window.SmartNFFoodRegistration;
   if(reg){try{cards.push(['추가 확정',(reg.read()?.items?.length||0)+'개']);}catch{cards.push(['추가 확정','상태 확인 필요']);}}
   for(const [label,value]of cards){const item=E('div');item.append(E('span',label),E('strong',value));values.append(item);}
  }
  refresh();['smartnf-health-confirmed','smartnf-food-selection','smartnf-food-registration','smartnf-allergy-change','smartnf-care-change'].forEach(name=>window.addEventListener(name,refresh));
  // Local navigation uses existing headings; it never changes their IDs or moves forms.
  const jump=E('nav',null,'hc-section-links');jump.setAttribute('aria-label','이 페이지 바로가기');
  function sections(){jump.replaceChildren();const headings=[...host.querySelectorAll('h2')].filter(h=>!h.closest('[hidden],details:not([open]),.hc-workspace,.hc-state-summary'));const seen=new Set();
   for(const h of headings){const text=h.textContent.trim();if(!text||seen.has(text)||jump.children.length>=6)continue;seen.add(text);const b=E('button',text);b.type='button';b.addEventListener('click',()=>{h.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});const previous=h.getAttribute('tabindex');h.setAttribute('tabindex','-1');h.focus({preventScroll:true});h.addEventListener('blur',()=>{if(previous===null)h.removeAttribute('tabindex');else h.setAttribute('tabindex',previous);},{once:true});});jump.append(b);}
   jump.hidden=jump.children.length<2;
  }
  (hero||summary).after(jump);sections();
  let timer;new MutationObserver(records=>{if(records.every(r=>jump.contains(r.target)||summary.contains(r.target)||nav.contains(r.target)))return;clearTimeout(timer);timer=setTimeout(()=>{refresh();sections();},120);}).observe(host,{childList:true,subtree:true,attributes:true,attributeFilter:['hidden','open']});
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
