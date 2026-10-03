# 공통 실행 규칙 (TASK-018 ~ TASK-031)

모든 Task 파일은 이 문서를 전제로 한다. Task 파일과 이 문서가 다르면 Task 파일의 더 구체적인 규칙을 따르고, 둘 다 Repository의 최신 승인 문서(`docs/09-DECISIONS.md`)와 다르면 승인 문서를 우선한다.

## 1. 역할

| 역할 | 담당 | 권한 |
|---|---|---|
| Executor | Codex | 승인된 Task 범위 안에서 구현 / 테스트 / 문서화. Working Tree만 수정한다 |
| Reviewer | Claude | Source를 수정하지 않는다(Read-only). Diff, Task Contract, Verification 결과, 승인된 Decision을 검토하고 Verdict를 낸다 |
| Orchestrator | 로컬 Script (TASK-018에서 구축) | 실행 순서, Deterministic Verification, Review 호출, Git / PR 작업(TASK-021 이후)을 제어한다 |
| Human | 사용자 | Gate 결정, 로그인(AWS SSO / GitHub), PR 승인, Production 배포 승인 |

Reviewer Verdict는 `PASS`, `CHANGES_REQUIRED`, `HUMAN_REQUIRED`, `BLOCKED`만 사용한다.

## 2. Agent 실행 방식

- Codex와 Claude는 **API Key를 사용하지 않는다.** VS Code에 로그인된 구독 계정과 로그인을 공유하는 로컬 CLI(`codex`, `claude`)로 실행한다.
- **Codex 실행 후 Claude 검토는 자동으로 이어진다.** Human이 Agent 사이에서 결과를 옮기지 않는다. Human은 승인이 필요한 지점에서만 개입한다.
  - TASK-018(Bootstrap): Orchestrator가 없으므로 Claude Code 세션이 임시 Orchestrator로 `codex exec`를 호출하고 결과를 검토한다. (1회 예외)
  - TASK-019 이후: `node scripts/orchestrator/run.mjs <TASK-ID>`로 실행한다.
- 따라서 Agent는 **로컬 개발 PC에서만** 실행된다. GitHub Actions에서는 Agent를 실행하지 않는다. (GitHub Actions는 Deterministic CI / CD만 담당)
- 구독 사용량 한도에 도달하면 자동 재시도하지 않고 `BLOCKED`로 멈춘 뒤 Human에게 알린다.
- OpenAI / Anthropic API Key를 Repository, GitHub Secret, Prompt, Log에 두지 않는다.

## 3. 로그인 / 자격 증명

- **Human이 로그인하고, 이후 작업은 Agent가 진행한다.**
  - AWS: Human이 `aws sso login --profile <profile>`로 로그인한 뒤 Agent가 그 Profile을 사용한다. (상세: TASK-025)
  - GitHub: Human이 Git / GitHub CLI 인증을 마친 뒤 Orchestrator가 사용한다. (상세: TASK-021)
- Agent는 Task Contract에 명시된 Profile만 사용한다. Production 관리 권한 Profile은 Agent에게 허용하지 않는다.
- 로그인이 만료되었거나 확인되지 않으면 Agent는 재로그인을 시도하지 않고 `HUMAN_REQUIRED`로 멈춘다.
- Agent 금지: Access Key 생성 / 저장(`aws configure`, `aws iam create-access-key`), SSO Token Cache 읽기, 자격 증명 출력(`aws configure export-credentials` 등)
- CI / CD(GitHub Actions)는 SSO를 사용할 수 없으므로 GitHub OIDC → IAM Role을 사용한다. 장기 AWS Access Key는 사용하지 않는다.

## 4. Source of Truth

작업 시작 전 다음을 확인한다.

1. `AGENTS.md`
2. `docs/01-PROJECT.md` ~ `docs/05-API_SPEC.md`
3. `docs/06-PLAN.md`, `docs/07-TASKS.md`
4. `docs/08-WORK_LOG.md`
5. `docs/09-DECISIONS.md`
6. `docs/10-WELLNESS-RULE-PROPOSAL.md`
7. `docs/11-MULTI-AGENT-ORCHESTRATION-POLICY.md`, `docs/12-ORCHESTRATOR-DESIGN.md` (TASK-018에서 작성, DEC-026 승인 후 유효)
8. `docs/tasks/` 해당 Task 파일
9. `prompts/README.md`

`README.md`는 프로젝트 소개 문서이며 진행 상태의 기준이 아니다.

## 5. Baseline

- TASK-001 ~ TASK-017 DONE, Release `v3.0.0` (Tag `v3.0.0`, `v3.0.0-mvp`)
- Decision: DEC-001 ~ DEC-025 (다음 번호: **DEC-026**)
- 승인된 기술: Java 21, Spring Boot 4.1.1, Gradle Wrapper 9.8.0, Node.js 24.21.0, React 19.3.0, Vite 8.3.1, MySQL 8.4.11 (Testcontainers / Container Smoke, DEC-030. 개발 PC Local 서비스는 8.0 유지 가능)
- Version / Tag / Release 규칙: DEC-025

## 6. 공통 금지

- 승인되지 않은 Dependency / Major Version / API Contract / DB Schema / Architecture 변경
- `main` 직접 Push(자동화 단계), Force Push, History Rewrite
- Secret, Token, Password, Access Key를 Source / Prompt / Log에 기록
- 실패한 Test / Build를 숨기거나 성공으로 처리
- 다음 Task 선행 구현
- Human Gate가 필요한 결정을 Agent가 임의로 확정

## 7. 작업 종료 보고

`git diff --check`, 관련 Test / Build / Verification 결과, 변경 파일 목록, 남은 Gate / Issue를 보고한다.

## 8. Commit / Push

- DEC-026 승인과 AGENTS.md 반영 전에는 현재 AGENTS.md 규칙(Human 지시 후 Commit / Push)을 따른다.
- 자동화 단계에서도 Commit 형식은 기존 규칙(`docs:` / `feat:` / `test:` / `ci:` / `chore:` + 한국어 요약 + `- ` 목록)을 유지하고, Codex 작업이 포함되면 Codex Co-author Trailer를 붙인다.
