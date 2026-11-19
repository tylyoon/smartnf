#!/usr/bin/env bash
# Windows Git Bash에서 실행합니다. 비밀번호를 로그에 출력하지 않습니다.
set +x
set -euo pipefail
cd -- "$(dirname -- "${BASH_SOURCE[0]}")"

fail() { printf '%s\n' "$1" >&2; exit 1; }

[[ -f gradlew && -f build.gradle ]] || fail "smartnf 프로젝트 루트에 이 파일을 넣어주세요."
git rev-parse --show-toplevel >/dev/null 2>&1 || fail "Git 저장소에서 실행해주세요."
[[ -z "$(git ls-files -- .env.local)" ]] || fail ".env.local이 이미 Git에 등록되어 있습니다. 실행을 중단합니다."

[[ $# -le 1 ]] || fail "사용법: bash run_local.sh [demo-seed|demo-delete]"
task_demo_action=''
case "${1:-}" in
    '') ;;
    demo-seed) task_demo_action='seed' ;;
    demo-delete) task_demo_action='delete' ;;
    *) fail "사용법: bash run_local.sh [demo-seed|demo-delete]" ;;
esac
[[ -f .env.local ]] || fail ".env.example을 참고하여 .env.local을 준비해주세요."
git check-ignore -q -- .env.local || fail ".env.local이 Git에서 제외되지 않았습니다."
[[ -z "${SPRING_APPLICATION_JSON:-}" ]] || fail "SPRING_APPLICATION_JSON이 설정되어 있습니다. 다른 설정과 충돌할 수 있으므로 확인해주세요."

task_mail_enabled='false' task_mail_from='' task_smtp_host='' task_smtp_port='587' task_smtp_user='' task_smtp_password=''
task_db_url='' task_db_user='' task_db_password='' task_flyway_password=''
task_google_enabled='false' task_google_id='' task_google_secret=''
task_naver_login_enabled='false' task_naver_login_id='' task_naver_login_secret=''
task_kakao_enabled='false' task_kakao_id='' task_kakao_secret='' task_public_base=''
task_naver_map_key='' task_naver_search_id='' task_naver_search_secret=''
while IFS= read -r task_line || [[ -n "$task_line" ]]; do
    task_line=${task_line%$'\r'}
    case "$task_line" in
        ''|'#'*) continue ;;
        SMARTNF_DATA_GO_KR_SERVICE_KEY=*) ;;
        # SmartNF PG environment 276
        SMARTNF_TOSS_CLIENT_KEY=*|SMARTNF_TOSS_SECRET_KEY=*|SMARTNF_TOSS_WEBHOOK_TOKEN=*)
            task_pg_name=${task_line%%=*}
            task_pg_value=${task_line#*=}
            case "$task_pg_value" in
                \'*\'|\"*\") task_pg_value=${task_pg_value:1:-1} ;;
            esac
            export "$task_pg_name=$task_pg_value"
            unset task_pg_name task_pg_value
            ;;
        DB_URL=*) task_db_url=${task_line#*=} ;;
        DB_USERNAME=*) task_db_user=${task_line#*=} ;;
        DB_PASSWORD=*) task_db_password=${task_line#*=} ;;
        FLYWAY_PASSWORD=*) task_flyway_password=${task_line#*=} ;;
        MFDS_API_KEY=*) ;;
        SMARTNF_PHOTO_MFDS_API_KEY=*) export SMARTNF_PHOTO_MFDS_API_KEY="${task_line#*=}" ;;
        SMARTNF_PHOTO_TOUR_API_KEY=*) export SMARTNF_PHOTO_TOUR_API_KEY="${task_line#*=}" ;;
        GEMINI_RECIPE_MODEL=*) export GEMINI_RECIPE_MODEL="${task_line#*=}" ;;
        SMARTNF_GROUNDING_ENABLED=*) export SMARTNF_GROUNDING_ENABLED="${task_line#*=}" ;;
        SMARTNF_GROUNDING_DAILY_LIMIT=*) export SMARTNF_GROUNDING_DAILY_LIMIT="${task_line#*=}" ;;
        GEMINI_GROUNDING_MODEL=*) export GEMINI_GROUNDING_MODEL="${task_line#*=}" ;;
        GEMINI_PRICE_MODEL=*) export GEMINI_PRICE_MODEL="${task_line#*=}" ;;
        SMARTNF_GEMINI_DAILY_LIMIT=*) export SMARTNF_GEMINI_DAILY_LIMIT="${task_line#*=}" ;;
        SMARTNF_PRICE_AUTO_REFRESH=*) export SMARTNF_PRICE_AUTO_REFRESH="${task_line#*=}" ;;
        SMARTNF_PRICE_DATA_DIR=*) export SMARTNF_PRICE_DATA_DIR="${task_line#*=}" ;;
        GEMINI_API_KEY=*) export GEMINI_API_KEY="${task_line#*=}" ;;
        SMARTNF_LOCAL_LLM_ENABLED=*) export SMARTNF_LOCAL_LLM_ENABLED="${task_line#*=}" ;;
        SMARTNF_LLM_PORT=*) export SMARTNF_LLM_PORT="${task_line#*=}" ;;
        SMARTNF_LLM_MODEL_PATH=*) export SMARTNF_LLM_MODEL_PATH="${task_line#*=}" ;;
        SMARTNF_LLM_EXECUTABLE=*) export SMARTNF_LLM_EXECUTABLE="${task_line#*=}" ;;
        SMARTNF_LLM_STARTUP_TIMEOUT=*) export SMARTNF_LLM_STARTUP_TIMEOUT="${task_line#*=}" ;;
        SMARTNF_ACCOUNT_MAIL_ENABLED=*) task_mail_enabled=${task_line#*=} ;;
        SMARTNF_ACCOUNT_MAIL_FROM=*) task_mail_from=${task_line#*=} ;;
        SMARTNF_SMTP_HOST=*) task_smtp_host=${task_line#*=} ;;
        SMARTNF_SMTP_PORT=*) task_smtp_port=${task_line#*=} ;;
        SMARTNF_SMTP_USERNAME=*) task_smtp_user=${task_line#*=} ;;
        SMARTNF_SMTP_PASSWORD=*) task_smtp_password=${task_line#*=} ;;
        GOOGLE_LOGIN_ENABLED=*) task_google_enabled=${task_line#*=} ;;
        GOOGLE_LOGIN_CLIENT_ID=*) task_google_id=${task_line#*=} ;;
        GOOGLE_LOGIN_CLIENT_SECRET=*) task_google_secret=${task_line#*=} ;;
        NAVER_LOGIN_ENABLED=*) task_naver_login_enabled=${task_line#*=} ;;
        NAVER_LOGIN_CLIENT_ID=*) task_naver_login_id=${task_line#*=} ;;
        NAVER_LOGIN_CLIENT_SECRET=*) task_naver_login_secret=${task_line#*=} ;;
        KAKAO_LOGIN_ENABLED=*) task_kakao_enabled=${task_line#*=} ;;
        KAKAO_REST_API_KEY=*) task_kakao_id=${task_line#*=} ;;
        KAKAO_CLIENT_SECRET=*) task_kakao_secret=${task_line#*=} ;;
        SMARTNF_PUBLIC_BASE_URL=*) task_public_base=${task_line#*=} ;;
        NAVER_MAP_KEY_ID=*) task_naver_map_key=${task_line#*=} ;;
        NAVER_SEARCH_CLIENT_ID=*) task_naver_search_id=${task_line#*=} ;;
        NAVER_SEARCH_CLIENT_SECRET=*) task_naver_search_secret=${task_line#*=} ;;
        *) fail ".env.local에 지원하지 않는 설정 줄이 있습니다." ;;
    esac
done < .env.local
[[ -n "$task_db_url" && -n "$task_db_user" && -n "$task_db_password" ]] || fail "DB 접속 설정이 비어 있습니다."
[[ -n "$task_flyway_password" ]] || fail ".env.local에 FLYWAY_PASSWORD를 입력해주세요."
export FLYWAY_PASSWORD="$task_flyway_password"
export SPRING_FLYWAY_URL="$task_db_url"
export SPRING_FLYWAY_USER=smartnf_migration
export SPRING_FLYWAY_PASSWORD="$task_flyway_password"
export DB_URL="$task_db_url" DB_USERNAME="$task_db_user" DB_PASSWORD="$task_db_password"
# Spring의 표준 환경변수에도 같은 값을 전달해 기존 값과의 충돌을 방지합니다.
export SPRING_DATASOURCE_URL="$task_db_url"
export SPRING_DATASOURCE_USERNAME="$task_db_user"
export SPRING_DATASOURCE_PASSWORD="$task_db_password"
# 네이버 설정은 선택 항목입니다. 키·비밀번호 값은 출력하지 않습니다.
export NAVER_MAP_KEY_ID="$task_naver_map_key"
export NAVER_SEARCH_CLIENT_ID="$task_naver_search_id"
export NAVER_SEARCH_CLIENT_SECRET="$task_naver_search_secret"
export GOOGLE_LOGIN_ENABLED="$task_google_enabled"
export GOOGLE_LOGIN_CLIENT_ID="$task_google_id" GOOGLE_LOGIN_CLIENT_SECRET="$task_google_secret"
unset task_google_enabled task_google_id task_google_secret
export NAVER_LOGIN_ENABLED="$task_naver_login_enabled"
export NAVER_LOGIN_CLIENT_ID="$task_naver_login_id" NAVER_LOGIN_CLIENT_SECRET="$task_naver_login_secret"
unset task_naver_login_enabled task_naver_login_id task_naver_login_secret
export KAKAO_LOGIN_ENABLED="$task_kakao_enabled"
export KAKAO_REST_API_KEY="$task_kakao_id" KAKAO_CLIENT_SECRET="$task_kakao_secret"
export SMARTNF_PUBLIC_BASE_URL="$task_public_base"
unset task_kakao_enabled task_kakao_id task_kakao_secret task_public_base
unset task_db_url task_db_user task_db_password task_flyway_password task_line
unset task_naver_map_key task_naver_search_id task_naver_search_secret
export SMARTNF_ACCOUNT_MAIL_ENABLED="$task_mail_enabled" SMARTNF_ACCOUNT_MAIL_FROM="$task_mail_from"
export SMARTNF_SMTP_HOST="$task_smtp_host" SMARTNF_SMTP_PORT="$task_smtp_port"
export SMARTNF_SMTP_USERNAME="$task_smtp_user" SMARTNF_SMTP_PASSWORD="$task_smtp_password"
unset task_mail_enabled task_mail_from task_smtp_host task_smtp_port task_smtp_user task_smtp_password
if [[ -n "$task_demo_action" ]]; then
    if [[ "$task_demo_action" == 'seed' ]]; then
        IFS= read -r -s -p "가상 회원 공통 비밀번호 입력: " SMARTNF_DEMO_PASSWORD
        printf '\n'
        IFS= read -r -s -p "공통 비밀번호 다시 입력: " task_demo_confirm
        printf '\n'
        [[ "$SMARTNF_DEMO_PASSWORD" == "$task_demo_confirm" ]] || fail "비밀번호가 일치하지 않습니다."
        export SMARTNF_DEMO_PASSWORD
        unset task_demo_confirm
    fi
    printf '%s\n' "가상 데이터 전용 로컬 실행입니다. 외부 접속 없이 127.0.0.1에서 실행합니다."
    exec bash ./gradlew bootRun --no-daemon --args="--spring.profiles.active=local-demo --server.address=127.0.0.1 --smartnf.local-demo.action=$task_demo_action"
fi
# 기본 실행은 자체 모델과 웹 서버를 함께 관리합니다.
[[ -f scripts/local_services.py ]] || fail "업데이트 ZIP의 scripts 폴더도 프로젝트에 복사해주세요."
if [[ -f .venv/Scripts/python.exe ]]; then
    task_python='.venv/Scripts/python.exe'
elif [[ -x .venv/bin/python ]]; then
    task_python='.venv/bin/python'
elif command -v python3 >/dev/null 2>&1; then
    task_python='python3'
elif command -v python >/dev/null 2>&1; then
    task_python='python'
else
    fail "Python을 찾을 수 없습니다. 가상환경을 활성화하고 다시 실행하세요."
fi
export SMARTNF_LOCAL_LLM_ENABLED="${SMARTNF_LOCAL_LLM_ENABLED:-true}"
export SMARTNF_LLM_PORT="${SMARTNF_LLM_PORT:-8091}"
# Native Windows Python must call this Git Bash, rather than another bash installation.
if command -v cygpath >/dev/null 2>&1; then
    export SMARTNF_RUNNER_BASH="$(cygpath -am "$BASH")"
else
    export SMARTNF_RUNNER_BASH="$BASH"
fi
exec "$task_python" scripts/local_services.py
