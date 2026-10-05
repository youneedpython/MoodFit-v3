# TASK-060 — History Record Compact (기록 Card 추천 접기 / 주간 리포트 기간 표기)

> 공통 실행 규칙: [COMMON.md](COMMON.md)

## 목적

History의 기록 Card는 기록마다 추천 음식 5개와 음악 5곡 이름을 모두 펼쳐 보여서, 모바일에서 한 페이지(5건)가 매우 길다. 추천 이력을 접어 두고, 주간 리포트의 기간 표기를 다른 날짜와 같은 형식으로 맞춘다. Frontend와 문서만 바꾼다.

## 초기 상태 / Dependency

- 초기: `READY` (Human 지시, 2026-10-05)
- 선행: TASK-045, TASK-048, TASK-056
- 실행: `node scripts/orchestrator/run.mjs TASK-060`

## Human 지시 (2026-10-05)

Claude 세션이 화면을 훑어 뽑은 개선 후보를 Human이 모두 승인했다("위 사항 모두 Task로 정리"). UI / UX 수정은 화면별로 나눠 진행한다. 이 Task가 맡는 후보: H2(기록 Card의 추천 음식 / 음악 접기), H3(주간 리포트 기간 표기).

참고: 후보 H1(그래프 시간 방향)은 Claude 세션의 오인이었다. API는 기록을 오래된 순으로 주고 그래프는 이미 과거 → 현재(왼쪽 → 오른쪽)로 그린다. 그래프는 바꾸지 않는다.

## 현재 구조 (Claude 세션 확인)

- `frontend/src/features/history/HistoryRecordList.tsx`: 기록마다 머리 줄(시각, Mood Badge, 긴장도 Badge, Score) → 지표 `dl`(심박수 … 날씨) → 추천 `dl`("추천 음식" / "추천 음악", 이름을 쉼표로 나열). 한 페이지 5건, Pagination.
- `frontend/src/features/insight/InsightCard.tsx`: 주간 리포트의 기간 줄이 `2026-09-28 ~ 2026-10-04 · 7건`처럼 API 값(`periodStart`, `periodEnd`, `YYYY-MM-DD`)을 그대로 보여 준다. 다른 날짜는 "10월 5일 (월) 오전 10:36"처럼 한국어로 표시한다(`frontend/src/utils/dateTime.ts`).

## 설계 (실행 기준)

### 1. 기록 Card의 추천 이력 접기 (H2)

- 추천 `dl`을 HTML 기본 요소 `<details>` / `<summary>`로 감싸 **기본은 접힌 상태**로 둔다. JavaScript State로 직접 만들지 않는다(Keyboard와 Screen Reader 동작을 Browser가 제공한다).
- `summary` 문구: "추천 음식 5개 · 음악 5곡 보기"처럼 실제 개수를 넣는다(`foodNames.length`, `musicTitles.length`). 개수가 0인 쪽은 문구에서 뺀다. 둘 다 0이면 `details` 자체를 그리지 않는다.
- 펼치면 지금과 같은 내용("추천 음식" / "추천 음악"과 이름 목록)이 보인다. 내용과 순서는 바꾸지 않는다.
- `summary`의 터치 영역은 44px 이상, 초점 테두리가 보인다. 펼침 표시(삼각형 등)는 글자와 겹치지 않게 한다.
- 페이지를 넘기면 새 페이지의 기록은 접힌 상태로 시작한다.
- 지표 `dl`과 머리 줄은 바꾸지 않는다.

### 2. 주간 리포트 기간 표기 (H3)

- 기간 줄을 "9월 28일 ~ 10월 4일 · 7건"으로 표시한다. 두 날짜의 연도가 서로 다르거나 올해가 아니면 "2025년 12월 29일 ~ 2026년 1월 4일"처럼 양쪽에 연도를 붙인다.
- `periodStart` / `periodEnd`는 `YYYY-MM-DD` 문자열이다. `new Date("YYYY-MM-DD")`는 UTC로 해석되어 날짜가 밀릴 수 있으므로 **문자열을 직접 나눠서** 월 / 일을 만든다. 형식이 맞지 않으면 원래 문자열을 그대로 보여 준다.
- 변환 함수는 `frontend/src/utils/dateTime.ts`에 두고 단위 Test를 붙인다. "올해" 판단에 쓰는 현재 날짜는 인자로 받을 수 있게 해 Test에서 고정한다.
- 기계가 읽을 수 있게 각 날짜를 `<time dateTime="2026-09-28">`으로 감싼다.

### Test

- 기록 Card: `details`가 기본으로 닫혀 있다(`open` 속성 없음). `summary` 문구에 개수가 들어간다. `details` 안에 음식 / 음악 이름이 있다. 이름이 없는 기록에는 `details`가 없다.
- 기간 변환: 같은 해(올해), 올해가 아닌 해, 해가 걸친 경우, 형식이 틀린 입력.
- 주간 리포트 Card에 변환된 기간과 건수가 보이고 `time` 요소의 `dateTime`이 원래 값이다.
- jest-dom Matcher(`toBeVisible`, `toHaveTextContent`, `toBeDisabled` 등)를 쓰지 않는다. 이 저장소에는 설치되어 있지 않다. `toBeTruthy()`, `textContent`를 쓴다.
- Test의 타입 오류에 주의한다(`tsc --noEmit`). CSS 파일 내용을 `?raw` import로 읽어 검사하지 않는다.
- 기존 Test는 그대로 통과해야 한다. 바뀐 구조를 가정하던 곳만 고친다.

### 문서

- `docs/07-TASKS.md`: 이미 READY로 등록된 TASK-060 행과 절을 DONE으로 고치고 구현 내용을 적는다(없으면 번호 순서에 맞게 추가, Task 표가 빈 줄로 끊기지 않게). 다른 Task 상태는 바꾸지 않는다.
- `docs/03-UX_UI_SPEC.md`의 History 부분에 추천 이력을 접어 둔다는 점을 한 줄로 적는다. `docs/23-LLM-INSIGHT.md`에 기간 표기를 적는다.
- `docs/08-WORK_LOG.md`, `prompts/`(지금 있는 마지막 번호의 다음 번호).

### 금지

- Backend / API / 계약 / Dependency 변경, 새 색 / 크기 값 추가(기존 Token 사용)
- 그래프(`WellnessTrend`), Pagination 동작, 지표 표시 변경
- `frontend/src/features/auth/`, `frontend/src/features/dashboard/`, `frontend/src/features/checkin/` 변경

### 참고 (Executor Sandbox)

- Sandbox에서 npm Test를 실행하지 못할 수 있다. 실행하지 못한 검증은 `docs/08-WORK_LOG.md`에 적는다. 판정은 Sandbox 밖 Orchestrator Verify가 한다.

## Verification

- `bash scripts/verify.sh`
- `git diff --check`

## Claude Review 기준

- 추천 이력이 `details` / `summary`로 접히고 내용이 그대로인가, 개수가 0일 때 처리가 맞는가
- 기간 변환이 문자열을 직접 나누는가(시간대로 날짜가 밀리지 않는가), 연도 규칙이 맞는가
- 설계에 없는 문구 / 동작을 바꾸지 않았는가, 새 Dependency / 새 색을 만들지 않았는가

## 완료 조건

검증과 Review를 통과하면 REVIEW. Claude 세션이 390 / 768 / 1280px 캡처(접힘 / 펼침)로 확인한다.
