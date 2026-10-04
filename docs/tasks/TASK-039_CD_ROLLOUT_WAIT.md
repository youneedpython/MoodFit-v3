# TASK-039 — Staging CD Rollout Wait Fix

> 공통 실행 규칙: [COMMON.md](COMMON.md)

## 목적

Staging 자동 배포가 ECS 배포는 성공했는데도 "Wait for ECS and reject circuit breaker rollback" Step에서 실패한다. 판정 방식을 고친다.

## 초기 상태 / Dependency

- 초기: `READY` (Human 지시 "CD 에러 해결", 2026-10-04)
- 선행: TASK-029, TASK-038
- 실행: `node scripts/orchestrator/run.mjs TASK-039`

## 확인된 사실 (2026-10-04, Claude 세션)

- TASK-038 적용 뒤 재실행에서 OIDC, ECR Push, Task Definition 등록, Service 갱신까지 통과했다.
- 실패 위치: 안정화 대기 Step의 inline Python 8번째 줄, `rolloutState == 'COMPLETED'` 검사(메시지 없는 AssertionError).
- 실패 직후 읽기 전용 조회 결과: Service는 새 revision 하나만 PRIMARY, `rolloutState` COMPLETED, desired 2 / running 2, 실패 Task 0, "deployment completed" 이벤트가 있다. 즉 배포는 성공했다.
- 원인: `aws ecs wait services-stable`은 Deployment가 하나이고 running이 desired와 같으면 끝난다. 그 시점에 `rolloutState`가 아직 `IN_PROGRESS`일 수 있다(Circuit Breaker 판정이 조금 뒤에 COMPLETED로 바뀐다). 대기가 끝난 직후 한 번만 조회해 COMPLETED를 요구해서 실패했다.
- 이 실행에서 Backend는 새 revision으로 바뀌었고 Frontend 배포 이후 단계는 실행되지 않았다.

## 실행 기준

1. 대기 Step을 다음처럼 바꾼다: `services-stable` 대기 뒤, Service를 주기적으로 조회해(예: 15초 간격, 최대 약 10분) 아래를 판정한다.
   - 성공: Service의 Task Definition이 목표 revision이고, Deployment가 하나이며 그 Task Definition이 목표이고, `rolloutState`가 `COMPLETED`, desired 2 / running 2 / pending 0.
   - 즉시 실패: Service의 Task Definition이 목표와 다르다(롤백), 또는 목표 Deployment의 `rolloutState`가 `FAILED`.
   - 그 밖(`IN_PROGRESS`, Deployment 둘 이상 등)은 계속 기다리고, 시간 안에 성공하지 못하면 실패.
2. 실패할 때 어떤 조건 때문인지 짧은 이유를 출력한다(예: "rollout state IN_PROGRESS after timeout", "rolled back"). 계정 ID, ARN, AWS 응답 원문은 출력하지 않는다. revision 번호와 상태 이름만 쓴다.
3. Deployment Circuit Breaker의 롤백을 성공으로 처리하지 않는다는 기존 의도는 유지한다.
4. 배포 Role 권한 안의 API만 쓴다(`DescribeServices`). 다른 Step, 권한, Trigger, Action 고정 SHA는 바꾸지 않는다.
5. 문서: `docs/21-STAGING-CD.md`(판정 방식과 이번 실패 기록), `docs/08-WORK_LOG.md`. `docs/07-TASKS.md`에 TASK-039 행과 절을 추가하고 DONE으로 둔다(Milestone 39, Task 표가 빈 줄로 끊기지 않게 한다). TASK-030은 BLOCKED 유지, AGENTS.md 3절 Current Task는 바꾸지 않는다. 다른 미등록 Task는 등록하지 않는다.
6. Secret 검사: Workflow의 OIDC 발급 권한 줄은 Contract에 허용 문구로 승인되어 있다. 그 줄은 바꾸지 않는다. 자격 증명 단어 뒤에 콜론 / 등호와 값이 오는 표기를 새로 쓰지 않는다.

## 제외 범위

- 다른 Step의 진단 출력 개선, concurrency, Tag 정책(후속 후보)
- Infra, Script, Backend, Frontend 변경

## Verification

- Workflow YAML 구조 검사, `git diff --check`

## Claude Review 기준

- 성공 / 즉시 실패 / 대기 조건이 위와 같은가, 무한 대기가 없는가
- 롤백을 성공으로 처리하지 않는가
- 식별값을 출력하지 않는가
- 다른 Step을 바꾸지 않았는가

## 완료 조건

검증과 Review를 통과하면 REVIEW. Merge 뒤 자동 배포가 끝까지 통과하는지 확인한다.
