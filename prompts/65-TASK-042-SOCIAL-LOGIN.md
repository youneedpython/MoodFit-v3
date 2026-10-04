# TASK-042 실행 지시

## 목적 / 승인

2026-10-04 Human이 승인한 TASK-042 Contract에 따라 Google / Kakao 로그인, 공유 체험 계정, 사용자별 Check-in 분리와 사용자 메뉴를 구현한다. Dependency / Migration / 인증 API / Smoke 변경은 사전 승인 범위다. 실제 OAuth 값과 Infra 변경은 TASK-043 범위다.

## 실행 Context / 지시

- `docs/tasks/TASK-042_SOCIAL_LOGIN.md`와 공통 규칙, 승인 Decision을 먼저 확인한다.
- Contract의 allowed_paths 안에서만 작업하며 forbidden_paths는 수정하지 않는다.
- Branch / Commit / Push / PR을 직접 수행하지 않고 Human Gate를 우회하지 않는다.
- Backend Dependency 이름은 추측하지 않고 해당 Boot Version의 Gradle 해석으로 확인한다. 해석할 수 없으면 문서에 기록하고 Human에게 보고한다.
- Executor JSON으로 누적 변경 경로, 실제 검증 결과, Human 결정과 후속 작업을 구분해 보고한다.

## 결과

Dependency 확인을 위한 Gradle Wrapper 시작 확인이 Sandbox 밖 Wrapper lock 디렉터리를 만들 수 없어 실패했다. Gradle 자체가 시작되지 않아 Boot BOM에 따른 새 Dependency 해석 근거를 확보하지 못했다. Task Contract의 Dependency 절에 따라 HUMAN_REQUIRED로 정지하며 인증 구현 완료나 테스트 성공을 주장하지 않는다. CLI 설치 / 업데이트, 자동 재시도와 Git 작업은 수행하지 않았다.

## Related Commit

Pending
