# 통합 실행 포트 확인 수정본

ZIP을 풀고 `scripts/local_services.py`를 SmartNF 프로젝트의 같은 경로에 덮어쓰세요.

프로젝트 루트에서 실행하세요.

```bash
bash run_local.sh
```

모델 재다운로드와 API 키 재입력은 필요하지 않습니다. 기존 `.env.local` 설정을 사용합니다.

계속 실패하면 터미널의 새 오류 메시지 전체를 보내주세요. 모델 실행 로그는 `logs/local-services/model.log`에 있습니다. 실제 Windows 환경에서 재실행 결과 확인이 필요합니다.

전체 개선 기록과 최신 목차는 함께 제공한 `SmartNF_IMPROVEMENTS.md` 174절에 있습니다.
