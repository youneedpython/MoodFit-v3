# TASK-059 — Weather Card Layout (Check-in 날씨 영역 배치)

> 공통 실행 규칙: [COMMON.md](COMMON.md)

## 목적

Check-in 화면의 "날씨" 영역은 버튼, 안내, 출처, 조회 결과가 섞여 있어 정작 중요한 조회 결과가 맨 아래에 있다. Human이 정한 순서대로 배치를 바꿔 읽기 쉽게 한다. Frontend와 문서만 바꾼다.

## 초기 상태 / Dependency

- 초기: `READY` (Human 지시, 2026-10-05)
- 선행: TASK-040, TASK-044
- 실행: `node scripts/orchestrator/run.mjs TASK-059`

## Human 지시 (2026-10-05)

"check-in 페이지에서 '날씨' 카드에서 배치를 가독성 있게 변경했으면 해." Human이 준 순서:

1. 날씨 (제목)
2. 날씨 모드: 자동
3. 현재 위치의 날씨를 가져왔습니다. ~ (상태 문구)
4. 서울특별시 ~ (조회 결과)
5. 다시 조회, 직접 입력 버튼
6. 위치(좌표)는 소수 둘째 자리 ~ (좌표 처리 안내)
7. 지역 이름, 날씨 데이터 (출처)

UI / UX 수정은 성격에 따라 나눠서 진행한다. 이 Task는 "Check-in 날씨 영역"만 맡는다. 사용자 메뉴(TASK-057)와 추천 평가 버튼(TASK-058)은 건드리지 않는다.

## 현재 구조 (Claude 세션 확인)

`frontend/src/features/checkin/CheckinPage.tsx`의 날씨 `fieldset`:

- 제목 "날씨", 설명 "현재 위치의 기온과 날씨를 입력해 주세요."
- `checkin-weather-tools`: "날씨 모드: 자동 / 직접 입력" → 버튼("다시 조회" 또는 "자동으로 가져오기", 자동일 때 "직접 입력") → 좌표 안내 → "지역 이름: BigDataCloud" → "날씨 데이터: Open-Meteo" → 상태 문구(`role="status"` 또는 `alert`)
- 그 아래: 자동이면 조회 결과 줄(`checkin-weather-summary`, "서울특별시 구로5동 · 맑음 · 18.5°C"), 직접 입력이면 기온 입력칸과 날씨 상태 선택
- 두 버튼 모두 강조 Variant(Gradient)라 화면 아래의 "분석 요청"과 같은 무게로 보인다.

## 설계 (실행 기준)

### 1. 자동 모드의 순서

위에서 아래로:

1. 제목 "날씨"
2. 날씨 모드 줄: "날씨 모드: 자동"
3. 상태 문구(조회 중 / 가져옴 / 실패)
4. 조회 결과 줄("지역 · 날씨 · 기온"). 이 영역에서 가장 눈에 띄어야 한다(지금의 배경 Box 유지, 글자를 본문보다 한 단계 강조 — 기존 Token).
5. 버튼 줄: "다시 조회", "직접 입력"
6. 좌표 처리 안내(보조 글자)
7. 출처(보조 글자): "지역 이름: BigDataCloud", "날씨 데이터: Open-Meteo". 넓은 화면에서는 한 줄에 나란히, 좁은 화면에서는 줄바꿈되어도 된다.

### 2. 직접 입력 모드의 순서

같은 틀을 따른다.

1. 제목 "날씨"
2. "날씨 모드: 직접 입력"
3. 상태 문구(있을 때만. 예: 위치 권한 거부, 조회 실패)
4. 기온 입력칸과 날씨 상태 선택(조회 결과 줄의 자리)
5. 버튼 줄: "자동으로 가져오기"
6. 좌표 처리 안내
7. 출처

### 3. 세부

- 제목 아래 설명 문장: 자동 모드에서는 "현재 위치의 날씨를 자동으로 가져옵니다.", 직접 입력 모드에서는 지금 문장("현재 위치의 기온과 날씨를 입력해 주세요.")을 쓴다. 자동 모드에서 "입력해 주세요"라고 하면 맞지 않기 때문이다.
- 이 영역의 버튼("다시 조회", "직접 입력", "자동으로 가져오기")은 공통 `Button`의 **덜 강조되는 기존 Variant**로 바꾼다. 화면의 주된 동작은 "분석 요청" 하나여야 한다. 새 Variant를 만들지 않는다.
- 구역 사이 간격은 기존 간격 Token으로 맞춘다: (모드 + 상태 + 결과) / (버튼) / (안내 + 출처)가 세 묶음으로 읽히게 한다.
- 상태 문구, 조회 결과 줄, 버튼 이름, 안내 문구, 출처 Link의 **문구와 Link 주소는 바꾸지 않는다**(위의 자동 모드 설명 문장만 예외).
- 동작은 바꾸지 않는다: 자동 조회, 다시 조회, 모드 전환과 저장, 실패 시 직접 입력 전환, 입력 검증과 오류 표시, 제출 값.
- 접근성: 상태 문구의 `role`(`status` / `alert`)과 `aria-live`, 조회 결과 줄의 `aria-live`, 직접 입력 `fieldset` / `legend` / `aria-describedby`를 유지한다. DOM 순서가 보이는 순서와 같아야 한다(CSS `order`로만 바꾸지 않는다).
- 390 / 768 / 1280px에서 가로 넘침이 없고 버튼의 터치 영역은 44px 이상이다.

### Test

- 자동 모드 DOM 순서: 모드 줄 → 상태 문구 → 조회 결과 줄 → 버튼 → 좌표 안내 → 출처.
- 직접 입력 모드 DOM 순서: 모드 줄 → 기온 / 날씨 입력 → "자동으로 가져오기" 버튼 → 좌표 안내 → 출처.
- 자동 모드와 직접 입력 모드의 설명 문장이 각각 맞게 나온다.
- 기존 날씨 Test(`CheckinWeather.test.tsx`, `CheckinPage.test.tsx`, `RegionDisplay.test.tsx`)는 그대로 통과해야 한다. 순서를 가정하던 곳만 고친다.
- 순서 비교는 `compareDocumentPosition`을 쓴다.
- jest-dom Matcher(`toBeVisible`, `toHaveTextContent`, `toBeDisabled` 등)를 쓰지 않는다. 이 저장소에는 설치되어 있지 않다. `toBeTruthy()`, `textContent`를 쓴다.
- Test의 타입 오류에 주의한다(`tsc --noEmit`). CSS 파일 내용을 `?raw` import로 읽어 검사하지 않는다.

### 문서

- `docs/19-LOCATION-WEATHER.md`: 날씨 영역의 배치 순서.
- `docs/07-TASKS.md`: TASK-059 행과 절 추가, DONE(Milestone 59, 번호 순서, Task 표가 빈 줄로 끊기지 않게). 다른 Task 상태는 바꾸지 않는다.
- `docs/08-WORK_LOG.md`, `prompts/`(다음 번호 `86-`).

### 금지

- Backend / API / 계약 / Dependency 변경
- 날씨 조회 방식, 좌표 처리, 외부 서비스 변경
- Check-in의 다른 영역(신체 리듬, 컨디션, 결과 화면) 변경
- `frontend/src/features/auth/`, `frontend/src/features/dashboard/` 변경

### 참고 (Executor Sandbox)

- Sandbox에서 npm Test를 실행하지 못할 수 있다. 실행하지 못한 검증은 `docs/08-WORK_LOG.md`에 적는다. 판정은 Sandbox 밖 Orchestrator Verify가 한다.

## Verification

- `bash scripts/verify.sh`
- `git diff --check`

## Claude Review 기준

- 자동 / 직접 입력 모드의 순서가 Human 지시와 같은가, DOM 순서와 보이는 순서가 같은가
- 문구, Link, 동작, 접근성 속성이 유지되는가
- 버튼이 덜 강조되는 기존 Variant인가, 새 색 / 새 Variant / Dependency를 만들지 않았는가
- 다른 영역을 건드리지 않았는가

## 완료 조건

검증과 Review를 통과하면 REVIEW. Claude 세션이 390 / 768 / 1280px 캡처(자동 / 직접 입력 / 실패)로 확인한다.
