# 263. 홈플러스 null 응답 진단·파서 보호 (2026-11-17)
사용자 정제염 실조회에서 AttributeError: NoneType has no attribute get 확인. 응답 원문/추적정보가 없어 정확한 null 위치는 확정하지 않았습니다. 파서의 최상위 JSON·data·dataList·상품 행·eventInfo 구조를 검사해 같은 예외를 방지합니다.
- SOURCE_EMPTY_DATA: 응답의 data/dataList가 null 또는 누락됨. 상품 없음으로 확정하지 않습니다.
- SOURCE_INVALID_RESPONSE: JSON/응답 구조 오류.
- SOURCE_STATUS_ERROR: 홈플러스 응답 내부 상태가 정상값이 아님.
- 정상 dataList=[]는 기존 NO_PRODUCTS로 유지합니다. null 상품 행과 비정상 eventInfo 상품은 저장하지 않습니다.
변경: tools/price_sources/retail_search.py, scheduled_prices.py, 관련 Python 테스트2개. DB·스케줄·가격·단위 계산은 변경하지 않습니다.
Python63건 및 SQLite→TSV→Java 조회 검사 통과. 운영 PC의 정제염 실응답은 미검증이며 수정 후 동일 수집 명령을 재실행해야 합니다.
적용: 262까지 적용한 프로젝트 루트에 이 ZIP의 파일을 덮어씁니다. 이번 ZIP은263 변경분만 포함하며 데이터 파일을 포함하지 않습니다.
