# 265. 두 번째 Gemini 검색어·독립 판매처 보완 조회 (2026-11-17)

264의 첫 번째 검색어만 조회하던 제한을 개선했습니다. Gemini 반환 검색어 최대2개를 중복 제거하고 순서대로 원 판매처에 직접 조회합니다. 성공하면 중단하고, 적합한 상품이 없으면 기존 OASIS→LOTTE 직접 조회 어댑터로 같은 검색어를 확인합니다. 원 판매처와 중복되는 판매처는 건너뜁니다. 한 보완 실행은 최대3판매처×2검색어로 제한합니다.

원래 재료·규격 검증은 유지합니다. 정제염에 천일염/맛소금/과자를 가격 근거로 적용하지 않고 Gemini 제안 가격도 저장하지 않습니다. 실제 저장 provider를 유지하며 최초 요청 provider로 바꾸지 않습니다.

최초403/429는 보완을 시작하지 않습니다. 보완 중403/429인 판매처는 당일 차단하고 해당 판매처에 다음 검색어를 보내지 않습니다. 다른 판매처는 자체 공개 조회 경로를 사용하는 독립 조회이며 차단 판매처를 우회하지 않습니다. 이미 차단된 판매처는 SKIPPED/DISABLED로 표시합니다. 기존 30분 간격·일자/재료/요청판매처별2회·Gemini일별호출상한·기존Gemini대기·운영스케줄은 유지합니다.

CLI 추가 결과: savedProvider(실제 저장처), attempts(각 판매처/검색어/성공실패/조회저장건수/사유). 기존 searchTerm은 마지막 조회 검색어를 표시합니다. SQLite immediate_attempts 및 collection_runs의 IMMEDIATE_FALLBACK에 개별 시도를 기록하고 status JSON의 immediateAttempts에 최근30건을 제공합니다. 성공 저장을 요약행과 중복 합산하지 않습니다. 기존 정기 jobs와 research는 변경하지 않습니다.

변경 파일: tools/price_sources/scheduled_prices.py, tests/test_immediate_research.py, 이 문서와 SmartNF_IMPROVEMENTS.md. 이번 ZIP은264 적용 이후 변경분이며 운영 DB/TSV/키를 포함하지 않습니다. SQLite 기록 테이블 자동 추가, MySQL 마이그레이션 없음.

검증: Python78건과 SQLite→TSV→실제 변경Java조회 컴파일/실행 통과. 추가5건은 두번째제안 우선조회, 다른판매처성공/검증기록/정기작업보존/중복합산방지, 차단판매처스킵, 전판매처무관상품제외, 검색어중복/상한을 확인합니다. 판매처와Gemini는 테스트 대역이며 사용자PC 실제조회는 미검증입니다.

적용:264 적용 프로젝트 루트에덮어씁니다. 사용자의 직전16:32 보완요청에 따른 대기시간이 남아 있으므로 약17:02이후 아래명령으로 확인합니다. 실제 next_at은DB기록이 기준입니다. 새코드도이대기시간을초기화하지않습니다.

```bash
python tools/price_sources/scheduled_prices.py --collect-now --directory data/price-reference --provider HOMEPLUS --query "정제염" --limit 20
```

Gemini가키누락/상한/대기/오류로검색어를내지못하면 보완조회도진행하지않습니다. 실제정제염상품을확보하지못하면미확인을유지합니다. GoogleSearchGrounding의수동보조검색기준은변경하지않았습니다.
