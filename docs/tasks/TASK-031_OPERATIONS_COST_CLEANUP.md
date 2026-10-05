# TASK-031 — Operations / Cost Guard / Cleanup / Final Hardening

> 공통 실행 규칙: [COMMON.md](COMMON.md)

## 목적

AWS / CD 도입 후 운영 위험을 정리하고 비용 / 보안 / 삭제 / 복구 관점의 최종 Hardening을 한다.

## 초기 상태 / Dependency

- 초기: `BLOCKED`
- TASK-030 DONE 또는 Production 배포 정책 확정

## Codex 작업 범위

- Resource Inventory와 Owner / Tag 규칙
- AWS Budget / Cost Alert 제안 및 승인 후 구성
- ECR Lifecycle / Log Retention / S3 Versioning / Retention 정책
- RDS Backup / Retention / Deletion Protection 확인, Engine Version 지원 기간 점검
- CloudFront Cache / Invalidation 운영 절차
- ECS Scaling / Desired Count 운영 가이드
- Incident / Rollback Runbook
- Staging Cleanup 절차
- 교육 종료 시 안전한 Destroy 순서와 보호 Resource 목록
- aws-nuke 같은 파괴 도구를 쓸 경우 별도 Human Approval과 Allowlist 보호 정책
- 접근 정리: 사용하지 않는 Permission Set / OIDC Role / GitHub Environment 점검
- Agent 운영 점검: 구독 사용량 한도 도달 이력, Orchestrator Run Log 보존 기간
- 최종 Architecture / Deployment / Operations 문서 동기화

## Human Gate

Resource 삭제, RDS Snapshot / Delete, Budget Threshold, Destructive Cleanup은 Human Approval 대상이다.
파괴적 작업은 Human이 SSO로 로그인한 승인된 Profile에서만 진행하며, Agent는 Dry-run과 절차 준비까지만 한다.

## Verification

- Dry-run 가능한 Cleanup은 Dry-run으로 검증
- 보호 Resource가 삭제 대상에서 제외되는지 확인
- Production 복구 / Rollback 문서 검토
- 전체 CI / CD / Smoke Test 최종 PASS

## Claude Review 기준

- 비용 누수 Resource(NAT / ALB / RDS / EIP 등) 식별
- 파괴적 명령 Guard
- Backup / Recovery 실제성
- Secret / Credential / 접근 권한 정리
- 운영 문서와 실제 IaC / CD 일치

## 완료 조건

운영 / 비용 / 삭제 / 복구 정책이 Human Review를 통과하고 최종 문서와 실제 환경이 동기화되면 DONE.

## Human 결정과 실행 기록 (2026-10-05)

Human이 삭제 목록과 순서를 본 뒤 승인했다(DEC-050). 범위는 환경 정리와 다시 만드는 방법의 문서화로 좁혔다.

- 실행: Claude 세션이 위임받은 관리 Profile로 Stack 13개와 Stack이 남긴 Resource를 지웠다. Orchestrator Run은 없다(파일 구현이 아니라 AWS 작업이다).
- 삭제 전 확인: 진행 중인 배포 없음, 배포 Workflow 두 개 비활성화.
- 삭제 뒤 확인: 비용이 드는 Resource 0개(조회 항목은 `docs/29-CLEANUP-AND-REDEPLOY.md` 2절).
- 승인 목록에 없어 남긴 것: 인증서 검증용 DNS Record 4개(무료).
- Human이 할 일: OAuth Secret 삭제.
- 하지 않은 것: Resource Tag 규칙 정리, ECR Lifecycle / 보존 정책 조정, Scaling 가이드, aws-nuke 검토. 운영을 계속하지 않아 대상이 없다.
