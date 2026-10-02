# Prompt 36 — TASK-018 Multi-Agent Harness Bootstrap

## 목적

TASK-018 A단계(정책)만 수행하고 DEC-026 초안 / 정책 / 작업 상태 / 이력을 작성한다.

## 실행 단계

Human 지시 → Claude 임시 Orchestrator의 `codex exec` → Codex A단계 작성 → Claude 자동 Review → Human DEC-026 승인 대기

## 사용 Context

- `AGENTS.md`, `docs/tasks/TASK-018_HARNESS_BOOTSTRAP.md` (A. 정책 / 허용 경로), `docs/tasks/COMMON.md`
- `docs/07-TASKS.md`, `docs/08-WORK_LOG.md` 마지막 부분, `docs/09-DECISIONS.md` DEC-021 ~ DEC-025 형식
- `prompts/README.md`, Prompt 35
- Human 제공 Context: 이 실행은 Claude 세션(임시 Orchestrator)에서 `codex exec`로 시작되었다.

## 실제 Prompt

Human이 기록하도록 제공한 선행 지시:

```text
커밋/푸시 승인!
```

이번 Executor 실행 지시:

```text
너는 MoodFit v3 Repository의 Executor(Codex)다. 현재 작업 폴더가 Repository Root다.
TASK-018 — Multi-Agent Harness Bootstrap 중 A단계(정책)만 수행한다.
이 실행은 Claude 세션(임시 Orchestrator)에서 codex exec로 시작되었다.
먼저 TASK-018(A. 정책 / 허용 경로), COMMON.md, AGENTS.md, TASKS,
WORK_LOG 마지막 부분, DEC-021 ~ DEC-025 형식, prompts/README.md를 읽는다.

1. TASKS Current Task(3절) Status / 전체 목록 TASK-018 행 / TASK-018 섹션 상태를 IN_PROGRESS로 변경.
   AGENTS.md는 3절 Current Task Status 값만 변경하고 다른 내용은 수정하지 않는다.
2. DEC-026 Multi-Agent Automation Policy 초안을 끝에 추가.
   Pending Human Approval, 기존 결정 / 범위 / 유지 / 상태 형식 유지.
3. docs/11-MULTI-AGENT-ORCHESTRATION-POLICY.md 작성.
   A. 정책 1~10과 필수 Matrix 항목을 모두 포함하고 표에 권장안 / Human 결정(미정) 열을 둔다.
4. WORK_LOG 끝에 TASK-018 — Multi-Agent Harness Bootstrap 섹션 추가.
   IN_PROGRESS 상태와 A단계 작업 내용 기록.
5. Prompt 36을 기존 형식으로 작성하고 README 표 36번 행(진행 중) 추가.
   실제 Prompt에 "커밋/푸시 승인!"과 Claude 세션의 codex exec 시작을 기록한다.

지정 파일 외 수정 금지. Source Code, scripts/, harness/, .github/,
package.json, build.gradle 수정 금지. B단계 구현 금지.
git commit / push / branch 작업 금지. Secret / Token / 계정 ID 기록 금지.
Human 결정은 미정으로 남긴다. 한국어 / 기존 표와 - 목록 문체 / 영문 기술 용어 유지.
LF, 제어 문자 금지. git diff --check 실행 결과를 verification에 기록한다.
최종 응답은 지정 JSON Schema만 사용하고 실제 changed_files / human_decisions_needed를 적는다.
```

Human 승인 원문 (2026-10-02, Review 2회차 PASS 후):

```text
권장안대로 승인, Sandbox는 elevated / unelevated
unelevated, 커밋/push/PR 승인
```

승인 반영 지시: 지정된 5개 파일에 승인 내용을 반영하며 정책 내용 자체는 새로 바꾸지 않는다. AGENTS.md 수정 / Git 작업 / Secret / 계정 정보 / Ruleset ID 기재는 금지한다. 한국어 / 기존 문체 / LF / 제어 문자 금지를 유지하고 `git diff --check` 결과를 기록한다.

## 기대 산출물

- TASK-018 / AGENTS.md Current Task IN_PROGRESS
- DEC-026 Pending Human Approval 초안 / 정책 / Human Decision Matrix
- WORK_LOG / Prompt 36 / Index 36 / Verification 결과

## Human Approval 여부

- A단계 실행: 승인됨 (명시적 지시)
- DEC-026 / Matrix: Human Approved (2026-10-02), 모든 항목 권장안대로 승인
- 선행 "커밋/푸시 승인!"은 이력 기록이며 이번 실행의 명시적 Git 작업 금지가 적용된다.
- B단계 / D단계 정책 반영 / 최종 Review: 이번 실행에서 수행하지 않음

## 결과 또는 상태

진행 중 (TASK-018 IN_PROGRESS). A단계 완료(Review 2회차 PASS, DEC-026 Human Approved), B단계 진행 예정.

## 관련 문서

- `docs/11-MULTI-AGENT-ORCHESTRATION-POLICY.md`
- `docs/09-DECISIONS.md` DEC-026
- `docs/tasks/TASK-018_HARNESS_BOOTSTRAP.md`
- `docs/08-WORK_LOG.md` TASK-018

## Related Commit

```text
Pending
```

### Review 2회차: Branch 전략 / 승인 채널 반영 (2026-10-02)

- Reviewer(Claude)의 `CHANGES_REQUIRED` Finding F1 ~ F6만 지정된 4개 파일에 반영했다.
- Human이 확정한 Task별 Branch / PR / Squash Merge 전략과 TASK-018 ~ TASK-020의 Human 승인 후 Claude 세션 또는 Human Git 작업, TASK-021 Script Git 자동화 경계를 기록했다.
- Task 완료 승인 = Human의 PR Squash Merge, Required approvals 0 / Required status checks / Auto Merge 비활성 유지, TASK-021 작성자 분리 검토를 반영했다.
- 기존 Codex Co-author Trailer의 Squash Commit 메시지 포함과 Human의 gh 설치 / 로그인 완료, Human 로그인 → Agent 사용 원칙을 기록했다. 계정명 / Token은 기록하지 않았다.
- DEC-026은 `Pending Human Approval`, TASK-018은 `IN_PROGRESS`로 유지하고 다른 Human 결정 항목은 미정으로 남겼다. Git 변경 작업과 B / C / D단계는 수행하지 않았다.

- 실제 Rework 지시: F1 ~ F6만 정책 5 / 6 / 7절과 Matrix, DEC-026 범위, TASK-018 기록 / Prompt 36에 반영한다. 지정된 4개 파일 외 수정 / Git 작업 / Secret 및 계정 정보 기재는 금지하며 한국어 / 기존 문체 / LF / 제어 문자 금지를 유지한다.

- Review 2회차 Verification: `git diff --check` 통과 (Exit Code 0, whitespace 오류 없음). 지정된 4개 파일 UTF-8 / LF / 제어 문자 없음 확인. 문서 Rework이므로 Test / Build는 실행하지 않았다.

### A단계 Human 승인 (2026-10-02)

- Reviewer(Claude) PASS(Review 2회차) 후 Human이 DEC-026 / Decision Matrix의 모든 항목을 권장안대로 승인했다.
- Windows Codex Sandbox는 `unelevated`로 시작한다 (사전 검증 완료, 추가 설정 없음). `elevated` 전환은 TASK-020(Orchestrator Hardening)에서 검증 후 다시 결정한다.
- Human 승인 후 Claude 세션이 `gh api`로 GitHub 설정을 적용했다 (2026-10-02).
- Squash Merge만 허용하고 Merge Commit / Rebase는 비활성화했다. Squash Commit 제목 = PR 제목, 본문 = PR 본문이며 Merge 후 Head Branch를 자동 삭제한다.
- Branch Ruleset `main-protection`: Active, 기본 Branch 대상, Bypass 없음. 삭제 금지 / Force Push 금지 / Linear History / PR 필수(Required approvals 0, Squash만 허용) / Required status checks `frontend` / `backend`를 적용했다.
- Agent가 Human의 GitHub 로그인을 사용하므로 Bypass가 있으면 Agent도 main에 직접 Push할 수 있어 Bypass를 두지 않았다. 긴급 시 Human이 Ruleset을 일시 Disabled로 전환한다.
- A단계 결과의 Task Branch Commit / Push / Draft PR 생성을 승인했다. Git 작업은 Claude 세션이 수행하며 이번 Executor 실행에서는 수행하지 않았다.
- A단계 완료(DEC-026 Human Approved), B단계 진행 예정. TASK-018 IN_PROGRESS / TASK-019 이후 BLOCKED 유지. AGENTS.md 정책 반영은 D단계에서 수행한다.

- Human 승인 반영 Verification: `git diff --check` 통과 (Exit Code 0, whitespace 오류 없음). 지정된 5개 파일 UTF-8 / LF / 제어 문자 없음 확인. 문서 변경이므로 Test / Build는 실행하지 않았다.
