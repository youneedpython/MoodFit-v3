# MoodFit v3 — Agent Task Roadmap (TASK-018 ~ TASK-031)

**Codex = Executor / Claude = Reviewer / Human = 승인 Gate** 구조로 개발을 자동화하고, AWS 배포와 CI / CD를 단계적으로 도입하기 위한 Task 묶음이다.

핵심은 **Agent를 이용한 완전 자동화 개발**이다. Codex 실행 후 Claude가 자동으로 검토하며, Human은 승인이 필요한 지점에서만 개입한다. 이를 위해 자동화 기반(Harness)을 가장 먼저 만든다.
공통 규칙은 [COMMON.md](COMMON.md)를 따른다.

## 기준 상태

- TASK-001 ~ TASK-017 DONE, Release `v3.0.0`
- 다음 Decision 번호: `DEC-026`
- Agent는 API Key 없이 VS Code에 로그인된 계정으로 로컬에서 실행한다.
- AWS는 Human이 SSO로 로그인한 뒤 Agent가 작업한다. CI / CD는 GitHub OIDC를 사용한다.

## 실행 순서

| Task | 제목 | 초기 상태 | 핵심 Gate |
|---|---|---|---|
| [TASK-018](TASK-018_HARNESS_BOOTSTRAP.md) | Multi-Agent Harness Bootstrap (Policy + Minimal Orchestrator) | READY | DEC-026 Human Approval |
| [TASK-019](TASK-019_CI_RUNNER_OS_HARDENING.md) | CI Runner OS Transition Hardening (FU-6) — Orchestrator 첫 실행 | BLOCKED | Runner 전략 Human Approval (2026-10-19 전 완료 목표) |
| [TASK-020](TASK-020_ORCHESTRATOR_HARDENING.md) | Orchestrator Hardening (worktree / Resume / Guard) | BLOCKED | Runtime / Dependency Gate C 조건부 |
| [TASK-021](TASK-021_GIT_PR_HARNESS.md) | Git Automation / Branch / PR Harness | BLOCKED | Git / GitHub 권한 Human Approval |
| [TASK-022](TASK-022_GITHUB_CI_INTEGRATION.md) | GitHub CI Integration / PR Gate | BLOCKED | Gate C: CI 동작 / Branch Protection |
| [TASK-023](TASK-023_AWS_ARCHITECTURE_GATE.md) | AWS Deployment Architecture / Cost Gate | BLOCKED | Human Approval |
| [TASK-024](TASK-024_DEPLOYMENT_ARTIFACT_CONTAINER_HEALTH.md) | Deployment Artifact / Container / Health Strategy | BLOCKED | 필요 시 Dependency / API Gate |
| [TASK-025](TASK-025_AWS_SSO_OIDC_IAM_GATE.md) | AWS SSO / GitHub OIDC / IAM / Environment Gate | BLOCKED | Human Approval |
| [TASK-026](TASK-026_AWS_IAC_FOUNDATION.md) | AWS Infrastructure as Code Foundation | BLOCKED | TASK-023 / 025 승인 |
| [TASK-027](TASK-027_AWS_APPLICATION_INFRA.md) | AWS Application Infrastructure (ECS / ALB / RDS) | BLOCKED | IaC 검증 + 비용 Gate |
| [TASK-028](TASK-028_STAGING_DEPLOYMENT_SMOKE.md) | Staging Deployment / Smoke Test | BLOCKED | 비용 Resource 생성 승인 |
| [TASK-029](TASK-029_STAGING_CD.md) | Staging Continuous Deployment | BLOCKED | Gate C: CD 동작 |
| [TASK-030](TASK-030_PRODUCTION_CD.md) | Production Continuous Deployment / Approval / Rollback | BLOCKED | Production Human Approval |
| [TASK-031](TASK-031_OPERATIONS_COST_CLEANUP.md) | Operations / Cost Guard / Cleanup / Final Hardening | BLOCKED | 파괴적 작업 Human Approval |

자동화 기반을 먼저 만들기 위해 Harness Bootstrap을 TASK-018로 두고, FU-6(Runner OS 전환)은 Orchestrator로 실행하는 첫 Task(TASK-019)로 둔다.
FU-6은 "`ubuntu-latest` 유지 후 확인" 전략을 선택하면 2026-10-19 전에 Workflow를 바꿀 필요가 없으므로 일정 위험이 작다.

## 사용 방법

0. **Roadmap 등록 (Human 지시 후 문서 작업)**
   - `docs/07-TASKS.md`에 TASK-018 ~ TASK-031을 등록하고 `docs/06-PLAN.md`에 Milestone 18 ~ 31을 추가한다.
   - `scripts/create-milestones.js`에 Milestone 정의를 추가하고 Human이 실행한다.
1. **TASK-018 Bootstrap (1회 예외)**
   - Claude Code 세션이 임시 Orchestrator로 `codex exec`를 호출하고, 결과를 자동으로 검토 / 재작업한다.
   - Human은 DEC-026 승인, Commit / Push 승인, 최종 Human Review만 한다.
2. **TASK-019 이후 (Orchestrator 실행)**
   - `node scripts/orchestrator/run.mjs <TASK-ID>`: Codex 실행 → Verify → Claude 자동 Review → Rework(최대 3회)
   - Gate에서는 `HUMAN_REQUIRED`로 정지하고, Human 승인 후 이어서 진행한다.
3. **TASK-020 ~ TASK-022 (자동화 고도화)**
   - Orchestrator Hardening → Git / PR 자동화 → GitHub CI 연동 순서로 Human 개입을 PR 승인 중심으로 줄인다.
4. **TASK-023 이후 (AWS / CD)**
   - Orchestrator가 Task를 실행한다. Human은 로그인(AWS SSO / GitHub), Gate 결정, PR 승인, Production 승인만 한다.
5. AWS Resource는 TASK-023 Architecture Gate 승인 전 생성하지 않는다.
6. Production 배포는 TASK-030에서 항상 Human Approval을 유지한다.

## 상태 전환 원칙

`READY → IN_PROGRESS → REVIEW → DONE`을 유지한다. 승인이 필요하면 `BLOCKED` 또는 문서 내 `Human Approval Pending`으로 멈춘다.
자동화 내부 상태가 필요하면 별도 Harness State로 관리하되 `docs/07-TASKS.md`의 상태 체계를 대체하지 않는다.
