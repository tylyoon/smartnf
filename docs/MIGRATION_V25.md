# V25 적용 전·후 확인

서버를 종료한 상태에서 DB를 백업한 뒤 변경 파일을 적용합니다. 예시(Git Bash):

```bash
mysqldump --single-transaction --no-tablespaces -h 127.0.0.1 -u smartnf_app -p smartnf > smartnf_before_v25.sql
```

백업 파일에 오류 대신 실제 테이블 DDL과 데이터가 들어 있는지 확인하세요. 비밀번호를 명령문에 넣지 않습니다. 백업 파일은 공개 저장소에 올리지 않습니다.

적용 전 아래 개수를 기록해 두면 기존 연결과 평가의 보존을 확인할 수 있습니다.

```sql
SELECT COUNT(*) AS saved_count FROM my_recipes;
SELECT COUNT(*) AS taste_count FROM my_recipe_taste;
SELECT COUNT(*) AS prediction_count FROM my_recipe_prediction;
```

203차까지 적용한 프로젝트에서 src를 덮어쓴 뒤 bash run_local.sh로 시작하면 Flyway V25가 실행됩니다. 이전 버전 서버와 동시 실행하지 마세요. MySQL의 DDL은 전체 이전을 하나의 트랜잭션으로 롤백하지 않으므로, 이전 오류가 나면 임의로 Flyway 기록을 지우거나 옛 서버를 실행하지 말고 오류와 백업을 기준으로 복구합니다.

이전은 원본 테이블 생성 → 기존 JSON을 SHA-256 ID로 복사 → 사용자 연결 채우기 → NOT NULL/FK 검사 → 기존 JSON 열 제거 순서입니다. 기존 사용자·레시피 번호·평가·AI 맛 예측 키는 바꾸지 않습니다. 동일 내용의 과거 중복 보관 행은 평가를 보존하기 위해 번호를 합치지 않으며 원본 내용만 공유합니다.

적용 후 확인:

```sql
SELECT version,success FROM flyway_schema_history ORDER BY installed_rank DESC LIMIT 3;
SELECT COUNT(*) AS originals FROM recipe_library;
SELECT COUNT(*) AS saved_count FROM my_recipes;
SELECT COUNT(*) AS taste_count FROM my_recipe_taste;
SELECT COUNT(*) AS prediction_count FROM my_recipe_prediction;
SELECT COUNT(*) AS broken_links FROM my_recipes m
LEFT JOIN recipe_library l ON l.recipe_id=m.recipe_id
WHERE l.recipe_id IS NULL;
```

broken_links는 0이어야 합니다. 다른 변경을 하지 않았다면 saved/taste/prediction 개수는 적용 전과 같아야 합니다. MyPage에서 기존 레시피와 별점을 확인하고, 다른 사용자에게 같은 레시피를 저장한 뒤 recipe_library 원본 수가 불필요하게 늘지 않는지 확인합니다. 공용 원본 공유는 타 사용자 보관함을 공개한다는 뜻이 아닙니다.

실제 MySQL에서의 기동은 사용자 환경에서 확인해야 합니다. 이 변경은 H2 MySQL 호환 모드에서 이전·데이터 보존·저장 동작을 검증했습니다. SHA2만 테스트 함수로 제공했습니다. MySQL 데이터 파일의 물리 용량은 중복 내용 제거만으로 즉시 줄어들지 않을 수 있습니다.
