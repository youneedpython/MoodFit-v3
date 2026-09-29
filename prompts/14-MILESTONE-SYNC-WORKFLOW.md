# Prompt 14 — Milestone Sync Workflow

## 목적

`docs/07-TASKS.md`에서 DONE 상태가 된 Task의 GitHub Milestone을
push 시 자동으로 Close한다.

## 실행 단계

Human 요청
→ Gate C 대안 검토
→ Human Approval (DEC-018)
→ Workflow 구현
→ Local Verification
→ Push / Remote 실행 확인

## 사용 Context

AGENTS.md
README.md

docs/07-TASKS.md
docs/09-DECISIONS.md

.github/workflows/ci.yml
scripts/create-milestones.js

## 실제 Prompt

Human 요청:

```text
push하면 관련 milestone가 닫혔으면 해. 어떻게 해?
```

Claude가 제시한 선택지:

- A: 지금 Gate C로 승인하고 DEC-018로 기록한 뒤 별도 Workflow(`milestones.yml`)를 추가한다.
- B: TASK-012 GitHub Actions Bot 범위에 포함하고, 그 전까지는 GitHub 화면에서 수동으로 Close한다.

Human 선택:

```text
A로 진행.
```

## 기대 산출물

- `.github/workflows/milestones.yml`
- `docs/09-DECISIONS.md` DEC-018
- `docs/07-TASKS.md` TASK-012 메모
- README 보조 스크립트 / Workflow 안내
- `docs/08-WORK_LOG.md` 기록

## Human Approval

Gate C Human Approval 완료 (DEC-018).

## 상태

실행 완료 / Human Approved

## Related Commit

Pending
