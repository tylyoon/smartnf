# SmartNF 건강정보 API 수집 준비

## Windows Python TLS 호환성 보완 (2026-10-22)

사용자 로컬 Python에서 `UNSAFE_LEGACY_RENEGOTIATION_DISABLED`가 발생했으나, curl GET에서는 HTTP 201/XML 응답을 받았다. 서버 또는 중간 네트워크 장비와 Python TLS의 호환성 문제로 보이며, TOKEN의 유효성은 이 결과로 판정하지 않는다. 인증서 검증을 끄거나 HTTP로 전환하지 않고, curl을 명시적으로 선택하는 연결 방식을 추가했다.

기존 TOKEN 설정을 유지하고 다음 **1건만** 먼저 실행한다.

```bash
python python/health_collection/kdca_bulk.py --download --id 6765 --transport curl
```

- `6765: collected`: 응답의 ID·제목·본문 형식 검증 후 저장 성공.
- `failed_RESPONSE_ID_MISSING`: XML은 받았지만 요청 ID를 확인할 필드가 없다. 성공으로 저장하거나 일괄 수집하지 않고 실응답 규격을 추가 확인한다.
- `failed_RESPONSE_ID_MISMATCH`: 응답 ID가 요청 ID와 다르다. 성공 처리하지 않는다.
- `failed_RESPONSE_TITLE_MISSING`: 응답 제목이 없어 자료 확인이 필요하다.
- `failed_CURL_*`: curl 연결·인증서·시간 제한 등의 문제. 표시된 고정 상태만 공유한다.

TOKEN 없는 GET에서 사용자가 받은 응답은 `S001`과 본문을 포함했으나 콘텐츠 ID·제목은 없었다. 이것을 고혈압 요청 성공 또는 TOKEN 검증 성공으로 간주하지 않는다. 새로운 옵션으로 TOKEN과 ID가 포함된 실제 요청 1건을 검증한다.

curl에 URL을 전달할 때 TOKEN은 프로세스 명령 인자가 아닌 표준입력으로 전달한다. 기본 curl 설정 파일을 읽지 않으며 인증서 검증을 유지한다. 리디렉션은 따라가지 않는다. 오류의 원본 URL·서버 메시지는 출력하지 않는다.

이번 보완 후 오프라인 테스트 16개 통과. Windows 실제 인증 응답 성공은 사용자 실행 확인 대기다. curl 표준입력 설정·기본 설정 비활성화 근거: https://curl.se/docs/manpage.html 및 https://github.com/curl/curl/blob/master/docs/MANUAL.md

## 현재 확인 범위

- 사용자 확인: 전체 688건 신청·승인 완료. TOKEN은 사용자 PC에만 보관한다.
- 공개 건강정보 목록 9페이지에서 중복 없이 669개 내부 콘텐츠 ID와 제목을 확인했다(2026-10-22). 외부 기관 링크는 포함하지 않았다.
- **공개 669건과 승인 688건은 같은 목록으로 단정하지 않는다.** 19건 차이의 원인은 아직 확인되지 않았다. 비공개 신청 목록을 확보하여 ID 단위로 대조해야 한다. 숫자 범위 추측으로 ID를 만들지 않는다.
- 제공받은 활용 가이드의 `TOKEN`, `cntntsSn`, XML 응답 형식을 기준으로 구현했다. 토큰 없는 HTTPS 연결만 여기서 확인했고, 인증된 실제 응답은 사용자 PC에서 1건을 먼저 검증한다.
- 기존 화면, DB 설정, `run_local.sh`, `.env.local`은 변경하지 않는다.

## 검색어 선정 원칙

전체 수집 대상에서 검색어에 안 맞는 자료를 제거하지 않는다. 키워드는 탐색·분류용이다. 한 자료에 여러 분류를 붙이며 미분류도 유지한다. 현재 제목만으로 분류하므로 본문에만 있는 정보는 아직 검색되지 않는다.

| 분류 | 대표 검색어 | 주의점 |
|---|---|---|
| 혈압 | 고혈압, 저혈압, 저염, 나트륨 | 검사와 식사 자료 함께 탐색 |
| 혈당 | 당뇨, 혈당, 당화혈색소, 저혈당 | 저혈당 자료도 포함 |
| 혈중지질 | 이상지질, 고지혈, 콜레스테롤, 중성지방 | 표현 차이를 함께 검색 |
| 체중 | 비만, 과체중, 저체중, 체지방 | 감량뿐 아니라 저체중도 포함 |
| 콩팥·간 | 콩팥, 신부전, 신장질환 / 지방간, 간염, 간경변 | ‘신장’, ‘간’ 단독 검색 제외 |
| 관련 질환 | 심뇌혈관, 근육·뼈, 빈혈, 소화, 통풍 | 관리 충돌·관련 정보를 놓치지 않기 위함 |
| 식생활 | 식이, 영양, 식사, 식습관, 식품, 식이섬유 | ‘지방’만으로 지방간을 판단하지 않음 |
| 운동·생활 | 걷기, 신체활동, 근력, 금연, 절주, 수면 | 질환명 없는 생활관리 자료 포함 |
| 주의 대상 | 소아, 청소년, 임신, 수유, 노인 | 사용자 적합성이 검증됐다는 뜻 아님 |

전체 동의어는 `python/health_collection/data/reference/health_keywords.json`에서 관리한다. 공백·대소문자 차이를 정규화한다. 다음 단계에서는 실제 수집 본문의 소제목·내용과 미분류 자료를 검토해 검색어를 보완한다. 사용자 질환이나 건강 수준을 검색어만으로 판정하지 않는다.

## 실행 순서

ZIP의 `python`, `docs`를 기존 `smartnf` 루트에 합친다. Git Bash에서 현재 가상환경을 유지한다. 외부 Python 패키지 설치는 필요 없다.

### 1. 검색 분류 미리보기

```bash
python python/health_collection/kdca_bulk.py
```

네트워크·TOKEN 없이 669건과 분류별 건수를 표시한다. 복수 분류이므로 분류 합계는 전체 건수와 다를 수 있다. 미분류가 많아도 수집 대상에서 빠지지 않는다.

### 2. TOKEN을 PC에 한 번 저장

```bash
python python/health_collection/kdca_bulk.py --setup
```

화면에 두 번 입력한다. URL 전체가 아니라 TOKEN 값만 넣는다. 입력 문자는 표시되지 않는다. 루트 `.env.kdca.local`에 저장하고 Git 제외를 확인한다. 기존 DB 설정과 분리한다. 이미 파일이 있으면 덮어쓰지 않는다. TOKEN을 대화에 보내지 않는다.

### 3. 실제 API 1건 검증

```bash
python python/health_collection/kdca_bulk.py --download --id 6765
```

기대 결과: `6765: collected`. 실패 시 TOKEN·URL·원본 본문을 보내지 말고 표시된 상태만 공유한다. API 성공 코드, 콘텐츠 ID, 제목·본문 구조를 확인해야 저장한다. 제공 가이드와 실제 응답 형식이 다르면 보완 후 진행한다.

### 4. 검증 후 현재 목록 일괄 수집

```bash
python python/health_collection/kdca_bulk.py --download --all-catalog --expected-count 669
```

**669건 수집이며 승인 688건 전체 완료가 아니다.** 1초 이상 간격으로 순차 요청한다. 인증 오류·호출 제한·응답 형식 오류가 나오면 중단한다. 일시 통신 실패는 기록하고 다음 자료로 넘어간다. 같은 명령을 다시 실행하면 파일 해시와 XML이 검증된 성공 자료는 건너뛰고 실패·누락 항목을 다시 시도한다. 실행 도중 중단하면 마지막까지 저장한 원본을 유지한다.

승인 목록이 확보되면 `{ "records": [{ "content_id": "6765", "title": "고혈압" }] }` 형식의 JSON을 만들고, 중복 없는 688건인지 확인한 뒤 `--catalog 승인목록.json --expected-count 688`로 대체한다. 기존 669개 목록에 임의의 19개를 추가하지 않는다.

## 저장·서비스 반영

- 저장 위치: `python/health_collection/data/api/` (실행 시 Git 제외 파일 생성, 이미 추적 중인 폴더는 중단).
- 콘텐츠별 원본 XML, 구조화 JSON, 해시·수집 시각, 마지막 실행 상태를 저장한다. 오류 메시지에 TOKEN·요청 URL은 출력하지 않는다.
- 응답의 HTML은 문자열로 보관하며 실행·렌더링하지 않는다. 이미지·하위 링크는 자동 다운로드하지 않는다.
- 자료 수집과 개인 건강 권고는 별개다. 이용조건·출처 표시·가공 범위, 기준의 적용 대상과 예외를 검토한 후 Backend 승인 자료에 연결한다. `runtime_enabled=false`, `clinical_status=not_approved`를 유지한다.
- MyPage, Backend, Python 후속 항목은 `SmartNF_IMPROVEMENTS.md`에 누적한다.

## 검증 결과

Python 오프라인 테스트 13개 통과(기존 6개+신규 7개). 복수 XML 루트, 필드 별칭, CDATA, 중복 소제목 번호, 오류 코드·다른 ID·DTD 거부, 복수 분류, 목록 669건 확인, 기존 성공 파일 보존, 변조된 캐시 검출을 확인했다. 실제 TOKEN 사용 성공과 Windows 로컬 실행은 아직 검증 전이다.

## 출처

- 공개 목록: https://health.kdca.go.kr/healthinfo/biz/health/gnrlzHealthInfo/gnrlzHealthInfo/gnrlzHealthInfoMain.do
- API 신청·활용: https://health.kdca.go.kr/healthinfo/biz/health/portalUseGuidance/openApiReqst/openApiReqstRegist.do
- 사용자 제공 `openApi(guide).hwp` 활용 가이드. 표지 1.1/2022-01-04, 변경 이력 1.2/2023-11-30. 현재 응답은 별도 검증한다.

## 본문 없는 항목 처리 보완 (2026-10-22)

사용자 PC에서 6765 수집 성공, 이어진 일괄 실행 중 6783의 `EMPTY_CONTENT`를 확인했다. 이 코드는 현재 파서가 본문을 확보하지 못했다는 뜻이며, 제공 자료의 실제 공백 여부나 구조 차이는 추가 확인이 필요하다.

수정본은 `failed_EMPTY_CONTENT`로 기록하고 다음 콘텐츠를 계속 처리한다. 해당 항목을 성공으로 저장하지 않는다. 다른 기존 중단 조건은 유지한다. 실행 마지막에 상태별 건수·확인 필요 ID·미처리 건수를 표시하고 `data/api/last_summary.json`에 저장한다. 이미 성공한 자료는 유지한다. 재실행 명령은 동일하다.

```bash
python python/health_collection/kdca_bulk.py --download --all-catalog --expected-count 669 --transport curl
```

테스트 총 18개 통과. 669건 전체 수집 완료 여부는 최종 결과로 판단한다. TOKEN은 다시 설정하지 않는다.

## 11건 구조 진단 (2026-10-22)

사용자가 공개 목록 669건을 모두 처리했다. 기존 성공 83건+신규 성공 575건=658건 저장·형식 검증, EMPTY_CONTENT 11건이다. 임상 검증 완료 상태는 아니다.

이번에는 일괄 수집을 반복하지 않고 다음만 실행한다.

```bash
python python/health_collection/kdca_diagnose.py
```

기존 TOKEN과 curl을 사용해 해당 11건만 1초 간격으로 조회한다. 인증·응답 ID·연결 문제가 생기면 추가 호출을 멈춘다. 출력은 ID·고정 상태·유무·개수이며 TOKEN과 본문을 포함하지 않는다. 기존 성공 자료·마지막 수집 보고서는 변경하지 않는다. 별도 `data/api/diagnostics_11.json`만 기록한다.

상태를 보고 소제목 노드 없음, 본문 필드 없음, 공백 본문, 중첩 구조, 현재 정상 응답을 구분한다. 실패 항목의 공백 본문에 임의 내용을 채우거나 성공 처리하지 않는다. 결과를 확인한 후 필요한 파서 보완 또는 출처 확인을 진행한다.

진단 대상: 6783, 6785, 6787, 6786, 6758, 6781, 6587, 6777, 6757, 6782, 6784. 테스트 총 22개 통과. 실제 11건 결과는 사용자 실행 대기다.

## 승인 688건 목록 내보내기

11건의 실진단 결과는 모두 성공 응답·ID 일치·제목 존재였지만 본문 목록의 자식 항목이 0개였다. 해당 응답에 본문이 없어 보류한다. 다음은 승인 목록과 공개 목록을 ID로 대조하는 단계다.

1. 로그인된 질병관리청 승인 목록 화면을 유지한다.
2. `docs/KDCA_APPROVED_EXPORT.js`를 VS Code의 텍스트 편집기로 열어 전체 복사한다. 별도 전달한 TXT도 동일 내용이다.
3. 목록 화면의 F12 → Console에서 붙여넣고 Enter를 누른다.
4. 페이지별 확인 건수가 표시된다. 완료까지 화면을 새로고침하거나 닫지 않는다.
5. 승인된 고유 ID 688건을 모으면 `approved_health_catalog.json`이 다운로드된다. ID·제목만 포함하며 TOKEN·URL·쿠키는 포함하지 않는다. 이 JSON을 전달하여 대조한다.

1초 간격으로 순차 조회하며 실제 소요 시간은 페이지 수·응답 속도에 따른다. 페이지가 반복되거나 표를 찾지 못하거나 통신 문제가 있으면 중단한다. 미완료 파일명은 `approved_health_catalog.partial.json`이며 완료 파일과 구분한다. 원본 페이지의 신청·승인 상태를 변경하거나 URL 복사 버튼을 누르지 않는다. 브라우저에서 코드를 실행하는 단계이므로 Git Bash에 붙여넣지 않는다.
