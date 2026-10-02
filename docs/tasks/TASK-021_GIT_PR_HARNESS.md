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
