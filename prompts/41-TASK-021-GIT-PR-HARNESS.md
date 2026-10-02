# TASK-021 Git Automation / Branch / PR Harness

- 목적: 승인된 Git 계층, 필수 실패 Test, 자기 Contract Guard, Resume 한도 문서화.
- 실행 단계: Executor 구현. TASK-021 자체 Git 작업은 Claude 세션 또는 Human 담당.
- Context: AGENTS.md, TASK-021 / COMMON, DEC-026, docs/11, docs/12, 승인된 Contract.
- 실제 Prompt: 승인된 TASK-021만 allowed_paths 안에서 구현한다. 독자 Commit / Push / Branch / PR은 금지한다. Human이 승인한 (b) 자동 방식은 후속 Task의 Verify 성공 + Claude PASS 이후 Orchestrator에만 적용한다. 결과는 Executor JSON으로 반환한다.
- Human Approval: 2026-10-02 첫 실행 Gate의 승인 범위와 (b) 자동 실행 결정.
- 기대 산출물: 안전한 개별 Stage / Commit / Push / Draft PR 계층과 실패 Test, 정책 기록.
- 상태: 완료(DONE). Rework 1 / 2회차 Claude Review PASS와 Human 완료 반영 승인. Task 완료 승인은 PR Squash Merge로 확정.
- Related Commit: Pending

## Human 결정 2 Rework (2026-10-02)

- 경위: 두 번째 실행의 구현 Test 60 / 60 후 안정 Orchestrator AGENTS Guard가 12절 변경을 차단해 BLOCKED. Claude 세션이 미커밋 13개 파일을 Task Branch로 가져왔다.
- Human Approval: Task 문서의 Human 결정 2와 Claude 세션이 준비한 Contract agents_sections ["12"]. Executor 자기 Contract 변경 금지.
- 실제 Prompt: 선택 필드 agents_sections Schema / run.mjs 검증과 승인 절 본문 Guard를 구현한다. 3절 코드 블록과 12절만 허용하고 절 제목 / 다른 절 변경을 차단한다. 잘못된 형식 및 LF / CRLF 혼용 Test를 추가한다. AGENTS 12절 덮어쓰기 메모를 본문 규칙으로 교체하고 정책 / 설계 / DEC-026 / WORK_LOG를 기록한다. 전체 Orchestrator Test, 치환 흔적, diff --check를 검증한다. Git 작업 / Dependency / Secret은 금지한다.
- 결과: Contract 기반 절 예외와 본문 규칙 Rework 구현. 동일 규격 Verify / Claude Review 후 Claude 세션이 Commit / Push / Draft PR, Human이 Squash Merge한다.
- Executor Verification: 전체 Test 61 / 61 통과, 누적 경로 / 인코딩 / Secret / AGENTS Guard 통과, 치환 흔적 없음, git diff --check Exit 0. Task IN_PROGRESS 유지, Claude Review 대기.

## Rework 2회차 — N-002 수정 (2026-10-02)

- Human Approval / Context: Rework 1회차 Claude PASS 이후 Human이 운영 결함 N-002 수정과 N-001 기록을 지시했다. 승인된 TASK-021 Contract를 따르며 자기 Contract와 AGENTS.md는 수정하지 않는다.
- 실제 Prompt: Source ignored Secret의 존재만으로 차단하지 말고 changed_files / Stage 대상 및 실제 staged 목록의 기존 secretFile 패턴을 차단한다. allowed_paths 안의 개별 literal pathspec Stage와 Commit 직전 staged 재검사를 유지한다. Workspace ignoredSecrets 검사는 유지한다. Source .env.local 정상 진행 / changed_files 및 staged Secret 차단 / 기존 Git 실패 Test를 검증하고 docs/11 / docs/12 / WORK_LOG를 갱신한다.
- N-001: TASK-021 완료(DONE) 반영 시 Claude 세션이 AGENTS.md 3절 설명 문장을 현행화하도록 WORK_LOG에 기록한다.
- 기대 산출물: N-002 수정, 회귀 Test, 정책 / 설계 / Rework 기록. 전체 Orchestrator Test, 물음표 치환 흔적 없음, git diff --check 결과를 Executor JSON으로 보고한다. handoff_actions에는 Orchestrator 밖 작업만 적는다.
- 결과: Source 존재 검사 제거, staged Secret 검사 및 Commit 직전 재검사, Workspace 검사 유지와 회귀 Test 반영. 검증 결과는 WORK_LOG와 Executor JSON에 기록한다. Git 작업 / Dependency 추가 없음.

## Human 승인 완료 반영 (2026-10-02)

- Context / Human Approval: Rework 2회차 Claude Review PASS 후 Human 승인. Claude 세션이 Contract agents_sections를 ["3", "12"]로 준비했다.
- 실제 Prompt: TASKS / AGENTS 3절을 TASK-021 DONE / TASK-022 READY로 동기화하고 WORK_LOG에 Human Review 승인과 후속 개선 후보를 기록한다. Prompt 41과 목록을 완료로 변경한다. 자기 Contract / Dependency / Git / Secret 변경을 금지하고 전체 Orchestrator Test, 치환 흔적, git diff --check를 검증한다.
- 결과: 승인된 완료 기록 반영. DONE은 PR 안에서 처리하며 Human PR Squash Merge로 확정한다. Merge 후 Sync Milestones가 Milestone 21을 종료한다. TASK-022 실행은 Human 승인 Contract와 명시적 실행 지시 후 진행한다.
