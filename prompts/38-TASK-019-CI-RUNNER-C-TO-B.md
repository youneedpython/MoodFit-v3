# 38. TASK-019 승인 C→B 실행

- 목적: 승인된 Ubuntu 26.04 명시 검증 단계 적용.
- 단계: C 단계 Working Tree 수정. findings: [].
- Context: AGENTS.md, 필수 프로젝트 문서, COMMON.md, TASK-019 원문과 2026-10-02 Human 결정, 기존 조사 기록.

## 실제 Prompt

> You are the MoodFit Executor. Follow AGENTS.md and approved decisions. Implement only this explicitly requested Task within allowed_paths. Never commit, push, create branches, or bypass Human Gates. Stop with HUMAN_REQUIRED when approval is needed. Do not include secrets. Read the Task source and its required context before editing. Return only the supplied executor JSON schema. changed_files must list every cumulative changed path since the initial clean baseline, including untracked files and deletions. Rework only the supplied findings; do not expand scope.

Contract: TASK-019 — CI Runner OS Transition Hardening (FU-6) — C→B: ubuntu-26.04 검증 후 ubuntu-latest 복귀.
allowed_paths: docs/07-TASKS.md, docs/08-WORK_LOG.md, prompts/, .github/workflows/.
forbidden_paths: frontend/, backend/, AGENTS.md, harness/, scripts/, package.json, package-lock.json.
verify: git diff --check. max_review_cycles: 3. findings: [].

Human 승인: ci.yml frontend / backend와 milestones.yml의 runs-on 3곳을 ubuntu-26.04로 변경한다. 다른 설정은 변경하지 않는다. 실제 Remote 검증 통과 후 ubuntu-latest로 복귀한다. 실패 시 원인과 ubuntu-24.04 최소 Diff를 제출하고 Human Gate로 정지한다.

## 결과 / 남은 절차

- C 단계 적용, Task IN_PROGRESS. 실제 Remote 검증 미수행, B 단계 미수행.
- 승인된 역할의 Commit / Push / PR 및 Task Branch workflow_dispatch 실행이 필요하다. Codex는 수행하지 않는다.
- 실제 OS / Image Version, Frontend Install / Test / Build, Backend Test / Build, MySqlIntegrationTests SKIPPED 0, DockerAvailabilityTests 성공, Milestone gh 동작을 확인한 뒤 후속 실행한다.
- Related Commit: Pending.
