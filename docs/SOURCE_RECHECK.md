# 문제 자료 11건 원본 재조회

2026-10-27 / 기존 원본·화면·추천 규칙을 변경하지 않는 확인 단계

## 준비

이 파일과 python/data_audit/recheck_sources.py를 기존 smartnf 폴더에 병합합니다. 기존 KDCA·식품안전나라 수집 코드와 인증 설정을 그대로 사용합니다.

필요한 기존 파일:
- python/health_collection/kdca_bulk.py
- python/food_nutrition/collect_recipes.py
- .env.kdca.local의 KDCA_TOKEN
- .env.local의 MFDS_API_KEY

인증키는 채팅에 보내지 않습니다. 실행 도구는 설정값·요청 URL·원본 오류 메시지를 출력하지 않습니다.

## 실행 (프로젝트 루트의 Git Bash)

```bash
python python/data_audit/recheck_sources.py --prepare
python python/data_audit/recheck_sources.py --download
```

서버를 실행하거나 중지할 필요는 없습니다. 첫 명령은 결과 폴더의 Git 제외 규칙만 준비합니다. 두 번째 명령은 저장된 인증키로 재조회합니다.

## 조회 대상

- 건강: 5283, 6759, 6807, 6808, 6809 — 각 ID 직접 조회.
- 레시피: 33, 36, 691, 692, 831, 2980 — ID는 목록 순번이 아닙니다. API 목록을100건씩 확인해6개ID만 별도 저장합니다. 모두 찾으면 중단하며 최대20페이지입니다. 다른 레시피는 응답을 확인하되 저장하지 않습니다.
- 레시피 원본의 기존 최신 전체수집 폴더를 찾아 비교합니다. 기존 건강XML도 읽어 비교합니다. 비교대상 원본이 없으면 baseline_available=false이며 변경 여부를 단정하지 않습니다.

## 결과

python/data_audit/data/source_rechecks/실행시각_고유번호/ 아래에 저장합니다.

- summary.json: 11건의 결과·변경여부·누락상태·제목일치·본문중복묶음·비교가능여부. 이 파일만 공유하면 됩니다.
- REPORT.md: 간단한 결과표.
- ID.xml / ID.json: 대상 건강자료 새 원본.
- recipe_ID.raw.json / recipe_ID.json: 대상 레시피 새 원본·정규화 자료.
- baseline_sources.json: 비교에 사용한 프로젝트 내부 원본 위치.

완료 출력의 건강5/5·레시피6/6·전체조회True는 조회 성공이지 내용 검토 완료가 아닙니다. source_issue_remains는 원문에 누락이 여전히 있다는 뜻입니다. source_fields_present_review_required도 검토 후 반영해야 합니다.

실패·호출제한·중복응답·전체건수변화 시 부분 결과를 보존하고 complete=false로 표시합니다. 재실행하면 새 폴더를 만들며 기존 실행 결과를 덮어쓰지 않습니다. 누락된 조리단계를 임의로 만들거나 기존 추천/품질보류 상태를 해제하지 않습니다.

오프라인 모의응답 검사5개 통과. 실제 인증API는 사용자PC에서 실행 후 확인해야 합니다.
