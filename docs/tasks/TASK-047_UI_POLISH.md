# TASK-047 — UI Polish (AI 코멘트 자동 생성 / 음식 아이콘 / History 페이지 나누기)

> 공통 실행 규칙: [COMMON.md](COMMON.md)

## 목적

Human이 Staging 화면을 보고 요청한 화면 보완 3가지를 반영한다. Frontend만 바꾼다.

## 초기 상태 / Dependency

- 초기: `READY` (Human 지시, 2026-10-04)
- 선행: TASK-036(추천 5개), TASK-045(AI 코멘트)
- 실행: `node scripts/orchestrator/run.mjs TASK-047`

## Human 지시 (2026-10-04)

1. "AI 코멘트는 자동으로 생성되었으면 해."
2. "추천 음식에 음식과 관련된 이미지 또는 아이콘이 보였으면 해."
3. "history page의 '기록'은 페이지네이션으로 처리했으면 해. 한 페이지에 5개씩 보이도록."

## 설계 (실행 기준)

### 1. AI 코멘트 자동 생성

- 지금: Check-in 결과 화면은 자동으로 생성 요청을 하고, Dashboard는 조회만 한 뒤 저장된 것이 없으면 "AI 코멘트 받기" 버튼을 보여 준다.
- 바꿀 것: **Dashboard에서도** 최신 기록에 저장된 코멘트가 없고 `enabled`와 `available`이 모두 true면 자동으로 생성 요청(POST)을 한 번 한다. 버튼을 누를 필요가 없다.
- 지켜야 할 것:
  - 한 화면 진입에 자동 요청은 **한 번만** 한다(실패해도 반복하지 않는다). React StrictMode / 재Render로 두 번 나가지 않게 한다.
  - 자동 요청이 실패(`text` null, 403, 429, Network 오류)하면 기존 실패 문구를 보여 주고, **수동 "다시 시도" 버튼**을 둔다(지금의 "AI 코멘트 받기" 버튼을 실패 뒤 재시도 용도로 쓴다. 문구는 "다시 시도").
  - 생성 중에는 진행 표시를 보여 준다.
  - 체험 계정(`available` false)과 기능 꺼짐(`enabled` false)의 동작은 그대로다(요청하지 않는다).
  - Backend는 저장된 코멘트가 있으면 재호출 없이 돌려주므로 비용이 늘지 않는다. 하루 한도(429)는 그대로 Server가 강제한다.
- Check-in 결과 화면의 자동 요청도 위 규칙(한 번만, 실패 시 "다시 시도")과 같게 맞춘다.

### 2. 추천 음식 아이콘

- 추천 음식 각 항목의 이름 왼쪽에 음식과 어울리는 **Emoji 아이콘**을 보여 준다. 사진 / 외부 이미지 / 새 Asset 파일은 쓰지 않는다(저작권과 용량 문제가 없다).
- 음식 이름 → Emoji 대응표를 Frontend에 둔다. 현재 Backend 추천 규칙(`backend/src/main/java/com/moodfit/service/WellnessRulePolicy.java`, 읽기만 한다)이 내보내는 **모든 음식 이름**에 대응을 정한다. 이름에 들어 있는 낱말로 고른다(예: 샐러드 → 🥗, 비빔밥 → 🍚, 샌드위치 → 🥪, 스튜 → 🍲, 칼국수 / 국수 → 🍜, 파스타 → 🍝, 죽 → 🥣, 차 → 🍵). 대응이 없는 이름은 기본 아이콘(🍽️)을 쓴다.
- 아이콘은 장식이다: `aria-hidden="true"`로 두어 화면 낭독기가 읽지 않게 한다(음식 이름이 이미 있다).
- Dashboard, Check-in 결과 화면의 추천 음식 목록에 적용한다(공통 추천 Card). History의 추천 음식은 이름 나열이라 적용하지 않는다.
- 크기와 간격은 기존 Token을 쓴다. 긴 이름에서 줄바꿈이 어색하지 않게 아이콘은 고정 폭으로 둔다.
- Test: 현재 규칙의 모든 음식 이름에 기본 아이콘이 아닌 아이콘이 대응되는지(이름 목록을 Test에 적는다), 모르는 이름은 기본 아이콘, 아이콘이 접근성 이름에 포함되지 않는지.
- 추천 음악에는 아이콘을 넣지 않는다(요청 범위 밖).

### 3. History "기록" 페이지 나누기

- "기록" 목록을 **한 페이지에 5개씩** 보여 준다. 최신 기록이 첫 페이지에 오게 한다(지금 정렬이 오래된 순이면, 목록만 최신순으로 바꾼다. 그래프의 순서는 바꾸지 않는다).
- Server API는 바꾸지 않는다. 이미 받아 온 최근 7일 기록을 화면에서 나눈다.
- 페이지 이동 UI: "이전" / "다음" 버튼과 현재 위치 표시(예: "1 / 3"). 기록이 5개 이하면 이동 UI를 보여 주지 않는다. 첫 / 마지막 페이지에서는 해당 버튼을 `disabled`로 둔다.
- 접근성: 이동 UI를 `nav`(`aria-label="기록 페이지"`)로 감싸고, 현재 위치 문구는 `aria-live="polite"`로 알린다. 페이지를 바꾸면 focus를 목록 제목("기록")으로 옮겨 Keyboard 사용자가 새 목록의 처음부터 읽게 한다.
- 기록 수가 바뀌어 현재 페이지가 범위를 벗어나면 마지막 페이지로 맞춘다.
- 그래프, 주간 리포트 Card, 요약 문구("기록 N건 …")는 전체 기록 기준으로 그대로 둔다.
- Test: 5개 이하(이동 UI 없음), 6개 이상(첫 페이지 5개, "다음"으로 나머지), 버튼 `disabled` 상태, 최신순.

### 문서

- `docs/07-TASKS.md`: TASK-047 행과 절 추가, DONE(Milestone 47, 번호 순서, Task 표가 빈 줄로 끊기지 않게). 다른 Task 상태는 바꾸지 않는다.
- `docs/23-LLM-INSIGHT.md`: Dashboard 자동 생성으로 바뀐 동작(한 번만, 실패 시 다시 시도).
- `docs/08-WORK_LOG.md`, README 기능 소개(필요하면 한 줄), `prompts/`.

### 금지

- Backend / API 계약 / Dependency 변경, 새 Asset 파일, 외부 이미지
- 추천 규칙이나 추천 개수 변경(다양화는 별도 Task)

### 참고 (Executor Sandbox)

- Sandbox에서 npm Test를 실행하지 못할 수 있다. 그 경우 실행하지 못한 검증을 `docs/08-WORK_LOG.md`에 적는다. 판정은 Sandbox 밖 Orchestrator Verify가 한다. Test의 타입 오류에 주의한다(`tsc --noEmit`가 Build에 포함된다. 예: Testing Library의 `getByRole` 옵션에는 `exact`가 없다).

## Verification

- `bash scripts/verify.sh`
- `git diff --check`

## Claude Review 기준

- 자동 요청이 한 번만 나가는가(StrictMode, 재Render, 실패 뒤 반복 없음), 체험 계정 / 꺼짐 상태에서 요청하지 않는가
- 아이콘이 낭독기에 읽히지 않는가, 현재 모든 음식 이름에 대응이 있는가
- 페이지 나누기가 5개 기준이고 최신순인가, 이동 UI의 접근성과 `disabled` 처리가 맞는가
- Backend와 API 호출 형식을 바꾸지 않았는가

## 완료 조건

검증과 Review를 통과하면 REVIEW. Claude 세션이 390 / 768 / 1280px 캡처로 확인한다.
