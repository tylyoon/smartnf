# 네이버 로그인 1차 연결·설정 안내

작성일: 2026-10-28. 상태: 구현본 작성 / Java 빌드·실제 네이버 인증·V3 로컬 적용 확인 대기.

## 1. 유지·추가 범위

SmartNF 통합 프로젝트에 네이버 로그인을 추가한다. 일반 이메일 인증과 사용자 PC에서 정상 확인한 카카오 인증은 유지한다. 네이버 로그인은 NAVER Developers에 등록하는 별도 로그인 API 설정을 사용한다. 기존 NAVER Maps/API HUB 지역 검색 키는 로그인 키로 재사용하지 않는다.

네이버도 명시적 활성화·서버 키·고정 공개 원점·요청 주소 일치를 만족할 때만 버튼을 표시한다. 미설정·비활성·다른 주소에서는 네이버 버튼이 숨겨지고 카카오/이메일은 기존 조건에 따라 유지된다. Google은 아직 등록·표시하지 않는다.

## 2. 인증·가입 처리

- Spring Security의 OAuth authorization code/state 흐름을 사용한다.
- 네이버 인가/토큰 엔드포인트는 nid.naver.com, 프로필은 openapi.naver.com/v1/nid/me로 고정한다.
- 네이버 토큰 발급 POST body에 client_id/client_secret/code 등 기본 값과 검증된 인가 요청의 state를 포함한다. 카카오에는 추가 state 파라미터를 넣지 않는다.
- 프로필 resultcode=00과 response.id를 확인하고 id만 최상위로 정규화한다. 다른 프로필 속성은 principal·회원 DB에 저장하지 않는다.
- response.id는 숫자가 아닌 불투명한 문자열로 취급하고 대소문자·원문을 보존한다. provider=naver와 ID를 함께 조회한다. 같은 ID 문자열이어도 카카오와 네이버는 별도 계정이다.
- 기존 네이버 회원은 ACTIVE 상태 및 USER/ADMIN 권한 확인 후 로그인한다.
- 처음 인증한 사용자는 서버 세션에 ID/시각만 10분 보관하고, 표시 이름·SmartNF 안내 동의를 확인한 뒤 회원·SNS 연결·USER 권한·동의 이력을 한 트랜잭션으로 만든다.
- 가입 대기는 실제 회원 로그인 권한이 없고, 요청으로 받은 providerId/memberId/role을 신뢰하지 않는다. 가입 완료 후 로그인 화면에서 네이버 버튼을 다시 눌러 접속한다.
- 이메일·표시 이름으로 기존 일반/카카오 회원을 자동 병합하지 않는다. 기존 계정에 SNS를 추가 연결/해제하는 UI는 후속이다.
- OAuth 토큰은 최종 로그인 세션·DB에 보관하지 않는다. SmartNF 로그아웃이 네이버 자체의 브라우저 로그인까지 종료하는 것은 아니다.

공통 인가 등록·UserService·성공/실패 처리를 제공자별로 분기했다. 새 OAuth 흐름의 성공/실패 때 이전 제공자의 가입 대기 상태를 함께 정리한다. 기존 KakaoOAuthConfiguration/KakaoAuthorizationResolver 파일명은 ZIP 병합 때 예전 설정이 중복 남지 않도록 유지했지만 내부는 두 제공자를 지원한다.

## 3. DB 변경

V1/V2와 기존 회원 데이터는 변경하지 않는다. V3__add_naver_dev_consent_documents.sql로 dev-naver-20261028 버전의 개발용 TERMS/PRIVACY 2개만 추가한다. social_accounts 등 기존 6개 회원 테이블을 재사용한다.

네이버 가입 안내는 /signup/documents/naver-terms 및 /signup/documents/naver-privacy이다. 운영용 약관·보관/탈퇴 정책 확정을 대신하지 않는다. 기존 일반/카카오 동의 문서는 그대로 보존한다.

## 4. 먼저 적용·테스트

1. 서버를 Ctrl+C로 중지하고 프로젝트를 백업한다.
2. ZIP의 src/, docs/, run_local.sh 및 값이 없는 .env.naver-login.example을 smartnf 루트에 병합한다.
3. 기존 .env.local과 키는 교체하지 않는다. 네이버 설정을 아직 넣지 않아도 기존 기능을 테스트할 수 있다.
4. 아래 명령을 실행한다.

```bash
bash ./gradlew test --no-daemon
```

테스트는 H2·가짜 키로 고정하며 실제 사용자 MySQL이나 네이버 인증 API를 호출하지 않도록 구성한다. 토큰 HTTP 검사는 MockRestServiceServer가 처리한다. Java 테스트 성공 후 개발자 콘솔 설정·실제 인증을 별도로 확인한다.

## 5. NAVER Developers 앱 설정

공식 문서 확인일: 2026-10-28. 콘솔 화면이 다르면 실제 화면을 기준으로 위치를 확인한다.

1. https://developers.naver.com/ 에 로그인한다.
2. Application → 내 애플리케이션에서 로그인용 SmartNF 앱을 확인한다. 없다면 애플리케이션 등록에서 SmartNF 로그인용 앱을 만든다.
3. 사용 API에 네이버 로그인을 선택하고 웹 서비스 환경을 추가한다.
4. 로컬 기준 서비스 URL과 Callback URL을 다음과 같이 맞춘다.

| 항목 | 값 |
|---|---|
| 서비스 URL | http://localhost:8080 |
| Callback URL | http://localhost:8080/login/oauth2/code/naver |

Callback URL은 코드의 redirect_uri와 정확히 일치해야 한다. 주소·포트·경로를 임의로 바꾸지 않는다. 등록 화면에서 localhost URL이 거부된다면 임의의 다른 주소를 넣지 말고 해당 화면을 확인한다.

회원 식별에 response.id만 사용하므로 이메일·이름·연락처 등의 추가 프로필 제공 항목을 이 코드 때문에 필수로 요구하지 않는다. 콘솔이 제공하는 선택지와 검수 요구를 확인하고 사용하지 않는 개인정보 요청은 최소화한다.

개발 중 앱은 테스트 가능한 계정에 제한이 있다. 멤버 관리의 테스터 등록 및 현재 계정의 이용 가능 여부를 확인한다. 불특정 사용자를 대상으로 공개 적용하려면 네이버 사전 검수가 별도 필요하다. 로컬 인증 성공을 검수 승인으로 표시하지 않는다.

네이버 식별 ID는 앱별이므로 로컬→배포 주소 변경 시 가능하면 같은 로그인 앱의 서비스/Callback URL을 갱신한다. 앱을 새로 만들면 기존 사용자 ID가 달라질 수 있다.

## 6. 기존 .env.local에 선택 설정 추가

아래 변수명 3개를 사용한다. 예시 문구가 아닌 콘솔에서 복사한 실제 값을 오른쪽에 입력한다. 따옴표 없이 한 줄씩 입력하고 키를 채팅·Git·캡처에 노출하지 않는다.

```dotenv
NAVER_LOGIN_ENABLED=true
NAVER_LOGIN_CLIENT_ID=여기에_로그인용_Client_ID
NAVER_LOGIN_CLIENT_SECRET=여기에_로그인용_Client_Secret
```

기존의 공통 주소는 다음 값 하나만 유지한다. 이미 카카오 설정 때 있다면 다시 추가하지 않는다.

```dotenv
SMARTNF_PUBLIC_BASE_URL=http://localhost:8080
```

DB/Flyway·카카오·네이버 지도/검색 변수는 그대로 유지한다. NAVER_LOGIN_*는 NAVER_SEARCH_CLIENT_*와 다른 설정이다. 준비 전에는 NAVER_LOGIN_ENABLED=false로 두거나 위 새 줄을 추가하지 않으면 된다.

```bash
bash run_local.sh
```

실행 스크립트는 새 3개 변수를 허용 목록으로 읽어 서버에 전달한다. 기존처럼 파일 내용을 쉘 코드로 실행하지 않고 비밀값도 출력하지 않는다.

## 7. 실제 확인 순서

1. http://localhost:8080/login 을 Ctrl+F5로 열어 준비된 카카오/네이버 버튼 확인. 미설정 제공자와 Google은 표시되지 않아야 한다.
2. 네이버 버튼 → 네이버 인증 → 최초 SmartNF 가입 화면 → 가상 표시 이름·개발용 안내 동의 → 가입 완료.
3. 네이버 버튼 재클릭 → 홈의 표시 이름·로그아웃 버튼 확인.
4. 로그아웃 후 다시 네이버 로그인하여 가입 화면 없이 기존 회원으로 들어가는지 확인.
5. 카카오·이메일 로그인도 재확인한다. 로그인 계정 변경 시 이전 계정의 브라우저 건강정보/식품 임시 선택이 섞이지 않아야 한다.
6. 인증 취소·가입 취소·대기 만료·주소 불일치·미설정 상태와 모바일 표시를 확인한다.

키나 회원 ID 없이 상태를 확인하는 SQL:

```sql
SELECT version, description, success FROM smartnf.flyway_schema_history ORDER BY installed_rank;
SELECT provider, COUNT(*) AS account_count FROM smartnf.social_accounts GROUP BY provider;
SELECT consent_type, version FROM smartnf.consent_documents ORDER BY id;
```

정상 적용 시 기존 7개 테이블을 유지하고 V1/V2/V3가 success=1이다. 동의 문서는 기존 일반2·카카오2에 네이버2가 추가된다. 새 네이버 회원에게 local_credentials나 가짜 비밀번호를 만들지 않는다.

## 8. 검증 결과·후속

| 검사 | 상태 |
|---|---|
| 런처 bash 문법·모의 실행 | 통과: SNS 미설정/카카오만/네이버만/둘 다, CRLF, 특수문자 원문, DB·지도·검색 보존, 비밀값 미출력 |
| HTML 중첩 form·정적 구조 | 통과 |
| V1/V2 원본 비교 | 기존 전달본과 동일 |
| Java/JUnit | 프로필 정규화/오류·opaque ID·설정/원점·신규/기존/정지 회원·권한/CSRF/state/만료·토큰 POST·제공자 분리 검사 작성. Gradle DNS 실패·Java21 부재로 이 환경 실행 미확인 |
| 실제 네이버 인증·MySQL V3·브라우저/모바일 | 사용자 환경 확인 대기 |

카카오의 기존 사용자 확인은 그대로 완료 기록으로 유지하되, 이번 공통 OAuth 변경 뒤의 카카오 회귀 검증은 별도 필요하다. 네이버 완료 후 Google의 주소/HTTPS/URI 지원 조건을 공식 확인하고 사용 가능한 환경에서만 버튼을 노출한다. 회원 건강정보 DB 저장·MyPage·운영 동의/탈퇴·기존 계정 SNS 추가 연결은 기존 후속 작업이다.

## 9. 공식 참고

- 네이버 인증 API: https://developers.naver.com/docs/login/api/api.md
- 회원 프로필: https://developers.naver.com/docs/login/profile/profile.md
- 개발·검수: https://developers.naver.com/docs/login/devguide/devguide.md
- Callback URL 일치: https://help.naver.com/service/23029/contents/19600?lang=ko
- Spring 토큰 파라미터 확장: https://docs.spring.io/spring-security/reference/servlet/oauth2/client/authorization-grants.html
- 중첩 프로필 변환: https://docs.spring.io/spring-security/reference/api/java/org/springframework/security/oauth2/client/userinfo/DefaultOAuth2UserService.html
