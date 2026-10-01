# Prompt 29 — TASK-016 DB 연동 테스트 Gate C Review

## 목적

TASK-016 DB 연동 테스트(실제 MySQL) 구현 전에
DB 연동 방식, 추가 Dependency, CI Database Strategy(DEC-009) 변경, Local Verification 반영 방식을 검토하고
Gate C Human Approval을 받는다.

## 실행 단계

TASK-015 DONE
→ TASK-016 BLOCKED (Gate C 대기)
→ Gate C Review
→ Human Approval 대기

## 사용 Context

AGENTS.md
README.md

docs/07-TASKS.md (TASK-016)
docs/08-WORK_LOG.md (TASK-011 GAP-5 / FU-3)
docs/09-DECISIONS.md (DEC-009, DEC-016, DEC-017, DEC-019, DEC-021)

backend/build.gradle
backend/src/main/resources/application.properties
backend/src/main/resources/db/migration/V1__create_checkin_tables.sql
backend/src/test/resources/application.properties
backend/src/test/java/com/moodfit/repository/WellnessCheckinRepositoryTests.java
.github/workflows/ci.yml

## 실제 Prompt

```text
응, TASK-016 Gate C 검토 자료 작성! 시작!
```

## 조사 기준 날짜

2026-10-01

## 조사한 Source

- Spring Boot 4.1.1 `spring-boot-dependencies` POM (Maven Central): `testcontainers.version` = `2.0.5`, `spring-boot-testcontainers` 관리
- Maven Central: `org.testcontainers:testcontainers-mysql` / `testcontainers-junit-jupiter` 최신 `2.0.5`
- Docker Hub `library/mysql`: `8.0.46`(2026-05-05), `8.4.11`(2026-09-29)
- Local 환경: MySQL Server `8.0.46`, Docker `29.7.2` 설치 (Docker Desktop 미실행 상태)

## 현재 상태

- DEC-009: 초기 CI는 MySQL Service Container를 실행하지 않는다. DB Integration Test가 필요해지면 Test DB 전략을 다시 결정한다.
- Backend Test는 H2 In-memory(`MODE=MySQL`)로 실행한다.
  - Flyway V1과 `ddl-auto=validate`는 H2에서 검증된다.
  - `WellnessCheckinRepositoryTests` 4건: UTC / Microsecond 저장, 추천 순서, Rolling Window 조회, `@EntityGraph` 추가 Query 없음
- 실제 MySQL은 Human의 Local 실행(`bootRun`)으로만 확인되었다. (GAP-5)

H2 `MODE=MySQL`이 실제 MySQL과 다를 수 있는 부분:

| 항목 | 위험 |
|---|---|
| Flyway V1 SQL | MySQL 문법 / 제약조건(FK, Index) 적용 차이 |
| `DATETIME(6)` | Microsecond 정밀도, UTC 변환(DEC-019) 동작 차이 |
| `DECIMAL(3,1)` | 기온 반올림 / 범위 처리 차이 |
| Collation / 문자열 | `utf8mb4` 한글 저장, 길이 제한 처리 차이 |
| `@ElementCollection` / `@EntityGraph` | 실제 Driver에서의 Query / 정렬 동작 차이 |

## 후보 비교

| Option | 방식 | 장점 | 단점 | 새 Dependency | CI 변경 |
|---|---|---|---|---|---|
| A | Testcontainers MySQL | Local / CI가 같은 Test Code와 같은 MySQL Image 사용. Test마다 깨끗한 DB. 별도 DB 준비 불필요 | Docker 필요 (Local은 Docker Desktop 실행 필요). Image Pull / Container 시작 시간 추가 | `spring-boot-testcontainers`, `testcontainers-junit-jupiter`, `testcontainers-mysql` (Version은 Spring Boot BOM 관리) | 없음 (GitHub Ubuntu Runner에 Docker 기본 포함). Summary 문구만 변경 |
| B | GitHub Actions MySQL Service Container | 새 Dependency 없음 | Local은 별도 Test DB(`moodfit_v3_test`) 수동 준비 필요. Local / CI 설정이 달라짐. Test 실행 조건(Profile / 환경변수) 관리 필요 | 없음 | `services: mysql` 추가, DB 환경변수 추가 |
| C | Local MySQL만 사용 | 가장 단순 | CI에서 자동 검증되지 않아 완료 조건("자동 검증") 불충족 | 없음 | 없음 |

## 추천안

### 추천: Option A (Testcontainers MySQL)

1. Dependency (`testImplementation`, Version 미기재 — Spring Boot `4.1.1` BOM 관리)

```groovy
testImplementation 'org.springframework.boot:spring-boot-testcontainers'      // 4.1.1
testImplementation 'org.testcontainers:testcontainers-junit-jupiter'          // 2.0.5
testImplementation 'org.testcontainers:testcontainers-mysql'                  // 2.0.5
```

2. MySQL Image: `mysql:8.0.46` 고정 (Local 개발 MySQL과 동일 Version)
3. Test 구성
   - 기존 H2 Test는 그대로 유지한다. (빠른 Unit / Slice Test)
   - MySQL 연동 Test Class를 별도로 추가하고 `@ServiceConnection`으로 Container에 연결한다.
   - 검증 대상: Flyway V1 적용 + `ddl-auto=validate`, UTC / Microsecond 저장(DEC-019), `DECIMAL(3,1)`, 한글 문자열, 추천 순서, Rolling Window 조회, `@EntityGraph`, API 저장 → 최신 / History 조회 1회 흐름
4. 실행 위치
   - `./gradlew test`에 포함한다. (`verify.ps1` / `verify.sh`, CI 명령 변경 없음)
   - Docker가 없는 Local 환경: MySQL 연동 Test를 건너뛰고(Skipped) Test 결과에 표시한다.
   - CI(`CI=true`): Docker가 없으면 건너뛰지 않고 실패시킨다. (CI에서 조용히 Skip되는 것을 방지)
5. CI
   - `ci.yml` 실행 명령 / Trigger / Permission은 변경하지 않는다.
   - DEC-021 Backend Summary의 "MySQL Service Container 미사용" 문구를 "MySQL: Testcontainers(`mysql:8.0.46`)"로 변경한다. (문구 변경만)
6. 문서
   - DEC-009를 대체하는 새 DEC(CI Database Strategy) 추가
   - DEC-016 / DEC-019 영향: Schema 변경 없음, Test Dependency만 추가 (DEC-019 재검토 결과 변경 없음으로 기록)

이유:

- Local과 CI에서 같은 방식으로 같은 MySQL Version을 검증할 수 있다. (TASK-013의 Local / CI 정렬 방향과 일치)
- Spring Boot BOM이 Version을 관리하므로 별도 Version 고정이 필요 없다.
- CI Workflow 구조를 바꾸지 않는다.

## MySQL Image Version 검토

| 후보 | 장점 | 단점 |
|---|---|---|
| `mysql:8.0.46` (추천) | Local 개발 MySQL(`8.0.46`)과 동일 → Local 실행 결과와 Test 결과가 일치 | MySQL 8.0 계열은 지원 종료 시점이 지난 계열이다 |
| `mysql:8.4.11` (LTS) | 장기 지원 계열 | Local 개발 MySQL과 Version이 달라진다 |

MySQL 8.4 전환은 Local 개발 DB 전환과 함께 별도로 결정하는 것을 제안한다.

## 예상 영향

| 항목 | 예상 |
|---|---|
| CI `backend` Job 시간 | 현재 약 52 ~ 66초 → Image Pull / Container 시작으로 약 30 ~ 60초 증가 예상 (구현 후 실측) |
| Local Verification | Docker Desktop 실행 시 같은 시간 증가. 미실행 시 MySQL 연동 Test Skip |
| Runner OS | 2026-10-19 `ubuntu-latest` → Ubuntu 26 전환(FU-6) 후에도 Docker 기본 포함 예상. 전환 후 CI 결과 확인 필요 |
| Security | Docker Hub 공식 Image만 사용, Secret / PAT 불필요 (Test용 임시 계정은 Testcontainers가 생성) |

## 제외 범위

- 기존 H2 Test 제거 / 변경
- Flyway Migration / DB Schema 변경
- 운영 DB 설정(`application.properties`) 변경
- `ci.yml` Trigger / Permission / Cache 정책 변경
- API 계약 테스트 (TASK-017)

## Human 결정 필요 사항

1. DB 연동 방식: Option A (추천) / B / C
2. MySQL Image: `mysql:8.0.46` (추천) / `mysql:8.4.11`
3. Docker 없는 Local 환경 처리: Skip 후 표시 (추천) / 실패
4. DEC-021 Backend Summary 문구 변경 허용 여부

## Human Approval

```text
1. A
2. mysql:8.0.46
3. 건너뛰고 표시
4. 문구 변경 해도 됨!
```

| 항목 | 결정 |
|---|---|
| DB 연동 방식 | Option A — Testcontainers MySQL |
| MySQL Image | `mysql:8.0.46` |
| Docker 없는 Local 환경 | 건너뛰고(Skipped) 표시 |
| DEC-021 Backend Summary 문구 | 변경 허용 |

승인 결과는 DEC-023으로 기록했다. (DEC-009 대체)

## 상태

Gate C Human Approved

## Related Commit

Pending
