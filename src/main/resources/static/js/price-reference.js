import {setReference,koreaTime} from './price-budget.js?actions267';
import {api,element} from './food-studio-core.js';
const $=id=>document.getElementById(id),money=n=>Number(n).toLocaleString('ko-KR',{maximumFractionDigits:0})+'원';
let epoch=0,timer;
function changed(name,grams,result){setReference(name,grams,result,$('purchase-unit')?.value||'g');window.dispatchEvent(new Event('smartnf:reference-ready'));}
const source=p=>p==='KAMIS'?'KAMIS 소매 조사':'참가격 판매점 조사';
export function sellerLinks(root,name){
 root.replaceChildren();const q=(name||'').split(',')[0].trim();
 const providers=[['네이버 쇼핑','https://search.shopping.naver.com/search/all?query='+encodeURIComponent(q)],['쿠팡','https://www.coupang.com/np/search?q='+encodeURIComponent(q)],['SSG','https://www.ssg.com/search.ssg?query='+encodeURIComponent(q)],['트레이더스몰','https://traders.ssg.com/search.ssg?query='+encodeURIComponent(q)],['코스트코 온라인몰','https://www.costco.co.kr/search?text='+encodeURIComponent(q)],['컬리','https://www.kurly.com/search?sword='+encodeURIComponent(q)],['다나와에서 비교','https://search.danawa.com/?query='+encodeURIComponent(q)],['에누리에서 비교','https://price.enuri.com/search?keyword='+encodeURIComponent(q)],['오아시스 상품 보기','https://www.oasis.co.kr/product/search?keyword='+encodeURIComponent(q)],['이마트몰 상품 보기','https://emart.ssg.com/search.ssg?query='+encodeURIComponent(q)],['롯데마트 제타 상품 보기','https://lottemartzetta.com/search?q='+encodeURIComponent(q)],['홈플러스 온라인 상품','https://mfront.homeplus.co.kr/search?keyword='+encodeURIComponent(q)],['롯데마트 매장 전단','https://www.mlotte.net/'],['홈플러스 매장 전단','https://m.my.homeplus.co.kr/leaflet']];
 for(const [label,url] of providers){const a=element('a');const logo=element('img'),text=element('span',label),origin=url.split('/').slice(0,3).join('/');logo.src=origin+'/favicon.ico';logo.alt='';logo.width=40;logo.height=40;logo.loading='lazy';logo.referrerPolicy='no-referrer';logo.addEventListener?.('error',()=>{logo.hidden=true;});a.append(logo,text);a.href=q?url:origin+'/';a.target='_blank';a.rel='noopener noreferrer';root.append(a);}
}
export async function refreshReference(){
 const root=$('price-reference-results');if(!root)return;const token=++epoch,name=$('purchase-name').value,grams=$('purchase-needed').value,unit=$('purchase-unit')?.value||'g';
 changed(name,grams,null);sellerLinks($('purchase-seller-links'),name);root.replaceChildren();$('price-reference-status').textContent='수집된 판매상품을 확인하고 있습니다…';
 if(!name.trim()||!(Number(grams)>0)){ $('price-reference-status').textContent='비교할 재료와 필요량을 입력하면 판매상품을 확인할 수 있습니다.';return;}
 try{
  const result=await api('/api/me/price-reference?query='+encodeURIComponent(name)+'&grams='+encodeURIComponent(grams)+'&unit='+encodeURIComponent(unit));if(token!==epoch)return;
  sellerLinks($('purchase-seller-links'),result.searchName||name);const search=$('product-search-query');if(search&&search.value===name.split(',')[0])search.value=result.searchName||search.value;
  $('price-reference-status').textContent='수집된 판매상품 '+(result.market||[]).length+'개 · 포장가격·동일 단위당 가격을 비교하세요. KAMIS·참가격 예상금액은 내 장보기에서 확인할 수 있습니다.';changed(name,grams,null);
  for(const p of result.market||[]){
   const card=element('article',undefined,'purchase-card'),quantity=p.surveyAmount??p.surveyGrams;
   card.append(element('strong','정기수집 판매상품 · '+p.provider+' · '+p.name),element('p',p.merchant+' · 판매포장 가격 '+money(p.price)+' · 규격 '+(quantity==null?'미확인':quantity+p.unit)),element('p',p.unitPrice==null?'단위당 가격: 규격 확인 필요':(['g','ml'].includes(p.unit)?'100':'1')+({ea:'개',pack:'팩',bag:'봉',bottle:'병'}[p.unit]||p.unit)+'당 '+money(p.unitPrice)+' · 동일 단위·식품·조건끼리 비교'));
   if(p.estimated!=null)card.append(element('p','필요량 '+grams+unit+' 예상비용 '+money(p.estimated)+' · 이 상품 구매 시 '+p.packs+'개 / '+money(p.purchaseAmount)+' · 잔량 '+p.leftover+p.unit));
   else card.append(element('p','필요량 계산 보류: '+p.comparisonReason));
   card.append(element('p','가격 확인 상태 '+p.verificationStatus+(p.stale?' · 오래된 가격':'')+' · 수집 '+koreaTime(p.checkedAt)),element('p','검토 사유: '+(p.verificationReason||'분석 결과 또는 가격 조건 확인 필요')),element('p',p.conditions),element('p','배송비·쿠폰·최종 가격은 판매처 확인 · 아직 선택한 상품이 아닙니다.'));
   const link=element('a','판매처에서 상품 확인');link.href=p.sourceUrl;link.target='_blank';link.rel='noopener noreferrer';card.append(link);
   const button=element('button','이 상품명으로 조회·선택');button.type='button';button.addEventListener('click',()=>{const input=$('product-search-query');if(input){input.value=p.name.slice(0,100);input.dispatchEvent(new Event('input',{bubbles:true}));input.focus();}const provider=$('product-search-provider');if(provider)provider.value=p.provider;$('product-search-button')?.click();});card.append(button);root.append(card);
  }
  if(!(result.market||[]).length)root.append(element('p','정기 판매자료 없음 · 수집 대기·검색결과 없음·접근 제한 여부는 수집 상태를 확인하세요.'));

 }catch(e){if(token===epoch)$('price-reference-status').textContent='판매상품 자료를 확인하지 못했습니다. '+e.message;}
}
for(const id of ['purchase-name','purchase-needed','purchase-unit'])$(id)?.addEventListener('input',()=>{clearTimeout(timer);timer=setTimeout(refreshReference,300);});
window.addEventListener('smartnf:shopping-item-ready',refreshReference);
if(new URLSearchParams(location.search).get('view')==='compare')refreshReference();

async function collectionStatus(){
 const panel=$('product-search-panel');if(!panel?.prepend)return;
 const p=element('p','정기 수집: 10:00 조사자료 · 10:10 참가격 · 10:20 판매가격, 늦게 실행하면 누락분 재개');panel.prepend(p);
 try{
  const s=await api('/api/me/price-reference/status'),today=new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Seoul'}).format(new Date()),jobs=(s.jobs||[]).filter(j=>j.day===today);
  const done=jobs.filter(j=>j.state==='DONE'&&!['KAMIS','CHAMPRICE','GEMINI'].includes(j.provider)).reduce((n,j)=>n+j.count,0),failed=jobs.filter(j=>j.state==='FAILED').reduce((n,j)=>n+j.count,0);
  const immediate=(s.runTotals||[]).filter(r=>r.day===today&&r.mode==='IMMEDIATE'),immediateDone=immediate.filter(r=>r.state==='DONE').reduce((n,r)=>n+r.count,0),immediateFailed=immediate.filter(r=>r.state==='FAILED').reduce((n,r)=>n+r.count,0);
  p.textContent+=' · 오늘 정기 판매작업 완료 '+done+'건 · 정기 작업 실패(분류·조사 포함) '+failed+'건 · 오늘 즉시 수집 성공 '+immediateDone+'회 / 실패 '+immediateFailed+'회 · 저장 상품 '+(s.offers||[]).reduce((n,x)=>n+x.count,0)+'개 · 기록 갱신 '+koreaTime(s.updatedAt)+' · 분석 상태 '+(s.analysis||[]).map(a=>a.state+':'+a.count).join(', ');
  if((s.runTotals||[]).some(r=>r.mode==='UNKNOWN'))p.textContent+=' · 이전 실행은 유형 미기록';
  for(const f of s.failures||[])panel.prepend(element('p',f.day+' · '+f.provider+' · '+(f.query||'분류/조사')+' · '+f.message));
  for(const r of (s.recentRuns||[]).slice(0,7))panel.prepend(element('p',({SCHEDULED:'정기',IMMEDIATE:'즉시',UNKNOWN:'이전 실행·유형 미기록'}[r.mode]||'이전 실행·유형 미기록')+' · '+r.provider+' · '+r.query+' · '+r.state+' · 반환 '+r.fetched+' / 저장 처리 '+r.saved+' · '+koreaTime(r.finished)+(r.message?' · '+r.message:'')));
 }catch{p.textContent+=' · 실행 기록 조회 실패';}
}
if(new URLSearchParams(location.search).get('view')==='compare')collectionStatus();
