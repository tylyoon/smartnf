import {koreaTime} from './price-budget.js?actions267';
import {api,element} from './food-studio-core.js';
let epoch=0;
export function invalidateChoices(root){epoch++;root.replaceChildren(element('p','재료 편집 중입니다. 변경 저장 후 선택 상품을 다시 확인합니다.'));}
export async function showShoppingChoices(root,saved){
 const token=++epoch;root.replaceChildren(element('p','선택한 구매 상품을 불러오고 있습니다…'));
 try{const choices=await api('/api/me/shopping-products?listId='+encodeURIComponent(saved.id));if(token!==epoch)return;root.replaceChildren(element('h3','내가 선택한 구매 상품'));
  if(!choices.length){root.append(element('p','선택한 상품이 없습니다. 재료의 가격 비교에서 상품을 선택해 저장하세요.'));return;}
  for(const c of choices){const row=element('article',undefined,'purchase-card'),amount=Number(c.packageAmount??c.packGrams)*Number(c.packs),needed=Number(c.requiredAmount??c.requiredGrams),unit=({ml:'mL',ea:'개',pack:'팩',bag:'봉',bottle:'병'}[c.quantityUnit]||c.quantityUnit||'g'),money=Number(c.price)*Number(c.packs);row.append(element('h4',c.ingredientName+' · '+c.productName),element('p',(c.stale?'장보기 변경 전 선택 · 다시 선택 필요':'저장한 상품')+' · '+c.merchant),element('p',c.packs+'개 · 구매량 '+amount.toLocaleString('ko-KR')+unit+' · '+(amount>=needed?'예상 잔량 '+(amount-needed).toLocaleString('ko-KR'):'부족 '+(needed-amount).toLocaleString('ko-KR'))+unit),element('p','선택 당시 상품 표시금액 '+money.toLocaleString('ko-KR')+'원 · 배송비·최종 결제 조건 별도'),element('p',c.sourceDetails||'출처 조건 확인 필요'),element('p','가격 조회 '+koreaTime(c.checkedAt)));
   try{const u=new URL(c.url);if(u.protocol==='https:'&&!u.username&&!u.password){const a=element('a','판매 사이트에서 다시 확인 →');a.href=u.href;a.target='_blank';a.rel='noopener noreferrer';row.append(a);}}catch{}
   root.append(row);
  }
 }catch(e){if(token===epoch)root.replaceChildren(element('p','선택 상품을 불러오지 못했습니다. '+e.message));}
}
