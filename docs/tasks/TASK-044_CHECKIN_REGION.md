# TASK-044 — Check-in Region Record (지역 저장 / Dashboard · History 표시)

> 공통 실행 규칙: [COMMON.md](COMMON.md)

## 목적

Check-in을 저장할 때의 지역 이름을 함께 저장하고, Dashboard와 History에서 날씨와 함께 보여 준다.

## 초기 상태 / Dependency

- 초기: `READY` (Human 지시, 2026-10-04)
- 선행: TASK-040(지역 이름 조회), TASK-042(로그인 / 사용자별 기록, Migration `V3`)
- 실행: `node scripts/orchestrator/run.mjs TASK-044`

## Human 지시 (2026-10-04)

"Dashboard, history에 저장할 당시의 지역이 날씨와 같이 표시 되었으면 해."

- 이 지시는 TASK-040(DEC-033)의 "지역 이름을 저장하지 않고 Backend로 보내지 않는다"를 바꾼다. **지역 이름(동 단위 문자열)만** 저장한다. 좌표는 계속 저장하지 않고 Backend로 보내지 않는다.

## 설계 (실행 기준)

### API 계약

- Check-in 생성 요청에 선택 항목 `region`(문자열 또는 null, 생략 가능)을 추가한다.
  - 검증: 앞뒤 공백 제거 뒤 1 ~ 80자. 제어 문자(줄바꿈 포함)가 있으면 400. 빈 문자열과 공백만 있는 값은 null로 본다. 80자를 넘으면 400.
  - 생략하거나 null이면 지역 없이 저장한다. 기존 Client(Smoke Script 포함)의 요청은 그대로 유효하다.
- 응답: 생성 / 최신 응답의 `weather` 객체에 `region`(문자열 또는 null)을 추가한다. 이력 응답의 각 항목에도 `region`(문자열 또는 null)을 추가한다(이력 항목은 `temperature`, `weather`와 같은 수준).
- `contracts/`의 예시와 `docs/05-API_SPEC.md`를 갱신한다. Smoke Script는 `region` 없이 요청하므로 **생성 / 최신 / 이력 예시의 `region`은 null**이어야 한다(Smoke가 응답을 예시와 정확히 비교한다). 지역이 있는 경우는 별도 Test로 검증한다.

### Data

- Migration `V4`: Check-in Table에 nullable 문자열 Column(길이 80)을 추가한다. 기존 행은 null이다. 이전 Version Task와 함께 실행되는 Rolling 배포에서도 저장이 실패하지 않아야 한다(기본값 없는 nullable Column).
- H2 Test와 MySQL Testcontainers 양쪽에서 통과해야 한다.
- 사용자별 분리(TASK-042)는 그대로 유지한다.

### Frontend

- Check-in: **자동 조회로 얻은 지역 이름이 있을 때만** `region`을 보낸다. "현재 위치" 같은 대체 문구는 보내지 않는다(null). 직접 입력 모드로 바꿔 기온 / 날씨를 고친 경우에도, 그 값이 자동 조회 결과에서 온 것이면 지역을 유지한다. 처음부터 직접 입력한 경우(자동 조회 결과 없음)는 보내지 않는다.
- Dashboard의 날씨 카드: 지역이 있으면 날씨 종류와 기온과 함께 지역을 보여 준다(예: 지역을 작은 글자로 한 줄). 없으면 지금과 같다.
- History: 각 기록의 날씨 표시 옆 / 아래에 지역을 보여 준다. 없으면 표시하지 않는다(빈 자리나 "-"를 만들지 않는다). 표가 좁은 화면에서 깨지지 않게 한다.
- Check-in 결과 화면에도 지역이 있으면 함께 보여 준다.
- 화면 출력은 React 기본 escaping만 쓴다. 긴 이름은 줄바꿈되거나 말줄임 처리되어 배치를 깨지 않게 한다.
- Check-in 화면의 개인정보 안내 문구를 사실에 맞게 고친다("위치(좌표)는 저장하지 않으며, 지역 이름은 기록과 함께 저장됩니다" 취지).
- 새 Dependency 없음.

### Test

- Backend: `region` 있는 저장 / 조회, 생략과 null, 공백만 → null, 81자와 제어 문자 → 400, 이력에 포함, 다른 사용자에게 보이지 않음(기존 분리 Test에 포함), Migration(H2 / MySQL).
- 계약 Test: 갱신한 예시와 일치.
- Frontend: 자동 조회 결과가 있을 때만 `region` 전송, 대체 문구는 전송하지 않음, Dashboard / History / 결과 화면의 표시와 미표시.

### 문서

- `docs/19-LOCATION-WEATHER.md`: 저장하는 것(지역 이름)과 저장하지 않는 것(좌표), 표시 위치.
- `docs/09-DECISIONS.md`: 새 Decision(최신 번호 다음, Human Approved 2026-10-04)과 DEC-033 변경 이력.
- `docs/07-TASKS.md`: TASK-044 행과 절 추가, DONE(Milestone 44, 번호 순서대로, Task 표가 빈 줄로 끊기지 않게). 다른 Task 상태는 바꾸지 않는다.
- `docs/08-WORK_LOG.md`, `docs/22-AUTH.md`는 바꾸지 않는다(필요 없으면), `prompts/`, README의 기능 소개에 한 줄.

### 참고 (Executor Sandbox)

- Sandbox에서 Gradle / npm을 실행하지 못할 수 있다. 그 경우 실행하지 못한 검증을 `docs/08-WORK_LOG.md`에 적는다. 판정은 Sandbox 밖 Orchestrator Verify가 한다. Dependency는 추가하지 않는다(`backend/build.gradle` 변경 금지).

## Verification

- `bash scripts/verify.sh`
- `bash scripts/container-smoke.sh`
- `git diff --check`

## Claude Review 기준

- 좌표가 저장되거나 Backend로 가지 않는가, 지역 이름 검증(길이 / 제어 문자)이 있는가
- 기존 요청(지역 없음)이 그대로 동작하고 Smoke 계약 예시와 맞는가
- Migration이 Rolling 배포에서 안전한가
- 사용자별 분리가 유지되는가
- 지역이 없는 기록의 화면이 어색하지 않은가

## 완료 조건

검증과 Review를 통과하면 REVIEW. Merge 후 Staging에서 Check-in → Dashboard / History의 지역 표시를 확인한다.
