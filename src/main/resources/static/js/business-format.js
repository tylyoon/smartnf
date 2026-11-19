export const states = {
    PAYMENT_PENDING:'PG 승인 대기',REQUESTED:'승인 대기', APPROVED:'승인 완료', PAID:'결제 완료', SHIPPED:'출고 완료',
    PARTIAL:'일부 입고·조정 중', RECEIVED:'입고 검수 완료', SETTLED:'정산 기록 완료', CANCELLED:'취소 완료',
    PREPARED:'PG 결제 준비',CONFIRMING:'PG 승인 확인 중',REFUNDING:'PG 환불 확인 중',REFUNDED:'PG 환불 완료',RELEASED:'예약 해제',FAILED:'실패',
    ACTIVE:'유효 견적',SUPERSEDED:'변경 전 견적',RESPONDED:'재견적 회신',REJECTED:'반려',OPEN:'처리 대기', ORDERED:'발주 연결 완료', ACCEPT:'수락', REJECT:'반려',
    PROPOSED:'승인 대기', REVIEW:'검토 필요', CONFIRMED:'모집 확정', UNMET:'목표 미달'
};
export const roles = {ADMIN:'업체 관리자',BUY:'구매',SELL:'판매',STORE:'창고',FINANCE:'정산'};
export const labels = {
    quoteState:'견적 상태',version:'견적 버전',pg_state:'PG 처리 상태',pg_refunded:'PG 환불금액',
    erp_verified:'모의 ERP 대조',id:'관리번호',org:'소속 업체',product:'상품 관리번호',seller:'판매업체',buyer:'구매업체',
    name:'명칭',member:'회원 번호',role:'담당 직무',zone:'보관 구역',sku:'상품 SKU',
    oldSku:'기존 상품',newSku:'대체 상품',origin:'원산지',unit:'기본 단위',pack:'포장당 기본 단위 수량',
    price:'포장당 세금 포함 가격',barcode:'바코드',allergens:'표시 알레르겐',
    protein:'100기본단위당 단백질(g)',sodium:'100기본단위당 나트륨(mg)',
    place:'창고',producerLot:'생산 로트 번호',producer_lot:'생산 로트 번호',expires:'소비기한',
    qty:'수량',people:'식수 인원',perPerson:'1인 필요량',delivery:'희망 납기·사용일',
    avoid:'피할 알레르겐',until:'견적 유효일',until_day:'견적 유효일',packs:'구매 포장 수',quote:'견적',
    shipment:'출고 번호',doc:'승인 문서(수량은 포장 수)',lot:'로트',toPlace:'도착 창고',
    reference:'증빙·사용처',target:'목표 포장 수',capacity:'최대 포장 수',deadline:'예약 마감일',
    kind:'구분',confirmedOrg:'삭제할 작업 업체의 관리번호',state:'처리 상태',po:'발주번호',
    paid:'기록된 결제금액',received:'검수 수량',billed:'청구 수량',blocked:'회수 차단',
    ord:'주문번호',ref:'관련 번호',reason:'사유',day:'처리일',amount:'금액',shipping:'주문당 배송비',
    active:'판매 상태',min_packs:'최소 주문 포장 수',region:'배송 지역',lead_days:'납품 준비 기간(일)',
    tax_note:'세금 안내',partner:'거래처',contact:'담당자',phone:'연락처',address:'납품처·주소',
    terms:'거래 조건',note:'메모',rfq:'견적 요청',spec:'희망 규격',decision:'처리 결정',
    resolution:'처리 결과·합의 내용',start:'기간 시작',end:'기간 종료',created:'등록일',
    updated:'마지막 처리일',due_day:'확정 희망 납기',receipt_closed:'입고 검수 마감',
    requester:'요청 업체',buyerName:'구매업체명',sellerName:'판매업체명',
    placeName:'창고명',message:'알림 내용',at:'발생 시각',isRead:'읽음 여부',owner:'관리 업체'
};
export const numbers = value => new Intl.NumberFormat('ko-KR',{maximumFractionDigits:3}).format(Number(value));
export const money = value => numbers(value)+'원';
export const unitName = value => ({ml:'mL',ea:'개'})[value]||value||'';
export function quantity(value, unit) {
    return numbers(value)+(unit?' '+unitName(unit):'');
}
export function packaging(row) {
    const pack=Number(row.pack), qty=Number(row.qty);
    if(!pack || !Number.isFinite(qty))return quantity(row.qty,row.unit);
    return quantity(qty,row.unit)+' · '+numbers(qty/pack)+'포장 × '+quantity(pack,row.unit);
}
export const element = (tag,text,className) => {
    const result=document.createElement(tag);
    if(text!=null)result.textContent=text;
    if(className)result.className=className;
    return result;
};
export function table(parent, caption, records, columns) {
    const wrapper=element('div',null,'business-scroll');
    wrapper.tabIndex=0;wrapper.setAttribute('role','region');wrapper.setAttribute('aria-label',caption);
    const result=element('table'), head=element('thead'), header=element('tr');
    for(const [,title] of columns){const cell=element('th',title);cell.scope='col';header.append(cell);}
    head.append(header);result.append(head);
    const body=element('tbody');
    for(const row of records){
        const tr=element('tr');
        for(const [key,,format] of columns)tr.append(element('td',format?format(row[key],row):row[key]??'미확인'));
        body.append(tr);
    }
    result.append(body);wrapper.append(result);parent.append(wrapper);
}
