# MoodFit v3 — Agent Task Roadmap (TASK-018 ~ TASK-031)

**Codex = Executor / Claude = Reviewer / Human = 승인 Gate** 구조로 개발을 자동화하고, AWS 배포와 CI / CD를 단계적으로 도입하기 위한 Task 묶음이다.
공통 규칙은 [COMMON.md](COMMON.md)를 따른다.

## 기준 상태

- TASK-001 ~ TASK-017 DONE, Release `v3.0.0`
- 다음 Decision 번호: `DEC-026`
- Agent는 API Key 없이 VS Code에 로그인된 계정으로 로컬에서 실행한다.
- AWS는 Human이 SSO로 로그인한 뒤 Agent가 작업한다. CI / CD는 GitHub OIDC를 사용한다.

## 실행 순서

| Task | 제목 | 초기 상태 | 핵심 Gate |
|---|---|---|---|
| [TASK-018](TASK-018_CI_RUNNER_OS_HARDENING.md) | CI Runner OS Transition Hardening (FU-6) | READY | Runner 전략 Human Approval (2026-10-19 전환 전 완료 목표) |
| [TASK-019](TASK-019_MULTI_AGENT_POLICY.md) | Multi-Agent Automation Policy / Agent Contract | BLOCKED | DEC-026 Human Approval |
| [TASK-020](TASK-020_LOCAL_ORCHESTRATOR.md) | Local Multi-Agent Orchestrator | BLOCKED | TASK-019 완료, Runtime Gate C |
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

FU-6(Runner OS 전환)은 2026-10-19부터 적용되므로 Multi-Agent Harness보다 먼저 TASK-018로 진행한다.

## 사용 방법

0. **Roadmap 등록 (Human 지시 후 문서 작업)**
   - `docs/07-TASKS.md`에 TASK-018 ~ TASK-031을 등록하고 `docs/06-PLAN.md`에 Milestone 18 ~ 31을 추가한다.
   - `scripts/create-milestones.js`에 Milestone 정의를 추가하고 Human이 실행한다.
1. **TASK-018 ~ TASK-019 (수동 단계)**
   - Task 파일을 VS Code의 Codex에 전달해 실행한다.
   - Codex의 변경 Diff와 검증 결과를 VS Code의 Claude에 전달해 검토한다.
   - Claude가 `PASS`가 아니면 Finding을 Codex에 전달해 수정한다. (최대 3회, 초과 시 Human 판단)
   - Human Gate가 나오면 해당 결정만 Human이 승인한다.
2. **TASK-020 ~ TASK-022 (자동화 구축)**
   - Local Orchestrator → Git / PR → GitHub CI 연동 순서로 만든다.
3. **TASK-023 이후 (Harness 사용)**
   - 가능하면 Orchestrator가 Task 파일을 읽어 자동 실행한다. Human은 로그인, Gate 결정, PR 승인만 한다.
4. AWS Resource는 TASK-023 Architecture Gate 승인 전 생성하지 않는다.
5. Production 배포는 TASK-030에서 항상 Human Approval을 유지한다.

## 상태 전환 원칙

`READY → IN_PROGRESS → REVIEW → DONE`을 유지한다. 승인이 필요하면 `BLOCKED` 또는 문서 내 `Human Approval Pending`으로 멈춘다.
자동화 내부 상태가 필요하면 별도 Harness State로 관리하되 `docs/07-TASKS.md`의 상태 체계를 대체하지 않는다.
