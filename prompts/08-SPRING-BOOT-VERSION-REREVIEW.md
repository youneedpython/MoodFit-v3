# Prompt 08 — Spring Boot Version Re-review

## 목적

TASK-001 실행 전에
Spring Boot 3.5.16의 OSS Support 종료 영향을 확인하고
Spring Boot 4.1.x 전환 여부를 Human Review한다.

## 실행 단계

TASK-001 Preflight
→ Spring Boot Version Re-review
→ Human Approval

## 사용 Context

AGENTS.md

docs/06-PLAN.md
docs/07-TASKS.md
docs/09-DECISIONS.md
prompts/07-PRE-BOOTSTRAP-SYNC.md

## 실제 Prompt

아래 내용을 이번 작업의 실행 지시사항으로 사용했다.

---
현재 TASK-001 Project Bootstrap 실행 직전이다.

새로운 Human Review 이슈가 발견되었다.

현재 DEC-015에서는 Spring Boot 3.5.16을 승인했지만,
Spring Boot 3.5.16은 Spring 공식 안내 기준
3.5.x의 마지막 OSS release이며
OSS support가 종료된 상태다.

Spring 공식 안내에서는 OSS support를 계속 받기 위해
Spring Boot 4.0.x 또는 4.1.x 업그레이드를 권장하고 있다.

따라서 TASK-001 실행 전에
Spring Boot Version 결정을 재검토한다.

이번 작업에서는 Project Bootstrap을 실행하지 마.

요구사항:

1. prompts/08-SPRING-BOOT-VERSION-REREVIEW.md를 생성한다.
2. docs/07-TASKS.md의 TASK-001을 READY에서 BLOCKED로 변경한다.
3. BLOCKED 이유는 Spring Boot Version Re-review Human Approval 대기로 기록한다.
4. Spring 공식 Source를 우선 사용해 Spring Boot 3.5.16과 4.1.x를 비교한다.
5. DEC-015 / DEC-016 및 관련 문서 영향 범위를 정리한다.
6. DEC-015, DEC-016은 아직 수정하지 않는다.
7. Project Bootstrap은 실행하지 않는다.
8. git commit 또는 git push를 수행하지 않는다.
---

## 기대 산출물

- Spring Boot 3.5.16 OSS Support 상태 확인
- Spring Boot 4.1.x Stable Version 확인
- Spring Boot 3.5.16과 4.1.x 비교
- Starter / Test / Jackson / Jakarta EE 영향 분석
- DEC-015 / DEC-016 영향 정리
- Option A / Option B 판단 자료
- Human Approval 요청

Project Bootstrap은 실행하지 않는다.

## 공식 Source

조사 기준 날짜:

```text
2026-09-28
```

확인한 공식 Source:

- Spring Blog: Spring Boot 3.5.16 available now
- Spring Boot 4.1.1 Documentation Overview
- Spring Boot 4.1.1 System Requirements
- Spring Boot 4.1.1 Gradle Plugin Documentation
- Spring Boot 4.1.1 Managed Dependency Coordinates
- Spring Boot 4.0 Migration Guide
- Spring Boot 4.0 Testing Reference
- Spring Boot 3.5.16 System Requirements
- Spring Boot 3.5.16 Managed Dependency Coordinates

## 조사 결과 요약

Spring 공식 Blog는 Spring Boot 3.5.16을 3.5.x generation의 마지막 OSS release로 안내하며,
OSS support를 계속 받기 위해 Spring Boot 4.0.x 또는 4.1.x로 업그레이드하라고 안내한다.

Spring Boot 현재 Stable 문서는 Spring Boot 4.1.1을 최신 Stable로 안내한다.

Spring Boot 4.1.1은 최소 Java 17을 요구하고 Java 26까지 호환된다고 안내한다.
따라서 MoodFit v3의 Java 21 정책과 충돌하지 않는다.

Spring Boot 4.1.1 Gradle Plugin은 Gradle 8.x 중 8.14 이상 또는 9.x를 요구한다.
현재 승인된 Gradle Wrapper 8.14.5는 이 요구사항을 충족한다.

Spring Boot 4.x는 Spring Framework 7 계열, Jakarta EE 11, Servlet 6.1, Tomcat 11 계열,
Hibernate Validator 9 계열, JUnit 6 계열로 이동한다.
Jackson은 Boot 4.1.1 managed dependency table에서 `tools.jackson.*` 3.1.5와
`com.fasterxml.jackson.*` 2.21.5가 모두 확인되므로,
MoodFit에서 어떤 starter/JSON stack을 채택할지 Human Review에서 함께 확인해야 한다.

## 3.5.16과 4.1.x 비교

| 항목 | Spring Boot 3.5.16 | Spring Boot 4.1.x | MoodFit 영향 |
|---|---|---|---|
| OSS Support | 3.5.x 마지막 OSS release | 현재 Stable 4.1.1 | 장기 OSS 지원 관점에서는 4.1.x가 유리 |
| Java 21 | Java 17 이상, Java 25까지 호환 | Java 17 이상, Java 26까지 호환 | Java 21 사용은 양쪽 모두 가능 |
| Gradle 8.14.5 | Gradle 7.6.4+ 또는 8.4+ | Gradle 8.14+ 또는 9.x | 승인된 Gradle 8.14.5는 4.1.x에서도 사용 가능 |
| Spring Framework | 6.2.19 이상 | 7.0.9 이상 | Framework major 변경으로 API/문서 차이 증가 |
| Jakarta EE | Jakarta EE 10 계열로 판단 | Jakarta EE 11 계열 | Servlet/Validation 등 Jakarta API baseline 상승 |
| Servlet | Servlet 6.0 | Servlet 6.1 | Web layer baseline 변경 |
| Tomcat | Tomcat 10.1 | Tomcat 11 | 내장 Servlet Container major 변경 |
| Jackson | Jackson 2.21.x | Jackson 3.1.x 및 Jackson 2.21.x managed coordinates 공존 | JSON starter 선택과 직렬화 모듈 호환성 확인 필요 |
| Validation | Hibernate Validator 8 계열 | Hibernate Validator 9 계열 | Bean Validation 사용 자체는 유지되나 baseline 상승 |
| JUnit/Test | JUnit Jupiter 5 계열 | JUnit 6 계열 | Test starter와 JUnit major 변경 영향 |
| Starter 구조 | 기존 starter 구조 | Modular starter 구조, technology별 test starter 권장 | `spring-boot-starter-web` 사용 정책 재검토 필요 |
| API Compatibility | Boot 3.x 생태계와 예제 풍부 | Boot 4.x major migration 필요 | 신규 프로젝트라 migration 부담은 낮지만 학습 난이도 상승 |
| 교육 난이도 | 예제와 자료가 많고 안정적 | 최신 구조를 배워야 함 | 교육 환경 재현성은 좋지만 자료 선택이 중요 |
| 향후 유지보수 | OSS support 종료 상태 | OSS support 지속 | 장기 유지보수는 4.1.x가 유리 |

## Starter 영향 분석

현재 DEC-016 승인 Dependency:

```text
spring-boot-starter-web
spring-boot-starter-validation
spring-boot-starter-test
```

Spring Boot 4.1.x 전환 시 검토 후보:

- `spring-boot-starter-web`
  - Boot 4 문서에서는 `spring-boot-starter-web`이 존재하지만 deprecated starter로 분류되고,
    Spring Web MVC에는 `spring-boot-starter-webmvc` 사용을 권장한다.
  - 신규 프로젝트인 MoodFit v3에서는 `spring-boot-starter-webmvc`로 시작하는 대안이 자연스럽다.

- `spring-boot-starter-validation`
  - Boot 4.1.1 managed coordinates에 존재한다.
  - Jakarta Validation starter로 계속 사용할 수 있다.
  - 필요 시 test companion인 `spring-boot-starter-validation-test`를 별도 검토할 수 있다.

- `spring-boot-starter-test`
  - Boot 4.1.1 managed coordinates에 존재한다.
  - 다만 Boot 4 migration guide는 technology별 test starter를 권장한다.
  - Spring MVC test가 필요하면 `spring-boot-starter-webmvc-test` 추가 또는 대체 여부를 검토해야 한다.

## 주요 Migration 영향

- Spring Framework 7: Framework major 변경으로 일부 API, annotation processing, auto-configuration 관련 차이가 생길 수 있다.
- Jakarta EE 11: Jakarta API baseline이 올라가며 Servlet/Validation 등 하위 API 버전이 달라진다.
- Servlet 6.1 / Tomcat 11: Web stack의 container baseline이 변경된다.
- Jackson: Boot 4.1.1은 Jackson 3 coordinates를 관리하지만 Jackson 2 coordinates도 함께 관리한다. Bootstrap starter 선택 시 실제 classpath와 JSON module 정책을 확인해야 한다.
- Hibernate Validator 9: Validation starter는 유지되지만 Jakarta Validation baseline이 달라진다.
- JUnit 6: 기존 JUnit 5 자료와 차이가 생길 수 있다.
- Starter modularization: Boot 4는 technology별 starter와 test starter 구조를 더 명확히 사용한다.
- Package/API 변경: Spring Boot module package 구조와 일부 auto-configuration import 경로가 달라질 수 있다.
- Auto Configuration 변화: Boot 4 modularization으로 필요한 starter를 명시적으로 고르는 방향이 강해진다.

## MoodFit v3 선택지

### Option A — Spring Boot 3.5.16 유지

장점:

- 기존 DEC-015 / DEC-016을 유지할 수 있다.
- Boot 3.x 예제와 교육 자료가 풍부하다.
- Jackson 2, JUnit 5, Tomcat 10.1 기반이라 변화 리스크가 낮다.

단점:

- 3.5.x OSS support가 종료되었다.
- 신규 프로젝트가 곧바로 지원 종료 라인에서 시작한다.
- 향후 유지보수와 보안 대응 측면에서 불리하다.

구현 영향:

- TASK-001 계획 변경이 가장 적다.
- 기존 `spring-boot-starter-web`, `spring-boot-starter-test` 정책을 유지할 수 있다.

### Option B — Spring Boot 4.1.x 전환

장점:

- 현재 Stable 4.1.x와 OSS support 흐름을 따른다.
- 아직 Bootstrap 전이므로 기존 코드 migration 부담이 거의 없다.
- 장기 유지보수와 교육용 최신성 측면에서 유리하다.

단점:

- Spring Framework 7, Jakarta EE 11, Jackson 3, JUnit 6, Tomcat 11 등 주요 baseline이 바뀐다.
- Boot 4 starter modularization을 반영해야 한다.
- 교육 자료와 예제 선택 시 Boot 3.x와 Boot 4.x 차이를 구분해야 한다.

구현 영향:

- DEC-015의 Spring Boot Version과 Spring Boot Plugin Version 수정이 필요하다.
- DEC-016의 Backend Bootstrap Starter Set 수정이 필요할 수 있다.
- `spring-boot-starter-web` 대신 `spring-boot-starter-webmvc` 사용 여부를 승인해야 한다.
- Spring MVC test 범위를 위해 `spring-boot-starter-webmvc-test` 사용 여부를 승인해야 한다.

## DEC 영향

Spring Boot 4.1.x 전환 시 수정 후보:

DEC-015:

- Spring Boot Version
- Spring Boot Plugin Version
- 필요 시 Gradle Compatibility 설명

DEC-016:

- `org.springframework.boot` Gradle Plugin Version
- `spring-boot-starter-web` → `spring-boot-starter-webmvc` 변경 여부
- `spring-boot-starter-test` 유지 여부
- `spring-boot-starter-webmvc-test` 추가 여부
- Spring Boot dependency management 기준 Version 변경

관련 문서 영향:

- docs/04-ARCHITECTURE.md
  - Backend 기술 Version과 starter 정책이 변경될 수 있다.
- docs/06-PLAN.md
  - Gate A 승인 결과가 변경되므로 최소 동기화가 필요할 수 있다.
- docs/07-TASKS.md
  - TASK-001 승인 기술 Version, Dependency Set, Verification 기준 변경이 필요할 수 있다.

## 추천안

Codex는 최종 결정을 확정하지 않는다.

추천 방향:

Spring 공식 OSS support 기준을 우선한다면
MoodFit v3는 아직 Bootstrap 전인 신규 프로젝트이므로
Spring Boot 4.1.x 전환을 Human Review 대상으로 승인 검토하는 것이 합리적이다.

단, 전환 승인 시에는 단순 Version 변경이 아니라
DEC-016의 starter set도 함께 재승인해야 한다.

특히 다음 항목은 Human Approval이 필요하다.

- Spring Boot 4.1.1 전환 여부
- `org.springframework.boot` Gradle Plugin 4.1.1 전환 여부
- Gradle Wrapper 8.14.5 유지 여부
- `spring-boot-starter-webmvc` 사용 여부
- `spring-boot-starter-web` 제외 여부
- `spring-boot-starter-test` 유지 여부
- `spring-boot-starter-webmvc-test` 추가 여부
- Jackson 3 사용 여부 또는 Boot 4.1.1의 Jackson 2 compatibility path 유지 여부
- JUnit 6 / Tomcat 11 baseline 수용 여부

## Human Approval

필수.

Human Approval 전에는 DEC-015와 DEC-016을 수정하지 않는다.
Human Approval 전에는 TASK-001 Project Bootstrap을 실행하지 않는다.

## Human Approval 결과

Spring Boot Version Re-review에 대한 Human Review 결과,
MoodFit v3는 Spring Boot `4.1.1`로 전환하는 것을 승인했다.

승인된 Backend 기술:

- Java 21
- Spring Boot 4.1.1
- org.springframework.boot Gradle Plugin 4.1.1
- Gradle Wrapper 8.14.5 유지
- io.spring.dependency-management Plugin 1.1.7

승인된 Backend Starter Set:

- `spring-boot-starter-webmvc`
- `spring-boot-starter-validation`
- `spring-boot-starter-webmvc-test`

제외된 Backend Starter:

- `spring-boot-starter-web`
  - Spring Boot 4에서 deprecated이므로 TASK-001에서 사용하지 않는다.
- `spring-boot-starter-test`
  - `spring-boot-starter-webmvc-test`가 포함하므로 직접 선언하지 않는다.

MoodFit v3는 Spring Boot 4 기본 Baseline을 수용한다.

- Spring Framework 7
- Jakarta EE 11
- Servlet 6.1
- Tomcat 11
- Hibernate Validator 9
- Jackson 3 기본 Stack
- JUnit 6 기본 Stack

Jackson 2 compatibility path는 TASK-001에서 사용하지 않는다.
향후 실제 호환성 문제가 발생하면 Gate C에서 별도로 검토한다.

## TASK-001 상태 변경 이력

```text
READY
  ↓ Spring Boot Version Re-review 시작
BLOCKED (Spring Boot Version Re-review Human Approval 대기)
  ↓ Spring Boot 4.1.1 전환 Human Approved, DEC-015 / DEC-016 반영
READY
```

TASK-001은 Human Approval 이후 다시 READY 상태가 되었으며,
실행 전 별도 Human 지시가 필요하다.

## 상태

실행 완료 / Human Approved

## Related Commit

Pending
