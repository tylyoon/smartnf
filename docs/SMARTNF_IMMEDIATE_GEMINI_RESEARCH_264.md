# 264. 즉시 수집 Gemini 부족 검색 보완 연결 (2026-11-17)

승인된 수정: tools/price_sources/scheduled_prices.py, tests/test_immediate_research.py. 기존 retail_search.py의263 null 응답 처리는 유지합니다.

## 변경 흐름
- --collect-now에서 SOURCE_EMPTY_DATA·NO_PRODUCTS·NO_RELEVANT_PRODUCTS이면 Gemini에 task=RESEARCH를 전달해 대체 검색어를 최대2개 제안받고, 유효한 첫 검색어1개로 판매처 재조회합니다. 정상 최초 수집에는 부족 검색 요청을 추가하지 않습니다.
- 대체 검색어는 별칭 재변환 없이 그대로 사용합니다. 정기 수집이 research 검색어를 사용하는 경로도 같은 방식으로 수정했습니다. 최초 검색의 기존 별칭은 유지합니다.
- 재조회 결과는 원래 재료명으로 다시 관련성 검사·중복 제거·판매처당 한도 적용 후 저장합니다. 정제염에 천일염·맛소금·과자를 대신 넣지 않습니다. Gemini 제안 가격은 사용하지 않습니다.
- SQLite immediate_research에 별도 기록합니다. 정기 jobs·research·체크포인트는 변경하지 않습니다. 추가 MySQL 마이그레이션은 없습니다. 기존 Gemini 일별 호출 상한을 공유하고, 보완은 일자·재료·판매처별 최대2회, 30분 간격이며 한 실행에서1회만 재조회합니다.
- 기존 Gemini 작업의 대기시간, 키 누락, 일일 상한, HTTP403/429 당일 판매처 중단을 지킵니다. 보완 재조회가403/429여도 당일 차단을 기록합니다.
- CLI에 initialMessage·searchTerm·researchMessage를 추가합니다. initialMessage는 최초 실패, searchTerm은 실제 보완 검색어, researchMessage는 GEMINI_HTTP_503/GEMINI_CONFIG/GEMINI_DAILY_LIMIT/GEMINI_BACKOFF/RESEARCH_BACKOFF/NO_ALTERNATIVE_TERM 등을 표시합니다. --status JSON에 immediateResearch 기록을 추가합니다.
- Google Search Grounding은 기존 수동 보조검색을 유지합니다. 이번 수정은 Gemini 검색어 제안과 판매처 재조회 연결이며 Grounding 결과를 자동 실판매가로 확정하지 않습니다.

## 검증
Python unittest73건 통과. 추가10건은 실제 fetch의 별칭 보존, 원래 재료 필터, 성공시 보완 생략,403 첫조회/재조회 중단,503 진단, 호출상한·대기·2회상한,정기작업 보존,잘못된 검색어/가격 미적용을 검사합니다. SQLite→TSV→변경 Java 조회 검사 통과. 판매처·Gemini는 테스트 대역으로 응답했고 운영PC의 실제 API·Spring Boot 화면은 미검증입니다.

## 적용
262·263이 적용된 프로젝트 루트에264 변경분을 덮어씁니다. 운영 DB/TSV/비밀키를 포함하지 않습니다. 다음 명령을 다시 실행하고 최종 state·saved·searchTerm·researchMessage를 확인합니다.

```bash
python tools/price_sources/scheduled_prices.py --collect-now --directory data/price-reference --provider HOMEPLUS --query "정제염" --limit 20
```

소금 검색이 가능해도 적합한 정제염 상품이 없으면 NO_RELEVANT_PRODUCTS를 유지합니다. GEMINI_BACKOFF는 기존 Gemini 실패에 따른 대기, RESEARCH_BACKOFF는 보완 시도 간격 또는 일일2회상한입니다. 대기·호출상한·503을 우회하기 위한 반복 실행을 하지 않습니다.
