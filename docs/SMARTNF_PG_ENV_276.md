# SmartNF 276 · 로컬 실행 스크립트의 PG 설정 허용

2026-11-19

## 원인

기존 run_local.sh는 .env.local의 이름을 허용 목록으로 검사합니다. PG 변수 3종을 목록에 추가하지 않은 상태에서 .env.local에 키를 입력하면 '지원하지 않는 설정 줄' 오류로 시작이 중단됩니다. source .env.local을 먼저 실행해도 이후 run_local.sh가 다시 검사하므로 해결되지 않습니다.

## 적용

1. SmartNF 프로젝트 루트에 SmartNF_PG_ENV_FIX_276.zip을 폴더 구조대로 덮어씁니다.
2. 기존 .env.local의 PG 설정을 유지합니다. 키를 다시 발급할 필요는 없습니다.
3. 프로젝트 루트의 Git Bash에서 아래 명령을 실행합니다.

```bash
python tools/business/setup_payment_env.py && bash run_local.sh
```

수정 도구는 현재 PC의 run_local.sh에서 알고 있는 허용 목록 형식이 일치할 때만 PG 항목을 추가합니다. 원본은 run_local.sh.before-pg-276으로 한 번 백업합니다. 알 수 없는 형식이나 이미 존재하는 백업은 덮어쓰지 않고 중단합니다. 이미 정상 반영한 도구는 다시 실행해도 재수정하지 않습니다.

PG 변수는 SMARTNF_TOSS_CLIENT_KEY, SMARTNF_TOSS_SECRET_KEY, SMARTNF_TOSS_WEBHOOK_TOKEN입니다. 값 전체를 감싼 작은따옴표 또는 큰따옴표는 제거한 뒤 해당 이름으로만 export합니다. eval이나 source로 설정값을 실행하지 않습니다. 다른 미지원 설정은 계속 거부합니다.

이 도구는 .env.local 파일을 읽거나 변경하지 않으며 키 값도 출력하지 않습니다. 변경될 때 셸 스크립트의 UTF-8 BOM은 제거하고 줄바꿈은 LF로 통일합니다. 별도의 set -a 또는 source .env.local을 먼저 실행할 필요가 없습니다. 이후에는 기존 bash run_local.sh만 사용합니다.

## 검증과 반영 기록

자동 검증 6건 통과. 따옴표 유무와 CRLF 설정 줄 전달, 셸 구문 문자열의 비실행, 원본 백업·반복 실행, 미지원 설정 거부, 알 수 없는 형식 및 기존 백업 보존을 확인했습니다. 보관 중인 실행 스크립트 2종에도 패치를 적용하고 Bash 구문 검사, 실제 PG Python 처리기에서 테스트 설정 활성화·시크릿 미반환을 확인했습니다. 사용자 PC에서의 실제 서버 기동과 PG 승인 통신은 후속 확인 대상입니다.

275 적용 후 빌드 성공, 274 가격 카드 표시 확인, GitHub main a8ce0e3 푸시 성공은 사용자 보고로 기록했습니다. 어제 확인한 거래 흐름은 반복하지 않고 PG 테스트 연결을 이어갑니다.

수정 후 Git에 반영할 때에는 run_local.sh와 tools/business/setup_payment_env.py, tests/test_payment_env_setup.py, docs의 변경 기록을 포함합니다. .env.local과 원본 백업은 커밋하지 않습니다.
