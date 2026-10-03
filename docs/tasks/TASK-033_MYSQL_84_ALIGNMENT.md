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
