# TASK-040 — Weather Auto Default / Region Display (날씨 자동 기본 + 지역 표시)

> 공통 실행 규칙: [COMMON.md](COMMON.md)

## 목적

Check-in 화면의 날씨를 **자동 조회가 기본**이 되게 하고, 조회한 **지역 이름**을 날씨와 함께 보여 준다. 사용자가 원하면 직접 입력으로 바꿀 수 있다. 기온 정확도를 높인다.

## 초기 상태 / Dependency

- 초기: `READY` (Human 승인, 2026-10-04)
- 선행: TASK-035(위치 인식 + 날씨 자동 조회), TASK-037
- 실행: `node scripts/orchestrator/run.mjs TASK-040`

## Human 결정 (2026-10-04, Gate 사전 승인)

1. **자동이 기본**: Check-in 화면에 들어오면 날씨를 자동으로 조회해 채운다. 사용자가 원하면 직접 입력으로 바꾼다. (Human: "날씨 항목은 기본이 자동 표시고, 사용자가 원하면 수동으로 입력")
2. **지역 이름 표시**: 좌표를 지역 이름으로 바꿔 날씨와 함께 Check-in 화면에 표시한다. BigDataCloud의 Client용 Reverse Geocoding API를 쓴다(API Key 없음).
3. **좌표 정밀도**: 외부 API로 보내는 좌표를 소수 1자리에서 **소수 2자리**(약 1km)로 바꾼다. TASK-035의 "소수 1자리" 결정을 변경한다.
4. **개인정보**: 좌표는 날씨 API와 지역 이름 API 두 곳에만 보낸다. 좌표와 지역 이름을 저장하지 않고(브라우저 저장소 포함) Backend로 보내지 않는다.
5. **표시 범위**: Check-in 화면에만 표시한다. Backend / API 계약 / DB는 바꾸지 않는다.

## 확인된 사실 (2026-10-04, Claude 세션)

- 소수 1자리 좌표는 실제 위치에서 최대 수 km 벗어나 고도가 다른 지점으로 잡힐 수 있다. 서울시청 부근에서 같은 시각에 소수 1자리는 고도 173m / 21.5°C, 소수 2자리는 고도 37m / 22.5°C였다.
- `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=<lat>&longitude=<lon>&localityLanguage=ko`: Key 없이 응답하고 `access-control-allow-origin: *`다. 응답 필드 예: `principalSubdivision` "서울특별시", `city` "서울특별시", `locality` "명동" / 부산은 "부산광역시", "부산광역시", "중1동".
- Open-Meteo의 `models=kma_seamless`는 `current` 값이 null로 와서 쓰지 않는다. 기존 기본 Model을 유지한다.

## Codex 작업 범위

### 동작

1. **기본 자동**: Check-in 화면에 처음 들어오면 자동 조회를 시작한다. 브라우저가 위치 권한을 처음 한 번 묻는다(브라우저 동작). 이미 허용되어 있으면 묻지 않고 채운다.
2. **모드 두 가지**: "자동" / "직접 입력". 사용자가 고른 모드는 기존 설정 저장 방식(`moodfit.autoWeather`)을 이어 쓰되, **저장된 값이 없으면 자동**으로 본다. 기존에 `false`를 저장한 사용자는 직접 입력으로 유지한다.
3. **자동 모드 화면**: 기온과 날씨 입력 대신 조회 결과를 읽기 쉬운 요약으로 보여 준다. 예: "서울특별시 명동 · 맑음 · 22.5°C". "다시 조회"와 "직접 입력" 버튼을 둔다. 조회 중에는 진행 상태를 보여 준다.
4. **직접 입력 모드 화면**: 기존 기온 입력과 날씨 선택을 그대로 보여 주고 "자동으로 가져오기" 버튼을 둔다.
5. **실패 처리**: 권한 거부 / 위치 실패 / 날씨 API 실패 / 시간 초과 때는 이유를 알리고 **직접 입력 화면으로 전환**해 제출을 막지 않는다. 이때 저장된 모드는 바꾸지 않는다(다음 방문에 다시 자동 시도). 단, 권한 거부는 매번 실패하므로 직접 입력을 저장한다.
6. **지역 이름**: 날씨 조회와 같은 좌표로 조회한다. 표시 형식은 `principalSubdivision`과 `locality`를 이어 쓰되 같은 값이 겹치면 한 번만 쓴다. 문자열이 아니거나 비어 있으면 그 부분을 뺀다. 길이를 제한하고(예: 각 40자) React 기본 escaping으로만 출력한다(HTML 삽입 금지).
7. **지역 조회 실패는 날씨를 막지 않는다**: 지역 이름을 얻지 못해도 날씨는 채우고, 지역 자리에 "현재 위치"처럼 중립 문구를 쓴다. 지역 API에도 시간 제한과 중단 처리(AbortSignal)를 둔다. `credentials: "omit"`, `referrerPolicy: "no-referrer"`를 쓴다.
8. **좌표**: 소수 2자리로 반올림해 두 API에 보낸다. 범위 검사는 유지한다.
9. **제출 값**: Backend로 보내는 것은 지금과 같이 기온과 날씨 종류뿐이다. 자동 모드에서 조회가 끝나지 않았으면 제출 전 검증이 기존처럼 동작해야 한다(값 없음 → 안내).
10. 사용자가 자동 조회 결과가 온 뒤 직접 입력으로 바꾸면 채워진 값을 유지해 고칠 수 있게 한다. 늦게 도착한 응답이 사용자의 직접 입력을 덮어쓰지 않게 한다(TASK-035의 기존 보호 유지).
11. 접근성: 모드 전환 버튼과 상태 문구에 접근 가능한 이름을 두고, 조회 상태 변화는 `aria-live`로 알린다. 390px 폭에서 배치가 깨지지 않게 기존 Token을 쓴다.

### Test

- 저장값 없음 → 자동 조회 시작, 저장값 false → 직접 입력 유지
- 조회 성공 시 지역 + 날씨 + 기온 요약 표시, 지역 실패 시에도 날씨는 채워짐
- 권한 거부 / API 실패 시 직접 입력 화면으로 전환되고 제출 가능
- 좌표 소수 2자리 반올림, 지역 이름 조합(중복 제거 / 빈 값 / 비문자열)
- 기존 Test를 깨지 않는다. 기존 Test가 "기본은 수동"을 전제로 하면 새 결정에 맞게 고친다.

### 문서

- `docs/19-LOCATION-WEATHER.md`: 기본 자동, 모드, 지역 이름 API(출처, 조건, 보내는 값), 좌표 소수 2자리, 실패 처리. BigDataCloud 이용 조건은 확인한 범위만 쓰고 확인하지 못한 것은 "확인 필요"로 남긴다.
- `docs/09-DECISIONS.md`: 새 Decision(최신 번호 다음, Human Approved 2026-10-04) — 기본 자동, 지역 이름 API, 좌표 정밀도 변경.
- `docs/07-TASKS.md`: TASK-040 행과 절 추가, DONE(Milestone 40). Task 표가 빈 줄로 끊기지 않게 한다. 다른 Task 상태는 바꾸지 않는다.
- `docs/08-WORK_LOG.md`, `prompts/`(색인 포함).

### 금지

- 새 Dependency, Backend / API 계약 / Infra 변경
- 좌표 / 지역 이름 저장, 로그 출력
- API Key가 필요한 서비스 사용

## Run 2 범위 (2026-10-04, Claude 세션 기록)

Run 1 구현은 Branch에 "검토 미완료 WIP"로 Commit되어 있다. Run 1은 Orchestrator Verify에서 멈췄다(Review 전).

- 실패: `frontend/src/services/weather.test.ts`의 "sends the same rounded coordinates to both APIs and returns weather with a region fallback" 1건. 나머지 116건은 통과했다.
- 원인: `vi.fn().mockResolvedValue(new Response(...))`가 두 번의 fetch(지역 / 날씨)에 **같은 Response 객체**를 돌려준다. Response body는 한 번만 읽을 수 있어 두 번째 읽기가 실패하고 날씨 조회가 "날씨 응답을 가져오지 못했습니다"로 끝난다. 구현이 아니라 Test의 mock 문제다.
- Run 2에서 할 일: 이 Test(와 같은 방식의 mock을 쓰는 다른 Test가 있으면 함께)를 호출마다 새 Response를 돌려주게 고친다(`mockImplementation`). 호출 순서(`mock.calls[0]` / `[1]`)에 기대는 검증은 URL origin으로 구분하게 바꾼다. 기대값이 의도와 다르면(예: 지역 이름 fallback을 검증하려는 것이면 지역 응답을 실패 / 빈 값으로 따로 준다) 의도에 맞게 고친다.
- 구현 코드는 Test를 고치는 데 꼭 필요한 경우가 아니면 바꾸지 않는다. Run 1의 문서 변경은 유지하고 `docs/08-WORK_LOG.md`에 Run 2 기록을 추가한다.

## Verification

- `bash scripts/verify.sh`
- `git diff --check`

## Claude Review 기준

- 저장값 없음이 자동으로 동작하는가, 실패 때 제출이 막히지 않는가
- 지역 조회 실패가 날씨 조회를 막지 않는가, 외부 응답을 검증 없이 쓰지 않는가
- 좌표와 지역 이름이 저장되거나 Backend로 가지 않는가
- 늦은 응답이 사용자 입력을 덮어쓰지 않는가
- 새 Dependency가 없는가

## 완료 조건

검증과 Review를 통과하면 REVIEW. Merge 후 Staging에서 자동 조회와 지역 표시를 확인한다.
