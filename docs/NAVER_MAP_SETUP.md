# 네이버 지도·장소 연계 설정

## 구현 상태
- 건강 식생활 가이드: 장보기/외식 지역·업종 입력, 네이버 지도 검색 링크, 서버 지역검색 연결, 좌표가 유효한 결과에 네이버 지도 마커 표시 구현.
- 내부 검색은 인증정보 미설정/로그인 차단/통신실패 상태에서 실제 매장 목록을 만들지 않는다. 외부 네이버 지도 검색은 별도로 제공.
- 검색 API는 관련도순 최대5건. 반경 내 전수검색/거리순 추천/실시간 재고/메뉴/알레르기/건강 적합성/영업 여부를 보증하지 않는다.

## 필요한 설정
1. 네이버 클라우드 Maps에서 Web Dynamic Map 애플리케이션 등록, 실제 localhost 및 배포 웹서비스 URL 허용. Key ID를 `NAVER_MAP_KEY_ID` 환경변수로 설정.
2. 네이버 Developers에서 검색 API 애플리케이션 등록. `NAVER_SEARCH_CLIENT_ID`, `NAVER_SEARCH_CLIENT_SECRET`를 서버 환경변수로 설정. 이 두 값은 지도 Key ID와 서로 다른 서비스의 인증정보이다.
3. 환경변수 설정 후 서버 재시작. 비밀키는 JS/HTML/공개 Git/채팅에 넣지 않는다. 지도 Key ID는 브라우저 SDK에 전달되는 공개 식별자이며 허용 웹 URL을 제한한다.
4. 기존 run_local.sh가 .env.local을 허용목록으로 읽으므로 이번 패키지는 알 수 없는 기존 실행 스크립트를 덮어쓰지 않았다. .env.local에 무작정 새 키를 추가하지 않는다. 실행할 터미널/배포환경에 위 변수3개를 먼저 설정하거나, 현재 실행 스크립트에 허용 항목을 추가한 뒤 사용해야 한다.

## 보안·실행 확인
- 새 Java 파일은 com.onrender.smartnf.place.NaverPlaceController. 기존 애플리케이션 스캔 범위 내에 위치한다. 별도 라이브러리 추가 없음(Java HttpClient+Spring MVC).
- `./gradlew classes`로 사용자 프로젝트 Java21/Spring Boot4.1.1에서 컴파일 확인 후 기존 방식으로 서버 실행. 이 작업 환경에는 사용자 전체 프로젝트/정확한 Java21 의존환경이 없어 실제 Spring 빌드와 실키 외부 호출은 검증하지 못했다.
- 기존 SecurityConfig가 /api/places/config 및 /api/places/search를 차단하면 기본 보안은 유지된다. 공개 미리보기에서 필요할 때 이 두 GET 경로만 기존 SecurityFilterChain에 허용한다. 전체 API 허용/CSRF 비활성화 금지. 기존 보안 파일은 이번에 덮어쓰지 않음.
- /api/places/config는 공개 지도 Key ID와 검색 설정 유무만 응답. 검색 Client ID/Secret은 응답하지 않는다. /api/places/search는 고정 네이버 호스트·허용 업종·제한 지역문자만 사용, 프록시 전체 분당30회 제한/타임아웃, 원문 오류·비밀키 로그 없음. 운영 다중 서버의 사용자별 제한은 후속.
- 지역/업종만 전송하며 질환·선택 식품·알레르기는 네이버 검색어에 붙이지 않는다. 현재 위치 자동 수집·저장 없음. 지역 직접 입력 방식.
- 장소 마커는 WGS84 정수 좌표를 변환하고 국내 범위 검증 후 표시. 과거 다른 좌표계의 값은 무리하게 변환하지 않고 마커 제외.

## 공식 문서
- https://navermaps.github.io/maps.js.en/docs/tutorial-1-Getting-Client-ID.html
- https://navermaps.github.io/maps.js.en/docs/tutorial-2-Getting-Started.html
- https://developers.naver.com/docs/serviceapi/search/local/local.md

확인일2026-10-26. 실제 키 승인/URL등록/보안 및 외부 응답 확인 후 운영 기능 완료로 표시한다.
