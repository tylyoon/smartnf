# SmartNF 네이버 API HUB 지역 검색 전환

## 적용

1. 실행 중인 서버를 Ctrl+C로 종료합니다.
2. 압축을 풀어 src 및 docs 폴더를 기존 smartnf 프로젝트 루트에 병합합니다.
3. bash run_local.sh 로 서버를 시작합니다.
4. 브라우저에서 Ctrl+F5를 누릅니다.

## 변경 파일

src/main/java/com/onrender/smartnf/place/NaverPlaceController.java

검색 API 주소를 https://naverapihub.apigw.ntruss.com/search/v1/local 로 바꾸고,
X-NCP-APIGW-API-KEY-ID 및 X-NCP-APIGW-API-KEY 헤더로 서버에서 인증합니다.
기존 NAVER_SEARCH_CLIENT_ID / NAVER_SEARCH_CLIENT_SECRET 환경변수 이름은 유지합니다.
Client ID·Secret 값, .env.local 및 비밀번호는 압축에 포함하지 않습니다.
기존에 적용한 run_local.sh 및 SecurityConfig.java 수정은 그대로 필요합니다.

## 확인

설정 확인 API에서 지도키설정됨 true, 매장검색설정됨 true가 예상됩니다.
두 값은 설정 존재 여부이며 실제 인증 성공 여부는 아닙니다.
건강 식생활 관리 가이드 → 장보기 → 주변 매장에서 지역을 입력하고,
창고형 매장 → 코스트코 또는 트레이더스를 선택하세요.
첫 확인에서는 식재료·음식·매장 검색어를 비우고 장소 검색을 누르세요.
네이버 응답 최대 5건의 목록과, 지도 인증이 정상인 경우 지도 표시를 확인합니다.
조회 조건에 따라 0건일 수 있으며 전체 매장·거리순·상품 재고 결과가 아닙니다.

## 검증 범위

공식 API 주소·두 인증 헤더·UTF-8 검색 파라미터 및 JSON 지정 대조 완료.
기존 검색어 검증·브랜드 목록·분당 제한·지도 설정과 변경 차이 확인.
실제 Spring 빌드·네이버 인증 호출은 사용자 PC에서 확인해야 합니다.

## 공식 문서

- https://api.ncloud-docs.com/docs/naver-api-hub-search-local
- https://api.ncloud-docs.com/docs/naver-api-hub-overview
