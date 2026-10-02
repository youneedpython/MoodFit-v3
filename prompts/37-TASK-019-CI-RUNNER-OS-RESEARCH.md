# 37. TASK-019 CI Runner OS 조사 / Human Gate

- 목적: FU-6 Runner OS 전환 근거와 현재 CI 의존 조사, 전략 제안.
- 단계: Human 명시 실행 지시에 따른 조사 / Human Gate. findings 없음.
- Context: AGENTS.md, docs/01 ~ 12의 필수 Context, 승인 DEC-017 / 018 / 021 / 023 / 025 / 026, tasks/COMMON.md, TASK-019 원문, 현재 두 Workflow와 MySQL 테스트.

## 실제 Prompt

> You are the MoodFit Executor. Follow AGENTS.md and approved decisions. Implement only this explicitly requested Task within allowed_paths. Never commit, push, create branches, or bypass Human Gates. Stop with HUMAN_REQUIRED when approval is needed. Do not include secrets. Read the Task source and its required context before editing. Return only the supplied executor JSON schema. changed_files must list every cumulative changed path since the initial clean baseline, including untracked files and deletions. Rework only the supplied findings; do not expand scope.

Contract: TASK-019, 조사 / Human Gate. allowed_paths: docs/07-TASKS.md, docs/08-WORK_LOG.md, prompts/. forbidden_paths: .github/, frontend/, backend/, AGENTS.md, harness/, scripts/, package.json, package-lock.json. verify: git diff --check. max_review_cycles: 3. findings: [].

## 기대 산출물 / 결과

- 최신 공식 근거와 현재 Docker / Shell / Runtime / Permission / Line Ending / gh 의존 조사, 최소 2개 전략과 승인 후 검증 계획.
- WORK_LOG에 A(24.04 고정), B(latest 유지, 권장), C(26.04 명시 검증)를 기록했다.
- Human Approval: 조사 실행 승인 있음. Runner 전략 / Workflow 변경 승인 없음.
- 결과: HUMAN_REQUIRED. Task IN_PROGRESS, Workflow 무변경, Remote CI / 실제 26.04 호환성 미검증.
- 관련 기록: docs/08-WORK_LOG.md TASK-019, docs/07-TASKS.md.
- Related Commit: Pending (Executor Git 변경 작업 없음).
