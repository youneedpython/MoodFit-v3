# Prompt 24 — TASK-012 GitHub Actions Bot

## 목적

DEC-021에서 승인된 범위로 GitHub Actions Bot을 구성한다.
CI 실행 결과를 GitHub Actions Step Summary로 자동 기록하고, 실패한 경우에도 결과가 남도록 한다.

## 실행 단계

TASK-012 READY
→ Human 실행 지시
→ TASK-012 IN_PROGRESS
→ CI Workflow에 Step Summary 추가
→ Local 정적 확인 / Summary Script 성공 · 실패 경로 확인
→ Commit / Push / Remote CI
→ REVIEW
→ Human Review

## 사용 Context

AGENTS.md

docs/07-TASKS.md (TASK-012)
docs/09-DECISIONS.md (DEC-009, DEC-013, DEC-017, DEC-018, DEC-021)

prompts/23-TASK-012-GITHUB-ACTIONS-BOT-GATE-C-REVIEW.md

.github/workflows/ci.yml
.github/workflows/milestones.yml

## 실제 Prompt

```text
응, 실행해!
```

## 실행 범위 (DEC-021)

- `.github/workflows/ci.yml`의 `frontend` / `backend` Job에 Step Summary 작성 Step 추가
  - Test / Build 결과, Commit SHA, Workflow Run URL, MySQL Service Container 미사용
  - `if: always()`와 Step outcome으로 실패 시에도 결과 기록
- `.github/workflows/milestones.yml`은 변경하지 않는다. (DEC-018 유지)

## 제약

- 기존 Trigger, Permissions(`contents: read`), Test / Build Command, Cache, MySQL 정책을 변경하지 않는다.
- 추가 GitHub Action, Dependency, Secret / PAT를 사용하지 않는다.
- Source Code / 문서 자동 수정, 자동 Commit / Push / PR, Comment, Issue, Label, Release를 하지 않는다.
- `continue-on-error: true`를 사용하지 않는다.
- Local Verification Script는 변경하지 않는다.

## Human Approval

- TASK-012 Gate C Human Approval 완료 (DEC-021).
- TASK-012 실행 승인 완료.

## Remote CI Verification 결과

- Commit: `e0f92de`
- Workflow run: https://github.com/youneedpython/MoodFit-v3/actions/runs/36814475255
- `frontend` Job: success (`Write frontend summary` 실행)
- `backend` Job: success (`Write backend summary` 실행)

## 상태

실행 완료 / Human Review 중

## Related Commit

e0f92de
