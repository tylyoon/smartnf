# SmartNF 가격 수집·비교 업데이트 적용 안내

## 적용
1. 실행 중인 SmartNF 서버를 중지합니다.
2. 이미 만든 운영 DB 백업을 보관합니다. ZIP에는 운영 DB나 환경설정/인증키가 없습니다.
3. ZIP 내용을 프로젝트 최상위 `C:\yoonfolder\hpexam\smartnf`에 같은 폴더 구조로 덮어씁니다.
4. 평소 실행 방법으로 서버를 다시 실행합니다. 첫 SQLite 연결에서 실행기록 테이블 하나가 자동 생성됩니다. MySQL/Flyway 변경은 없습니다.
5. 가격 비교 화면을 새로고침합니다. 판매가격은 표시하고 검증 대기·오래됨·단위 불일치 자료는 예산에 자동 포함하지 않습니다.

## 상한 설정
기본값은 검색 재료별·판매처별 20개이며 허용 범위는 1~100입니다. 관련성 및 중복 검사 뒤 상한을 적용합니다. 판매처가 적게 반환하면 실제 건수는 20보다 적습니다.
필요할 때만 기존 `.env.local`에 다음 값을 추가합니다.

```dotenv
SMARTNF_PRICE_PER_PROVIDER_LIMIT=20
```

참가격/KAMIS 조사 후보의 기존 3개 상한은 실제 판매상품 상한과 구분하여 유지합니다.

## 즉시 수집
프로젝트 최상위의 기존 Python 가상환경에서 실행합니다.

```bash
python tools/price_sources/scheduled_prices.py --collect-now --provider HOMEPLUS --query "우유" --limit 20
```

이 명령은 운영 스케줄을 변경하지 않으며 기본적으로 `data/price-reference-dev`에 별도 저장합니다.
개발 데이터 상태:

```bash
python tools/price_sources/scheduled_prices.py --directory data/price-reference-dev --status
```

서버가 읽는 운영 DB/TSV에 즉시 반영하려는 경우 아래처럼 명시합니다. DONE 작업도 재조회하지만 기존 정기 작업의 완료/재시도 체크포인트는 변경하지 않습니다. 동시 실행 잠금과 같은 날 HTTP 403/429 차단을 존중합니다.

```bash
python tools/price_sources/scheduled_prices.py --collect-now --directory data/price-reference --provider HOMEPLUS --query "우유" --limit 20
python tools/price_sources/scheduled_prices.py --directory data/price-reference --status
```

반환 JSON의 state/fetched/saved/message/checkedAt을 확인합니다. 실패 시에도 JSON을 출력하므로 프로세스 종료 여부만으로 수집 성공으로 판단하지 마세요. `scheduled-status.json`에는 최근 실행의 시작·종료·반환·저장 건수, 실패 사유, 판매처별 저장 상품 수가 추가됩니다.

## 화면·계산
- 현재 판매처 표시가격과 필요량 예상가격, 포장 올림 구매금액을 구분합니다.
- 원문 규격으로 900ML×2=1800ml, 1L×2=2000ml, 500g×3=1500g을 계산합니다.
- 100g/100ml 단가를 표시하지만 g↔ml를 변환하지 않습니다.
- 판매가격은 미검증·규격 미확인·단위 불일치·24시간 경과 여부와 함께 표시합니다. 기존 보관정책에 따라 7일을 초과한 수집 자료는 정기 정리 대상입니다.
- 동일식품·원문 규격 검증이 완료되고 최신이며 요청 단위가 일치해야 자동 예산 계산에 사용합니다. 미확인 가격을 0원으로 계산하지 않습니다.
- `이 상품명으로 조회·선택`은 해당 판매처의 기존 조회 흐름을 실행합니다. 조회한 후보를 사용자가 선택하고 기존 인증·상품확인ID 검증을 통과해야 구매상품으로 저장됩니다. 정기 카드 자체로 자동 저장하지 않습니다.
- 화면 상단에 판매처별 실패 사유와 최근 실행 건수가 표시됩니다. HTTP_403/429는 접근 제한, NO_PRODUCTS는 반환 상품 없음, NO_RELEVANT_PRODUCTS는 관련성/중복/유효 가격 검사 후 대상 없음, RESPONSE_OR_NETWORK는 응답/네트워크 확인 필요입니다.

## Gemini와 Grounding
업로드한 DB에는 2026-11-16 GEMINI FAILED `상품분류 실패`만 남아 있고 분석 오류 행은 없습니다. 로그도 일반 실패 문구만 반복되어 과거 HTTP 코드·키/모델/쿼터 원인은 소급 확정할 수 없습니다.
이번 변경은 분류 실패를 CATALOG_GEMINI_HTTP_400/403/404/429 등으로, 상품 분석 오류를 GEMINI_CONFIG/GEMINI_HTTP_* 등으로 기록합니다. 알 수 없는 예외의 원문·API 키는 저장하지 않습니다. 다음 실제 수집 후 오류 코드로 원인을 좁혀야 합니다.
기존 Google Search Grounding은 기본 꺼짐, 사용자 요청 시 보조 검색, 정기 가격 자동 저장 없음 정책을 유지했습니다. 기존 테스트로 해당 동작을 확인했습니다. 키·모델을 임의 변경하거나 새 검색을 자동 활성화하지 않았습니다.

## 실제 검증과 한계
- Python 전체 기존·추가 테스트 56건 통과.
- Java 21 실제 컴파일/실행으로 Python DB 저장 → TSV 내보내기 → 실제 ScheduledPriceCatalog 조회 통과. 20건·미검증·단위 불일치·오래된 가격·필요량/포장금액 및 g/kg/ml/L 확인.
- 이 Java 검증은 Spring Service 어노테이션과 영수증 관련 타입을 격리하고, 실제 URL 검증 메서드를 복사해 컴파일합니다. 전체 Spring Boot 컨텍스트/보안/DB 통합 검증은 아닙니다.
- 관련 JavaScript 회귀 테스트 21건 통과, 별도 기존 UI 테스트 4건 통과. 신규 화면 테스트는 가상 DOM으로 판매가격/단위 표시·계산 보류·선택 조회 연결을 검증했습니다. 실제 브라우저 로그인 화면은 미검증입니다.
- 제공 환경에 Gradle 실행 명령과 프로젝트 Gradle Wrapper가 없어 전체 Gradle 빌드는 실행하지 못했습니다. 사용자 PC에서 `./gradlew test` 및 평소 서버 기동 후 화면 확인이 필요합니다.
- 판매처 실시간 재수집·사용자 Gemini/Grounding 키 실호출·실제 오전 예약 실행은 미검증입니다. 수집 테스트는 모의 판매처/모의 Gemini 응답을 사용했습니다. 업로드한 운영 DB 원본은 수정하지 않았습니다.
- 기존 스케줄 테스트 하나는 모의 Gemini가 새 카탈로그 작업을 상품 용량 분석으로 오인하던 문제를 고쳤습니다. 기대 완료 건수를 낮추지 않고 실제 요청 유형을 구분하도록 테스트 응답만 수정했습니다.

## 재현 명령
```bash
python -m unittest discover -s tests -p 'test_*.py'
python tests/check_price_pipeline.py
node --test tests/price-budget.test.mjs tests/purchase-budget.test.mjs tests/price-reference-update.test.mjs
```
