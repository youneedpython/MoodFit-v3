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

## 실행 기준 (Human 승인, 2026-10-03)

- Contract: `harness/tasks/TASK-024.json`. Orchestrator Verify에 `scripts/verify.sh` 전체(Frontend / Backend Test·Build, DEC-023 MySQL Testcontainers, DEC-024 계약 Test)를 포함한다.
- 금지 경로: Dependency 파일(`backend/build.gradle`, `settings.gradle`, `gradle/`, `frontend/package.json` / `package-lock.json`), API 계약(`contracts/`), CI(`.github/`), `scripts/`, `harness/`. 이 경로의 변경이 필요한 제안(예: Spring Boot Actuator 추가, 새 Health API와 계약 파일 변경, CI Image Build)은 구현하지 않는다. 근거와 최소 Diff 제안을 문서에 남기고 `HUMAN_REQUIRED`(Gate C)로 정지한다. 승인 후 Contract 허용 경로를 넓혀 다시 실행한다.
- 승인된 Architecture: DEC-027(B안, ECS Fargate Linux x86, 0.5 vCPU / 1 GiB, Desired Count 2, CloudFront `/api` → ALB HTTPS origin, Domain `8949db.kr`). 상세는 `docs/13-AWS-ARCHITECTURE.md`를 따른다.
- 산출 문서: `docs/14-DEPLOYMENT-ARTIFACT.md` (Container Build 방식, Image Tag 정책, Frontend Artifact 절차, Runtime Configuration, Health 전략, Local Smoke 결과)
- Docker Image Build / 실행 Smoke는 Dockerfile 작성 후 Verify 항목으로 추가할지 Gate에서 결정한다. Executor는 Docker Desktop을 사용한 Local Smoke 결과를 verification에 기록한다.
- 이후 Task에서 결정 / 수행하기로 기록된 항목(AWS Resource, IAM, CI / CD 변경, MySQL 8.4 Local 전환)은 `human_decisions_needed`로 보고하지 않는다.
- 완료 반영(TASK-024 DONE / TASK-025 READY / AGENTS.md 3절)은 마지막 Run의 PR에 포함한다.

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
