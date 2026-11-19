# 사진 출처 통합 설정

## 적용 상태와 범위

- 등록 사진 → 식품안전나라 → 포토코리아 → Wikimedia Commons → Openverse 순서로 검색합니다.
- 등록 사진은 공유마당·셀렉트스타 등에서 이용 조건을 확인하고 선별한 파일입니다. 사진 데이터셋 자체는 이번 ZIP에 없습니다.
- Wikimedia와 Openverse는 별도 키 없이 요청합니다. API의 접속 제한/속도 제한으로 후보를 못 찾을 수 있습니다.
- 식품안전나라·포토코리아는 아래 전용 키를 설정해야 검색합니다. 키가 없으면 정상적으로 건너뜁니다. 키 설정 여부와 실제 API 성공 여부를 구분해 표시합니다.
- 공유마당 실시간 API는 로그인 뒤 상세 명세를 아직 확인하지 못해 연결하지 않았습니다. 임의 API 주소로 요청하지 않습니다. 현재는 확인한 사진을 등록해 사용하는 방식입니다.
- 대표 음식명으로 찾은 사진은 실제 생성 레시피의 완성 사진이 아닌 참고 사진입니다. 원본에서 음식과 이용 조건을 검토한 후 승인해야 화면에 표시됩니다.

## 1. 식품안전나라

https://www.foodsafetykorea.go.kr/api/newDatasetDetail.do?svc_no=COOKRCP01

식품안전나라에 로그인하고 `조리식품의 레시피 DB / COOKRCP01` 이용을 신청해 인증키를 받습니다.
공공데이터포털의 다른 API용 서비스키와 혼용하지 않습니다.

프로젝트 `.env.local`에 다음 한 줄을 추가합니다. `발급받은값`을 실제 키로 바꾸되 따옴표는 넣지 않습니다.

```dotenv
SMARTNF_PHOTO_MFDS_API_KEY=발급받은값
```

기존 `MFDS_API_KEY` 설정을 변경하지 않습니다. 사진용 설정 이름을 별도로 둡니다.
샘플 키는 연결 확인용입니다. `sample`을 운영 키로 넣지 마세요.

## 2. 포토코리아

https://www.data.go.kr/data/15101914/openapi.do

`한국관광공사_관광사진 정보_GW`를 활용 신청하고 승인된 **Decoding 서비스키**를 사용합니다.

```dotenv
SMARTNF_PHOTO_TOUR_API_KEY=발급받은Decoding서비스키
```

두 키는 서버에서만 사용하고 화면·검색 기록에 출력하지 않습니다. 키를 이 대화나 GitHub에 올리지 마세요.
키 없이 시작해도 Wikimedia/Openverse 검색은 실행됩니다.

## 3. 공유마당·셀렉트스타 사진 등록

- 공유마당: https://gongu.copyright.or.kr/gongu/useReqst/apiKey/info.do?menuNo=200245
- 셀렉트스타: https://selectstar.ai/od_food_picture/

공유마당에서 사진별 라이선스를 확인하거나 셀렉트스타 다운로드 절차로 데이터를 받은 뒤, 필요한 대표 사진을 선별합니다. 원본 촬영자·제목·출처·라이선스 정보를 보존합니다. 파일 전체를 일괄로 무조건 사용하지 않습니다.

`docs/photo-import-example.csv`를 복사해 UTF-8 CSV로 작성합니다. CSV 헤더 순서는 유지하세요.

| 필드 | 내용 |
|---|---|
| food_name | 연결할 음식/식재료명. 조리 상태가 다르면 별도 이름 사용 |
| title | 원본 사진 제목 |
| file | `--image-root` 폴더 기준 상대 파일 경로 |
| author | 원본 저작자 |
| source_url | 사진의 원본 페이지 HTTPS 주소 |
| license | `CC0`, `CC BY 4.0`, `CC BY-SA 3.0`, `공공누리 제1유형` 등 실제 조건 |
| license_url | 위 라이선스의 공식 URL. CC 라이선스는 deed 주소 대신 정규 URL 사용 |
| provider | `공유마당`, `셀렉트스타` 등 출처 |
| reviewed | 사진 일치와 사용 조건을 확인했으면 `yes` |

CSV가 `my-photos.csv`, 사진 폴더가 `my-food-images`인 경우 프로젝트 루트에서 실행합니다.

```bash
python scripts/import_food_photos.py --manifest my-photos.csv --image-root my-food-images
```

- 확인한 JPEG/PNG/WebP만 등록합니다. NC/ND는 이번 가져오기에서 제외합니다.
- JPEG/PNG/WebP 파일은 원본 바이트 그대로 복사하고, 내용의 SHA-256 기반 이름을 붙입니다.
- 결과는 `src/main/resources/static/photos/catalog/`와 `src/main/resources/photo-catalog.tsv`입니다.
- 동일 음식명은 새 등록으로 교체하며 다른 음식은 유지합니다. 매번 복사본이 증가하지 않습니다.
- CSV 메타데이터는 입력자가 확인한 값입니다. 스크립트가 권리자를 자동 검증하는 것은 아닙니다.
- CC BY-SA 사진을 변경할 경우 변경 사실과 동일조건 라이선스 등 해당 조건을 지킵니다.
- 서버 재시작 후 새 음식 검색 또는 다음 예약 재검색에서 후보로 사용됩니다. 이전 미발견 기록은 마지막 검색 후 24시간까지 대기할 수 있습니다.

## 4. 실행과 확인

1. 서버를 종료하고 ZIP의 `src/`, `scripts/`, `run_local.sh`를 프로젝트에 덮어씁니다. 이전 `SmartNF_PHOTO_MULTI_SOURCE_UPDATE.zip`은 먼저 적용할 필요 없습니다.
2. docs/SmartNF_IMPROVEMENTS.md를 개선 기록에 반영합니다.
3. `bash run_local.sh`로 실행합니다. 기존 모델 실행·종료 관리 흐름은 유지됩니다.
4. Flyway V19·V20이 적용됩니다. 기존에 다른 이름의 V19/V20이 있다면 먼저 충돌 여부를 확인하세요. 기존 마이그레이션 파일을 삭제하거나 초기화하지 않습니다.
5. 브라우저 Ctrl+Shift+R 후 관리자 `/admin/recipe-photos`를 엽니다.
6. 출처 상태에서 키 설정/미설정을 확인합니다. 시작 약 1분 후 첫 점검, 작업 완료 5분 후 다음 점검(최대 10개)입니다.
7. 음식별 기록에서 출처·검색어·결과/오류를 확인합니다. 후보가 생기면 원본 확인 후 승인하고 레시피·MyRecipe·헬스케어에서 표시를 확인합니다.

승인·제외·거절 자료는 보존합니다. V19에서 기존 미발견 자료만 READY로 한 번 전환합니다.
국내 유료/제휴 사진, Pexels/Pixabay의 자동 대량 수집, Pinterest/검색엔진 무허가 사진 수집은 포함하지 않습니다.

## 검증 범위

- 변경 Java 소스의 최소 Spring/JDBC/Jackson 의존성 스텁 컴파일 통과. 전체 Gradle 빌드는 사용자 환경 확인 필요.
- 실제 식품안전나라 공개 샘플 응답의 이미지 메타데이터 처리, HTTPS 전환 및 음식명 불일치 배제 검사.
- 포토코리아 단일 객체 응답 형태는 합성 fixture로 검사. 승인된 실제 서비스키 요청은 아직 확인하지 못함.
- 사진 등록 성공·중복 방지·디렉터리 이탈/미확인/잘못된 라이선스 거부·오류 시 기존 목록 보존 검사.
- 변경 JS 문법·Bash 문법 검사. MySQL 마이그레이션 및 실제 브라우저 표시 확인 필요.
- Openverse는 이 실행 환경에서 403 응답으로 실제 검색 성공을 검증하지 못했습니다. 사용자 PC에서 연결 상태 확인 필요.
- 국내 API 자체 호출 한도는 프로세스당/출처당 한국 날짜 기준 800회입니다. 재시작하면 카운터가 초기화되므로 외부 제공기관 한도를 대체하지 않습니다.
