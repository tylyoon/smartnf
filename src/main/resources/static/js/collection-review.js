import {api,element} from './food-studio-core.js';
const $=id=>document.getElementById(id);let rows=[];let busy=false;
const labels={sourceId:'출처 상품 ID (같은 상품은 같은 ID로 갱신)',name:'상품명',merchant:'판매처',grams:'포장 총중량(g)',price:'해당 포장 가격(원)',validFrom:'적용 시작일',validTo:'적용 종료일',branch:'점포 (전단 필수)',conditions:'할인·회원·카드·배송 조건 (전단 필수)'};
export function loadCollection(data){
 if(busy)return false;rows=[];$('collection-review').replaceChildren();$('collection-save').disabled=true;
 try{if(data.schemaVersion!==1||!Array.isArray(data.offers)||data.offers.length>100)throw Error('schemaVersion=1, offers 최대 100행인 수집 결과가 필요합니다. 작업을 나누어 실행하세요.');
 $('collection-status').textContent=(Array.isArray(data.runs)?data.runs.slice(0,20).map(r=>[r.provider,r.status,r.count??'',r.message||''].join(' ')).join(' / '):'')+' · 원문·포장량·조건을 확인해 수정하고 행별로 체크하세요.';
 for(const original of data.offers){if(!original||typeof original!=='object')throw Error('상품 행 형식을 확인하세요.');const offer={};for(const key of ['sourceType','provider','sourceId','name','merchant','grams','price','url','checkedAt','validFrom','validTo','priceKind','conditions','branch','evidence'])offer[key]=original[key]??'';offer.confirmed=false;
 const card=element('article',undefined,'purchase-card'),fields=element('div',undefined,'purchase-fields'),controls={};card.append(element('h4',[offer.provider,offer.sourceType,offer.priceKind].join(' · ')),element('p','출처: '+offer.url+' · 수집 '+offer.checkedAt),element('p','추출 원문: '+offer.evidence));
 for(const [key,title] of Object.entries(labels)){const label=element('label',title),input=element('input');input.type=['grams','price'].includes(key)?'number':key.startsWith('valid')?'date':'text';input.value=offer[key];input.maxLength=key==='conditions'?1000:key==='sourceId'?100:300;if(input.type==='number'){input.min='0.001';input.step='0.001';}controls[key]=input;label.append(input);fields.append(label);input.addEventListener('input',()=>{check.checked=false;});}
 const check=element('input');check.type='checkbox';const confirm=element('label','원문·가격의 포장 기준·기간·조건을 확인했습니다');confirm.append(check);card.append(fields,confirm);$('collection-review').append(card);rows.push({offer,controls,check});}
 $('collection-save').disabled=rows.length===0;
 return true;
 }catch(error){rows=[];$('collection-review').replaceChildren();$('collection-status').textContent=error.message;return false;}
}
$('collection-file').addEventListener('change',async event=>{if(busy)return;try{const file=event.target.files[0];if(!file)return;if(file.size>2000000)throw Error('JSON은 2MB 이하만 지원합니다.');loadCollection(JSON.parse(await file.text()));}catch(error){$('collection-status').textContent=error.message;}});
$('collection-save').addEventListener('click',async()=>{if(busy)return;const selected=rows.filter(r=>r.check.checked);if(!selected.length){$('collection-status').textContent='검토를 마친 상품의 확인란을 체크하세요.';return;}
 const offers=selected.map(r=>({...r.offer,...Object.fromEntries(Object.entries(r.controls).map(([k,v])=>[k,['grams','price'].includes(k)?Number(v.value):v.value.trim()])),confirmed:true}));
 if(offers.some(o=>!o.name||!o.merchant||!(o.grams>0)||!(o.price>0)||!o.validFrom||!o.validTo||o.validTo<o.validFrom||(o.priceKind==='FLYER'&&(!o.branch||!o.conditions)))){$('collection-status').textContent='상품명·판매처·포장량·가격·기간을 채우세요. 전단은 점포와 할인 조건도 필요합니다.';return;}
 busy=true;$('collection-save').disabled=true;$('collection-file').disabled=true;
 try{const result=await api('/api/me/collected-products',offers);$('collection-status').textContent=result.message+' '+result.saved+'개. 판매 상품 조회를 눌러 확인하세요.';$('collection-status').scrollIntoView?.({behavior:'smooth',block:'center'});for(const r of selected){r.check.checked=false;r.offer.confirmed=false;}}
 catch(error){$('collection-status').textContent=error.message+' 입력 내용은 유지됩니다. 확인 후 같은 상품을 다시 반영할 수 있습니다.';}
 finally{busy=false;$('collection-save').disabled=false;$('collection-file').disabled=false;}
});
