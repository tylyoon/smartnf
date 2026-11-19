# 개인 취향 추천 연결 검사

PreferenceIntegrationCheck.java는 실제 변경 서비스/생성 컨트롤러 + 기존 RecipeTastePolicy + 실제 Spring/Jackson/H2를 사용한다. identity-fixtures는 독립 검사에서만 회원 식별을 대체하며 프로젝트 src/main/java에 복사하지 않는다. 실제 인증·CSRF 필터 전체 통합 검사는 아니다.

Java21과 Spring web/context/core/beans/jdbc/tx/expression/security-core, Jackson3 databind/core, Jackson annotations, H2, commons-logging JAR 경로들을 --classpath로 전달해 run-java-checks.py를 실행한다. 기존 RecipeTastePolicy가 있는 프로젝트 루트를 --project-dir로 지정한다. 자동으로 외부 의존성을 설치하지 않는다.

preference-ui.test.cjs는 실제 추천 템플릿/추천 JS/취향 JS를 JSDOM+모의 API에서 실행한다. jsdom을 별도 설치하거나 SMARTNF_TEST_JSDOM에 모듈 경로를 지정한 후 node로 실행한다.

검사 항목과 실제 환경 확인 범위는 docs/PERSONAL_RECIPE_PREFERENCE.md에 기록했다.
