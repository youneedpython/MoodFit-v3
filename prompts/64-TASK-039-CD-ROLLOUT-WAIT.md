# 64. TASK-039 Staging CD Rollout Wait Fix

- 목적: ECS 배포 성공 직후 IN_PROGRESS 상태를 실패로 오인하는 Staging CD 대기 판정을 수정한다.
- 실행 단계: Human 승인 Contract에 따른 Executor 구현.
- 사용 Context: AGENTS.md, 승인 Decision, TASK-039 Contract와 COMMON, Staging CD 운영 문서.
- 실제 Prompt: "CD 에러 해결" 지시에 따라 services-stable 뒤 15초 간격으로 최대 10분 DescribeServices를 조회한다. 목표 revision / 단일 Deployment / COMPLETED / desired 2 / running 2 / pending 0을 모두 확인하고 롤백 / FAILED는 즉시 실패한다. 실패 이유에 AWS 원문이나 식별값을 출력하지 않는다. 다른 Step과 권한은 바꾸지 않는다.
- 기대 산출물: 대기 Step 수정, TASK-039 Milestone 39 / DONE 기록, 운영 문서와 작업 이력.
- Human Approval: 2026-10-04 명시 실행 지시. Production 실행 승인과 무관하다.
- 결과: Executor 구현 완료. 최종 검증과 Review, Human Squash Merge 및 Merge 후 실제 자동 배포 확인 대기.
- Related Commit: Executor는 Commit을 수행하지 않는다.
