# TASK-035 — Location / Weather Auto Fill (위치 인식 + 날씨 자동 조회)

> 공통 실행 규칙: [COMMON.md](COMMON.md)

## 목적

Daily Check-in의 기온과 날씨 입력을 사용자의 현재 위치 기준으로 자동으로 채운다. 지금은 사용자가 두 값을 직접 입력한다. Frontend만 변경한다.

Human이 2026-10-04 기능 추가를 지시했고, TASK-028(Staging 배포) / TASK-029(Staging CD)와 병행해 별도 저장소 사본에서 개발한다. 완료 후 CD로 Staging에 자동 재배포해 기능 추가 전후를 확인한다.

## 초기 상태 / Dependency

- 초기: `READY` (Human 승인, 2026-10-04)
- 선행: 없음(main 기준). Merge는 TASK-028 / TASK-029 Merge 뒤에 한다.
- 실행: `node scripts/orchestrator/run.mjs TASK-035` (병행 개발용 저장소 사본에서 실행)

## Human 결정 (2026-10-04, Gate 사전 승인)

1. **구현 위치**: Frontend만 변경한다. Backend, API 계약(`contracts/`, `docs/05-API_SPEC.md`), DB Schema는 바꾸지 않는다. Check-in 요청 형식은 지금과 같다(기온, 날씨 조건).
2. **동작**:
   - Check-in 화면의 날씨 입력 영역에 "현재 위치 날씨 가져오기" 동작을 둔다. 실행하면 브라우저가 위치 권한을 요청하고, 허용되면 기온과 날씨 칸을 자동으로 채운다. 사용자는 채워진 값을 고칠 수 있다.
   - **위치 허용은 처음 한 번만 묻는다.** 브라우저는 사이트별로 허용 여부를 기억한다. 화면에 들어올 때 브라우저의 권한 상태를 조회해(Permissions API) 이미 허용된 상태이고 사용자가 자동 조회를 켠 상태면, 버튼을 누르지 않아도 자동으로 날씨를 가져와 채운다. 권한 상태가 "묻기" 또는 "거부"이면 자동으로 권한 요청 창을 띄우지 않는다(사용자가 버튼을 눌렀을 때만 요청한다).
   - 자동 조회 사용 여부는 사용자가 한 번 가져오기에 성공하면 켜지고 브라우저 저장소(localStorage)에 기억한다. 사용자가 끌 수 있다. 사용자가 이미 값을 입력했거나 고친 뒤에는 자동 조회가 그 값을 덮어쓰지 않는다.
   - Permissions API가 없는 브라우저에서는 버튼 방식으로만 동작한다.
3. **날씨 API**: Open-Meteo Forecast API를 브라우저에서 직접 호출한다. API Key가 없다.
4. **개인정보**: 좌표는 소수 첫째 자리로 반올림해(약 10km) 날씨 API 요청에만 쓴다. 좌표를 MoodFit Backend로 보내지 않고, 저장소 / Log / localStorage에 저장하지 않는다.
5. **실패 처리**: 권한 거부, 위치 조회 실패 / 시간 초과, API 오류 / 시간 초과, 응답 형식 오류일 때 안내 문구를 보여 주고 직접 입력하게 한다. 기존 직접 입력 흐름과 검증은 그대로 동작한다.
6. **새 Dependency 없음**: 브라우저 기본 기능(`navigator.geolocation`, `navigator.permissions`, `fetch`, `AbortController`)만 쓴다. `package.json` / `package-lock.json`은 바꾸지 않는다.
7. **출처 표시**: 날씨를 자동으로 채운 영역에 "날씨 데이터: Open-Meteo" 표시와 링크를 둔다.

## 확인한 사실 (Claude 세션, 2026-10-04)

- Endpoint: `https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current=temperature_2m,weather_code`. 응답의 `current.temperature_2m`(섭씨)와 `current.weather_code`(WMO 코드)를 쓴다. ([Open-Meteo Docs](https://open-meteo.com/en/docs))
- API Key 없이 HTTP 200으로 응답하고 `access-control-allow-origin: *` Header를 준다(브라우저 직접 호출 가능). Staging hostname을 Origin으로 넣은 요청으로 확인했다.
- 이용 조건([Terms](https://open-meteo.com/en/terms)): 비상업 용도 무료, 하루 10,000회 미만 / 시간당 5,000회 / 분당 600회, CC BY 4.0 출처 표시 필요. 이 프로젝트는 교육 / 포트폴리오 용도다.
- WMO 코드: 0 ~ 3 맑음 ~ 흐림, 45 ~ 48 안개, 51 ~ 57 이슬비, 61 ~ 67 비, 71 ~ 77 눈, 80 ~ 82 소나기, 85 ~ 86 눈 소나기, 95 ~ 99 뇌우.

## Codex 작업 범위

1. 날씨 코드 변환(순수 함수): WMO 코드를 기존 `WeatherCondition` 4개 값으로 바꾼다. 권장 대응: 0 ~ 1은 `CLEAR`, 2 ~ 3과 45 ~ 48은 `CLOUDY`, 51 ~ 67 / 80 ~ 82 / 95 ~ 99는 `RAIN`, 71 ~ 77 / 85 ~ 86은 `SNOW`. 표에 없는 코드는 실패로 처리해 직접 입력하게 한다. 대응 근거를 Code 주석과 문서에 적는다.
2. 기온: 기존 입력 규칙(범위 -30 ~ 50, 소수 첫째 자리)에 맞춰 반올림한다. 범위를 벗어나면 채우지 않고 안내한다.
3. 위치 / 날씨 조회 Service와 Check-in 화면 연동(위 결정 2 ~ 5, 7). 요청에는 시간 제한을 둔다. 화면 상태(조회 중, 성공, 실패 안내)를 접근성 있게 표시한다(버튼 비활성 / 진행 표시, 안내 문구의 역할 지정).
4. Test (기존 Frontend Test 유지, 추가): 코드 변환 전 범위, 좌표 반올림, 조회 성공 시 두 칸이 채워짐, 권한 거부 / 시간 초과 / API 오류 / 형식 오류 시 안내와 직접 입력 가능, 권한이 이미 허용되고 자동 조회가 켜져 있으면 진입 시 자동 채움, 권한이 "묻기" 상태면 자동 요청하지 않음, 사용자가 입력한 값을 덮어쓰지 않음, 자동 조회 끄기. Test는 실제 네트워크와 위치 장치를 쓰지 않고 대체물(mock)로 검증한다.
5. 문서: `docs/19-LOCATION-WEATHER.md`(동작, 개인정보 처리, 외부 API와 이용 조건, 한계)와 README의 기능 소개 갱신. `docs/08-WORK_LOG.md`에 기록한다.
6. **수정하지 않는 것**: `docs/07-TASKS.md`, `AGENTS.md`, `docs/09-DECISIONS.md`. 이 Task는 병행 개발 중이라 TASK-028 / TASK-029와 문서가 충돌하지 않게 Task 등록, Decision 기록, 완료 반영은 Claude 세션이 Merge 시점에 정리한다.
7. 새로 Human 결정이 필요한 사항만 `human_decisions_needed`로 보고한다. API 계약이나 Backend 변경이 필요하다고 판단되면 구현하지 않고 보고한다.

## Run 중단과 이어서 작업 (2026-10-04, Claude 세션 기록)

첫 Run은 Claude 실행 파일 경로 변경(VS Code 확장 갱신)으로 Preflight에서 정지했다. 경로를 고친 두 번째 Run(`2026-10-03T23-15-30-369Z-cd5f601e`)은 Execute 단계에서 세션 종료로 중단되었다. Codex가 작성하던 변경(날씨 Service와 Test, Check-in 화면 연동, 문서)은 **검토 미완료 WIP**로 Commit했다. 구현이 끝났는지 확인되지 않았다.

이번 Run의 Codex 작업 범위: WIP 상태에서 이어서 작업한다. 이 문서의 결정과 작업 범위 전체를 기준으로 구현과 Test가 빠짐없이 되어 있는지 확인하고 미완성 부분을 완성한다. 이미 맞게 된 부분은 다시 쓰지 않는다.

## 제외 범위

- Backend / API 계약 / DB 변경, 새 Dependency
- 좌표 저장, 주소(지명) 표시, 날씨 예보 표시
- 로그인 사용자별 서버 저장 설정(로그인 기능 Task에서 다룬다)
- CloudFormation / CI / CD 변경

## Verification

- `bash scripts/verify.sh` (Frontend Test / Build, Backend Test / Build 포함)
- `git diff --check`
- `package.json` / `package-lock.json` 변경 없음

## Claude Review 기준

- 좌표가 날씨 API 외의 곳으로 나가거나 저장되지 않는가
- 권한을 사용자 동작 없이 요청하지 않는가(이미 허용된 경우의 자동 조회만 허용)
- 사용자가 입력한 값을 자동 조회가 덮어쓰지 않는가
- 실패 시 기존 직접 입력 흐름이 그대로 동작하는가
- 외부 응답을 검증 없이 화면 / 요청에 쓰지 않는가(형식, 범위 확인)
- API 계약과 Backend를 바꾸지 않았는가, 새 Dependency가 없는가

## 완료 조건

검증과 Review를 통과하면 REVIEW. Merge 후 Staging CD로 배포된 화면에서 동작을 확인하고(영상 촬영), Claude 세션이 Task 등록과 완료 반영을 정리한다.
