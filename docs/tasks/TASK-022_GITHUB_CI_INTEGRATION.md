# TASK-022 — GitHub CI Integration / PR Gate

> 공통 실행 규칙: [COMMON.md](COMMON.md)

## 목적

로컬 Multi-Agent Harness(TASK-018 / TASK-020 / TASK-021)가 만든 PR을 GitHub에서 **Deterministic CI와 Human 승인**으로 마무리하는 흐름을 완성한다.

Agent는 VS Code에 로그인된 계정으로 로컬에서만 실행되므로(COMMON.md 2절) **GitHub Actions에서 Codex / Claude를 호출하지 않는다.**
GitHub Actions는 CI(Test / Build / Summary)와 이후 CD만 담당한다.

## 초기 상태 / Dependency

- 초기: `BLOCKED`
- TASK-021 DONE
- CI 동작 변경 / Branch Protection Gate C Human Approved

## 전체 흐름

```text
[로컬] Orchestrator: Codex 실행 → Verify → Claude Review → Branch / Commit / Push / PR
[GitHub] PR CI (ci.yml) → Required Check 통과
[Human] PR Review / Approve → Merge (또는 승인된 조건의 Auto Merge)
[GitHub] main CI → Sync Milestones → (TASK-029 이후) Staging CD
[로컬] Orchestrator: Merge 확인 후 다음 Task 진행
```

## Codex 작업 범위

1. 기존 `.github/workflows/ci.yml`, `milestones.yml`을 존중하고 역할 중복을 최소화한다.
2. PR에서 기존 CI가 실행되는지 확인하고, 필요하면 PR 전용 Summary(Task ID, Review Verdict 링크)를 추가한다.
3. `main` Branch Protection / Required Status Check 설정안을 작성한다. (실제 설정은 Human이 GitHub 화면에서 적용)
4. Human 승인 채널(DEC-026)을 GitHub에 맞춘다. 예) PR Approve = Task 완료 승인, Label = Gate 결정
5. Orchestrator가 PR CI 결과와 Human 승인을 `gh`로 조회해 다음 단계로 진행하거나 멈추도록 한다.
6. 같은 Task의 중복 실행 / 동시 PR을 방지한다.
7. 실패 / 취소 / Timeout 경로에서도 Step Summary와 PR에 상태를 남긴다.
8. Workflow 권한은 최소 권한을 유지한다. `contents: read`보다 커지면 승인된 Decision을 근거로 한다.
9. GitHub Secret에 Agent용 API Key를 추가하지 않는다.

## 필수 검증 시나리오

- 정상 PASS → PR CI 성공 → Human Approve → Merge
- PR의 Frontend Test 실패
- PR의 Backend Test 실패
- Human이 Changes Requested → Orchestrator가 Rework로 되돌림
- Human 승인 없이 Merge 시도 차단
- 같은 Task 중복 실행
- PR / Branch Conflict

## Claude Review 기준

- Workflow 권한 최소화, Secret 노출 없음
- 기존 CI 우회 없음
- AI `PASS`만으로 Merge하지 않음 (Deterministic Check + Human 승인 필요)
- Human Gate가 실제 중지점이 되는가
- Event Chaining / `pull_request_target` 같은 위험한 Trigger를 쓰지 않는가
- Timeout / Concurrency / 중복 실행 방지

## 완료 조건

최소 1회의 End-to-End Harness Run(로컬 실행 → PR → CI → Human Approve → Merge)을 성공 검증하고, 실패 경로가 안전하게 멈추는 것을 확인한 뒤 REVIEW. 이후 Task부터 이 Harness를 사용 가능 상태로 전환한다.
