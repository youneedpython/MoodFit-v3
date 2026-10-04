# TASK-041 — Header Logo Link / Alignment (로고 클릭 이동 + 정렬)

> 공통 실행 규칙: [COMMON.md](COMMON.md)

## 목적

상단 메뉴의 로고를 누르면 첫 화면(Dashboard, `/`)으로 이동하게 하고, 로고와 날짜 글자의 세로 위치를 맞춘다.

## 초기 상태 / Dependency

- 초기: `READY` (Human 지시, 2026-10-04)
- 선행: TASK-037
- 실행: `node scripts/orchestrator/run.mjs TASK-041`

## Human 지시 (2026-10-04)

1. "페이지의 좌측 상단 로고를 클릭하면, index(main) page 이동"
2. "로고와 날짜의 위치 맞추기" — 현재 날짜 글자가 로고 / "MoodFit" 글자보다 아래로 내려가 보인다(Human이 화면 캡처로 확인). TASK-037 Review도 같은 가능성을 지적했다: `.app-header__brand`가 `align-items: baseline`인데 첫 항목이 그림이라 기준선이 그림 아래쪽에 잡힌다.

## Codex 작업 범위

1. `frontend/src/app/AppLayout.tsx`: 로고 그림과 "MoodFit" 글자를 하나의 Link(`/`)로 감싼다. SPA 내부 이동(react-router Link)을 쓰고 전체 새로고침을 하지 않는다.
   - 접근 가능한 이름은 한 번만 읽히게 한다(그림은 지금처럼 장식, 글자가 이름을 제공). Link의 이름이 "MoodFit"(필요하면 "MoodFit 홈")이 되게 한다.
   - Keyboard focus 표시가 보이게 한다(기존 focus Token / 방식 사용). 글자의 gradient 표현은 유지한다.
   - 날짜는 Link 밖에 둔다.
2. `frontend/src/app/AppLayout.css`: 로고 묶음과 날짜가 세로 가운데로 맞게 한다(예: `.app-header__brand`의 `align-items: center`). 좁은 화면(390px)에서 메뉴 줄바꿈 동작과 간격은 지금과 같게 유지한다. 새 색 / 크기 값을 만들지 말고 기존 Token을 쓴다.
3. Test(`frontend/src/app/` 아래 기존 Test 갱신 / 추가): 로고 Link가 `/`를 가리키는지, 다른 화면에서 누르면 Dashboard로 이동하는지, 접근 가능한 이름이 중복되지 않는지.
4. 문서: `docs/07-TASKS.md`에 TASK-041 행과 절 추가, DONE(Milestone 41, Task 표가 빈 줄로 끊기지 않게, 번호 순서대로). `docs/08-WORK_LOG.md`, `prompts/`(색인 포함). 다른 Task 상태는 바꾸지 않는다.
5. 새 Dependency 없음. 로고 Asset, 다른 화면, Backend는 바꾸지 않는다.

## Run 2 범위 (2026-10-04, Claude 세션 기록)

Run 1 구현은 Branch에 "검토 미완료 WIP"로 Commit되어 있다. Run 1은 Orchestrator Verify의 Frontend Build(`tsc --noEmit`)에서 멈췄다(Review 전). Test 123건은 모두 통과했다.

- 실패: `frontend/src/app/AppLayout.test.tsx` 17행, 38행 — `getByRole(..., { name: ..., exact: true })`의 `exact`는 `ByRoleOptions`에 없는 속성이다(TS2769).
- Run 2에서 할 일: 두 곳에서 `exact`를 없애고 같은 의도를 타입에 맞게 표현한다(예: `name`에 정확히 일치하는 정규식 `/^MoodFit$/` 사용). 다른 Test 파일에 같은 표기가 있으면 함께 고친다.
- 구현 코드와 CSS는 바꾸지 않는다. `docs/08-WORK_LOG.md`에 Run 2 기록을 추가한다.

## Verification

- `bash scripts/verify.sh`
- `git diff --check`

## Claude Review 기준

- 로고 Link가 SPA 내부 이동인가, 접근 가능한 이름이 중복되지 않는가, focus 표시가 있는가
- 날짜와 로고가 세로로 맞는가(CSS 근거), 좁은 화면 배치를 깨지 않는가
- 범위 밖 변경이 없는가

## 완료 조건

검증과 Review를 통과하면 REVIEW. Claude 세션이 390 / 768 / 1280px 캡처로 정렬을 확인한다.
