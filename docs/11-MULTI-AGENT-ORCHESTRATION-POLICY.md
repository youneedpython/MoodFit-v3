# MoodFit v3 Multi-Agent Orchestration Policy

## 1. 목적 / 상태

- 상태: `Human Approved (DEC-026, 2026-10-02)`
- 근거: `tasks/TASK-018_HARNESS_BOOTSTRAP.md` A단계, `tasks/COMMON.md`, `../AGENTS.md`, 승인된 DEC-001 ~ DEC-025
- 목적: Codex 실행 → Deterministic Verification → Claude 자동 Review → Rework / Human Gate 흐름을 구축한다. Human이 Agent 사이에서 결과를 옮기지 않는다.
- 아래 정책은 Human이 Decision Matrix의 모든 항목을 권장안대로 승인한 확정 정책이다. D단계 AGENTS.md 반영 전에는 기존 권한 / Gate 규칙을 유지한다. 기존 승인 Decision은 유지한다.
- 이번 실행은 A단계 문서 작성만 수행한다. B단계 구현 / C단계 Test / D단계 정책 반영은 수행하지 않는다.

## 2. 역할 / 권한 / 금지 (확정)

| 역할 | 권한 | 금지 |
|---|---|---|
| Codex / Executor | Human이 실행 지시한 READY Task의 허용 경로에서 Working Tree 수정 / Test / 문서화, Finding에 따른 Rework | 임의 Task 시작 / 범위 확대 / Gate 결정 / 독자 Commit / Push / PR / Merge |
| Claude / Reviewer | 완전 Read-only로 Task Contract / 실제 Diff / Verification / 승인 Decision 검토, Verdict / Finding 작성 | Source / 문서 / Git 수정, 배포, 승인 대행, 임의 실행 도구 사용 |
| Orchestrator | 승인된 실행 순서 / Verification / Review / 반복 횟수 / Gate 정지를 결정적으로 제어 | 권한 확대, Gate 우회, 무한 반복, 승인 전 Git / 배포 자동화 |
| Human | Task 실행 지시, 정책 / Gate 결정, 로그인, PR / Production 승인, 최종 Review | AI PASS를 Human Approval로 간주하지 않음 |

- Bootstrap 1회만 Claude Code 세션이 임시 Orchestrator로 `codex exec`를 호출하고 자동 Review / 재호출한다.
- TASK-019 이후는 승인 / 검증된 Local Script로 실행한다. Script 구현은 DEC-026 승인 후 B단계에서 수행한다.

## 3. Agent 실행 / CLI / Sandbox (확정)

- API Key 없이 VS Code 구독 로그인과 로그인을 공유하는 로컬 CLI(`codex exec`, `claude -p`)를 사용한다.
- Agent는 로컬 개발 PC에서만 실행한다. GitHub Actions는 Deterministic CI / CD만 담당한다.
- 사용량 한도 도달 시 `BLOCKED`로 정지한다. 자동 재시도 / 계정 전환 / API 우회를 금지한다.
- Claude는 Read-only 도구만 허용하며 쓰기 / 실행 권한을 부여하지 않는다.
- Codex는 `workspace-write`와 Task 허용 경로를 적용한다. Windows Sandbox는 `unelevated`로 시작한다 (사전 검증 완료, 추가 설정 없음). `elevated` 전환은 TASK-020(Orchestrator Hardening)에서 검증 후 다시 결정한다.
- Codex npm 전역 CLI와 Claude VS Code 확장 실행 파일을 사용한다. Task 문서의 사전 검증 Version을 재현 기준으로 삼고 최신 Version으로 가정하지 않는다.
- CLI Version / 실행 파일 경로를 설정과 Preflight에서 확인한다. 확장 업데이트로 Claude 경로가 바뀌면 재확인한다. 무승인 설치 / 업데이트를 금지한다.
- B단계에서 Agent Timeout과 Codex stdin 종료를 구현한다. 권한 제한을 확인할 수 없으면 `BLOCKED`로 정지한다.

## 4. Human Gate (확정)

| 대상 | 승인 기준 |
|---|---|
| Dependency / Major Version / 기술 스택 | 추가 / 변경 전 Gate A 또는 C |
| API Contract | Contract 변경 전 Human Approval |
| DB Schema | 주요 구조 변경 전 Human Approval |
| Business Rule | DEC-014 변경 전 Gate B 재승인 |
| CI / CD 동작 | Trigger / Workflow / 배포 동작 변경 전 Gate C |
| GitHub Permission | 권한 확대 / Branch Protection / Git 자동화 전 Human Approval |
| AWS Architecture | Architecture 변경 전 Human Approval |
| IAM / Network | Permission Set / Role / Network 변경 전 Human Approval |
| 비용 Resource | 생성 / 확대 / Change Set 적용 전 비용 / 범위 승인 |
| Production | 배포 / 최초 생성 / Rollback 실행 전 Human Approval |
| 파괴적 DB 작업 | 삭제 / 파괴적 Migration 실행 전 Human Approval |
| Secret 정책 | 전달 / 저장 / 접근 / Log 정책 변경 전 Human Approval |
| 기존 기능 삭제 / 요구사항 축소 / 인증 / 외부 연동 / 최상위 구조 | 기존 AGENTS.md 승인 규칙 유지 |

- Gate가 필요하면 `HUMAN_REQUIRED`로 정지하고 사유 / 대안 / 권장안 / Diff / Verification을 제공한다.
- 승인은 Task / 변경 범위 / 검토 대상 Commit 또는 Diff에 연결한다. 범위 밖 승인을 추론하지 않는다.

## 5. Human 승인 채널 (확정)

- Bootstrap 정책 / Git 작업 승인은 임시 Orchestrator가 정지한 뒤 Human이 CLI / 대화로 승인한다. DEC-026 승인 / Git 작업 승인 / Task 완료 승인을 구분한다.
- Task 완료 승인 = Human이 PR을 Squash Merge하는 행위로 정의한다. Agent / Orchestrator는 Merge하지 않는다.
- Agent와 Human이 같은 GitHub 계정의 `gh` 로그인을 사용하므로 PR 작성자가 Human 계정이며 GitHub에서 자기 PR을 Approve할 수 없다. Required approvals는 0으로 두고 Required status checks로 Remote CI(frontend / backend)를 강제한다.
- Auto Merge는 비활성으로 유지한다. Agent 전용 GitHub 계정 / GitHub App 도입(작성자 분리)은 TASK-021 검토 항목으로 남긴다.
- Production은 GitHub Environment Required Reviewer 사용을 권장하며 Agent / Orchestrator의 우회를 금지한다.
- 승인 범위 / 대상 / 시점을 비민감 기록으로 남긴다. 승인 입력이 없으면 정지 상태를 유지한다.

## 6. 로그인 / 자격 증명 (확정)

- GitHub CLI(`gh`)는 Human이 설치하고 로그인을 마쳤다. Human 로그인 → Agent 사용 원칙을 따른다. 계정명 / Token은 기록하지 않는다.
- AWS SSO는 Human이 로그인을 마친 뒤 Agent가 진행한다. AWS 상세는 TASK-025에서 확정한다.
- Task Contract에 명시되고 Human이 허용한 최소 권한 Profile만 사용한다. Production 관리 Profile은 Human 전용이다.
- 로그인 만료 / 미확인 시 재로그인하지 않고 `HUMAN_REQUIRED`로 정지한다.
- Access Key 생성 / 저장, SSO Token Cache 읽기, 자격 증명 Export / 출력을 금지한다.
- CI / CD는 GitHub OIDC → IAM Role을 사용하며 장기 AWS Access Key를 사용하지 않는다. 실제 계정 / Profile 식별값은 이 문서에 기록하지 않는다.

## 7. Git / Merge / Release (확정)

- DEC-026 승인과 AGENTS.md 반영 전에는 Human 명시 지시 후 Commit / Push하는 기존 규칙을 유지한다. 이번 실행은 Git 작업 금지 지시를 따른다.
- Human 결정: 확정. Task 하나 = Branch 하나 = PR 하나. Branch 이름은 `task/TASK-0XX-<짧은-이름>`이며 TASK-018부터 적용한다.
- `main` 직접 Push 금지(Branch Ruleset으로 보호). PR + Remote CI(frontend / backend) 통과 후 Human이 Squash Merge한다. main에는 Task당 Commit 1개를 남긴다.
- Task의 DONE 상태 변경은 PR 안에서 처리하고 Merge 후 Sync Milestones가 Milestone을 닫는다.
- TASK-018 ~ TASK-020에서는 Branch / Commit / Push / PR 생성을 Human 승인 후 Claude 세션(임시 Orchestrator) 또는 Human이 수행한다. Orchestrator Script의 Git 자동화는 TASK-021에서 별도 승인 / 구현한다.
- 자동화는 Task Branch에만 허용한다. Force Push / History Rewrite를 금지한다.
- Commit은 검증 성공 / 기록 갱신 / 필요한 Review 후 수행한다. 기존 `docs:` / `feat:` / `test:` / `ci:` / `chore:` + 한국어 요약 + `- ` 목록 형식을 유지한다.
- Codex 작업이 포함되면 Commit `c8807a1`에서 사용한 기존 Trailer `Co-authored-by: Codex <199175422+chatgpt-codex-connector[bot]@users.noreply.github.com>`를 사용한다. Squash Merge 시 Commit 메시지에도 이 Trailer를 포함한다.
- Auto Merge는 비활성으로 유지한다. Remote CI / Claude PASS / Gate / Branch Ruleset 충족 후 Human이 PR을 Squash Merge하며 Agent / Orchestrator는 Merge하지 않는다.
- Release / Tag는 DEC-025대로 main에서 만든다. DEC-025 Semantic Versioning / Annotated Tag / 검증된 main Commit / Tag 이동·삭제 금지 / Release 노트 규칙을 유지한다. Tag push / Release 생성은 Human 확인 후 수행한다. Merge 승인을 대신 사용하지 않는다.

### GitHub 설정 적용 기록 (2026-10-02)

- Human 승인 후 Claude 세션이 `gh api`로 GitHub 설정을 적용했다 (2026-10-02).
- Squash Merge만 허용하고 Merge Commit / Rebase는 비활성화했다. Squash Commit 제목 = PR 제목, 본문 = PR 본문이며 Merge 후 Head Branch를 자동 삭제한다.
- Branch Ruleset `main-protection`: Active, 기본 Branch 대상, Bypass 없음. 삭제 금지 / Force Push 금지 / Linear History / PR 필수(Required approvals 0, Squash만 허용) / Required status checks `frontend` / `backend`를 적용했다.
- Agent가 Human의 GitHub 로그인을 사용하므로 Bypass가 있으면 Agent도 main에 직접 Push할 수 있어 Bypass를 두지 않았다. 긴급 시 Human이 Ruleset을 일시 Disabled로 전환한다.

## 8. Review Loop (확정)

- 흐름: Preflight → Execute → Verify → Review → Decide
- `MAX_REVIEW_CYCLES=3`: 첫 Review를 1회로 센다. 3번째 판정도 `CHANGES_REQUIRED`이면 4번째 Execute / Review를 시작하지 않고 `HUMAN_REQUIRED`로 정지한다.

| Verdict | 처리 |
|---|---|
| `PASS` | Verification 성공 / Gate 충족을 별도로 확인한다. 남은 Human Review / 승인은 유지한다 |
| `CHANGES_REQUIRED` | Finding을 Codex에 전달해 같은 Task 범위에서 Rework → Verify → Review한다. 상한 도달 시 Human 개입 |
| `HUMAN_REQUIRED` | Gate / 로그인 / 반복 상한 사유를 기록하고 즉시 정지한다 |
| `BLOCKED` | 사용량 한도 / 실행 실패 / Timeout / Verification 실패 / 계약 오류로 즉시 정지한다. 자동 우회하지 않는다 |

- Executor / Reviewer 결과 JSON을 Schema로 검증한다. 형식 오류 / 미허용 Verdict는 `BLOCKED`로 처리한다.
- `changed_files`와 실제 변경 경로를 대조한다. 신규 / 비추적 파일도 포함하며 불일치 / 허용 경로 위반은 `BLOCKED`로 처리한다.
- B단계에서 Fake CLI Test로 반복 / 실패 경로를 검증한다. A단계에서는 구현하지 않는다.

## 9. Deterministic Verification / AI Review / Secret / Log (확정)

- Deterministic Verification은 Exit Code / Test / Build / Schema / 변경 경로 / 반복 횟수 / Gate 상태를 검사한다. 실패를 AI PASS로 덮어쓰지 않는다.
- AI Review는 요구사항 / 승인 Decision 준수와 Diff의 품질 / 누락 / 위험을 검토한다. 미실행 Test를 통과로 판단하지 않는다.
- Reviewer 입력은 Task Contract + 실제 `git diff` + Verification Log로 한정한다. 승인 Decision은 Contract의 근거로 제공하고 Codex 자기 설명은 넘기지 않는다. 신규 파일 내용도 실제 변경으로 제공한다.
- Run 기록은 Git 비추적 `.harness/runs/<run-id>/`에 저장하는 방안을 권장한다. 이번 A단계에는 생성하지 않는다.
- 실제 Secret / Token / Password / 계정 ID / 인증 Cache를 Source / Prompt / Agent 입력 / Log에 기록하지 않는다. OpenAI / Anthropic API Key를 GitHub Secret에도 두지 않는다.
- 앱 Secret은 승인된 환경변수 / GitHub Secrets 정책으로 전달한다. Prompt / 명령 인자에 값을 넣지 않으며 Log에는 저장 전 민감 출력을 제거한 결과만 남긴다.

## 10. 배포 경계 (확정)

- Staging 자동 배포는 TASK-028 검증 / TASK-029 CD Gate 승인 후 허용하는 방안을 권장한다. 비용 Resource / IAM / Network 변경 Gate는 유지한다.
- Production은 TASK-030에서 DEC-025 Release Tag 기반으로 배포하며 항상 Human Approval / Environment Required Reviewer를 요구한다.
- 정책 승인은 실제 AWS Resource 생성 / 배포 승인이 아니다. 이번 Executor 실행에서는 AWS / GitHub 설정을 변경하지 않는다. Claude 세션의 GitHub 설정 적용 기록은 7절을 따른다.

## 11. Human Decision Matrix

Human은 2026-10-02 Decision Matrix의 모든 항목을 권장안대로 승인했다. Sandbox는 `unelevated`로 시작하며 `elevated` 전환은 TASK-020에서 검증 후 재결정한다.

| 항목 | 권장안 / 확정 내용 | Human 결정 |
|---|---|---|
| Branch / PR / Squash Merge 전략 | Task 하나 = Branch 하나 = PR 하나, `task/TASK-0XX-<짧은-이름>`, TASK-018부터 적용, main 직접 Push 금지 / Branch Ruleset 보호, PR + Remote CI(frontend / backend) 통과 후 Human Squash Merge, Task당 Commit 1개, DONE 변경은 PR 안에서 / Merge 후 Sync Milestones가 Milestone 종료 | 확정 |
| Codex Source 수정 권한 | 승인 Task의 허용 경로 Working Tree만 수정 | 확정 |
| Codex Commit / Push 권한 | 독자 실행 금지, Human 지시 또는 승인된 Orchestrator에 한정 | 확정 |
| Claude 완전 Read-only 여부 | Read-only 도구만 허용, Source / 문서 / Git / 배포 변경 금지 | 확정 |
| Orchestrator Commit / Push / PR 단계별 권한 | TASK-018 ~ TASK-020은 Human 승인 후 Claude 세션(임시 Orchestrator) 또는 Human이 Branch / Commit / Push / PR 생성, Script Git 자동화는 TASK-021 별도 승인 / 구현 | 확정 |
| Agent 실행 / 사용량 한도 | API Key 없는 로컬 로그인 CLI, 한도 시 BLOCKED / 재시도 금지 | 확정 |
| Windows Sandbox elevated / unelevated | workspace-write + unelevated 시작, 사전 검증 완료 / 추가 설정 없음, elevated 전환은 TASK-020에서 검증 후 재결정 | 확정: unelevated (elevated 전환은 TASK-020에서 검증 후 재결정) |
| CLI 설치 / Version 관리 | Codex npm 전역 / Claude 확장 실행 파일 경로 설정, Version 기록 / 업데이트 후 재검증 | 확정 |
| Human 승인 채널 | Task 완료 승인 = Human의 PR Squash Merge, Agent / Orchestrator Merge 금지, 동일 gh 계정으로 자기 PR Approve 불가 / Required approvals 0 / Required status checks로 CI 강제, 작성자 분리는 TASK-021 검토. Bootstrap CLI / 대화 및 Production Environment Reviewer는 확정 | 확정 |
| AWS / GitHub 로그인 / Agent Profile | Human 로그인 후 Task 지정 최소 권한 Profile, Production 관리 권한 금지, 만료 시 HUMAN_REQUIRED | 확정 |
| Auto Merge 조건 | 비활성 유지, Remote CI / Claude PASS / Gate / Branch Ruleset 충족 후 Human Squash Merge, Agent / Orchestrator Merge 금지 | 확정 |
| MAX_REVIEW_CYCLES | 3회, 3번째 CHANGES_REQUIRED 후 HUMAN_REQUIRED | 확정 |
| Human Gate 목록 | §4 전체 항목과 기존 Gate A / B / C 유지 | 확정 |
| Secret 전달 / Log | 인증 Cache / 자격 증명 출력 금지, 비민감 Run 기록, 앱 Secret은 승인 환경변수 / GitHub Secrets | 확정 |
| Staging 자동 배포 | TASK-028 검증 / TASK-029 승인 후 허용, 비용 / IAM / Network Gate 유지 | 확정 |
| Production 항상 Human Approval | 항상 필요, Environment Required Reviewer, 우회 금지 | 확정 |
| Release / Tag와 자동화 | DEC-025 유지, Tag push / Release 생성은 Human 확인 | 확정 |

## 12. 승인 후 절차

- Claude가 A단계 실제 Diff / Verification을 자동 Review한다. 작성만으로 PASS를 주장하지 않는다.
- Human이 DEC-026 / Matrix를 승인한 뒤 명시된 실행 범위에 따라 B단계를 진행한다.
- B / C단계 검증 후 D단계에서 승인 정책을 AGENTS.md에 반영한다. 최종 Human Review 전 TASK-018은 DONE으로 처리하지 않는다.
