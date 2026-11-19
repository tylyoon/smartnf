# SmartNF 혈압 정보 수집 STEP 1

작성·확인일: 2026-10-22. 건강정보 프론트는 사용자 확인에 따라 **1차 완료**로 두고, 이 단계에서는 화면·DB·로그인·실행 스크립트를 변경하지 않습니다.

## 이번 결과

- 공식 출처 6개 + 이용조건/API 안내 2개를 등록했습니다.
- Python으로 8개 페이지의 공개 메타데이터를 실제 확인했습니다. 결과 JSON을 함께 제공합니다.
- 혈압 관리의 6개 행동과 출처·필요한 입력·보조 측정 항목을 연결했습니다.
- 기준 차이·이용조건·개인 적용 조건 등의 검토 항목 5개를 작성했습니다.
- 이 결과는 **출처·메타데이터 수집 1차**입니다. 원문 전체·이미지·API 콘텐츠 수집, 임상 검토·승인, 화면 반영 완료가 아닙니다.

## 확보한 출처 목록

| ID | 공식 자료 | 확보 목적 | 확인 내용 |
|---|---|---|---|
| kdca-bp-6765 | [KDCA 고혈압](https://health.kdca.go.kr/healthinfo/biz/health/gnrlzHealthInfo/gnrlzHealthInfo/gnrlzHealthInfoView.do?cntnts_sn=6765) | 일반 관리·측정·생활습관 | 개정일 2026-10-21 확인 |
| kdca-diet-6855 | [KDCA 고혈압 환자의 식이요법](https://health.kdca.go.kr/healthinfo/biz/health/gnrlzHealthInfo/gnrlzHealthInfo/gnrlzHealthInfoView.do?cntnts_sn=6855) | 저염·식품 구성·실천 | 개정일 2026-09-28 확인 |
| kdca-home-68 | [KDCA 고혈압에 관한 궁금증](https://health.kdca.go.kr/healthinfo/biz/health/ntcnInfo/healthSourc/thtimtCntnts/thtimtCntntsView.do?thtimt_cntnts_sn=68) | 가정 측정과 조건 | 페이지 확인. 날짜 자동 추출 안 됨 |
| kdca-older-6698 | [KDCA 노인 고혈압](https://health.kdca.go.kr/healthinfo/biz/health/gnrlzHealthInfo/gnrlzHealthInfo/gnrlzHealthInfoView.do?cntnts_sn=6698) | 고령자 조건 | 메타데이터 개정일 2026-06-08. 상세 규칙 검토 대기 |
| kdca-low-5259 | [KDCA 저혈압](https://health.kdca.go.kr/healthinfo/biz/health/gnrlzHealthInfo/gnrlzHealthInfo/gnrlzHealthInfoView.do?cntnts_sn=5259) | 낮은 혈압의 별도 처리 | 메타데이터 개정일 2026-04-23. 상세 규칙 검토 대기 |
| amc-bp-44 | [서울아산병원 혈압 검사정보](https://health.amc.seoul.kr/health/personal/checkInformation.do?checkno=44) | 현재 화면 기준의 근거 추적 | 2018 학회 표 인용 확인. 최신 지침과 대조 필요 |
| kdca-rights | [KDCA 건강정보 활용방법](https://health.kdca.go.kr/healthinfo/biz/health/portalUseGuidance/hlthinsReqst/hlthinsReqstMth.do?index=1) | 권리·API 제공 절차 | 자료별 표시와 신청 절차 확인 |
| kdca-api-terms | [KDCA OpenAPI 신청](https://health.kdca.go.kr/healthinfo/biz/health/portalUseGuidance/openApiReqst/openApiReqstRegist.do) | 사용 목적·콘텐츠 신청 | 신청·목적 검토·사용 조건 확인. 신청은 하지 않음 |

개정일은 페이지에 표시된 값이고, 확인 시각은 수집 실행 시각입니다. 날짜가 `null`이면 모르는 값이며 임의로 채우지 않습니다. HTTP 200이나 `metadata_checked`는 이용허락·임상 승인과 다릅니다.

## 우선 검토할 내용

1. **기준 버전:** 현재 프론트가 참고하는 분류와 최신 학회 지침·개인 치료 목표를 구분합니다.
2. **자료 차이:** 소금 수치가 두 자료에서 6g/일·5g/일로 다릅니다. 출처·대상·지침 목적을 검토하기 전 하나의 개인 목표로 합치지 않습니다. 소금과 나트륨도 구분합니다.
3. **측정 조건:** 가정·진료실, 측정 시각·준비·반복 측정 등 필요한 입력을 확정합니다.
4. **적용 대상:** 고령·저혈압·질환·복약·운동 제한, 추가로 확보할 소아·임신 자료를 분리합니다.
5. **콘텐츠 이용:** KDCA 안내에는 공공누리 4유형의 출처표시·비상업·변경금지 조건과 API 신청·목적 검토 절차가 있습니다. API 승인이 임의 요약·변형·LLM 입력·상업 이용 승인을 의미하지 않습니다. 실제 자료별 허용 범위는 별도 확인합니다.

이번 패키지는 출처 목록·메타데이터·독자적으로 작성한 검토 메모이며 공식 원문/그림의 재배포본이 아닙니다. 정리한 메모는 게시용 건강 안내로 자동 사용하지 않습니다.

## 행동과 정보 연결

| 행동 ID | 사용자 관리 항목 | 확보·검토할 정보 | MyPage의 후속 기록 |
|---|---|---|---|
| salt | 짜게 먹는 습관 줄이기 | 근거·개인 식이 제한·분량·소금/나트륨 단위 | 식사 실천 + 혈압/측정 조건 |
| balanced | 균형 잡힌 식사 | 식품군·분량·질환별 제외 조건 | 식사 구성·실천 + 관련 측정값 |
| movement | 걷기 등 신체활동 | 활동 수준·운동 제한·허용 범위 | 활동·시간·불편 + 혈압 |
| weightcare | 적정 체중 관리 | 체중 방향·저체중/고령 등 조건 | 실천 + 체중/허리둘레 |
| alcohol | 음주 줄이기·피하기 | 음주 여부·양·질환/복약 | 음주·실천 + 혈압 |
| smoking | 금연 실천 | 흡연 여부·금연 지원 | 실천·지원 + 건강 상태 |

행동 ID는 현재 프론트와 맞추기 위한 연구용 연결값입니다. DB 스키마나 개인 권고는 아직 확정하지 않습니다.

## 파일 구조와 코드 의미

```text
python/health_collection/
  bp_collect.py
  .gitignore
  tests/test_bp_collect.py
  data/reference/sources.json
  data/reference/review_notes.json
  data/reference/action_evidence_map.json
  data/observed/실제_확인결과.json
```

| 파일·함수 | 의미 |
|---|---|
| sources.json | 자료 ID·제공처·URL·주제·이용/임상 검토 상태 |
| review_notes.json | 자료 차이와 미확보 조건. `runtime_enabled=false` 유지 |
| action_evidence_map.json | 기존 행동과 근거·추가 입력·보조 기록 연결 |
| data/observed/*.json | 이번에 실제 실행한 확인 결과. 본문·개인정보 없음 |
| validate_reference() | 중복 ID·출처 연결·URL·비활성 상태 검사 |
| MetadataParser / extract_metadata() | HTML에서 제목·날짜만 추출. 스크립트와 스타일 제외 |
| robots_allowed() | 공개 수집 지침 확인. 차단·확인 오류는 실패로 처리. 404는 별도 표시 |
| check_online() | 등록된 출처를 순서대로 확인하고 변경·실패 상태 생성 |
| main() | 명령 인자 해석·실행·결과 파일 저장 |

`metadata_sha256`은 제목·날짜 등 추출 메타데이터의 지문입니다. 메타데이터가 같아도 본문이 바뀔 수 있으므로 **본문 변경 없음의 증거로 사용하지 않습니다.** 전체 원문 비교와 배포 갱신은 허용된 API 계약을 확보한 뒤 구현합니다.

원문 HTML은 메모리에서 메타데이터 분석에만 사용하고 저장하지 않습니다. 인터넷 확인 결과는 새 파일에 기록해 이전 결과를 덮어쓰지 않습니다. 성공한 자료도 임상 승인 상태로 자동 승격하지 않습니다. 현재는 승인본 배포 기능 자체가 없습니다.

## Windows Git Bash에서 직접 실행

ZIP의 `python`과 `docs` 폴더를 기존 `smartnf` 프로젝트 루트에 합칩니다. 기존 `.venv`·`src`·`run_local.sh`·DB 설정은 변경하지 않습니다. ZIP 안에 기존 관리 MD도 포함되어 있습니다.

**우선 아래 1단계만 직접 실행해 확인하세요.**

```bash
cd /c/yoonfolder/hpexam/smartnf
source .venv/Scripts/activate
python --version
python python/health_collection/bp_collect.py --validate
```

- 가상환경을 활성화하면 프로젝트에서 정한 Python 3.11을 사용합니다.
- `python ...bp_collect.py`는 수집 프로그램을 실행합니다.
- `--validate`는 인터넷 접속 없이 파일과 출처 연결만 검사합니다.
- 기대 결과: `참조 검사 통과: 출처 8 / 검토 5 / 행동 6`

그다음, 혈압 출처 **한 개의 메타데이터만** 실제 확인합니다.

```bash
python python/health_collection/bp_collect.py --check-online --source kdca-bp-6765
```

- `--check-online`: 공개 페이지 메타데이터 확인.
- `--source`: 전체가 아닌 이 자료 ID만 확인.
- 결과는 `python/health_collection/data/runs/`의 새 JSON에 저장됩니다. 이 폴더는 하위 `.gitignore`에서 제외합니다.
- `metadata_checked`는 제목·날짜 확인 성공입니다. 원문 본문·API 자료 확보 완료라는 뜻이 아닙니다.
- 인터넷·robots·페이지 구조 때문에 실패할 수 있습니다. 결과의 `error_type`/`error_code`를 확인하고, 기존 결과나 화면은 유지합니다.

전체 출처 확인과 테스트 명령은 한 개 출처 확인 후 진행합니다.

```bash
python python/health_collection/bp_collect.py --check-online
python -m unittest discover -s python/health_collection/tests -v
```

Python 3.11 이상 표준 라이브러리만 사용하므로 `pip install`은 필요하지 않습니다. 이번 실행 검증 환경은 Python 3.12이며 사용자의 Windows/Python 3.11 실행 결과는 별도로 확인합니다.

## 다음 단계와 완료 조건

1. 사용자가 위 `--validate` 실행 결과를 확인합니다.
2. API 신청에 필요한 사용 목적·사용 URL·대상 콘텐츠 목록을 정리하고, 제공처의 신청 절차와 허용 범위를 확인합니다. 신청서 제출·약관 동의·연락처 입력은 이번 작업에서 하지 않았습니다.
3. 승인 후 제공받은 실제 API 정보로 연결합니다. 엔드포인트·인증 방식·응답 구조를 추측해 만들지 않습니다. 인증키는 환경변수로 관리하고 코드/문서/로그에 넣지 않습니다.
4. 허용된 원본 자료 → 정규화 → 적용/제외 조건·자료 차이 검토 → 승인본 순서로 진행합니다. LLM 가공·RAG 입력도 허용 범위를 확인합니다.
5. 검토 완료 자료만 Backend의 공통 기준·행동 근거와 연결한 뒤 건강정보 화면을 보완합니다. MyPage는 해당 페이지 작업 시 반영합니다.

이번에 화면·DB·실제 권고 수치를 바꾸지 않았습니다. 고혈압 진단·복약 변경·개인별 운동/영양 처방을 수행하는 프로그램이 아닙니다.
