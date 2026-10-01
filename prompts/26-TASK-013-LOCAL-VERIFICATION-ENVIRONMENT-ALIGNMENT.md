# Prompt 26 — TASK-013 Local Verification Environment Alignment

## 목적

Local Verification과 GitHub Actions CI의 Frontend 실행 환경 차이를 줄인다. (FU-2, GAP-3 / GAP-4)

## 실행 단계

TASK-013 등록 (Prompt 25)
→ Milestone 13 ~ 17 생성 (Human 실행)
→ TASK-013 Human Approval
→ Implementation / Verification

## 사용 Context

AGENTS.md
README.md

docs/07-TASKS.md (TASK-013)
docs/08-WORK_LOG.md (TASK-011 Verification Gap GAP-3 / GAP-4)
docs/09-DECISIONS.md (DEC-015)

scripts/verify.ps1
scripts/verify.sh
.github/workflows/ci.yml

## 실제 Prompt

```text
Milestone 생성 완료. TASK-013 승인!
```

## 작업 범위

- `scripts/verify.ps1`, `scripts/verify.sh`에 `npm ci` 단계 추가
- Repository Root `.nvmrc`에 Node.js `24.21.0` 명시 (DEC-015)
- Local Node.js Version이 `.nvmrc`와 다르면 경고 출력 (검증은 계속 진행)

## 제약

- 새로운 Dependency 추가 없음 (Gate C 대상 아님)
- `package.json` / `package-lock.json` 변경 없음
- `.github/workflows/ci.yml` 변경 없음
- git commit / push는 Human 확인 후 진행

## 상태

실행 완료 / Human Review 대기

## Related Commit

- `db2567f` feat: TASK-013 Local Verification 환경 정렬 (npm ci, Node.js Version 명시)
