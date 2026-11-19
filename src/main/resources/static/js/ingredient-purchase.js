import './price-grounding.js?v=budget255';
import {scheduleShoppingBudget} from './shopping-budget.js?actions267';
import {koreaTime} from './price-budget.js?actions267';
import './product-offers.js?actions267';
import {api,element,button} from './food-studio-core.js';
import {safeSellerURL} from './purchase-comparison.js?v=purchase243';
import {purchaseCost,totalOrder} from './purchase-budget.js?actions267';
const $=id=>document.getElementById(id),quotes=[];let loading=false;
const view=new URLSearchParams(location.search).get('view')==='compare'?'compare':'shopping';
$('purchase-shopping').hidden=view!=='shopping';$('purchase-compare').hidden=view!=='compare';$('purchase-'+view+'-link').setAttribute('aria-current','page');
const today=new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Seoul'}).format(new Date());$('purchase-from').value=today.slice(0,7)+'-01';const end=new Date(today.slice(0,7)+'-01T12:00:00Z');end.setUTCMonth(end.getUTCMonth()+1);end.setUTCDate(0);$('purchase-to').value=end.toISOString().slice(0,10);
const query=new URLSearchParams(location.search);$('purchase-name').value=(query.get('ingredient')||'').slice(0,100);const amount=Number(query.get('grams'));if(Number.isFinite(amount)&&amount>0&&amount<=1e7)$('purchase-needed').value=String(amount);
async function load(){if(loading)return;loading=true;const submit=$('purchase-load').querySelector('button');submit.disabled=true;$('purchase-lists').replaceChildren();$('purchase-status').textContent='저장한 장보기 목록을 확인하고 있습니다…';try{const from=$('purchase-from').value,to=$('purchase-to').value;if(!from||!to||from>to)throw Error('조회 날짜를 확인하세요.');const response=await api('/api/me/shopping-lists?from='+encodeURIComponent(from)+'&to='+encodeURIComponent(to));for(const list of response.lists){const card=element('article',undefined,'purchase-card');card.append(element('h3',list.shoppingDate+' · '+list.items.length+'종'),element('p','식단 기간 '+list.sourceFrom+' ~ '+list.sourceTo));const ul=element('ul'),budget=element('section',undefined,'purchase-card'),slots=[];for(const [entryNo,item] of list.items.entries()){const li=element('li'),link=element('a','이 재료 가격 비교');link.href='/preview/recipes/offers?view=compare&ingredient='+encodeURIComponent(item.name)+'&grams='+encodeURIComponent(item.grams)+'&listId='+encodeURIComponent(list.id)+'&entryNo='+entryNo+'&listRevision='+list.revision;const estimate=element('p');slots.push(estimate);li.append(element('span',item.name+' · '+(item.grams>0?Number(item.grams).toLocaleString('ko-KR')+'g':(item.quantities||[]).map(q=>q.amount+({ml:'mL',ea:'개',pack:'팩',bag:'봉',bottle:'병'}[q.unit]||q.unit)).join(' / '))+' '),link,estimate);const units=element('a','필요량 단위 확인·수정');units.href='/mypage/shopping?date='+encodeURIComponent(list.shoppingDate);li.append(units);ul.append(li);}const edit=element('a','MyPage에서 목록 보기·수정 →');edit.href='/mypage/shopping?date='+encodeURIComponent(list.shoppingDate);card.append(budget,ul,edit);scheduleShoppingBudget(budget,list,slots);$('purchase-lists').append(card);}$('purchase-status').textContent=response.lists.length?response.lists.length+'개 목록입니다.'+(response.truncated?' 조회 기간을 좁히면 더 확인할 수 있습니다.':''):'이 예정일 범위에 저장된 장보기 목록이 없습니다.';}catch(error){$('purchase-status').textContent=[401,403].includes(error.status)?'로그인 후 본인의 장보기 목록을 확인할 수 있습니다.':error.message;}finally{loading=false;submit.disabled=false;}}
$('purchase-load').addEventListener('submit',e=>{e.preventDefault();load();});if(view==='shopping')load();
const unitLabel=u=>({ml:'mL',ea:'개',pack:'팩',bag:'봉',bottle:'병'}[u]||u);
const quantityUnit=()=>document.getElementById('purchase-unit')?.value||'g';
const money=n=>Math.round(n).toLocaleString('ko-KR')+'원';
function requiredFor(q){if(q.manualNeed)return Number(q.requiredAmount)>0?Number(q.requiredAmount):null;return q.quantityUnit===quantityUnit()&&Number($('purchase-needed').value)>0?Number($('purchase-needed').value):null;}
function preview(q){const needed=requiredFor(q);return {...purchaseCost(q,needed??q.grams),needsQuantity:needed==null};}
function render(){
 const option=$('purchase-sort').querySelector('option[value="unit"]');if(option)option.textContent='같은 단위끼리 단가순';const root=$('purchase-quotes');root.replaceChildren();
 try{
  let rows=quotes.map(preview);if($('purchase-discount').checked)rows=rows.filter(q=>q.discount);
  rows.sort((a,b)=>a.quantityUnit.localeCompare(b.quantityUnit)||($('purchase-sort').value==='total'?(a.needsQuantity-b.needsQuantity||totalOrder(a,b)):a.unit-b.unit));
  for(const row of rows){
   const original=quotes.find(q=>q.id===row.id),u=unitLabel(row.quantityUnit),card=element('article',undefined,'purchase-card');
   card.append(element('h3',row.name),element('p',row.merchant+' · 판매포장 '+row.grams+u+' · '+money(row.price)),element('p',(['g','ml'].includes(row.quantityUnit)?'100':'1')+u+'당 '+money(row.unit)+' · 같은 단위·같은 식품끼리 비교'),element('p',row.needsQuantity?'필요량 미확인 · 판매가격·단가만 비교합니다. '+u+' 필요량을 확인해 입력하면 구매 계산이 가능합니다.':row.packs+'포장 필요 · 상품금액 '+money(row.total)+' · 예상 잔량 '+Number(row.left.toFixed(3))+u),element('p','판매처 조회/직접 확인 '+koreaTime(row.checkedAt)));
   const need=element('input');Object.assign(need,{type:'number',min:'0.001',step:'any',value:requiredFor(row)??'',placeholder:u+' 필요량을 별도 확인'});const needLabel=element('label','확인한 필요량('+u+')');needLabel.append(need);need.addEventListener('change',()=>{const value=need.value===''?null:Number(need.value);if(value!=null&&!(value>0)){$('purchase-compare-status').textContent='필요량을 확인하세요.';return;}original.requiredAmount=value;original.manualNeed=true;render();});const quantityFields=element('div',undefined,'purchase-fields');quantityFields.append(needLabel);card.append(quantityFields);
   card.append(element('p',row.needsQuantity?'배송비 포함 총지출은 필요량 확인 후 계산합니다.':row.totalWithShipping==null?'배송비 미확인 · 총지출 미확정':'배송비 '+money(row.shippingFee)+' · 총지출 '+money(row.totalWithShipping)),element('p',row.conditions||'쿠폰·회원 조건 별도 확인'),element('p',row.delivery||'배송 조건 미확인'));
   const shipping=element('input');Object.assign(shipping,{type:'number',min:'0',step:'1',placeholder:'미확인은 빈칸',value:row.shipping??''});const shippingLabel=element('label','확인한 배송비(원) · 무료는 0');shippingLabel.append(shipping);
   const free=element('input');Object.assign(free,{type:'number',min:'1',step:'1',value:row.freeFrom??''});const freeLabel=element('label','무료배송 기준 상품금액(원)');freeLabel.append(free);
   for(const [field,key]of [[shipping,'shipping'],[free,'freeFrom']])field.addEventListener('change',()=>{try{preview({...original,[key]:field.value});original[key]=field.value;render();}catch(error){$('purchase-compare-status').textContent=error.message;}});const deliveryFields=element('div',undefined,'purchase-fields');deliveryFields.append(shippingLabel,freeLabel);card.append(deliveryFields);
   if(row.conditionalTotal!=null&&!row.needsQuantity)card.append(element('p','조건부 상품금액 '+money(row.conditionalTotal)+' · '+row.conditions));
   const actions=element('div',undefined,'product-actions'),feedback=element('p',undefined,'purchase-save-feedback');feedback.setAttribute('role','status');feedback.setAttribute('aria-live','polite');
   let busy=false;
   if(row.onSave){const confirm=element('input');confirm.type='checkbox';const label=element('label',undefined,'purchase-confirm');label.append(confirm,element('span','상품 구성·단위·구매 개수를 확인했습니다'));const save=button('이 상품 선택·저장',async()=>{
    if(busy)return;
    if(row.needsQuantity){feedback.textContent='상품 단위의 필요량을 먼저 확인해 입력하세요.';return;}
    if(!confirm.checked){feedback.textContent='상품 구성을 확인하고 체크하세요.';return;}
    busy=true;save.disabled=true;feedback.textContent='선택한 상품을 저장하고 있습니다…';
    try{const result=await row.onSave(row.packs,save,requiredFor(row));feedback.textContent=result===false?'저장하지 못했습니다. 상단의 선택 상품 상태에서 오류를 확인하세요.':'선택 상품을 저장했습니다. 내 장보기로 돌아가 새로고침하면 구매금액을 확인할 수 있습니다.';}
    catch(error){feedback.textContent=error.message;}
    finally{busy=false;save.disabled=row.needsQuantity||!confirm.checked;}
   });
   const sync=()=>{save.disabled=busy||row.needsQuantity||!confirm.checked;feedback.textContent=row.needsQuantity?'상품 단위의 필요량을 먼저 입력하세요.':confirm.checked?'확인 완료 · 선택·저장 버튼을 누르세요.':'위 확인란을 체크하면 선택·저장할 수 있습니다.';};confirm.addEventListener('change',sync);sync();card.append(label,feedback);actions.append(save);
   }else card.append(element('p','구매상품 저장은 장보기 재료에서 연결한 실제 조회 상품만 가능합니다.'));
   if(row.url){const link=element('a','판매처에서 상품 확인·구매하기 →');link.href=row.url;link.target='_blank';link.rel='noopener noreferrer';link.className='product-seller-link';actions.append(link);}
   const remove=button('비교에서 빼기',()=>{quotes.splice(quotes.findIndex(q=>q.id===row.id),1);render();});remove.className='product-remove';actions.append(remove);card.append(actions);root.append(card);
  }$('purchase-compare-status').textContent=rows.length+'개 상품 · 단위별 비교 · 서로 다른 단위를 같은 값으로 계산하지 않습니다.';
 }catch(error){$('purchase-compare-status').textContent=error.message;}
}
$('purchase-quote').addEventListener('submit',event=>{event.preventDefault();try{if(quotes.length>=30)throw Error('상품은 최대 30개까지 비교할 수 있습니다.');const fields=new FormData(event.currentTarget),quote=Object.fromEntries(fields);quote.name=quote.name.trim();quote.merchant=quote.merchant.trim();if(!quote.name||!quote.merchant)throw Error('상품명과 판매처를 입력하세요.');quote.url=safeSellerURL(quote.url);purchaseCost(quote,$('purchase-needed').value);quote.quantityUnit=quantityUnit();quote.source='MANUAL';quote.id=crypto.randomUUID();quote.checkedAt=new Date().toISOString();quotes.push(quote);event.currentTarget.reset();render();}catch(error){$('purchase-compare-status').textContent=error.message;}});
$('purchase-name').addEventListener('input',()=>{quotes.length=0;render();});
for(const id of ['purchase-needed','purchase-name','purchase-sort','purchase-discount'])$(id).addEventListener('change',render);if(view==='compare')render();

window.addEventListener('smartnf:reference-ready',render);

document.getElementById('purchase-unit')?.addEventListener('change',render);

window.addEventListener('smartnf:compare-add',event=>{
 try{
  const quote={...event.detail};if(!['g','ml','ea','pack','bag','bottle'].includes(quote.quantityUnit))throw Error('상품 단위를 확인하세요.');
  quote.url=safeSellerURL(quote.url);preview(quote);
  const duplicate=quotes.find(q=>q.source==='LIVE'&&q.receiptId===quote.receiptId||q.url&&q.url===quote.url&&q.quantityUnit===quote.quantityUnit);
  if(duplicate){Object.assign(duplicate,quote);render();event.detail.added=true;return;}
  if(quotes.length>=30)throw Error('상품은 최대 30개까지 비교할 수 있습니다.');
  quote.id=crypto.randomUUID();quotes.push(quote);render();event.detail.added=true;$('purchase-comparison-list')?.scrollIntoView?.({behavior:'smooth',block:'start'});
 }catch(error){event.detail.error=error.message;$('purchase-compare-status').textContent=error.message;}
});
