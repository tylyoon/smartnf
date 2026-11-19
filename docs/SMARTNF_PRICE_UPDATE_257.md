# SmartNF 257: 실시간 부피 상품 표시·선택과 실행 집계 보완

## 적용
이번 ZIP은 256~257 누적 변경본입니다. 기존 서버를 중지하고 프로젝트 최상위에 같은 구조로 덮어쓴 뒤 재시작하세요. 가격 비교 화면도 새로고침하세요. DB 파일·인증키·환경설정은 포함하지 않습니다.

## 확인된 결과와 원인
- 사용자 PC에서 홈플러스 우유 17건 수집·저장 성공. 정기 판매상품 카드에 900ml·100ml당 가격·REVIEW·g/ml 계산 보류가 표시되는 것을 사용자 화면으로 확인했습니다.
- 현재 Gemini 실패는 `CATALOG_GEMINI_HTTP_503`. 이번 보완은 모델/키 변경이나 성공 처리를 하지 않습니다. 과거 11월 16일의 일반 실패 문구는 그대로 보존합니다.
- 실시간 `NC다이노스 1A 우유 2.3L`는 서버 ProductQuantity/상품 생성자가 이미 2300ml를 계산합니다. UI가 `product.grams`만 보고 중량 미확인이라고 안내하고 있었으므로 서버 파서를 새로 만들지 않고 표시·선택 로직을 고쳤습니다.

## 변경
- 실시간 상품 카드가 quantityUnit/packageAmount를 우선 사용합니다. 2.3L는 2300ml로 표시하며 g 필드에 부피를 넣지 않습니다.
- 현재 비교 단위가 g이고 상품이 ml이면 판매가격·상품 규격·100ml당 가격은 표시합니다. 해당 상품의 용량 입력·구매 개수·확인 체크·저장을 비활성화해 단위 오인을 막습니다.
- mL로 바꾸면 기존처럼 필요량을 비우고 사용자가 확인한 부피를 별도로 입력하게 합니다. 상품 재조회 후 포장량을 mL로 채우며, 기존 상품 확인ID·인증·멱등 저장 API를 그대로 사용합니다.
- g로 돌아오면 장보기에서 전달된 원래 g 필요량을 복원합니다. 식단/장보기 모델과 영양 계산용 g는 변경하지 않았습니다.
- 정기 카드에 verificationReason을 추가해 g/ml 불일치와 별개로 실제 분석/검토 사유를 보여줍니다. REVIEW를 검증 성공으로 바꾸지 않습니다.
- 실행기록에 mode=IMMEDIATE/SCHEDULED/UNKNOWN과 날짜별 집계를 추가합니다. 구형 collection_runs에는 mode 열을 자동 추가하고 기존 행은 UNKNOWN으로 보존합니다. 과거 성공 17건의 실행 유형을 추측하지 않습니다.
- 상태 화면에 정기 판매작업 완료 건수, 분류/조사를 포함한 정기 실패 건수, 오늘 즉시 수집 성공/실패 횟수, 저장 상품 수를 분리합니다. 과거의 0 값 coverage를 실제 상품 수처럼 보이게 하던 안내는 분석 상태 집계로 교체했습니다.
- 화면 모듈 버전을 갱신해 이전 JS 캐시와 섞이지 않게 했습니다.
- 기존 운영 수집 시각·판매처·상품 선택/금액 API·Grounding 정책은 유지합니다. MySQL/Flyway 변경은 없고 SQLite 실행기록에 mode 열 하나를 추가합니다.

## 적용 후 확인
1. g 상태에서 홈플러스 우유를 조회: 2300ml·판매가격·100ml당 가격이 보이고 계산/저장은 보류돼야 합니다.
2. mL 선택 → 필요한 부피(예:100)를 직접 입력 → 상품 재조회: 2300ml 포장량으로 계산합니다. 5290원 상품 1개라면 구매금액 5290원·잔량2200ml·100ml당 약230원입니다. 필요량 예상 예산은 별도 검증 자료가 있을 때만 계산합니다.
3. 장보기에서 들어온 화면에서 상품 확인 체크 후 선택·저장하고 장보기로 돌아가 구매 총금액을 확인합니다.
4. 예전 17건 실행은 유형 미기록으로 나옵니다. 다음 즉시 수집부터 즉시 실행 횟수가 집계됩니다. 필요한 경우 기존 명령을 한 번 실행하세요.

```bash
python tools/price_sources/scheduled_prices.py --collect-now --directory data/price-reference --provider HOMEPLUS --query "우유" --limit 20
```

## 검증
- Python 전체 테스트 57건 통과: 구형 실행 테이블에 mode 열 추가·기존17건 보존·즉시/정기 유형 및 상태 내보내기 포함.
- 관련 Node 테스트 35건 통과: 2.3L 표시, g/ml 불일치 선택 차단, mL100 필요량/2300ml 상품의 저장 요청과 확인 GET, g700 복원, 정기0/즉시1/저장17 구분, 검토사유 표시, 구매금액/잔량 및 예산 회귀.
- Java21 실제 컴파일/실행: 실제 Product 레코드/생성자에서 2.3L=2300ml와 grams=null 확인, 실제 ScheduledPriceCatalog의 DB→TSV 가격/단위/검토사유 연결 확인. 격리 테스트용으로 Product 레코드와 URL 검증 메서드를 원소스에서 추출하고 Spring 어노테이션을 대체한 하네스입니다. 전체 Spring Boot 통합 테스트와 구분합니다.
- 전체 Gradle 빌드·실제 사용자 로그인 브라우저·실제 서버 DB 선택 저장·외부 재수집·Gemini/Grounding 실호출은 이 환경에서 미검증. UI 저장 테스트는 모의 API 응답과 실제 JS를 사용했습니다. 운영 DB 원본은 수정하지 않았습니다.

```bash
python -m unittest discover -s tests -p 'test_*.py'
python tests/check_price_pipeline.py
node --test tests/product-ui.test.mjs tests/price-reference-update.test.mjs tests/price-budget.test.mjs tests/purchase-budget.test.mjs tests/purchase-comparison.test.mjs tests/purchase-page.test.mjs
```
