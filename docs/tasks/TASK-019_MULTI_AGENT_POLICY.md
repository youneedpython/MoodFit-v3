# TASK-019 — Multi-Agent Automation Policy / Agent Contract

> 공통 실행 규칙: [COMMON.md](COMMON.md)

## 목적

Codex를 Executor, Claude를 독립 Reviewer, Orchestrator를 제어 계층, Human을 위험 결정 승인자로 정의한다.
이번 Task는 **정책 / 계약 설계 Task**이며 Orchestrator 실행 Code를 구현하지 않는다.

## 초기 상태 / Dependency

- 초기: `BLOCKED`
- 시작 조건: TASK-018 DONE
- 실행 방식: 수동 단계 (VS Code Codex 실행 → VS Code Claude 검토 → Human 승인)
- 현재 승인 문서와 Git Working Tree를 확인하고, 예상하지 못한 변경이 있으면 작업을 멈추고 보고한다.

## Codex 작업 범위

1. `docs/09-DECISIONS.md`에 `DEC-026 — Multi-Agent Automation Policy` 초안을 추가한다. 상태는 `Pending Human Approval`이다.
2. 정책 문서 `docs/11-MULTI-AGENT-ORCHESTRATION-POLICY.md`를 작성한다.
3. Codex / Claude / Orchestrator / Human의 권한과 금지를 명확히 한다.
4. Agent 실행 방식을 정의한다.
   - API Key 없이 VS Code에 로그인된 구독 계정 사용
   - 자동화 단계에서는 같은 로그인을 공유하는 로컬 CLI(`codex`, `claude`) 호출
   - Claude Reviewer는 Read-only 도구 설정으로 실행
   - 구독 사용량 한도 도달 시 `BLOCKED` 처리, 자동 재시도 없음
5. Human Gate를 정의한다: Dependency / Major Version, API Contract, DB Schema, Business Rule, CI / CD 동작, GitHub Permission, AWS Architecture, IAM / Network, 비용 Resource, Production, 파괴적 DB 작업, Secret 정책
6. **Human 승인 채널**을 정의한다. 예)
   - Task 완료 승인: PR Approve
   - Gate 결정: PR / Issue Comment + Label (`human-approved` 등)
   - Production 배포: GitHub Environment Required Reviewer
7. **로그인 / 자격 증명 정책**을 정의한다: Human 로그인 후 Agent 진행, Agent 허용 Profile 목록, 만료 시 `HUMAN_REQUIRED` (AWS 상세는 TASK-025)
8. Git 정책: Agent Branch만 자동화 가능, `main` 직접 Push 금지, Force Push / History Rewrite 금지, Commit 형식과 Co-author Trailer
9. Review Loop 정책: `PASS / CHANGES_REQUIRED / HUMAN_REQUIRED / BLOCKED`, 권장 `MAX_REVIEW_CYCLES=3`
10. Deterministic Verification과 AI Review의 역할을 분리한다.
11. 향후 Machine-readable 계약 구조를 Proposal로 정의한다: `harness/tasks`, `harness/policies`, `harness/schemas`, `harness/prompts`
12. `docs/08-WORK_LOG.md`, Prompt 기록을 갱신하되 정책 승인 전 자동화 권한을 활성화하지 않는다.

## Human Decision Matrix에 반드시 포함할 항목

- Codex Source 수정 권한
- Codex Commit / Push 권한 여부
- Claude 완전 Read-only 여부
- Orchestrator Commit / Push / PR 권한
- Agent 실행 방식 (VS Code 로그인 계정 / 로컬 CLI, API Key 미사용)
- 구독 사용량 한도 도달 시 처리
- Human 승인 채널 (PR Approve / Comment Label / Environment Reviewer)
- AWS / GitHub 로그인 방식과 Agent 허용 Profile
- Auto Merge 조건
- MAX_REVIEW_CYCLES
- Human Gate 목록
- Secret 전달 / Log 정책
- Staging 자동 배포 허용 여부
- Production 항상 Human Approval 여부
- Release / Tag 규칙(DEC-025)과 자동화의 관계 (예: Tag 생성은 Human 승인 후)
- Orchestrator 방식: 결정적 Script + 로컬 CLI (사전 검증 완료) / 구현 언어: Node.js 24 + JavaScript(`.mjs`), Dependency 없음 (Human 확정, TASK-020 문서 참고)
- Windows Codex Sandbox 모드: `elevated` / `unelevated`
- Agent CLI 설치 / Version 관리 방식 (Codex npm 전역, Claude VS Code 확장 포함 실행 파일 경로)

## 산출물

- `docs/11-MULTI-AGENT-ORCHESTRATION-POLICY.md`
- `docs/09-DECISIONS.md`의 DEC-026 초안
- `docs/08-WORK_LOG.md` TASK-019 기록
- Prompt 기록 1개 (다음 번호)

## 제외 범위

- Orchestrator 구현, Codex / Claude CLI 자동 호출
- GitHub Actions 변경
- 자동 Branch / Commit / Push / PR / Merge
- AWS Resource, GitHub Secret / Environment 생성

## Verification

- 문서 간 Task 번호 / 상태 / Decision 번호 일치
- 기존 TASK-001 ~ TASK-018 기록 손상 없음
- `git diff --check`
- Source Code / Dependency / CI 변경 없음 확인

## Claude Review 기준

- 정책이 기존 AGENTS.md / Gate A / B / C와 충돌하는가
- Human Gate가 지나치게 넓거나 좁지 않은가
- Codex와 Claude 권한이 분리되어 있는가
- Orchestrator가 Git / Verification 책임을 가져가는가
- Auto Merge 조건이 Deterministic Check와 Human 승인을 요구하는가
- Secret / Production / 파괴적 작업이 Human Gate로 보호되는가
- Agent가 Human의 로그인 권한을 필요 이상으로 쓰지 않는가
- TASK-020 이후가 승인 전 BLOCKED인가

## 완료 조건

1. 정책 초안 작성 후 `TASK-019 = REVIEW`, `DEC-026 = Pending Human Approval`로 멈춘다.
2. Human이 DEC-026을 승인하면 승인된 정책을 `AGENTS.md`에 반영한다. (역할, 실행 방식, 승인 채널, Commit / Push 권한)
3. AGENTS.md 반영까지 Human Review를 통과하면 DONE. 그 전에는 TASK-020을 시작하지 않는다.
