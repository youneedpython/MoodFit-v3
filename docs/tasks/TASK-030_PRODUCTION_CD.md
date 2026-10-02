# TASK-030 — Production Continuous Deployment / Approval / Rollback

> 공통 실행 규칙: [COMMON.md](COMMON.md)

## 목적

Staging에서 검증된 Release를 Production에 배포하되, **Human Approval을 반드시 거치는 Gated CD**를 만든다.

## 초기 상태 / Dependency

- 초기: `BLOCKED`
- TASK-029 Staging CD 안정화
- Production Architecture / IAM / Environment 승인 완료

## Human Gate

- Production 배포는 항상 Human Approval이 필요하다. (GitHub Environment `production` Required Reviewer)
- 최초 Production Stack / Resource 생성도 별도로 승인한다. 최초 생성은 Human이 `MoodFitProductionAdmin` 권한으로 직접 수행하거나 승인한다. Agent는 Production Profile을 사용하지 않는다.
- 파괴적 DB Migration은 자동으로 진행하지 않는다.

## Release 연계 (DEC-025)

- Production 배포 단위는 Release Tag `v3.x.y`로 한다.
- 흐름 예: Staging 검증 → Human이 Tag / Release 생성 승인 → Tag의 Commit SHA에 해당하는 검증된 Image / Artifact를 Production으로 승격 → Environment 승인 → 배포
- Release 노트(`docs/releases/<tag>.md`)에 배포 결과를 연결한다.

## Codex 작업 범위

- GitHub `production` Environment 기반 승인 Gate
- Staging에서 검증된 동일 Image / Artifact 승격 (재Build 금지)
- Production 전용 설정 / Secret Reference
- 배포 Concurrency / Locking
- 배포 전 점검
- 배포 후 Smoke Test
- Health / Smoke 실패 시 자동 또는 승인된 Rollback
- 배포 Audit Trail (Tag, Commit SHA, Image Digest, 승인자, 시각)

## Production Safety

- `latest` 재Build 대신 검증된 Artifact 승격
- Production DB 삭제 금지
- Schema Destructive Change 감지 시 `HUMAN_REQUIRED`
- Rollback이 DB Schema와 충돌할 수 있으면 자동 Rollback 금지 후 Human Escalation

## Claude Review 기준

- 승인 우회 가능성
- Staging과 Production Artifact 동일성
- IAM 최소 권한, Agent의 Production 접근 차단
- Rollback 안전성
- Migration / 호환성
- Production Secret / Log 노출

## 완료 조건

Human 승인 후 Production 배포가 성공하고 Smoke Test PASS, Rollback 절차가 검증 / 문서화되면 REVIEW.
