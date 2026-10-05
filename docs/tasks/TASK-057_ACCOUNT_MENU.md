# TASK-057 — Account Menu (회원 탈퇴 메뉴 이름 / 사용자 메뉴와 확인 창 정리)

> 공통 실행 규칙: [COMMON.md](COMMON.md)

## 목적

Human이 Staging에서 소셜 계정으로 로그인한 뒤 "탈퇴 메뉴가 없다(안 보인다)"고 지적했다. 기능은 TASK-054에서 "내 데이터 삭제"라는 이름으로 들어가 있지만, 사용자가 찾는 말("탈퇴")과 달라 찾지 못했다. 메뉴 이름을 고치고, 같은 영역(사용자 메뉴와 확인 창)의 미뤄 둔 UI 문제를 함께 정리한다. Frontend와 문서만 바꾼다.

## 초기 상태 / Dependency

- 초기: `READY` (Human 지시, 2026-10-05)
- 선행: TASK-054
- 실행: `node scripts/orchestrator/run.mjs TASK-057`

## Human 지시 (2026-10-05)

- "소셜 계정으로 '탈퇴' 메뉴 없음(안 보임)"
- UI / UX 수정은 성격에 따라 나눠서 진행한다(Claude 세션 판단 위임). 이 Task는 "계정 영역"을 맡는다. 추천 평가 버튼은 TASK-058이 맡으므로 건드리지 않는다.

## 현재 구조 (Claude 세션 확인)

- `frontend/src/features/auth/UserMenu.tsx`: 아바타를 누르면 닉네임, 제공자, "로그아웃" 버튼, "개인정보 처리 안내" Link, "내 데이터 삭제" 버튼(소셜 계정만)이 나온다. 항목 사이 간격이 고르지 않고(Link만 버튼 사이에 붙어 있다) 삭제 항목이 다른 항목과 구분되지 않는다.
- `frontend/src/features/auth/DeleteAccountDialog.tsx`: 제목 "내 데이터 삭제", 버튼 "취소" / "삭제". 버튼이 Browser 기본 모양이다. 삭제 요청이 진행 중일 때도 "취소"와 Esc로 창이 닫힌다.
- `frontend/src/features/privacy/PrivacyPage.tsx`, `docs/22-AUTH.md`, `docs/25-PRIVACY.md`가 메뉴 이름 "내 데이터 삭제"를 인용한다.

## 설계 (실행 기준)

### 1. 이름

- 사용자 메뉴 항목: "내 데이터 삭제" → **"회원 탈퇴"**
- 확인 창 제목: **"회원 탈퇴"**
- 확인 창의 실행 버튼: "삭제" → **"탈퇴하기"**, 진행 중 "탈퇴 처리 중…"
- 확인 창 설명 문장은 지우는 대상 목록과 "되돌릴 수 없습니다", 백업 보관 안내를 그대로 두되, 첫머리를 "탈퇴하면 …을 모두 삭제하고 로그아웃합니다."로 맞춘다. 지우는 대상 목록의 내용은 바꾸지 않는다.
- 진행 / 실패 문구도 같은 말로 맞춘다("탈퇴 처리하고 있습니다.", "탈퇴하지 못했습니다. 다시 시도해 주세요.").
- 로그인 화면의 삭제 완료 안내 문구는 뜻이 맞으면 그대로 둔다.
- 개인정보 처리 안내 화면과 `docs/22-AUTH.md`, `docs/25-PRIVACY.md`에서 메뉴 이름을 인용한 곳을 새 이름으로 고친다. 절 제목 "계정과 기록 삭제"는 그대로 둬도 된다.

### 2. 사용자 메뉴 모양

- 항목 순서: 닉네임 / 제공자 → "개인정보 처리 안내" → "로그아웃" → 구분선 → "회원 탈퇴".
- 항목 사이 간격을 기존 간격 Token으로 고르게 맞춘다. 닉네임은 본문 굵게, 제공자는 보조 글자 색으로 덜 강조한다.
- "회원 탈퇴"는 구분선 아래에 두고 위험한 동작임을 글자 색으로 구분한다(기존 위험 / 오류 색 Token이 있으면 그것을 쓴다. 없으면 새 색을 만들지 말고 구분선과 배치만으로 구분한다).
- 체험 계정에는 "회원 탈퇴"와 구분선이 보이지 않는다(지금과 같다).
- 메뉴의 동작(열기 / 닫기, Esc, 바깥 클릭, 초점 이동, `role="menu"` / `menuitem`)은 바꾸지 않는다. 메뉴가 열릴 때 첫 초점 대상이 바뀌어야 하면 첫 번째 `menuitem`으로 맞춘다.
- 모든 항목의 터치 영역은 44px 이상이다.

### 3. 확인 창

- 버튼은 공통 `Button` Component(`frontend/src/components/Button/`)의 기존 Variant를 쓴다. "취소"는 덜 강조되는 Variant, "탈퇴하기"는 강조되는 Variant. 새 Variant나 새 색을 만들지 않는다.
- 탈퇴 요청이 진행 중일 때: "취소" 버튼을 비활성화하고 Esc로도 닫히지 않게 한다. 실패하면 다시 닫을 수 있어야 한다.
- 기본 초점은 "취소"(지금과 같다). 초점 가두기, `aria-modal`, `aria-busy`는 유지한다.
- 제목 / 설명 / 버튼 줄 사이 간격을 기존 간격 Token으로 맞춘다.
- 390 / 768 / 1280px에서 창이 화면을 넘지 않는다.

### Test

- 소셜 계정: 메뉴에 "회원 탈퇴" `menuitem`이 있고 "내 데이터 삭제"는 없다. 체험 계정: "회원 탈퇴"가 없다.
- 확인 창 제목과 버튼 이름이 새 이름이다.
- 진행 중에는 "취소"가 비활성화되고 Esc로 닫히지 않는다. 실패 뒤에는 닫을 수 있다.
- 기존 Test에서 옛 이름을 찾던 곳을 새 이름으로 고친다. 기존 삭제 흐름 Test(요청 1회, 완료 안내, 실패 안내)는 그대로 통과해야 한다.
- jest-dom Matcher(`toBeVisible`, `toHaveTextContent`, `toBeDisabled` 등)를 쓰지 않는다. 이 저장소에는 설치되어 있지 않다. `toBeTruthy()`, `textContent`, `(el as HTMLButtonElement).disabled`를 쓴다.
- Test의 타입 오류에 주의한다(`tsc --noEmit`). CSS 파일 내용을 `?raw` import로 읽어 검사하지 않는다.

### 문서

- `docs/22-AUTH.md`, `docs/25-PRIVACY.md`: 메뉴 이름과 진행 중 닫기 동작.
- `docs/07-TASKS.md`: TASK-057 행과 절 추가, DONE(Milestone 57, 번호 순서, Task 표가 빈 줄로 끊기지 않게). 다른 Task 상태는 바꾸지 않는다.
- `docs/08-WORK_LOG.md`, `prompts/`(다음 번호 `84-`).

### 금지

- Backend / API / 계약 / Dependency 변경
- 추천 영역(`frontend/src/features/dashboard/RecommendationCards.*`) 변경 — TASK-058 범위
- 삭제 대상과 삭제 방식 변경

### 참고 (Executor Sandbox)

- Sandbox에서 npm Test를 실행하지 못할 수 있다. 실행하지 못한 검증은 `docs/08-WORK_LOG.md`에 적는다. 판정은 Sandbox 밖 Orchestrator Verify가 한다.

## Verification

- `bash scripts/verify.sh`
- `git diff --check`

## Claude Review 기준

- 메뉴 / 확인 창 / 안내 화면 / 문서의 이름이 "회원 탈퇴"로 일관되는가
- 진행 중에 창이 닫히지 않고, 실패 뒤에는 닫을 수 있는가
- 메뉴와 확인 창의 접근성 동작(role, 초점, Esc)이 유지되는가
- 새 색 / 새 Variant / Dependency를 만들지 않았는가, 추천 영역을 건드리지 않았는가

## 완료 조건

검증과 Review를 통과하면 REVIEW. Claude 세션이 390 / 768 / 1280px 캡처로 확인한다.
