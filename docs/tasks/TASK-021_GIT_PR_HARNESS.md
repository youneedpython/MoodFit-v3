# TASK-021 — Git Automation / Branch / PR Harness

> 공통 실행 규칙: [COMMON.md](COMMON.md)

## 목적

TASK-018 / TASK-020에서 만든 Orchestrator에 **안전한 Git 작업 계층**을 추가한다.
Codex는 Working Tree 수정만 담당하고, Orchestrator가 Policy 통과 후 Branch / Stage / Commit / Push / PR을 수행한다.

## 초기 상태 / Dependency

- 초기: `BLOCKED`
- TASK-020 DONE
- DEC-026의 Git 자동화 범위 승인 완료

## GitHub 인증

- Human이 로컬에서 Git Credential과 GitHub CLI(`gh auth login`) 로그인을 마친 뒤 Orchestrator가 사용한다. (Human 로그인 → Agent 진행)
- PAT / GitHub App Key를 Repository나 Log에 저장하지 않는다.
- 인증이 없거나 만료되면 `HUMAN_REQUIRED`로 멈춘다.
- GitHub CLI 설치 자체가 새 도구 도입이므로 Human Approval 후 진행한다.

## Human 결정 (2026-10-02, TASK-021 첫 실행 Gate)

첫 Orchestrator 실행에서 Codex가 Git 자동화 범위 승인을 요청하며 수정 전 정지했고(Executor HUMAN_REQUIRED → Verify / Claude Review 후 정지), Human이 다음을 승인했다.

1. **Git 자동화 범위 (Codex 권장안 승인)**
   - 승인된 `task/TASK-0XX-<짧은-이름>` Branch에서만 작업한다.
   - Stage는 Contract allowed_paths 안의 파일만 개별 추가한다. `git add .` 금지, forbidden_paths / Secret 파일 차단.
   - 인증은 Human이 로그인한 기존 `git` / `gh`를 사용한다. Token / PAT를 저장하지 않는다.
   - PR은 `gh pr create`로 만들고 본문에 Task ID, Verification, Review Verdict, Human Gate 여부, Codex / Claude Co-author Trailer를 포함한다.
   - 금지: `main` 직접 Push, Force Push, History Rewrite, **Merge / Auto Merge**(Merge는 Human만).
2. **Git 실행 승인 방식: (b) 자동** — Deterministic Verification 성공 + Claude `PASS`이면 Orchestrator가 **자동으로 Commit / Push / Draft PR 생성**까지 진행한다. Human은 PR Squash Merge로 최종 승인한다. (`main` Ruleset 보호, Draft PR, Human Merge가 안전장치)
   - `HUMAN_REQUIRED` / `BLOCKED` / `CHANGES_REQUIRED` 상태에서는 Git 작업을 하지 않는다.
   - 이 결정으로 DEC-026의 "Commit / Push는 Human 승인 후" 규칙이 바뀌므로 DEC-026 변경 이력, docs/11, AGENTS.md 12절을 갱신한다. (Contract 허용 경로에 docs/09-DECISIONS.md 추가 — Claude 세션이 Human 승인으로 수정)
3. **TASK-020 개선 후보 범위**
   - 포함: **자기 Contract 변경 금지 Guard**(Orchestrator가 실행 중인 Task의 `harness/tasks/<id>.json` 변경을 차단), **Resume 한도 동작 문서화**(Review 3회 한도로 정지한 Run은 Resume해도 추가 Review 없이 다시 정지함을 설계 문서에 명시).
   - 제외(TASK-022 이후): `scripts/verify.*`를 Contract Verify에 포함, Secret Redaction 범위 정밀화.
4. 첫 실행 Reviewer Finding F-001 ~ F-005(Git 계층 구현, 필수 실패 Test, Allowlist Stage, PR 기록 / 본문, 문서 갱신)를 작업 목록으로 사용한다.
5. TASK-021 자체의 Branch / Commit / Push / PR은 Git 계층 구현 전이므로 Claude 세션이 수행한다. TASK-022부터 Orchestrator Git 자동화를 사용한다.

## Human 결정 2 (2026-10-02, 두 번째 실행 Guard BLOCKED 후)

두 번째 Orchestrator 실행에서 Codex 구현(Test 60 / 60)은 완료되었으나, AGENTS.md 12절 변경이 AGENTS Guard(3절 상태 동기화만 허용)에 막혀 BLOCKED 되었다. Human이 다음을 승인했다.

1. **승인된 AGENTS.md 절 예외를 TASK-021 범위에 추가**: Task Contract의 `agents_sections`(예: `["12"]`)에 Human이 승인한 절 번호를 명시하면 Guard는 3절 상태 동기화와 함께 해당 절의 변경만 허용한다. Contract는 자기 Contract Guard로 Executor가 바꿀 수 없다.
2. **TASK-021 Contract에 `agents_sections: ["12"]` 추가**: 이번 Task에서 AGENTS.md 12절(Git / Commit 규칙) 변경을 허용한다. (Claude 세션이 Human 승인으로 수정)
3. **TASK-021 마무리 방식**: 안정 Version(main) Orchestrator에는 예외 기능이 없어 재실행해도 같은 이유로 막히므로, Claude 세션이 Workspace 결과를 Task Branch로 가져와 Codex Rework 호출 → 같은 규격 Verify / Claude Review → Commit / Push / PR을 수행한다. TASK-022부터 Orchestrator가 예외 기능과 Git 자동화를 사용한다.
4. AGENTS.md 12절은 덮어쓰기 메모가 아니라 본문 규칙을 결정 내용(Git 자동화 범위, (b) 자동 Commit / Push / Draft PR, Merge는 Human)에 맞게 고쳐 쓴다.

## Human Gate

Git 권한 확대, GitHub Token / PAT / App 사용, Auto Merge 정책 변경은 Human Approval 대상이다. 승인되지 않은 Credential 방식을 임의로 도입하지 않는다.

## Codex 작업 범위

1. Branch 이름: `agent/TASK-XXX` 계열을 기본으로 한다.
2. `main` 직접 Push 금지, Force Push / History Rewrite 금지
3. allowed_paths에 포함된 파일만 Stage한다. `git add .` 금지
4. Working Tree Preflight에서 예상하지 못한 변경이 있으면 멈춘다.
5. Deterministic Verification + Claude `PASS` 후에만 Commit / Push 가능하게 한다.
6. PR 생성 전 Base / Head, Commit SHA, Diff Summary, Test 결과를 기록한다.
7. PR Body에 Task ID, Verification, Review Verdict, Human Gate 여부를 포함한다.
8. Auto Merge는 기본 비활성으로 시작하고, DEC-026에서 명시 승인된 경우에만 활성화한다.
9. Commit Message는 기존 규칙과 Co-author Trailer 규칙(COMMON.md 8절)을 따른다.

## 필수 실패 테스트

- `main` 직접 Push 시도 차단
- Force Push 차단
- Forbidden File Stage 차단
- Dirty Working Tree 충돌 차단
- Test 실패 후 Commit 차단
- Claude `PASS`가 아닌데 Push / Merge 차단
- Secret File(`.env.local` 등) Stage 차단
- GitHub 인증 없음 → `HUMAN_REQUIRED`

## Verification

가능하면 임시 Git Repo / Fixture로 실제 프로젝트 History를 오염시키지 않고 자동 Git Flow를 검증한다. 기존 Local Verification도 PASS해야 한다.

## Claude Review 기준

- Codex와 Git 권한 분리
- Allowlist Staging
- `main` / Force Push 보호
- 실패 경로에서 Commit / Push가 일어나지 않음
- Secret File 보호
- PR Metadata / Auditability

## 완료 조건

Task Branch → Safe Stage → Commit → Push → PR 생성 흐름이 정책대로 검증되면 REVIEW. GitHub CI 연동은 TASK-022에서만 진행한다.
