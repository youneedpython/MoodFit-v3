# Prompt 23 — TASK-012 GitHub Actions Bot Gate C Review

## 목적

TASK-012 GitHub Actions Bot 구현 전에
Bot 자동화 범위, Trigger, 권한, 공식 도구 사용 여부, 기존 Milestone 자동화와의 관계를 검토하고
Gate C Human Approval을 받는다.

## 실행 단계

TASK-012 BLOCKED
→ Gate C Review
→ Human Approval 대기

## 사용 Context

AGENTS.md
README.md

docs/06-PLAN.md
docs/07-TASKS.md
docs/08-WORK_LOG.md
docs/09-DECISIONS.md

.github/workflows/ci.yml
.github/workflows/milestones.yml
scripts/create-milestones.js

## 실제 Prompt

```text
TASK-012 Gate C 검토 시작!
```

## 현재 상태

- TASK-001 ~ TASK-011은 DONE 상태이다.
- TASK-012는 선행 조건을 충족했지만 GitHub Actions Bot 구성이 Gate C 대상이므로 BLOCKED 상태이다.
- DEC-013은 GitHub Actions Bot을 Core Feature 구현 및 검증 이후에 추가하며, 초기에는 Source Code 자동 수정을 하지 않는다고 정한다.
- DEC-018로 GitHub Milestone 자동 Close만 선도입되어 있다.
- TASK-011에서 FU-1 ~ FU-4 후속 보완 후보가 정리되었지만, TASK-012에서 임의로 함께 수행하지 않는다.

## 조사 기준 날짜

2026-10-01

## 조사한 공식 Source

- GitHub Docs — `GITHUB_TOKEN`
  - https://docs.github.com/en/actions/concepts/security/github_token
- GitHub Docs / Changelog — `GITHUB_TOKEN` permissions
  - https://github.blog/changelog/2021-04-20-github-actions-control-permissions-for-github_token/
- GitHub CLI Manual — `gh api`
  - https://cli.github.com/manual/gh_api
- GitHub CLI Manual — `gh issue comment`
  - https://cli.github.com/manual/gh_issue_comment
- actions/github-script official repository / releases
  - https://github.com/actions/github-script
  - https://github.com/actions/github-script/releases

## 기존 자동화 상태

### CI Workflow

`.github/workflows/ci.yml`

- Trigger: `push` / `pull_request` to `main`
- Permissions: `contents: read`
- Jobs: `frontend`, `backend`
- 역할: Test / Build 검증
- Bot 역할 없음

### Milestone Sync Workflow

`.github/workflows/milestones.yml`

- Trigger:
  - `push` to `main` when `docs/07-TASKS.md` or workflow file changes
  - `workflow_dispatch`
- Permissions:
  - `contents: read`
  - `issues: write`
- Tool:
  - Runner 기본 `gh` CLI
- 역할:
  - `docs/07-TASKS.md` 전체 Task 목록에서 DONE Task를 읽고 대응 Milestone을 Close
- DEC-018에서 Human Approved 상태이다.

## TASK-012 Bot 후보 범위

TASK-012의 목적은 검증 결과 또는 Harness 관련 기록 자동화이다.
다음 후보를 비교한다.

| Option | 범위 | 설명 | 장점 | 단점 | 권한 |
|---|---|---|---|---|---|
| A | 현재 유지 | DEC-018 Milestone 자동 Close를 TASK-012 Bot 초기 범위로 인정하고 추가 Workflow를 만들지 않음 | 가장 단순, 새 권한 없음, 위험 최소 | TASK-012 산출물이 이미 선도입된 DEC-018에 한정됨 | 현재 유지 |
| B | CI Summary Bot | CI 완료 후 GitHub Actions Step Summary에 Frontend / Backend 결과 요약 | Source 수정 없음, PR/Issue 권한 불필요, 교육용으로 이해 쉬움 | Summary는 Workflow Run 화면에서만 보임 | `contents: read` |
| C | PR Comment Bot | Pull Request에서 CI 결과 요약 Comment 작성 | Review 흐름에서 보기 쉬움 | `pull-requests: write` 또는 `issues: write` 필요, 중복 Comment 관리 필요 | `contents: read`, `pull-requests: write` 또는 `issues: write` |
| D | Issue Comment / Issue 생성 Bot | 실패 또는 DONE Task 변경 시 Issue / Comment 생성 | 기록성이 강함 | 권한 확대, Issue Noise 가능성, 범위 설계 필요 | `contents: read`, `issues: write` |
| E | Source 수정 Bot | Work Log나 Task 문서를 자동 수정 후 Commit / PR 생성 | 자동화 효과 큼 | DEC-013 초기 범위에서 제외, Source 자동 수정 위험 큼 | `contents: write`, `pull-requests: write` 등 |

## 추천안

### 추천: Option A + B

TASK-012 초기 Bot은 다음 범위로 제한하는 것을 제안한다.

1. DEC-018 Milestone 자동 Close를 TASK-012 Bot 범위의 기존 구성으로 인정한다.
2. CI Workflow에 Source Code를 수정하지 않는 GitHub Actions Step Summary를 추가한다.
3. Step Summary에는 다음만 기록한다.
   - Frontend Test / Build 결과
   - Backend Test / Build 결과
   - 실행 Commit SHA
   - Workflow Run URL
   - MySQL Service Container 미사용
4. PR Comment, Issue 생성, Label, Release, Source 수정은 TASK-012 초기 범위에서 제외한다.

이유:

- DEC-013의 "초기에는 Source Code를 자동 수정하지 않는다"는 결정과 일치한다.
- `GITHUB_STEP_SUMMARY`는 추가 GitHub Action이나 추가 Permission 없이 사용할 수 있다.
- 기존 CI의 `contents: read` 권한을 유지할 수 있다.
- 교육용 Harness에서 "검증 결과 기록 자동화"를 가장 낮은 위험으로 보여줄 수 있다.
- PR Comment / Issue 자동화는 중복 관리와 권한 확대가 필요하므로 다음 Gate C로 미루는 편이 안전하다.

## Trigger 검토

| Trigger | 추천 여부 | 이유 |
|---|---|---|
| `push` to `main` | 유지 | 기존 CI와 동일, main 반영 결과 확인 |
| `pull_request` to `main` | 유지 | PR 검증 결과 Summary 확인 가능 |
| `workflow_dispatch` | 선택 | 수동 재실행 편의는 있으나 TASK-003 CI 정책과 달라지므로 승인 필요 |
| `issue_comment` | 제외 | Comment 기반 Bot은 권한과 보안 고려가 커짐 |
| `pull_request_target` | 제외 | Fork PR / Token 권한 위험이 커 초기 Bot에 부적절 |
| `schedule` | 제외 | 현재 검증 자동화 목적과 무관 |

## 권한 정책

추천 범위(Option A + B)에서는 기존 CI 권한을 유지한다.

```yaml
permissions:
  contents: read
```

PR Comment 또는 Issue Comment를 도입하는 경우에는 다음 권한이 추가로 필요할 수 있다.

- `pull-requests: write`
- `issues: write`

단, TASK-012 초기 제안에서는 권한 확대를 하지 않는다.

## 공식 Tool / Action 후보

| Tool / Action | 현재 Stable / 사용 후보 | TASK-012 필요 여부 | 검토 |
|---|---|---|---|
| Runner shell + `GITHUB_STEP_SUMMARY` | GitHub Actions 기본 기능 | 추천 | 추가 Action / Dependency 없이 Summary 작성 가능 |
| Runner 기본 `gh` CLI | GitHub-hosted runner 기본 도구로 이미 DEC-018에서 사용 | 현재 유지 | Milestone Close Workflow에서만 계속 사용 |
| `actions/github-script` | v9.0.0 | 초기 범위 제외 | GitHub API Script 작성에는 유용하지만 새 Action 추가가 필요함 |
| GitHub REST API via `gh api` | 공식 GitHub CLI | 필요 시 후속 검토 | Issue / PR Comment 자동화 시 후보 |

## 기존 Workflow 영향

### `.github/workflows/ci.yml`

Option A + B를 승인하면 CI Workflow에 Summary Step을 추가하는 방식이 가장 작다.

예상 변경:

- `frontend` Job 마지막에 Frontend Summary Step 추가
- `backend` Job 마지막에 Backend Summary Step 추가
- 기존 Test / Build Command 변경 없음
- 기존 Dependency / Cache / MySQL 정책 변경 없음

### `.github/workflows/milestones.yml`

DEC-018 Workflow는 유지한다.

예상 변경:

- 없음

## 제외 범위

TASK-012 초기 Bot에서는 다음을 제외하는 것을 제안한다.

- Source Code / 문서 자동 수정
- 자동 Commit
- 자동 Push
- 자동 Pull Request 생성
- PR Review 승인 / 병합
- Release 생성
- Label 자동 변경
- Issue 자동 생성
- PR / Issue Comment 작성
- `pull_request_target` Trigger
- 외부 Secret / PAT 사용
- Slack / Email / 외부 서비스 알림
- 새로운 npm / Gradle Dependency
- Local Verification Script 변경
- MySQL Service Container 추가

## Local Verification / CI 영향

- Local Verification(`scripts/verify.ps1`, `scripts/verify.sh`)은 변경하지 않는다.
- CI Test / Build 범위도 변경하지 않는다.
- Summary Step 추가 시에도 실패를 숨기지 않는다.
- `continue-on-error: true`는 사용하지 않는다.

## Human Approval 필요 항목

다음 항목은 모두 제안 상태이며, Human Approval 전에는 구현하지 않는다.

1. TASK-012 초기 Bot 범위
   - 추천: DEC-018 유지 + CI Step Summary 추가
2. `.github/workflows/ci.yml` 수정 여부
3. `.github/workflows/milestones.yml` 유지 여부
4. Trigger
   - 추천: 기존 CI의 `push` / `pull_request` 유지
5. Permission
   - 추천: `contents: read` 유지
6. PR Comment / Issue Comment 제외 여부
7. `actions/github-script` 제외 여부
8. `gh api` 신규 사용 제외 여부
9. Source Code 자동 수정 제외 여부
10. Remote CI 확인 방식
    - Commit / Push 후 GitHub Actions Run 확인 필요

## Gate C 추천 결정 초안

승인 시 `docs/09-DECISIONS.md`에 새 Decision으로 다음 내용을 기록하는 것을 제안한다.

```text
DEC-021 TASK-012 GitHub Actions Bot

- Gate C Human Approved
- 초기 Bot 범위는 Source 수정 없는 CI Step Summary 자동화로 제한
- DEC-018 Milestone 자동 Close는 기존 Bot 자동화로 유지
- CI Workflow의 Test / Build Command는 변경하지 않음
- permissions는 contents: read 유지
- PR Comment, Issue 생성, Label, Release, Source 수정, Commit / Push 자동화는 제외
- 추가 Action / Dependency는 사용하지 않음
- Remote CI 결과 확인 후 TASK-012 REVIEW 전환
```

## Claude 검토

- 사실관계 확인: `actions/github-script` 최신 v9.0.0(2026-04-09), DEC-013 / DEC-018 내용, 기존 CI 권한, `GITHUB_STEP_SUMMARY`의 추가 권한 불필요를 확인했다.
- 추천안(A + B) 동의 근거 추가: Repository는 Pull Request가 0건이고 최근 Workflow 실행 30건이 모두 `main` 직접 Push이므로 PR Comment Bot(Option C)은 현재 실행될 일이 없다.
- 보완 제안: Summary Step을 마지막 Step으로만 추가하면 Test / Build 실패 시 건너뛰어져 실패 결과가 기록되지 않는다. `if: always()`와 Step outcome으로 실패 시에도 결과를 기록해야 한다.

## Human Approval 결과

Gate C Human Approval 완료 (2026-10-01).

```text
1. 범위: 추천안(A+B)
2. 보완: 실패 시에도 요약 기록 보완
승인!
```

- 승인된 결정은 `docs/09-DECISIONS.md` DEC-021에 기록했다.
- TASK-012를 READY로 변경했다. 구현은 별도 실행 지시 후 진행한다.

## 상태

실행 완료 / Human Approved

## Related Commit

Pending
