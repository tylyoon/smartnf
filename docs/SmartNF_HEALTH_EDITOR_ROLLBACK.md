# 마지막 건강정보 업데이트 원상복구

대상은 SmartNF_HEALTH_EDITOR_RESTORE_UPDATE.zip(142절)만입니다. 앞선 오늘의 선택·장보기·외식 기능은 유지합니다.

1. 실행 중인 서버를 종료합니다.
2. 이 ZIP을 프로젝트 최상위에 풀어 같은 경로를 덮어씁니다.
3. 프로젝트 폴더에서 `bash rollback_health_editor.sh`를 실행합니다. 마지막 업데이트에만 추가됐던 HealthEditorPageTests.java를 제거합니다.
4. `bash run_local.sh`로 시작한 뒤 브라우저에서 Ctrl+F5를 누릅니다.

MyPage에 기존 대시보드·왼쪽 메뉴가 다시 표시되는지 확인하세요. 건강정보 자동 불러오기/신규 수정 UI는 취소합니다. 원래 /health/info 계정 편집 기능은 이전 상태로 유지됩니다.

원인: 마지막 ZIP의 HealthPageController.java가 오래된 통합 MyPage 매핑을 포함했습니다. 변경 전 SmartNF_INGREDIENT_REFERENCE_UPDATE.zip의 컨트롤러로 /mypage·/mypage/examples·/mypage/daily의 personal-mypage 연결을 복구했습니다. 나머지 JS/CSS/템플릿/응답 필터는 업데이트 직전 사본으로 되돌렸습니다.

DB·계정·저장된 건강정보·선택 식품·계획을 삭제하거나 되돌리는 SQL은 없습니다. 검증 범위는 복구 파일 비교/경로 매핑/JS 문법 및 정리 스크립트의 지정 파일 제거입니다. 실제 사용자 서버 화면 확인은 재시작 후 필요합니다.
