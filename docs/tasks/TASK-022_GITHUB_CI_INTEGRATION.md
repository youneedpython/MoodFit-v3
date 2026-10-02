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

## Human 결정 (2026-10-02, Gate C — 첫 실행 HUMAN_REQUIRED 후)

첫 Orchestrator 실행에서 Codex가 Gate C 검토안(권장안 A / 대안 B)을 작성하고 정지했으며, Claude 자동 Review도 HUMAN_REQUIRED였다. Human이 다음을 승인했다.

1. **권장안 A 승인** — 구현 범위:
   1. `ci.yml`: 기존 frontend / backend 명령, Trigger, `contents: read`, Milestone Workflow 유지. Job `timeout-minutes: 20`, PR 번호 또는 ref 기준 `concurrency`(`cancel-in-progress: false`) 추가. Queue된 Run 때문에 최신 head SHA의 Required Check가 오래된 결과로 남지 않는지 확인한다.
   2. CI Summary에 Task ID / PR 링크 추가. head ref / title / body 등 PR 입력은 **env로만** 전달하고 run Script에 직접 삽입하지 않는다. `pull_request_target`를 사용하지 않는다. CI는 AI Review를 실행하거나 재판정하지 않는다.
   3. 로컬 Orchestrator PR 상태 조회: 기존 Human `gh` 인증, Base main / Task Branch / 저장된 head SHA / PR 번호 고정. 현재 head의 CI frontend / backend가 모두 success일 때만 Human Review 대기로 진행한다. 누락 / skipped / neutral / failure / cancelled / timed_out은 통과로 인정하지 않는다. 조회 실패 / Timeout은 정지, 자동 재시도 없음.
   4. Changes Requested는 PR head와 Review 근거를 보존해 Rework 필요 상태로 정지한다. Label / Comment / AI PASS / PR Approve를 Gate 또는 완료 승인으로 사용하지 않는다. Gate 승인은 resume-approval.json 방식을 유지한다.
   5. Human Squash Merge 확인 시에만 다음 Task 선행 조건 충족 근거를 기록한다. Merge / Auto Merge / 다음 Task 자동 실행 / READY 자동 승격 없음.
   6. Git 변경 전 같은 Task Branch / Task ID의 open PR, 다른 head의 동시 Task PR, Remote Branch SHA 충돌을 전체 페이지 조회로 확인하고 중복 / 불일치 시 BLOCKED.
2. **PR 상태 Comment 자동화 허용** (권장안 A 7번): 실패 / 취소 / Timeout 상태를 로컬 redacted Audit에 남기고 기존 PR에 로컬 `gh`로 고정 형식의 상태 설명을 기록한다. DEC-021에서 보류된 PR Comment 자동화의 추가 승인이며, Workflow 권한 확대 / 새 Secret은 없다. DEC-021 / DEC-026 변경 이력에 기록한다. (docs/09-DECISIONS.md는 Contract 허용 경로가 아니므로 DEC 변경 이력은 docs/11 정책과 WORK_LOG에 기록하고, DEC 본문 반영은 Claude 세션이 수행한다)
3. **strict Required Status Checks 적용** (권장안 A 8번): Claude 세션이 Human 승인으로 `main-protection` Ruleset의 `strict_required_status_checks_policy`를 true로 변경했다(2026-10-02, 다른 규칙 / 필수 Check frontend / backend는 변경 없음). PR Branch가 최신 main 기준으로 CI를 통과해야 Merge할 수 있다.
4. 첫 실행 Claude Review의 F2(07-TASKS / AGENTS.md TASK-022 상태 표기 불일치), F3(concurrency 최신 SHA 확인, PR 입력 env 전달, `pull_request_target` 금지)를 구현과 기록에 반영한다.
5. 구현 Run이 PASS로 끝나면 Orchestrator가 Commit / Push / Draft PR을 자동으로 수행한다(TASK-021 결정 b). 실제 Harness → Draft PR → 최신 head CI 성공 → Human Squash Merge E2E 근거를 최소 1회 기록한다.

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
