# TASK-024 — Deployment Artifact / Container / Health Strategy

> 공통 실행 규칙: [COMMON.md](COMMON.md)

## 목적

승인된 AWS Architecture에 맞춰 Frontend와 Backend의 배포 Artifact를 재현 가능하게 만들고, ECS / ALB가 사용할 Health Check 전략을 확정한다.

## 초기 상태 / Dependency

- 초기: `BLOCKED`
- TASK-023 Architecture Human Approved

## Human Gate

Spring Boot Actuator 같은 새 Dependency 추가, 새 Health API 추가, API Contract 변경(DEC-024 계약 파일 영향 포함), Container Base Image 정책 변경이 승인 범위를 벗어나면 Gate C에서 멈춘다.

## Codex 작업 범위

- Backend Production Dockerfile 또는 승인된 Container Build 방식
- `.dockerignore`
- Non-root 실행 가능성 검토
- 재현 가능한 Build / Image Tag 정책 (Commit SHA 권장, Release Tag `v3.x.y`와의 관계는 DEC-025 기준으로 정리)
- Frontend `npm ci` + `npm run build` Artifact 절차
- Runtime Configuration / API Base URL 전략
- Health Check Endpoint / 전략 제안 및 승인 후 구현
- Local Container Smoke Run (Docker Desktop 사용)
- Secret을 Image Layer에 넣지 않음

## Verification

- Backend Image Build / Start
- Health Check 성공 / 실패
- Frontend Production Build
- Container에 Source Secret(`.env.local` 등) 미포함
- Image / Tag Metadata 확인
- 기존 Test / Build / Verify PASS (DEC-023 MySQL 연동, DEC-024 계약 테스트 포함)

## Claude Review 기준

- 작고 안전한 Base Image, Non-root 여부
- Secret / Credential Layer 유출 가능성
- Health Check가 DB 장애를 어떻게 해석하는지
- Image Immutability / Tag 전략
- Local / CI 재현성

## 완료 조건

배포 Artifact가 로컬에서 재현 / 검증되고 승인된 Health 전략이 문서화되면 REVIEW.
