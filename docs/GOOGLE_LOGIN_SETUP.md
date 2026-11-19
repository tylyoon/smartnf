# SmartNF 구글 로그인 적용·설정 안내

작성: 2026-10-28 · 네이버 정상 동작 확인 후 구글 추가

## 1. 먼저 변경 파일 적용과 테스트

이 ZIP은 전체 프로젝트가 아니라 최신 네이버 수정본에 덮어쓰는 변경 파일입니다.
압축을 풀면 run_local.sh, src/, docs/가 바로 나옵니다. 이 항목을 build.gradle이 있는 프로젝트 루트에 덮어쓰세요. 별도 smartnf 하위 폴더를 만들지 않습니다.
기존 .env.local과 DB는 유지합니다. 예전 ZIP으로 다시 덮어쓰지 마세요.

서버가 실행 중이면 Ctrl+C로 종료한 뒤 프로젝트 루트에서:

```bash
bash ./gradlew test --no-daemon
```

성공하면 아래 콘솔 설정을 진행합니다. 이 전달 환경에는 Java 17만 있고 Gradle 다운로드 DNS 접속이 실패해 Java 21 빌드/JUnit을 실행하지 못했습니다. 구글 실인증과 MySQL V4도 사용자 PC에서 확인해야 합니다.

## 2. Google Cloud 설정

1. https://console.cloud.google.com/ 에서 SmartNF 프로젝트를 선택하거나 만듭니다.
2. Google Auth Platform에서 Branding(브랜딩), Audience(대상), Data Access(데이터 액세스)를 설정합니다. 앱 이름 SmartNF, 지원 이메일과 개발자 연락 이메일을 등록합니다.
3. 개인 계정으로 시험하면 외부(External) 대상의 테스트 모드로 준비합니다. 콘솔이 테스트 사용자 등록을 요구하거나 테스트 제한이 있으면 실제 사용할 구글 계정을 추가합니다. 불필요한 Google API·Drive·Gmail·이메일·프로필 권한은 추가하지 않습니다. 코드가 요청하는 범위는 openid 하나입니다.
4. Clients(클라이언트)에서 OAuth 클라이언트를 생성합니다. 유형은 **웹 애플리케이션**입니다.
5. **승인된 리디렉션 URI**에 다음 전체 주소를 등록합니다.

```text
http://localhost:8080/login/oauth2/code/google
```

JavaScript SDK를 사용하지 않으므로 승인된 JavaScript 원본 입력은 이 구현에 필요하지 않습니다. 리디렉션 URI 칸에 콜백을 넣어야 합니다.
6. 발급된 Client ID와 Client secret을 .env.local에 직접 입력합니다. 채팅·스크린샷·Git에는 비밀값을 올리지 않습니다.

콘솔 표시명과 배치는 변경될 수 있으며, 필요한 항목이 다르게 보이면 해당 화면에서 확인합니다. 계정 종류·브랜딩 검증·공개 승인까지 끝났다는 의미는 아닙니다.

## 3. 로컬 설정

기존 DB·카카오·네이버 설정은 유지한 채 .env.local에 아래 3개 설정을 추가합니다. 아래 설명용 값을 실제 발급값으로 바꿉니다. 값에 따옴표나 export를 붙이지 않습니다.

```dotenv
GOOGLE_LOGIN_ENABLED=true
GOOGLE_LOGIN_CLIENT_ID=발급받은_실제_Client_ID
GOOGLE_LOGIN_CLIENT_SECRET=발급받은_실제_Client_secret
```

기존 공통 주소는 한 줄만 유지합니다.

```dotenv
SMARTNF_PUBLIC_BASE_URL=http://localhost:8080
```

```bash
bash run_local.sh
```

http://localhost:8080/login 에서 Ctrl+F5로 새로고침합니다. 새 run_local.sh에는 GOOGLE_LOGIN_ 허용 목록이 포함되어 있습니다. 예전 실행 파일로는 지원하지 않는 설정 줄 오류가 납니다.

## 4. 사용자 확인 순서

1. 로그인·회원가입 화면에 카카오 → 네이버 → Google 순서로 설정된 버튼만 표시되는지 확인합니다.
2. Google로 로그인 → 구글 인증 → SmartNF 신규 가입 화면 → 가상 표시 이름·필수 안내 동의 → 가입 완료.
3. Google로 다시 로그인하여 기존 회원으로 홈에 접속합니다.
4. 로그아웃 → Google 재로그인 시 가입 화면으로 되돌아가지 않는지 확인합니다.
5. 기존 이메일·카카오·네이버 로그인도 확인합니다. 동일한 실제 사용자여도 제공자가 다르면 별도 SmartNF 계정이며 자동 병합하지 않습니다.
6. GOOGLE_LOGIN_ENABLED=false로 바꾸고 재시작하면 구글 버튼이 사라져야 합니다. 원래 값으로 복구하고 다시 시작하세요.

MySQL의 smartnf DB에서 확인할 수 있습니다. 사용자 ID·비밀키가 포함된 결과를 공유할 필요는 없습니다.

```sql
SELECT version, description, success
FROM flyway_schema_history ORDER BY installed_rank;
SELECT provider, COUNT(*) AS account_count
FROM social_accounts GROUP BY provider;
```

V4는 구글용 개발 동의 문서 2개를 추가할 뿐 기존 V1~V3·회원·이전 동의 이력을 바꾸지 않습니다. 회원 관련 테이블 수는 그대로입니다. V4 성공 및 provider=google은 실제 서버 실행/가입 후에 확인합니다.

## 5. 배포 주소와 버튼 표시

공식 Google 리디렉션 규칙상 localhost는 HTTP 테스트가 가능하지만 일반 IP 주소는 허용되지 않고 배포 주소는 HTTPS가 필요합니다. **유료 도메인 구매 자체가 필수라는 뜻은 아닙니다.** 실제 도메인의 Google 등록·검증 조건 충족 여부는 배포 시 확인해야 합니다.

- localhost/127.0.0.1: HTTP 또는 HTTPS 개발 주소 지원.
- 공개/사설 IPv4·IPv6 리터럴: 구글 버튼과 로그인 시작 모두 차단.
- HTTPS 도메인: 설정이 완성되고 현재 요청의 프로토콜·호스트·포트가 공통 주소와 일치할 때만 버튼 표시. 명백한 예약 도메인·단일 호스트명 등은 제외합니다.
- 플래그 OFF, ID/secret 누락, 잘못된 공통 주소: 구글 미등록·미노출. 다른 제공자는 자체 조건에 따라 계속 동작합니다.

주소 형식 검사는 Google 등록 성공·실제 키 유효성·공개 승인을 보장하지 않습니다. 외부 IP로만 AWS를 운영하면 GOOGLE_LOGIN_ENABLED=false로 유지하세요. 지원 가능한 HTTPS 주소를 마련한 뒤 구글 콘솔 콜백과 공통 주소를 일치시킵니다. 카카오·네이버도 같은 공통 주소를 사용하므로 해당 콘솔의 콜백도 함께 맞춥니다. 프록시/로드밸런서 뒤에서는 신뢰할 프록시 범위와 외부 주소 전달을 배포 시 검토해야 합니다.

## 6. 구현과 남은 범위

Spring Security OpenID Connect 코드 흐름을 사용합니다. state 및 nonce, ID 토큰 서명·발급자·대상·시각 검증은 프레임워크에 맡깁니다. openid만 요청하고 검증된 sub로 식별하며, 이메일로 자동 연결하지 않습니다. 가입 대기 권한 없음, 10분 제한, 서버 검증 ID 사용, CSRF 및 USER/ADMIN 권한 경계를 유지합니다.

회원 DB에 토큰을 저장하지 않습니다. 액세스/리프레시 토큰은 최종 로그인 세션에도 보관하지 않습니다. OIDC의 검증된 ID 토큰은 인증된 서버 세션의 principal에 포함됩니다. 신규 가입 대기 세션에는 sub·인증 시각만 남기고 인증 상태를 비웁니다. 로그아웃은 SmartNF 세션 종료이며 구글 계정 자체에서 로그아웃하거나 연결 해제를 하지는 않습니다.

아직 실제 구글 인증·V4 적용 확인, 운영용 동의/보관/삭제 정책, SNS 연결·해제·탈퇴, 이메일 소유 확인·비밀번호 재설정, 개인 건강정보 DB 저장·MyPage는 완료되지 않았습니다.

## 공식 근거

- https://developers.google.com/identity/protocols/oauth2/web-server#uri-validation
- https://developers.google.com/identity/openid-connect/openid-connect
- https://docs.spring.io/spring-security/reference/servlet/oauth2/login/core.html
- https://docs.spring.io/spring-security/reference/servlet/oauth2/login/advanced.html
