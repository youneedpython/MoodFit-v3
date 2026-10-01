# Prompt 25 — Post-MVP 보완 Task 등록 (TASK-013 ~ TASK-017)

## 목적

TASK-011 / TASK-012에서 정리한 후속 보완 작업 후보 FU-1 ~ FU-5를
`docs/07-TASKS.md`에 Task로 등록하고 GitHub Milestone과 연결한다.

## 실행 단계

TASK-001 ~ TASK-012 DONE
→ FU-1 ~ FU-5 작업 순서 정리 (Human 요청)
→ 용어 정리 (API 계약 테스트 / DB 연동 테스트)
→ Task 등록 및 Milestone 연결 (Human 지시)

## 사용 Context

AGENTS.md
README.md

docs/06-PLAN.md
docs/07-TASKS.md
docs/08-WORK_LOG.md (TASK-011 Verification Gap / 보완 Task 후보, TASK-012 Human Review)

scripts/create-milestones.js
.github/workflows/milestones.yml

## 실제 Prompt

```text
FU1~FU5의 작업 순서 정리!
```

```text
"Work Log와 README의 FU 표기를 이 이름으로 맞춰 두겠습니다." <-- 좋아!
그리고 FU1~5를 TASKS에 등록하고 Milestone도 연결해.
```

## 결정 내용

- 작업 순서: FU-2 → FU-5 → FU-4 → FU-3 → FU-1
  - 환경 일치(FU-2, FU-5) → 빠른 보완(FU-4) → 통합 검증(FU-3, FU-1)
  - FU-3의 CI Database Strategy 결정이 FU-1(API 계약 테스트 / E2E)의 전제가 되므로 FU-3을 먼저 진행한다.
- 용어
  - FU-1: API 계약 테스트 (Frontend / Backend) — 양쪽을 함께 띄우지 않고 약속한 API 형식을 각각 검증
  - FU-3: DB 연동 테스트 (실제 MySQL) — Backend를 실제 MySQL에 연결해 검증

| Task | Milestone | 원래 후보 | 필요 승인 |
|---|---|---|---|
| TASK-013 Local Verification Environment Alignment | Milestone 13 | FU-2 | Human Approval |
| TASK-014 Gradle Wrapper Version Review | Milestone 14 | FU-5 | Human Approval (DEC-015) |
| TASK-015 Timezone-fixed Date Display Test | Milestone 15 | FU-4 | Human Approval |
| TASK-016 DB 연동 테스트 — 실제 MySQL | Milestone 16 | FU-3 | Gate C |
| TASK-017 API 계약 테스트 — Frontend / Backend | Milestone 17 | FU-1 | Gate C |

## 산출물

- `docs/07-TASKS.md`: TASK-013 ~ TASK-017 등록, Current Task를 TASK-013(BLOCKED, Human Approval 대기)으로 변경
- `docs/06-PLAN.md`: Milestone 13 ~ 17 목록 추가 (상세는 TASKS를 따름)
- `docs/08-WORK_LOG.md`: FU 표기 변경, 용어 설명, FU → TASK 대응표
- `scripts/create-milestones.js`: Milestone 13 ~ 17 정의 추가, 이미 있는 Milestone은 제목 기준으로 건너뛰도록 변경
- `AGENTS.md`, `README.md`: Current Task와 다음 단계 동기화

## Milestone 생성

- `create-milestones.js`는 GitHub Token이 필요하므로 Human이 실행한다.
- 실행 전 확인: Milestone 13 ~ 17 5개 생성 대상, Milestone 1 ~ 12 12개는 건너뜀
- `.github/workflows/milestones.yml`은 `TASK-N | Milestone N` 행과 `Milestone N:` 제목 접두어로 동작하므로 변경하지 않는다.

## Human Approval

Task 등록 및 Milestone 연결 지시 완료.
각 Task는 실행 전 TASKS에 정의된 Human Approval / Gate C를 따로 받는다.

## 상태

실행 완료 / Milestone 13 ~ 17 생성 완료 (Human 실행, 중복 없음 확인)

## Related Commit

Pending
