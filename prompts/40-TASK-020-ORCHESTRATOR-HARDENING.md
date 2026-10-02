# 40. TASK-020 Orchestrator Hardening

- 목적: 승인 TASK-020의 작업 공간 / Resume / Lock / Guard / 운영 보강 및 Review 1회차 F1~F9 수정.
- 실행 단계: Executor Working Tree 수정 완료. TASK-020 DONE은 PR Squash Merge 승인으로 확정된다.
- Context: AGENTS.md, docs/01~12, COMMON.md, TASK-020 원문, harness/tasks/TASK-020.json, 기존 구현 / Schema / Fake CLI / 누적 Diff / Verify 실패 기록.
- Human Approval: 명시적 TASK-020 실행 및 Finding 수정 지시. DEC-026 / Task 범위를 준수한다. elevated / CI / Git 권한 확대를 추론하지 않는다.

## 실행 Prompt

MoodFit v3 Executor로서 Contract allowed_paths만 수정한다. 이전 Working Tree 변경을 유지하고 Finding만 고친다. guard의 diff 기본값과 Schema Test의 handoff_actions를 수정한다. 손상 문서를 main의 읽을 수 있는 설계 원본을 기반으로 UTF-8로 복구한다. WORK_LOG의 추가 빈 줄과 README 표 분리 빈 줄을 제거한다. 추가 내용의 연속 물음표 치환 흔적과 U+FFFD를 BLOCKED로 처리하는 Guard와 Test를 추가한다. Deterministic Verification은 Orchestrator가 Sandbox 밖에서 실행하며 Sandbox 제약만으로 FAILED / HUMAN_REQUIRED를 반환하지 않는 규칙을 Template과 설계에 반영한다. 실제 CLI Run과 필수 검증 전 TASK-020을 IN_PROGRESS로 유지한다. Git 작업 / Dependency 추가 / 금지 경로 수정 / Secret 기록은 금지한다. 가능한 검증과 git diff --check를 실행하고 변경 문서 인코딩을 직접 확인한다. 최종 결과는 지정 JSON Schema로만 반환하며 changed_files는 git status의 누적 전체 목록이다.

## 기대 산출물 / 상태

- 현재 상태: 완료. Review 4회차 PASS / Human 결정 A / 실제 CLI Run / 필수 검증 증거를 반영하고 TASK-021 READY로 동기화했다. 아래 검증 대기 서술은 당시 실행 이력이다.

- 산출물: Finding 범위 코드 / Test / 설계 / 기록 / Prompt 수정. Commit / Push / PR 없음.
- 이전 Sandbox 밖 Verify: tests 42 / pass 40 / fail 2, git diff --check Exit 0. 실패를 AI PASS로 덮어쓰지 않는다.
- 수정 후 검증 결과는 docs/08-WORK_LOG.md에 기록한다. Sandbox 밖 Verify / 실제 CLI Run / scripts/verify.ps1 또는 verify.sh 증거는 후속 검증 항목이다.
- Related Commit: 없음, 기존 Working Tree에서 Human 지시에 따른 수정.

## Review 2회차 Rework 지시 (2026-10-02)

- Human 지시: F1의 CRLF 보존 / 코드 블록 값 제한과 회귀 Test, F2의 Executor 편집 / Orchestrator 검증 책임 명시 및 실제 제목 형식의 통합 Test만 반영한다. F3의 실제 CLI Run / verify Script / elevated 재검증은 후속 Orchestrator·Claude 세션이 수행하고 TASK-020은 IN_PROGRESS로 유지한다.
- F10: WORK_LOG와 Prompt 36의 TASK-018 C단계 손상된 제목 / 목록 줄만 제공 사실대로 UTF-8 apply_patch로 복구한다. 손상되지 않은 이웃 줄은 보존한다. TASK-020 WORK_LOG에 원인과 복구를 기록한다.
- 검증: 가능한 Test, 변경 / 복구 문서의 물음표 치환 흔적 검사, git diff --check. Sandbox 차단만으로 FAILED를 반환하지 않는다. 최종 JSON changed_files는 git status의 누적 전체 변경 파일이다.

## Review 4회차 PASS 이후 완료 정리 지시 (2026-10-02)

- Human은 MAX_REVIEW_CYCLES 초과 후 같은 Task 추가 Rework 1회를 승인했고, 4회차 PASS 이후 결정 A로 elevated 전환을 승인했다. Contract의 승인된 허용 경로 추가는 수정하지 않는다.
- 검증된 config.sandbox 전달 / 두 허용 값과 거부 값 회귀 Test, DEC-026 / 정책 / 설계 / AGENTS Sandbox 반영, N1~N3 정리, handoff_actions에서 Contract verify 및 자동 단계 제외를 수행한다.
- 제공된 임시 Repo TASK-901 Smoke Run과 verify.sh / verify.ps1 결과를 WORK_LOG에 구분해 기록한다. TASK-020 DONE / TASK-021 READY는 PR Squash Merge로 승인 확정하며 TASK-021은 실행하지 않는다.
- 직접 node --test "scripts/orchestrator/*.test.mjs", 치환 흔적 검사, git diff --check를 실행한다. Git / Dependency / Secret / 금지 경로 변경 없이 완료한다.
