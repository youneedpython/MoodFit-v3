# TASK-033 — MySQL 8.4 Alignment (Local / Testcontainers / CI)

> 공통 실행 규칙: [COMMON.md](COMMON.md)

## 목적

DEC-027에서 RDS를 MySQL 8.4로 확정했다(8.0은 Extended Support 유료). Local / Testcontainers / CI의 MySQL 기준(DEC-023, `mysql:8.0.46`)을 8.4로 맞춰 개발 / 검증 환경과 배포 환경의 major Version을 일치시킨다. TASK-026(IaC)의 선행 조건이다.

## 초기 상태 / Dependency

- 초기: `BLOCKED`
- 선행: TASK-032 DONE
- 실행: `node scripts/orchestrator/run.mjs TASK-033`

## Human Gate

- DEC-023 변경(Testcontainers Image Version), 대상 minor Version 선택, Local MySQL(개발 PC 설치본) 처리 방식은 Gate C / Human Approval이다.
- JDBC Driver / Flyway / Hibernate Dependency Version 변경이 필요하면 Gate C로 정지한다.

## Codex 작업 범위

1. 영향 조사: Testcontainers Image, `scripts/container-smoke.sh`의 MySQL Image, Flyway Migration, SQL / Schema(DEC-019), JDBC Driver, 인증 Plugin 기본값(`caching_sha2_password`), 8.4에서 제거 / 변경된 설정을 확인한다.
2. 대상 Version 제안: RDS가 제공하는 8.4 minor와 Docker Hub `mysql` 8.4 Tag를 비교해 고정 Tag를 제안한다. (공식 근거는 URL과 조회일을 적고, 확인하지 못한 값은 `확인 필요`로 표시한다. Human Gate에서 Claude 세션이 사실 확인한다)
3. 승인 후 최소 변경으로 Image Version을 바꾸고 전체 Test / Container Smoke를 통과시킨다.
4. Local MySQL(개발 PC의 MySQL 8.0 서비스)은 Agent가 변경하지 않는다. 필요한 Human 작업을 안내 문서로 남긴다.
5. DEC-023 변경 이력 또는 새 Decision을 기록한다.

## Human 결정 (2026-10-03, Gate C 사전 승인) / 실행 기준

Claude 세션이 사실을 미리 확인했고 Human이 아래를 승인했다. 이 Run은 Gate 제안에서 멈추지 않고 구현까지 진행한다.

확인한 사실 (Claude 세션, 2026-10-03):

- RDS for MySQL 8.4의 최신 minor는 8.4.11이다(AWS RDS MySQL versions 문서, 표준 지원 종료 2029-07-31).
- Docker Hub `mysql:8.4.11`이 존재한다(linux/amd64 manifest 확인, `docker buildx imagetools inspect`).
- 저장소의 `8.0.46` 사용처: `backend/src/test/java/com/moodfit/mysql/MySqlIntegrationTests.java`(Image 상수, Version 확인 구문, 주석), `scripts/container-smoke.sh`(단계 이름, Image), `.github/workflows/ci.yml`(Summary 표시 문구 1줄), 문서.

승인된 결정:

1. 대상 Version: **`mysql:8.4.11`** 고정(Tag). RDS 최신 minor와 맞춘다.
2. DEC-023에 변경 이력을 추가하고 새 Decision **DEC-030**(Human Approved, 2026-10-03)으로 기록한다. DEC-027의 "DEC-023 변경은 별도 Decision" 조건을 이 Decision으로 충족한다.
3. `.github/workflows/ci.yml`은 Summary 표시 문구 1줄만 고친다. Job / Step / 명령 / Trigger / 권한 / concurrency는 바꾸지 않는다.
4. 개발 PC의 Local MySQL 8.0 서비스는 Agent가 변경하지 않는다. Test / CI / Container Smoke는 모두 Container를 쓰므로 영향이 없다. 로컬에서 앱을 직접 실행할 때만 8.0을 쓰며, 8.4로 올리는 방법과 주의점을 문서에 안내로 남긴다(Human 선택 사항).
5. Dependency / 운영 Code / Migration 변경이 필요하면 구현하지 않고 `HUMAN_REQUIRED`로 정지한다. `backend/build.gradle`, `backend/src/main/`은 금지 경로다.

Codex 작업 범위 (이 Run):

1. 위 사용처를 `mysql:8.4.11` / `8.4.` 기준으로 바꾼다. Test의 Version 확인 구문도 맞춘다.
2. 8.4 영향 조사 결과를 문서에 기록한다: 인증 Plugin 기본값, 제거 / 변경된 설정, Flyway / JDBC Driver 호환, DEC-019 Schema와 `V1__create_checkin_tables.sql` 영향. 실제 호환 여부는 Orchestrator Verify(전체 Test, Container Smoke)가 판정한다. Executor Sandbox는 Docker에 접근할 수 없다.
3. 문서 갱신: DEC-023 변경 이력, DEC-030, `docs/13` / `docs/14` / README 등 `8.0.46`을 현재 기준으로 적은 곳. 과거 기록(WORK_LOG의 이전 Task 기록, 승인 당시 서술)은 고치지 않는다.
4. 완료 반영: TASK-033 DONE / **TASK-034 READY** / AGENTS.md 3절. `docs/07`의 TASK-026 선행 조건에서 TASK-033을 충족으로 표시한다.
5. 작성 규칙(TASK-034 전까지 유지): Orchestrator Secret 검사 오탐을 피한다. 자격 증명을 뜻하는 단어 바로 뒤에 콜론이나 등호와 값이 오는 표기를 문서 / Script에 새로 쓰지 않는다. `scripts/container-smoke.sh`의 기존 줄은 필요한 부분만 고친다.
6. 이후 Task의 항목(TASK-034, TASK-026)은 `human_decisions_needed`로 보고하지 않는다.

## Verification

- `bash scripts/verify.sh` (MySQL Testcontainers 통합 Test, 계약 Test 포함)
- `bash scripts/container-smoke.sh`
- Remote CI(`frontend` / `backend`)
- `git diff --check`

## Claude Review 기준

- 8.4 비호환 항목 누락 여부, Migration / Schema 영향
- Image Tag 고정과 재현성
- DEC-023 / DEC-027 / DEC-028 기록의 일관성

## 완료 조건

Local 검증과 Remote CI가 MySQL 8.4에서 통과하고 Decision이 Human Approved 되면 REVIEW. 완료 후 TASK-026을 READY로 전환한다.
