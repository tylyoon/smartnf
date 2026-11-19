# SmartNF 통합 실행 적용 안내

## 적용

1. 현재 켜 둔 SmartNF와 자체 모델 터미널에서 각각 `Ctrl+C`로 종료한다.
2. ZIP의 `run_local.sh`, `scripts/`, `llm/`, `logs/`, `docs/`를 SmartNF 프로젝트의 같은 위치에 복사한다. `llm/`에는 실행 스크립트만 들어 있으며 기존 모델 파일은 별도로 보관된 상태에서 사용한다.
3. 프로젝트 루트의 Git Bash에서 실행한다.

```bash
bash run_local.sh
```

새 기본 실행 순서는 설치된 llama.cpp 탐색 → 모델 서버 시작 → 준비 완료 확인 → SmartNF 실행이다. SmartNF가 기동하면 사진 검색 예약 작업도 서버 안에서 동작한다. 실행한 터미널을 켜 두고, 종료할 때 `Ctrl+C`를 누른다.

## 자동으로 찾는 항목

- 프로젝트 `.venv`의 Python을 우선 사용한다.
- llama-server가 PATH에 없으면 사용자·시스템 WinGet의 Links와 `ggml.llamacpp_*` Packages 폴더를 탐색한다. 사용자 이름을 고정하지 않는다.
- 기본 모델 파일은 `llm/food-parser/models/Qwen_Qwen3-4B-Instruct-2507-Q4_K_M.gguf`다.
- 모델 준비 여부와 `smartnf-food-parser` 별칭을 확인한다. 같은 포트의 준비된 모델은 재사용한다. 다른 모델이나 서비스가 있으면 안내하고 중단한다.
- 같은 프로젝트의 통합 실행을 중복으로 켜면 먼저 실행 중인 터미널을 확인하도록 안내한다.

## 선택 설정

현재 `.env.local`에 아래 키가 있으면 읽는다. 기본 실행에는 새 설정 줄을 추가하지 않아도 된다.

| 키 | 기본값·용도 |
|---|---|
| `SMARTNF_LOCAL_LLM_ENABLED` | `true`, 자체 모델 함께 실행. `false`이면 웹 서버만 실행 |
| `SMARTNF_LLM_PORT` | `8091` |
| `SMARTNF_LLM_MODEL_PATH` | 기본 모델 경로 대신 사용할 파일 |
| `SMARTNF_LLM_EXECUTABLE` | 자동 탐색 대신 사용할 llama-server 실행 파일 경로 |
| `SMARTNF_LLM_STARTUP_TIMEOUT` | 준비 대기 최대 `300`초, 1~1800초 범위 |

기존 환경변수도 사용하지만 같은 키가 `.env.local`에 있으면 파일 값이 적용된다. `.env.local`은 기존처럼 `키=값` 형식의 데이터로 읽고 쉘 코드로 실행하지 않는다. 실제 키나 비밀번호를 이번 변경 파일에 넣지 않았다.

## 종료와 로그

- 통합 실행이 직접 시작한 SmartNF와 모델은 `Ctrl+C` 또는 실행 오류 때 함께 정리한다.
- 처음부터 다른 터미널에 실행 중이던 모델은 재사용하며, 그 모델의 종료는 원래 터미널에서 관리한다. 처음 적용할 때 두 서버를 모두 닫은 뒤 통합 실행을 시작하면 한 터미널에서 관리할 수 있다.
- 모델 로그는 `logs/local-services/model.log`다. 새 모델 시작 때 해당 로그를 갱신한다. 같은 폴더의 잠금 파일과 로그는 동봉한 `.gitignore`로 Git에서 제외한다.
- 모델 파일·실행 파일을 찾지 못하거나 준비 시간이 초과되면 원인을 안내한다.
- 기존 `demo-seed`·`demo-delete` 실행은 종전의 전용 경로를 사용한다.

## 검증 범위

모의 모델·모의 Gradle을 사용해 준비 대기, 환경변수 전달, 중복 실행 거부, 모델 비활성화, 타임아웃·모델 오류·앱 오류 정리, `Ctrl+C`와 프로세스 그룹 종료, 기존 모델 재사용과 보호를 확인했다. WinGet 패키지 경로 탐색은 임시 폴더로, Windows PID 트리 종료 호출은 모의 검사로 확인했다. 실제 Windows Git Bash·Vulkan 모델·Spring Boot를 함께 실행하는 확인은 사용자 PC에서 필요하다.

준비 상태 확인은 llama.cpp 공식 `/health` 및 `/v1/models` API를 기준으로 구성했다. [llama.cpp 서버 문서](https://github.com/ggml-org/llama.cpp/blob/master/tools/server/README.md)
