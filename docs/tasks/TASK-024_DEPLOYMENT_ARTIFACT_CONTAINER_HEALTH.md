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

## Human 결정 (2026-10-03, Gate C — Run 1 HUMAN_REQUIRED 후)

Run 1(`2026-10-03T02-43-14-183Z-371baba4`)에서 Codex가 Gate C 제안(`docs/14-DEPLOYMENT-ARTIFACT.md`)을 작성했고 Claude Review는 기술적 결함 없음 / HUMAN_REQUIRED였다(초안 Commit `2b94ab0`). Review H-003(MySQL 통합 Test 미실행 가능성)은 Claude 세션이 결과 파일로 확인했다: `MySqlIntegrationTests` 5개 실행, skipped 0. SKIPPED 1건은 CI 전용 `DockerAvailabilityTests`다. Human이 권장안을 모두 승인했다.

1. **Health 전략 A**: `spring-boot-starter-actuator`를 추가한다(Spring Boot BOM 관리, Version 미지정). health만 노출하고 상세 / component는 숨긴다. ALB는 `/actuator/health/readiness`(readinessState + db, DB 장애 시 503), ECS Container 점검은 `/actuator/health/liveness`(DB 제외)를 사용한다. 다른 Actuator Endpoint는 노출하지 않는다.
2. **Base Image**: `eclipse-temurin:21-jre-jammy`를 digest로 고정한다. Claude 세션 확인(2026-10-03, `docker buildx imagetools inspect`): linux/amd64 manifest `sha256:8c2dddf1bb2a8455160f4e23080059de5003eddc5cb839130b177c6be0c2cfe0`, image version `21.0.12.1_1-jre-jammy`, `/usr/bin/curl` 포함, 기본 사용자 root(UID 0). Dockerfile에서 numeric UID 10001로 실행한다. Dockerfile의 `RUNTIME_IMAGE` 기본값은 이 `repository@sha256` 형식으로 두며 mutable tag를 기본값으로 쓰지 않는다. Container probe는 image에 포함된 curl을 사용하고 package를 추가 설치하지 않는다.
3. **digest 교체 정책**: 자동 갱신하지 않는다. 보안 패치 등 교체는 별도 PR과 Human 승인으로 한다.
4. **Health 계약 취급**: DEC-024 업무 API 계약과 별개의 운영 Endpoint다. `contracts/`와 `docs/05-API_SPEC.md`는 변경하지 않는다. `docs/14`에 문서화하고 Backend Test로 고정한다(live 200, ready 200, DB 장애 시 ready 503 / live 200, 상세 비노출).
5. **Container Smoke를 Verify에 포함**: `scripts/container-smoke.sh`를 새로 만든다. Orchestrator Verify가 Sandbox 밖에서 실행한다.
6. **JAR 이름 고정**(Review I-002): `backend/build.gradle`에서 bootJar 산출 파일 이름을 Version과 무관하게 `app.jar`로 고정하고 Dockerfile / .dockerignore가 이 이름을 사용한다.
7. 새 Decision은 최신 번호 다음(DEC-028)으로 `docs/09-DECISIONS.md`에 Human Approved(2026-10-03)로 기록한다.

Contract 변경(Claude 세션): 허용에 `backend/build.gradle`, `scripts/container-smoke.sh` 추가. 금지는 `scripts/` 전체 대신 `scripts/orchestrator/`, `scripts/verify.sh`, `scripts/verify.ps1`로 조정하고 `docs/05-API_SPEC.md`를 추가했다. Verify에 `bash scripts/container-smoke.sh`를 추가했다.

### Run 2 Codex 작업 범위

1. `backend/build.gradle`: Actuator 의존성 1줄, bootJar 파일 이름 고정. 그 외 Dependency / Plugin / Version은 바꾸지 않는다.
2. `backend/src/main/resources/application.properties`와 필요한 최소 Source: Health 노출 / probe / group / 상세 비노출 설정. Spring Boot 4.1.1의 실제 속성 이름과 동작을 Test로 검증한다.
3. `backend/src/test/`: 위 4번의 회귀 Test. 기존 Test / 계약 Test(DEC-024) / MySQL 통합 Test(DEC-023)를 깨지 않는다.
4. `backend/Dockerfile`, `backend/.dockerignore`: 승인된 digest, non-root, JAR 하나만 복사, Secret 미포함.
5. `scripts/container-smoke.sh` (bash, Git Bash on Windows와 Linux에서 동작, `set -euo pipefail`):
   - Executor Sandbox는 Docker에 접근할 수 없다(Run 1 확인). Script는 Orchestrator Verify가 실행하므로 **직접 실행해 보지 못한 채 작성한다는 점을 감안해 단순하고 방어적으로** 쓴다. 실패 시 원인을 알 수 있게 단계 이름과 Container Log 마지막 부분을 출력한다.
   - Verify 순서상 `scripts/verify.sh`가 먼저 실행되어 `backend/build/libs/app.jar`가 존재한다. 없으면 명확한 오류로 종료한다.
   - 단계: Image Build(linux/amd64) → 전용 Docker network에 `mysql:8.0.46`(DEC-023)과 앱 Container 실행(0.5 CPU / 1 GiB 제한, read-only root + `/tmp` tmpfs) → readiness / liveness 200 대기(Timeout 포함) → MySQL Container 정지 후 readiness 503 / liveness 200 확인 → 실행 사용자 UID가 0이 아님, Image에 `.env` 계열 파일 없음, OCI revision label 확인 → 종료 시 trap으로 Container / network 정리.
   - DB 접속 값은 Script 안에서 무작위로 만든 일회용 값을 환경변수 파일(임시 디렉터리, 종료 시 삭제)로 전달한다. 고정 비밀번호 문자열을 Source에 쓰지 않는다. Orchestrator Secret 검사 오탐을 피하도록 `password` / `token` / `secret` 바로 뒤에 `:` 또는 `=`와 값이 오는 표기를 Script / 문서에 쓰지 않는다(변수 참조는 가능한 한 다른 이름을 사용).
   - 호스트 Port는 고정값 충돌을 피한다(임의 Port 또는 Container 내부 `docker exec ... curl` 사용 권장).
   - Working Tree를 변경하지 않는다(산출물은 gitignore 경로 또는 임시 디렉터리).
   - Windows Git Bash의 경로 변환(MSYS)으로 `docker` 인자가 깨지지 않게 한다.
6. `docs/14-DEPLOYMENT-ARTIFACT.md`를 확정 내용으로 갱신하고 DEC-028을 기록한다. 07 / 08 / AGENTS.md 3절을 맞춘다. Review I-003(`prompts/README.md` 42 ~ 47 누락 행)을 채운다.
7. 완료 반영(TASK-024 DONE / TASK-025 READY / AGENTS.md 3절)을 이 Run의 PR에 포함한다. Local Smoke 실측값(startup 시간 등)은 Orchestrator Verify Log 기준으로 Claude 세션이 Merge 전후에 WORK_LOG에 보완할 수 있다.

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
