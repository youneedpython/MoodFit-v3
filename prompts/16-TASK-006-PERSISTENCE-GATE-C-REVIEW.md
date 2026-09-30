# Prompt 16 — TASK-006 Persistence Gate C Review

## 목적

TASK-006 Backend Domain / API Core 구현 전에
Check-in 저장에 필요한 Persistence Dependency, Test DB 전략, DB Schema를 검토하고
Gate C Human Approval을 받는다.

## 실행 단계

TASK-006 READY
→ Human 실행 지시
→ TASK-006 IN_PROGRESS
→ Gate C Persistence Review (이 문서)
→ Human Approval
→ 구현

## 사용 Context

AGENTS.md

docs/05-API_SPEC.md
docs/07-TASKS.md
docs/09-DECISIONS.md (DEC-005, DEC-006, DEC-007, DEC-008, DEC-009, DEC-014, DEC-016)

backend/build.gradle
backend/src/main/resources/application.properties
.env.example

Spring Boot 4.1.1 `spring-boot-dependencies` BOM

## 실제 Prompt

```text
실행!
```

Human이 TASK-006 실행을 지시했다.
Persistence Dependency와 DB Schema는 승인되지 않았으므로, 구현 전에 Gate C Review를 먼저 수행한다.

이번 단계에서는 다음을 수행하지 않는다.

- `build.gradle` 수정
- Entity / Repository / Service 구현
- DB Schema 파일 생성
- git commit / git push

## 1. 결정해야 할 항목

| # | 항목 | 이유 |
|---|---|---|
| 1 | Persistence 기술 | DEC-016에서 Spring Data JPA를 TASK-001 제외 항목으로 두고 "Backend Core 시점에 Gate C 검토"로 남겼다. |
| 2 | Runtime DB Driver | DEC-008에서 MySQL(3306)을 Local 개발 DB로 정했지만 Driver는 미승인이다. |
| 3 | Test DB 전략 | DEC-009에서 Repository / DB Integration Test가 필요해지면 Test DB 전략을 다시 결정하기로 했다. |
| 4 | Schema 관리 방식 | DEC-016에서 Database Migration Tool을 "DB Schema 변경 단계에서 Gate C 검토"로 남겼다. |
| 5 | DB Schema | AGENTS.md 5절: DB Schema 주요 구조는 Human Approval 대상이다. |
| 6 | Recommendation 저장 방식 | DEC-005에서 "정확한 JPA Mapping 방식은 Domain 구현 전에 검토"로 남겼다. |
| 7 | 구현 세부 정책 | 기록 시각, History 기간 계산, 정렬, Temperature 정밀도 |

## 2. Spring Boot 4.1.1 BOM 확인 결과

모든 후보는 Spring Boot 4.1.1 Dependency Management가 관리한다. Version을 직접 지정하지 않는다.

| Artifact | 관리 Version | 비고 |
|---|---|---|
| `spring-boot-starter-data-jpa` | Boot 관리 | Hibernate ORM `7.4.5.Final` |
| `spring-boot-starter-data-jpa-test` | Boot 관리 | Boot 4 기술별 Test Starter (`@DataJpaTest`) |
| `spring-boot-starter-flyway` | Boot 관리 | Flyway `12.4.0` |
| `org.flywaydb:flyway-mysql` | Boot 관리 | Flyway의 MySQL 지원 Module |
| `com.mysql:mysql-connector-j` | `9.7.0` | MySQL JDBC Driver |
| `com.h2database:h2` | `2.4.240` | In-memory Test DB |
| Testcontainers | `2.0.5` | 대안 비교용 (추천안 아님) |

## 3. 선택지

### 3.1 Persistence 기술

| Option | 설명 | 장점 | 단점 |
|---|---|---|---|
| **P1 Spring Data JPA (추천)** | Entity + Repository | DEC-005가 JPA Mapping을 전제로 작성됨, 교육 자료 풍부, Repository Test 지원 | ORM 개념 학습 필요 |
| P2 Spring JDBC (`JdbcClient`) | SQL 직접 작성 | 동작이 명시적, 의존성 적음 | Mapping 코드 직접 작성, DEC-005 전제와 다름 |

### 3.2 Test DB 전략

| Option | 설명 | 장점 | 단점 |
|---|---|---|---|
| **T1 H2 In-memory (추천)** | Test에서만 H2 (MySQL 호환 Mode) 사용 | DEC-009(CI에서 MySQL Container 미사용) 유지, Local Verification / CI 변경 없음, 빠름 | MySQL과 SQL 방언 차이 가능성 |
| T2 Testcontainers MySQL | Test에서 Docker로 실제 MySQL 실행 | 실제 DB와 동일 | Docker 필요, CI 시간 증가, DEC-009 취지와 충돌 |
| T3 Repository Mock | DB 없이 Service만 Test | 가장 빠름 | 저장 / 조회 Query를 검증하지 못함 |

T1의 방언 차이는 Schema를 단순한 표준 SQL 타입으로 제한해 줄인다. 실제 MySQL 검증이 필요해지면 TASK-011 Verification Hardening에서 T2를 Gate C로 재검토한다.

### 3.3 Schema 관리 방식

| Option | 설명 | 장점 | 단점 |
|---|---|---|---|
| **S1 Flyway + `ddl-auto=validate` (추천)** | `V1__create_checkin_tables.sql`로 Schema를 명시, Hibernate는 검증만 | Schema가 Review 가능한 파일로 남음 (Harness 원칙과 일치), 변경 이력 관리 | Dependency 2개 추가 |
| S2 Hibernate `ddl-auto=update` | Entity로부터 자동 생성 | 가장 단순 | Schema가 코드에 숨음, 실제 DB에서 위험, Review 불가 |

### 3.4 Recommendation 저장 방식 (DEC-005)

| Option | 설명 | 장점 | 단점 |
|---|---|---|---|
| **R1 `@ElementCollection` (추천)** | Food / Music을 Check-in에 종속된 값 Collection으로 저장, `@OrderColumn`으로 순서 유지 | DEC-005 "독립 Aggregate로 설계하지 않는다"와 정확히 일치, 별도 Repository 없음 | Item 단독 조회 불가 (필요 없음) |
| R2 `@OneToMany` 별도 Entity | Recommendation Entity + cascade | 확장 쉬움 | 독립 Entity가 생겨 DEC-005 취지와 다름 |
| R3 JSON Column | Check-in 행에 JSON으로 저장 | Table 1개 | H2 / MySQL JSON 차이, 검증 어려움 |

## 4. DB Schema 초안 (추천안 기준)

단일 사용자(DEC-007)이므로 `user_id`는 두지 않는다.
분석 결과와 Recommendation은 Check-in 생성 시 함께 생성해 저장한다(API Spec 7절).

```sql
CREATE TABLE wellness_checkin (
    id               BIGINT        NOT NULL AUTO_INCREMENT,
    recorded_at      DATETIME(6)   NOT NULL,   -- UTC 기준 Instant (DEC-006)
    heart_rate       INT           NOT NULL,
    respiratory_rate INT           NOT NULL,
    sleep_score      INT           NOT NULL,
    stress_level     INT           NOT NULL,
    energy_level     INT           NOT NULL,
    temperature      DECIMAL(3,1)  NOT NULL,   -- -30.0 ~ 50.0
    weather          VARCHAR(10)   NOT NULL,   -- CLEAR / CLOUDY / RAIN / SNOW
    wellness_score   INT           NOT NULL,
    mood             VARCHAR(20)   NOT NULL,   -- TIRED / ENERGETIC / CALM / BALANCED
    summary          VARCHAR(500)  NOT NULL,
    PRIMARY KEY (id)
);
CREATE INDEX idx_wellness_checkin_recorded_at ON wellness_checkin (recorded_at);

CREATE TABLE checkin_food_recommendation (
    checkin_id BIGINT        NOT NULL,
    position   INT           NOT NULL,        -- 0: Mood Item, 1: Context Item (DEC-014)
    name       VARCHAR(100)  NOT NULL,
    tag        VARCHAR(50)   NOT NULL,
    reason     VARCHAR(300)  NOT NULL,
    PRIMARY KEY (checkin_id, position),
    FOREIGN KEY (checkin_id) REFERENCES wellness_checkin (id)
);

CREATE TABLE checkin_music_recommendation (
    checkin_id BIGINT        NOT NULL,
    position   INT           NOT NULL,
    title      VARCHAR(100)  NOT NULL,
    artist     VARCHAR(100)  NOT NULL,
    tag        VARCHAR(50)   NOT NULL,
    reason     VARCHAR(300)  NOT NULL,
    PRIMARY KEY (checkin_id, position),
    FOREIGN KEY (checkin_id) REFERENCES wellness_checkin (id)
);
```

- `recorded_at`은 MySQL `TIMESTAMP`(2038년까지만 표현)가 아닌 `DATETIME(6)`을 사용하고, 값은 항상 UTC로 저장한다.
- Mood label은 저장하지 않는다. `mood` code로부터 DEC-014 표에 따라 응답 시 변환한다.
- Recommendation 문구는 생성 시점 값 그대로 저장한다. 이후 DEC-014 문구가 바뀌어도 과거 기록은 그대로 유지된다.

## 5. 구현 세부 정책 (추천안)

| 항목 | 추천 정책 | 비고 |
|---|---|---|
| 기록 시각 | 서버가 저장 시점의 `Instant`를 기록한다. 주입 가능한 `Clock` Bean을 사용해 Test에서 시각을 고정한다. | API Request에 시각 필드 없음 |
| Latest 조회 | `recorded_at`이 가장 늦은 1건. 같으면 `id`가 큰 것 | 기록 없으면 기존대로 `404 CHECKIN_NOT_FOUND` |
| History 기간 | 현재 시각 기준 최근 `days × 24시간` (Rolling Window) | 달력 날짜 경계는 사용자 Timezone이 필요해 MVP에서 제외 |
| History 정렬 | `recorded_at` 오름차순 (오래된 → 최신) | Trend 표시 순서와 일치. **API Spec에 명시 필요** |
| Temperature 정밀도 | 소수 첫째 자리까지 허용 (`@Digits(integer = 2, fraction = 1)`) | 현재는 `19.25`도 허용되어 저장 시 반올림될 수 있음. **API Contract 변경** |
| Rule 구현 위치 | `WellnessRulePolicy` 한 곳에 DEC-014 threshold / weight / 문구 표를 둔다. | DEC-014 결정 사항 |
| DB 접속 정보 | `DB_URL`, `DB_USERNAME`, `DB_PASSWORD` 환경변수 (DEC-008) | 실제 값은 Commit하지 않는다 |

## 6. 영향 범위

- `backend/build.gradle`: Dependency 6개 추가 (아래 7절)
- `backend/src/main/resources/application.properties`: Datasource(환경변수), JPA `validate`, Flyway 설정
- Test Resource: H2 (MySQL Mode) 설정
- `backend/src/main/resources/db/migration/V1__create_checkin_tables.sql` 생성
- Local Verification / CI: **변경 없음**. Test는 H2로 실행되며 외부 MySQL이 필요 없다.
- Local에서 Backend를 실행(`bootRun`)할 때는 MySQL과 DB 환경변수가 필요해진다.
- `docs/05-API_SPEC.md`: History 정렬 명시, Temperature 소수 첫째 자리 제한 (승인 시)

## 7. Codex / Claude 추천안 요약

```text
Persistence : P1 Spring Data JPA
Test DB     : T1 H2 In-memory (MySQL Mode), Test 전용
Schema      : S1 Flyway + ddl-auto=validate
Recommendation 저장 : R1 @ElementCollection + @OrderColumn
```

추가 Dependency (모두 Spring Boot 4.1.1 BOM 관리, Version 직접 지정 없음):

```text
implementation      org.springframework.boot:spring-boot-starter-data-jpa
implementation      org.springframework.boot:spring-boot-starter-flyway
runtimeOnly         org.flywaydb:flyway-mysql
runtimeOnly         com.mysql:mysql-connector-j
testRuntimeOnly     com.h2database:h2
testImplementation  org.springframework.boot:spring-boot-starter-data-jpa-test
```

## Gate C Human Approval 필요 항목

1. Persistence / Test DB / Schema 관리 / Recommendation 저장 방식 (7절 추천안)
2. 추가 Dependency 6개
3. DB Schema 초안 (4절)
4. 구현 세부 정책 (5절), 특히 API Contract 변경 2건
   - History 응답 정렬: `recorded_at` 오름차순 명시
   - Temperature: 소수 첫째 자리까지만 허용

## Human Approval

완료.

TASK-006 Persistence Gate C Human Review를 통해 다음 사항이 승인되었다.

- Spring Data JPA 사용
- H2 In-memory Test DB와 MySQL Compatibility Mode
- Flyway 기반 Schema 관리와 Hibernate `ddl-auto=validate`
- `V1__create_checkin_tables.sql` 초기 Schema
- Food / Music Recommendation의 `@ElementCollection`, `@Embeddable`, `@OrderColumn(position)` 저장 방식
- Spring Boot 4.1.1 Dependency Management 기반 Persistence Dependency 6개
- `wellness_checkin`, `checkin_food_recommendation`, `checkin_music_recommendation` Table 구조
- `recorded_at` MySQL `DATETIME(6)`와 UTC `Instant` 변환 정책
- History `days × 24시간` Rolling Window와 `recorded_at ASC` 정렬
- Temperature 소수 첫째 자리 제한과 DB `DECIMAL(3,1)`
- 주입 가능한 `java.time.Clock`
- 기존 Local Verification / CI Workflow 변경 없음

승인 결과는 `docs/09-DECISIONS.md` DEC-019에 기록한다.

## 상태

Gate C Review 완료 / Human Approved

## Related Commit

e89ca5e
