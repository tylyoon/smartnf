# 카카오 로그인 1차 연결·설정 안내

작성일: 2026-10-28. 상태: 구현본 작성, 설정/실제 카카오 인증 및 사용자 로컬 검증 대기.

## 1. 이번 범위

SmartNF 안에 카카오 OAuth2 로그인을 추가한다. 일반 가입·이메일 로그인·로그아웃을 유지한다. 네이버·구글은 이후 순서이며 이번 화면에 해당 버튼을 만들지 않는다. Google의 배포 주소 허용 조건은 Google 연결 단계에서 공식 문서로 검토한다. 유료 도메인 구매 자체를 준비 완료 조건으로 삼지 않는다.

카카오 버튼 표시 조건은 다음을 모두 만족하는 경우다.

1. KAKAO_LOGIN_ENABLED=true: 사용자가 콘솔 설정을 마쳤다고 명시적으로 활성화.
2. REST API 키와 Client Secret이 서버에 설정됨.
3. SMARTNF_PUBLIC_BASE_URL이 올바른 원점 URL. HTTP는 localhost/127.0.0.1 개발 환경만 허용하고 그 밖에는 HTTPS만 허용.
4. 요청의 scheme/host/port가 설정한 원점과 일치하고 루트 컨텍스트로 실행됨.

키가 있다는 사실만으로 카카오 측 인증 성공까지 확인한 것은 아니다. 틀린 키·미등록 URI·외부 장애는 실제 인증 때 확인된다. 활성화 플래그를 false로 바꾸면 서버 재시작 후 버튼이 숨겨진다. 직접 인가 요청도 설정 주소와 다른 요청에서는 시작하지 않는다.

## 2. 로그인·신규 가입 흐름

- 기존 회원: 카카오 인증 → provider=kakao + 카카오 회원 ID 조회 → ACTIVE 상태와 USER/ADMIN 권한 확인 → SmartNF 로그인.
- 신규 사용자: 카카오 인증 → 서버 세션에 회원 ID·인증 시각만 최대 10분 임시 보관 → 표시 이름과 개발용 안내 동의 → 회원·SNS 계정·USER 권한·동의 이력 트랜잭션 저장.
- 신규 가입 직후는 로그인 화면으로 이동한다. 카카오 버튼을 한 번 더 눌러 로그인한다. 가입 대기 상태를 실제 로그인으로 취급하지 않는다.
- 회원별 같은 ID를 재사용한다. 이메일이나 표시 이름으로 기존 일반 회원과 자동 병합하지 않는다. 기존 계정에 SNS를 추가 연결/해제하는 화면은 후속이다.
- 카카오 이메일·프로필·비밀번호를 회원 DB에 저장하지 않고 필수 식별 ID만 사용한다. 카카오 user-info 응답 중 나머지 속성은 principal에 남기지 않는다. OAuth access/refresh token은 DB·최종 로그인 세션에 보관하지 않는다.
- CSRF와 OAuth state 검증을 유지한다. 사용자가 제출한 provider ID·memberId·role은 가입 필드로 받지 않는다. 인증 미완료·가입 대기 사용자는 개인 권한 경로에 접근할 수 없다.
- 로그아웃은 SmartNF 세션을 종료한다. 카카오 계정 자체의 브라우저 로그인까지 종료하는 기능은 이번 범위가 아니다.

## 3. DB 변경 — V2만 추가

회원 테이블 6개와 V1은 그대로 둔다. V2__add_kakao_dev_consent_documents.sql은 dev-kakao-20261028 버전의 TERMS/PRIVACY 문서 2개만 추가한다.

이전 일반 가입 동의 문서 dev-20261028은 변경하지 않는다. 카카오 가입용 경로는 /signup/documents/kakao-terms 와 /signup/documents/kakao-privacy 이다. 둘 다 개발 검증용이며 공개 운영 약관·보관/탈퇴 정책 확정을 대신하지 않는다.

## 4. 먼저 파일 적용·테스트

1. 현재 서버를 Ctrl+C로 중지한다.
2. 프로젝트 백업 후 ZIP의 docs/, src/, build.gradle, run_local.sh 및 비밀값 없는 .env.kakao.example을 smartnf 루트에 병합한다.
3. 기존 .env.local을 교체하지 않는다. 기존 Flyway 파일·DB·가입 회원을 삭제하지 않는다.
4. 프로젝트 루트 Git Bash에서 테스트한다.

```bash
bash ./gradlew test --no-daemon
node src/test/js/account-state.test.cjs
```

Spring Boot 4 계열의 spring-boot-starter-security-oauth2-client 의존성을 추가했으므로 첫 빌드 시 다운로드가 필요하다. 테스트의 DB·키는 H2/가짜 값으로 고정한다. 실제 Kakao API를 호출하는 테스트는 포함하지 않는다. 테스트 성공 후 콘솔 설정과 실제 인증을 별도로 확인한다.

## 5. 카카오 개발자 콘솔 설정

공식 문서 확인일: 2026-10-28. 화면이 다르면 현재 콘솔 화면을 기준으로 위치를 확인한다.

1. https://developers.kakao.com/ 에 로그인하고 SmartNF 앱을 선택하거나 새 앱을 만든다.
2. 앱의 카카오 로그인 → 사용 설정을 ON으로 설정한다.
3. 앱 → 플랫폼 키 → REST API 키에서 키와 Client Secret 설정을 확인한다. JavaScript 키나 Admin 키를 대신 사용하지 않는다. Client Secret은 활성화된 상태로 사용한다.
4. 해당 REST API 키의 Redirect URI에 아래 주소를 정확히 등록한다.

```text
http://localhost:8080/login/oauth2/code/kakao
```

5. localhost:8080으로 접속한다. 127.0.0.1·다른 포트와 섞지 않는다. 원점을 바꾼다면 카카오 등록 URI와 환경변수 모두 같은 값으로 바꿔야 한다.
6. 이번 구현은 OAuth2 ID 조회 방식으로, OpenID Connect·이메일·닉네임 scope를 요청하지 않는다. 콘솔에 별도 필수 동의항목이 설정돼 있다면 앱이 실제 요청할 항목을 확인한다. 추가 개인정보를 받기 위한 설정을 임의로 요구하지 않는다.

## 6. 환경변수 — 기존 .env.local에 추가

키는 채팅·Git·화면 캡처에 넣지 않는다. 아래는 형식 예시이며 실제 키를 포함하지 않는다. run_local.sh는 파일을 코드로 실행하지 않고 허용된 줄을 읽는다. 값은 따옴표 없이 한 줄로 입력한다.

```dotenv
KAKAO_LOGIN_ENABLED=true
KAKAO_REST_API_KEY=여기에_REST_API_키
KAKAO_CLIENT_SECRET=여기에_Client_Secret
SMARTNF_PUBLIC_BASE_URL=http://localhost:8080
```

콘솔 설정 전에는 KAKAO_LOGIN_ENABLED=false로 두거나 4개 줄을 아직 추가하지 않아도 된다. 그 경우 이메일 로그인은 유지되고 카카오 버튼은 보이지 않는다. 동봉한 .env.kakao.example은 참조용이다. DB_URL·DB_USERNAME·DB_PASSWORD·FLYWAY_PASSWORD·기존 네이버 지도/검색 설정을 지우지 않는다.

```bash
bash run_local.sh
```

run_local.sh에는 위 4개 줄을 안전하게 읽어 전달하는 처리를 추가했다. 키·비밀값을 출력하지 않는다. 기존 네이버 지도/지역 검색 Client ID·Secret은 카카오 로그인 키나 향후 네이버 로그인 키와 별개다.

## 7. 실제 확인 순서

1. http://localhost:8080/login 에서 카카오 버튼 확인. 설정이 없을 때 숨겨지는지도 확인.
2. 카카오 인증 → 최초 가입 화면 → 가상 표시 이름·개발용 안내 동의 → 가입 완료.
3. 로그인 화면에서 카카오 버튼 재클릭 → SmartNF 홈과 표시 이름 확인.
4. 로그아웃 후 재로그인해 기존 회원을 재사용하는지 확인.
5. 인증 취소·가입 취소·가입 대기 만료·다른 주소 접속 시 처리 확인.
6. 이메일 로그인·관리자 권한 경계·헬스케어 선택/확정 흐름 회귀 확인. 로그인 방식 변경 시 이전 계정 임시 정보가 섞이지 않아야 한다.

DB에서는 다음을 확인한다. 카카오 ID·개인정보·토큰 값을 공유할 필요는 없다.

```sql
SELECT version, description, success FROM smartnf.flyway_schema_history ORDER BY installed_rank;
SELECT provider, COUNT(*) AS account_count FROM smartnf.social_accounts GROUP BY provider;
SELECT consent_type, version FROM smartnf.consent_documents ORDER BY id;
```

정상 적용 시 Flyway V1/V2 success=1, 테이블 수는 기존 7개 그대로, 동의 문서는 일반 가입 2개+카카오 2개다. 신규 카카오 회원에게 local_credentials 행이나 가짜 비밀번호는 만들지 않는다.

## 8. AWS 등 배포 시

실제 공개 HTTPS 원점과 카카오 Redirect URI를 일치시킨다. 프록시 뒤에서는 신뢰할 프록시의 전달 헤더 설정을 검토해야 한다. 잘못된 Host를 신뢰해 콜백을 만들지 않도록 콜백 URL은 환경변수의 고정 주소를 사용한다. 특정 배포 IP/도메인의 제공자 지원 여부는 해당 주소 등록과 실제 인증으로 확인한다. 현재는 로컬 설정을 먼저 검증한다.

## 9. 이번 검증과 한계

| 항목 | 결과 |
|---|---|
| bash 문법 | 통과 |
| 런처 모의 실행 | 키 미설정/설정, CRLF, 특수문자 원문 보존, DB/네이버 설정 유지, 비밀값 출력 없음 통과 |
| V1 원문 비교 | 기존 적용본과 동일 |
| HTML 구조·중첩 form | 정적 검사 통과 |
| 기존 account-state Node 검사 | 통과 |
| Java/JUnit | 신규 설정·가입·권한·state 검사 작성. 이 환경에서 Gradle 다운로드 DNS 실패/Java21 부재로 실행 미확인 |
| 카카오 실제 인증·V2 MySQL 적용·브라우저/모바일 | 사용자 환경 확인 대기 |

Java 테스트에는 미설정 버튼 숨김·원점 일치·state 없는 콜백 실패·신규/기존 회원·정지 회원·동의/CSRF·임시 인증 만료·provider ID/권한 변조 무시·가입 대기 권한 차단을 포함한다. 테스트 작성과 통과를 구분한다.

## 10. 공식 참고

- 카카오 설정: https://developers.kakao.com/docs/ko/kakaologin/prerequisite
- 카카오 REST API: https://developers.kakao.com/docs/ko/kakaologin/rest-api
- Spring Security OAuth2 Login 설정: https://docs.spring.io/spring-security/reference/servlet/oauth2/login/advanced.html
- Spring Security OAuth2 등록 구조: https://docs.spring.io/spring-security/reference/servlet/oauth2/login/core.html

후속 순서: 카카오 실제 인증 확인 → 네이버 연결 → 구글 주소/설정 지원 조건 확인 및 조건부 표시. 회원 건강정보 저장·MyPage·운영 동의/탈퇴·계정 연결 정책은 기존 후속 작업으로 유지한다.

- Spring Boot 4 starter 명칭 참고: https://github.com/spring-projects/spring-boot/wiki/Spring-Boot-4.0-Migration-Guide
