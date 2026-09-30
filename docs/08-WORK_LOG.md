# 08. MoodFit v3 Work Log

## TASK-001 — Project Bootstrap

### 상태

DONE

### 작업 내용

- Frontend Skeleton 생성
- Backend Skeleton 생성
- 승인 Version 및 Dependency 적용
- Local Test / Build 수행

### Frontend Verification

- `node --version`
  - PASS
  - 결과: `v24.21.0`
- `npm --version`
  - PASS
  - 결과: `11.19.0`
- `npm install`
  - PASS
  - 결과: 99 packages installed, 0 vulnerabilities
- `npm test`
  - PASS
  - 결과: 1 test file passed, 1 test passed
- `npm run build`
  - PASS
  - 결과: TypeScript type check 및 Vite production build 성공

### Backend Verification

- `java --version`
  - PASS
  - 결과: `java 21.0.10`
- `gradlew.bat --version`
  - PASS
  - 결과: Gradle 8.14.5, JVM 21.0.10
- `gradlew.bat test`
  - PASS
  - 결과: Spring Boot Application Context Test 성공
- `gradlew.bat build`
  - PASS
  - 결과: Backend build 성공

### Dependency 확인

Frontend:

- 승인된 direct dependency만 `package.json`에 기록했다.
- `react` 19.3.0
- `react-dom` 19.3.0
- `react-router` 8.4.0
- `vite` 8.3.1
- `typescript` 6.0.2
- `@vitejs/plugin-react` 6.1.1
- `vitest` 5.0.2
- `@testing-library/react` 16.3.3
- `@testing-library/dom` 10.4.2
- `jsdom` 30.1.1
- `@types/react` 19.3.0
- `@types/react-dom` 19.3.0
- `@types/node` 24.13.6
- `react-router-dom`, oxlint, ESLint, Prettier는 설치하지 않았다.
- `package-lock.json`을 생성했다.

Backend:

- 승인된 Gradle plugin과 dependency만 `build.gradle`에 기록했다.
- `org.springframework.boot` Gradle Plugin 4.1.1
- `io.spring.dependency-management` Gradle Plugin 1.1.7
- Java Toolchain 21
- `spring-boot-starter-webmvc`
- `spring-boot-starter-validation`
- `spring-boot-starter-webmvc-test`
- `spring-boot-starter-web`은 사용하지 않았다.
- `spring-boot-starter-test`는 직접 선언하지 않았다.
- 외부 MySQL 설정 없이 test/build를 성공했다.

### Secret / Generated File 확인

- 실제 Secret은 작성하지 않았다.
- `.env.example`에는 빈 환경변수 예시만 기록했다.
- `frontend/node_modules/`, `frontend/dist/`, `backend/.gradle/`, `backend/build/`는 Git ignored 상태임을 확인했다.
- Secret 키워드 스캔 결과 실제 비밀값은 발견되지 않았다. 문서의 `tokens.css` 표현과 lock file의 package name만 탐지되었다.

### 오류 및 해결

- 오류: 최초 `npm run build`에서 `vite.config.ts`의 `test` 설정이 Vite `UserConfig` 타입에 없다는 TypeScript 오류가 발생했다.
- 원인: `defineConfig`를 `vite`에서 import하면 Vitest의 `test` 설정 타입이 포함되지 않았다.
- 해결: 승인된 Vitest 범위 안에서 `defineConfig` import를 `vitest/config`로 변경했다.
- 재검증: `npm run build`를 다시 실행해 성공했다.

### Human Review

검토 일자: 2026-09-29

- Frontend / Backend 산출물을 DEC-015, DEC-016 기준으로 재검토했다.
- `package-lock.json`의 Frontend Dependency Version이 승인 Version과 일치함을 확인했다.
- `react-router-dom`이 lock file에 포함되지 않았음을 확인했다.
- Backend runtimeClasspath에서 Spring Boot 4.1.1, Spring Web MVC 7.0.9, Tomcat 11.0.24, Jackson 3.1.5(`tools.jackson`)를 확인했다.
- `gradlew.bat clean build`를 재실행해 성공했다.

Node.js Version 확인:

- Review 시점 Local 환경의 Node.js가 `v24.16.0` / npm `11.13.0`으로 확인되어 DEC-015 승인 Version과 달랐다.
- nodejs.org 공식 `node-v24.21.0-x64.msi`를 SHA256 검증 후 설치했다.
- 설치 후 `node --version` `v24.21.0`, `npm --version` `11.19.0`을 확인했다.
- Node.js 24.21.0 환경에서 `npm ci`, `npm test`, `npm run build`를 재실행해 모두 성공했다.

### 결과

Human Review 완료 / DONE

---

## TASK-002 — Initial Local Verification Harness

### 상태

DONE

### 작업 내용

- `scripts/verify.ps1` 생성
- `scripts/verify.sh` 생성
- Frontend Test / Build 검증 절차 구성
- Backend Test / Build 검증 절차 구성
- 실패 시 종료 코드가 전파되도록 구성

### Verification

- `powershell -ExecutionPolicy Bypass -File .\scripts\verify.ps1`
  - PASS
  - Frontend `npm test` PASS
  - Frontend `npm run build` PASS
  - Backend `gradlew.bat test` PASS
  - Backend `gradlew.bat build` PASS
- `bash scripts/verify.sh`
  - PASS
  - Frontend `npm test` PASS
  - Frontend `npm run build` PASS
  - Backend test PASS
  - Backend build PASS

### 검증 범위

- 초기 Frontend Test / Build를 포함한다.
- 초기 Backend Test / Build를 포함한다.
- 아직 존재하지 않는 Feature Test는 실패 조건으로 강제하지 않는다.
- 외부 MySQL 연결 없이 실행된다.
- 새로운 Dependency는 추가하지 않았다.

### 오류 및 해결

- 오류: 최초 `bash scripts/verify.sh` 실행 시 WSL 계열 Bash 환경에서 Java가 PATH에 없어 Backend Gradle 단계가 실패했다.
- 원인: PowerShell 환경에서는 Java 21이 사용 가능하지만, 해당 Bash 환경에서는 `java` command가 노출되지 않았다.
- 해결: `verify.sh`에서 Java가 없는 Windows Bash/WSL 환경이면 `cmd.exe /C gradlew.bat`를 통해 Windows Java 환경의 Gradle Wrapper를 호출하도록 보완했다.
- 재검증: `bash scripts/verify.sh`를 다시 실행해 성공했다.

### Human Review 보완

Human Review에서 `verify.ps1`의 PowerShell native command 실패 전파 문제가 발견되었다.

보완 내용:

- `$ErrorActionPreference = "Stop"`만으로는 Windows PowerShell 5.1에서 native command의 non-zero exit code를 안정적으로 예외 처리하지 못할 수 있음을 반영했다.
- `Invoke-NativeStep` helper를 추가했다.
- 각 native command 실행 직후 `$LASTEXITCODE`를 명시적으로 확인하도록 수정했다.
- Frontend 검증에서는 `npm.cmd`를 명시적으로 사용하도록 수정했다.
- 실패한 단계가 있으면 즉시 중단하고 `verify.ps1` 자체가 non-zero exit code를 반환하도록 수정했다.
- 모든 단계가 성공한 경우에만 `Local verification passed.`를 출력하도록 유지했다.

재검증 결과:

- `powershell -ExecutionPolicy Bypass -File .\scripts\verify.ps1`
  - PASS
  - Frontend `npm test` PASS
  - Frontend `npm run build` PASS
  - Backend `gradlew.bat test` PASS
  - Backend `gradlew.bat build` PASS
- `bash scripts/verify.sh`
  - PASS
  - 기존 WSL / Windows Bash 보완 경로 유지
  - Frontend Test / Build PASS
  - Backend Test / Build PASS

PowerShell 실패 경로 검증:

- 임시 디렉터리에 non-zero exit code를 반환하는 가짜 `npm.cmd`를 만들었다.
- 해당 임시 디렉터리를 현재 PowerShell Process의 `PATH` 앞에 추가한 뒤 `verify.ps1`을 실행했다.
- Frontend test 단계에서 즉시 실패했다.
- Frontend build / Backend test / Backend build 단계로 진행하지 않았다.
- `verify.ps1` process exit code는 `1`이었다.
- 실패 유도용 임시 디렉터리와 파일은 검증 후 제거했다.
- Repository 파일에는 테스트용 임시 변경을 남기지 않았다.

### Human Review

검토 일자: 2026-09-29

- `verify.ps1`, `verify.sh`의 성공 경로와 실패 경로를 재검증했다.
- `verify.ps1` 성공 경로: exit code `0`
- `verify.ps1` 성공 경로(stdout/stderr pipe 연결): Gradle stderr 경고로 인한 오탐 없이 exit code `0`
- `verify.ps1` 실패 경로: 가짜 `npm.cmd`(exit `7`)로 Frontend test 단계에서 즉시 중단, 이후 단계 미실행, exit code `1`
- `verify.sh` 성공 경로(Git Bash): exit code `0`
- `verify.sh` 실패 경로: 가짜 `npm`(exit `5`)로 첫 단계에서 즉시 중단, 원래 exit code `5` 전파
- 실패 유도용 임시 파일은 검증 후 제거했고 Repository 변경은 없었다.

### 결과

Human Review 완료 / DONE

---

## TASK-003 — Initial GitHub Actions CI

### 상태

DONE

### 작업 내용

- TASK-003 시작
- DEC-017 기준 GitHub Actions CI 구성 사용
- `.github/workflows/ci.yml` 생성
- Frontend CI Job 구성
- Backend CI Job 구성
- Cache 미사용 정책 반영
- MySQL Service Container 미사용 정책 반영

### Workflow 구성

- Workflow name: `CI`
- Workflow path: `.github/workflows/ci.yml`
- Trigger: `push` to `main`, `pull_request` to `main`
- Permissions: `contents: read`
- Runner: `ubuntu-latest`
- Jobs: `frontend`, `backend`

Frontend Job:

- `actions/checkout@v7`
- `actions/setup-node@v7`
- Node.js `24.21.0`
- `package-manager-cache: false`
- `npm ci`
- `npm test`
- `npm run build`

Backend Job:

- `actions/checkout@v7`
- `actions/setup-java@v6`
- Temurin Java `21`
- `gradle/actions/setup-gradle@v6`
- `cache-disabled: true`
- `./gradlew test`
- `./gradlew build`

제외 항목:

- npm cache 미사용
- Gradle cache 미사용
- MySQL Service Container 미사용
- Docker 미사용
- Deploy 미사용
- `continue-on-error` 미사용
- `chmod +x` step 미사용

### Local Verification

실행 명령:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\verify.ps1
```

결과:

- PASS
- Frontend `npm test` PASS
- Frontend `npm run build` PASS
- Backend `gradlew.bat test` PASS
- Backend `gradlew.bat build` PASS

### Workflow 정적 확인

- Workflow path가 `.github/workflows/ci.yml`임을 확인했다.
- `push` main trigger 존재를 확인했다.
- `pull_request` main trigger 존재를 확인했다.
- `permissions: contents: read` 존재를 확인했다.
- `frontend`, `backend` Job 분리를 확인했다.
- `ubuntu-latest` 사용을 확인했다.
- `actions/checkout@v7` 사용을 확인했다.
- `actions/setup-node@v7` 사용을 확인했다.
- Node.js `24.21.0` 사용을 확인했다.
- `package-manager-cache: false` 사용을 확인했다.
- `npm ci`, `npm test`, `npm run build` 사용을 확인했다.
- `actions/setup-java@v6` 사용을 확인했다.
- Temurin Java `21` 사용을 확인했다.
- `gradle/actions/setup-gradle@v6` 사용을 확인했다.
- `cache-disabled: true` 사용을 확인했다.
- `./gradlew test`, `./gradlew build` 사용을 확인했다.
- MySQL Service Container가 없음을 확인했다.
- `continue-on-error`가 없음을 확인했다.
- `chmod` step이 없음을 확인했다.

### git diff --check

- PASS
- 출력: line ending warning만 있었고 whitespace error는 없었다.

### Remote GitHub Actions Verification

Codex 작업 시점에는 git commit과 git push를 수행하지 않아 Remote CI를 실행할 수 없었다.
Human 확인 후 commit `7c8c5e7`을 `main`에 push하여 최초 Remote CI를 실행했다.

- Workflow run: https://github.com/youneedpython/today-v3/actions/runs/36529263245
- Trigger: `push` to `main`
- 결과: PASS (`success`)

| Job | 결과 | 소요 시간 | 실행 Step |
|---|---|---|---|
| `frontend` | success | 약 11초 | Checkout, Setup Node.js, `npm ci`, `npm test`, `npm run build` |
| `backend` | success | 약 47초 | Checkout, Setup Java, Setup Gradle, `./gradlew test`, `./gradlew build` |

- `gradle/actions/setup-gradle@v6` 단계에서 Gradle Wrapper 검증을 포함해 성공했다.
- Cache 미사용 상태에서도 초기 CI 실행 시간은 약 1분 이내였다.
- Local Verification과 동일한 Frontend Test / Build, Backend Test / Build 범위가 Remote CI에서 성공했다.

Remote CI Verification 완료 후 TASK-003 상태를 REVIEW로 변경했다.

### Human Review

검토 일자: 2026-09-29

- `.github/workflows/ci.yml`이 DEC-017 항목과 일치함을 확인했다.
- Workflow YAML 구문과 Job / Trigger 구조를 확인했다.
- `backend/gradlew`, `scripts/verify.sh`가 Git에서 LF / executable bit `100755`로 추적됨을 확인했다.
- Remote CI의 `frontend`, `backend` Job이 모두 success임을 확인했다.
- Human Review 승인 후 TASK-003 상태를 DONE으로 변경했다.

### 결과

Human Review 완료 / DONE

---

## TASK-004 — Backend Domain / API Skeleton

### 상태

DONE

### 작업 내용

- TASK-004 시작
- `docs/05-API_SPEC.md`와 `docs/09-DECISIONS.md` 기준 Backend API Skeleton 구성
- `POST /api/check-ins` Request DTO와 Validation 구성
- `GET /api/check-ins/latest` Empty State `404 CHECKIN_NOT_FOUND` 처리 구성
- `GET /api/check-ins/history` 기본 `days=7`, 최대 `30` Validation 구성
- Error Response 구조 구성
- Controller / Service / Repository boundary 구성
- Controller Validation Test와 API 동작 Test 추가

### Backend 구현 범위

- Controller: `CheckinController`
- Service boundary: `CheckinService`, `CheckinServiceSkeleton`
- Repository boundary: `repository/package-info.java`
- Request DTO: `CreateCheckinRequest`, `WeatherCondition`
- Response DTO: `CheckinResponse`, `HistoryResponse`, `HistoryItemResponse`, `MoodResponse`, `MetricsResponse`, `WeatherResponse`, `FoodRecommendationResponse`, `MusicRecommendationResponse`, `ErrorResponse`
- Exception: `CheckinNotFoundException`, `PendingImplementationException`, `GlobalExceptionHandler`

### 제외한 항목

- Wellness Score 계산
- Mood 판정
- Weather / Temperature 영향 규칙
- Food Recommendation Rule
- Music Recommendation Rule
- Entity
- Spring Data JPA
- MySQL Connector
- Database Integration Test
- Auth / User / JWT / OAuth
- Frontend Feature
- scripts 변경
- GitHub Actions Workflow 변경

### Endpoint 동작 상태

- `GET /api/check-ins/latest`
  - 실행 가능
  - 저장된 Check-in이 없는 Skeleton 상태에서 `404 CHECKIN_NOT_FOUND` 반환
- `GET /api/check-ins/history`
  - 실행 가능
  - 기본 `days=7`과 빈 `items` 구조 반환
  - `days > 30`이면 `VALIDATION_ERROR` 반환
- `POST /api/check-ins`
  - Request Validation은 실행 가능
  - Valid 요청의 저장, 분석, 추천 생성은 DEC-014와 TASK-006 전까지 보류
  - 현재 valid 요청은 `NOT_IMPLEMENTED` 응답으로 보류 상태를 명시

### Backend Verification

- `.\gradlew.bat test`
  - 1차 FAIL
  - 원인: Spring Boot 4.1의 MockMvc 자동 구성 패키지가 기존 `org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc`가 아니라 `org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc`에 위치함
  - 해결: 승인된 `spring-boot-starter-webmvc-test` 범위 안에서 import만 Spring Boot 4 구조로 수정
- `.\gradlew.bat test`
  - PASS
  - 결과: Backend Controller Test와 Application Context Test 성공
- `.\gradlew.bat build`
  - PASS
  - 결과: Backend build 성공

### Local Verification

- `powershell -ExecutionPolicy Bypass -File .\scripts\verify.ps1`
  - PASS
  - Frontend `npm test` PASS
  - Frontend `npm run build` PASS
  - Backend `gradlew.bat test` PASS
  - Backend `gradlew.bat build` PASS

### Contract 확인

- Endpoint path는 API Spec과 동일하게 유지했다.
- Request field는 API Spec과 동일하게 유지했다.
- Response DTO field는 API Spec 구조를 따른다.
- Latest empty 정책 `404 CHECKIN_NOT_FOUND`를 유지했다.
- History 기본값 `7`, 최대값 `30` 정책을 유지했다.
- Backend time 표현은 `Instant` 기반 DTO로 유지했다.
- DTO와 Entity는 분리되어 있으며 Entity를 생성하지 않았다.
- Recommendation Refresh는 구현하지 않았다.
- Auth/User 구조는 추가하지 않았다.
- Wellness Analysis Rule은 구현하지 않았다.

### Human Review 보완

Human Review에서 API 입력 Validation 누락 2건이 발견되어 보완했다.

발견 내용(실제 서버 실행 후 요청으로 확인):

- `GET /api/check-ins/history?days=0`, `days=-5`가 `200 OK`로 처리되었다.
- 알 수 없는 `weather` Enum 값, JSON 구문 오류, 숫자 필드의 문자열 값, `days=abc` 요청이 `ErrorResponse`가 아닌 Spring 기본 Error 형식(`timestamp` / `status` / `error`)으로 응답되었다.

보완 내용:

- `CheckinController`의 `days` parameter에 `@Min(1)`을 추가했다.
- `GlobalExceptionHandler`에 `HttpMessageNotReadableException` 처리를 추가했다.
  - `VALIDATION_ERROR`로 응답한다.
  - Jackson 오류 path에서 field 이름을 확인할 수 있으면 `fieldErrors`에 포함한다.
- `GlobalExceptionHandler`에 `MethodArgumentTypeMismatchException` 처리를 추가했다.
  - `VALIDATION_ERROR`로 응답하고 parameter 이름을 `fieldErrors`에 포함한다.
- `CheckinControllerTests`에 Test 6건을 추가했다.
  - `days=0`, `days=-5` Validation Error
  - `days=abc` Validation Error
  - 알 수 없는 `weather` 값 Validation Error
  - 숫자 필드 문자열 값 Validation Error
  - JSON 구문 오류 Validation Error
- 새로운 Dependency는 추가하지 않았다. Jackson 3는 `spring-boot-starter-webmvc`를 통해 이미 포함되어 있다.
- `days` 최소값 `1`은 기존 API Spec에 명시되어 있지 않았으므로 Human Approval을 받아 `docs/05-API_SPEC.md`와 DEC-004에 허용 범위 `1 ~ 30`을 추가했다.
- 요청 형식 오류(JSON 문법 오류, 없는 enum 값, 타입 오류)의 `VALIDATION_ERROR` 응답 정책도 Human Approval을 받아 `docs/05-API_SPEC.md` 8절에 추가했다.

재검증 결과:

- `.\gradlew.bat test`
  - PASS
  - `CheckinControllerTests` 10건, `MoodFitApplicationTests` 1건 성공
- `powershell -ExecutionPolicy Bypass -File .\scripts\verify.ps1`
  - PASS
- 실제 서버 실행 후 요청 확인
  - 알 수 없는 `weather`, JSON 구문 오류, 숫자 필드 문자열 값: `400 VALIDATION_ERROR`
  - `days=0`, `days=-5`, `days=31`, `days=abc`: `400 VALIDATION_ERROR`
  - `days=1`, 기본값 `7`: `200 OK`
  - `latest`: `404 CHECKIN_NOT_FOUND`
  - valid `POST`: `501 NOT_IMPLEMENTED` (TASK-006 전까지 보류 상태 유지)

### Remote CI Verification

Commit `3f12803`을 `main`에 push하여 Remote CI를 실행했다.

- Push 시 Remote `main`에 Human이 추가한 commit `af73c75`(`scripts/create-milestones.js`)가 있어 push가 거부되었다.
  - TASK-004 파일과 겹치지 않음을 확인한 뒤, 아직 push되지 않은 로컬 commit을 `origin/main` 위로 rebase하여 push했다.
- Workflow run: https://github.com/youneedpython/today-v3/actions/runs/36540515429
- 결과: PASS (`success`)

| Job | 결과 | 소요 시간 |
|---|---|---|
| `frontend` | success | 약 12초 |
| `backend` | success | 약 53초 |

Remote CI Verification 완료 후 TASK-004 상태를 REVIEW로 변경했다.

### Human Review

검토 일자: 2026-09-29

- Controller / DTO / Service / Exception 구조가 `docs/05-API_SPEC.md`와 일치함을 확인했다.
- 실제 서버 실행 후 요청으로 Validation / Error Response 동작을 확인했다.
- Human Review 보완 사항(`days` 최소값, 요청 형식 오류 응답 통일)과 API Spec / DEC-004 보완을 확인했다.
- Remote CI의 `frontend`, `backend` Job이 모두 success임을 확인했다.
- Human Review 승인 후 TASK-004 상태를 DONE으로 변경했다.

### 결과

Human Review 완료 / DONE

---

## Out-of-Task — GitHub Milestone Sync Workflow (DEC-018)

### 상태

DONE

### 작업 내용

- Human이 `scripts/create-milestones.js`(GitHub Milestone 1~12 생성 스크립트)를 추가했다.
- Human 요청에 따라 DONE Task의 Milestone을 자동 Close하는 Workflow를 Gate C로 승인받아 추가했다.
- `.github/workflows/milestones.yml` 생성
- DEC-018 기록, TASK-012 관련 메모 추가, README 보조 스크립트 안내 추가

### Verification

`gh` CLI를 가짜 명령으로 대체하고 Workflow의 run script를 로컬에서 실행했다.

| 시나리오 | 결과 |
|---|---|
| 현재 `docs/07-TASKS.md` (TASK-001~003 DONE) | Milestone 1, 2, 3만 Close 요청, exit `0` |
| TASK-004, TASK-010을 DONE으로 바꾼 사본 | Milestone 1, 2, 3, 4, 10 Close, `Milestone 1:`이 `Milestone 10:`과 혼동되지 않음, exit `0` |
| DONE Task 없음 | `No DONE tasks found.`, exit `0` |
| Milestone이 아직 없음 | `Closed 0 milestone(s).`, exit `0` |

Remote 실행 결과 (commit `03782ac`):

- `Sync Milestones` run https://github.com/youneedpython/today-v3/actions/runs/36542755169 (event: `push`) : success
  - Human이 push 이전에 `scripts/create-milestones.js`로 Milestone 1~12를 생성해 두었다.
  - 이 push run이 DONE Task에 해당하는 Milestone 1, 2, 3을 Close했다. (closed_at `2026-09-29T08:26:48Z`, run 시작 5초 후)
- `CI` run https://github.com/youneedpython/today-v3/actions/runs/36542755222 : success

GitHub API로 Milestone 상태를 확인했다.

- Milestone 1, 2, 3: `closed`
- Milestone 4 ~ 12: `open`
- 총 12개, 중복 없음

---

## TASK-005 — Wellness Analysis / Recommendation Rule Approval

### 상태

DONE

### 작업 내용

- TASK-005 시작
- Gate B Human Review를 위한 Rule Proposal 작성
- `docs/10-WELLNESS-RULE-PROPOSAL.md` 생성
- Wellness Score Option 검토
- Metric Weight 후보 검토
- Mood 판정 후보 검토
- Weather 영향 후보 검토
- Temperature 처리 후보 검토
- Summary Rule 후보 검토
- Food Recommendation Rule 후보 검토
- Music Recommendation Rule 후보 검토
- Boundary / Edge Case 검토
- API 예시 입력 계산 결과 작성
- Decision Matrix 작성

### Gate B 목적

TASK-006 Backend Domain / API Core 구현 전에 DEC-014 Wellness Analysis Rule의 후보를 Human Review 대상으로 제안한다.

### 검토한 Score Option

- Option A: Self-reported Metric 중심
  - `sleepScore`, `stressScore`, `energyLevel`만 Score 계산에 사용
  - Heart Rate / Respiratory Rate는 Summary와 Dashboard 보조 정보로 사용
- Option B: 모든 Metric 사용
  - Heart Rate / Respiratory Rate를 낮은 weight의 comfort score로 반영
  - Threshold는 의료 기준이 아닌 MoodFit 교육용 Product Heuristic으로 명시

### Mood 후보

- `CALM`
- `ENERGETIC`
- `TIRED`
- `BALANCED`

새 Mood Code는 추가하지 않았다.

### Recommendation Rule 후보

- 외부 Food API 또는 Music API를 사용하지 않는 deterministic rule 후보를 제안했다.
- Food Recommendation은 `name`, `tag`, `reason` 구조를 유지한다.
- Music Recommendation은 초기 MVP에서 가상 Playlist / Track Metadata 사용을 우선 후보로 제안했다.

### Edge Case 검토

다음 범주의 Boundary / Edge Case를 검토했다.

- 모든 입력이 낮은 경우
- 모든 입력이 높은 경우
- 높은 Energy와 높은 Stress가 함께 있는 경우
- 낮은 Energy와 낮은 Stress가 함께 있는 경우
- Mood 경계값
- Heart Rate / Respiratory Rate 최소값과 최대값
- Temperature `-30`, `50`
- Weather `CLEAR`, `CLOUDY`, `RAIN`, `SNOW`
- 같은 Score지만 Metric 조합이 다른 경우

### API 예시 입력 계산 결과

`docs/05-API_SPEC.md`의 예시 입력을 사용했다.

- Option A 예상 Score: `76`
- Option B 예상 Score: `79`
- 예상 Mood 후보: `ENERGETIC`

### 의료 진단 표현 배제 확인

- Proposal에서 정상/비정상 진단, 질환 가능성, 의학적 위험, 치료 필요, 건강 이상 판정 표현을 배제했다.
- Threshold와 score 기준은 MoodFit 교육용 Product Heuristic으로 명시했다.

### 코드 변경 여부

코드 변경 없음.

Backend Java Source, Frontend Source, Test Code, build.gradle, package.json, Dependency, CI Workflow, Milestone Workflow를 수정하지 않았다.

### DEC-014 상태

`docs/09-DECISIONS.md` DEC-014는 `Pending Human Approval` 상태로 유지했다.

### Milestone 4 상태 확인

`gh api repos/youneedpython/today-v3/milestones?state=all` 조회를 시도했으나 현재 환경에서 `gh` CLI가 PATH에 없어 확인하지 못했다.
Milestone 4 상태를 추정하지 않았다.

### Gate B Human Review 보완

검토 일자: 2026-09-30

- Human은 §15 Codex 추천 조합(Option A / M2 / Weather Context only / T-A / Deterministic Recommendation / Template Summary / Rule Policy class)을 그대로 승인했다.
- Human Review에서 Rule 정의 누락 6건이 발견되어, Human 지시에 따라 Claude가 `docs/10-WELLNESS-RULE-PROPOSAL.md` §16 확정 Rule로 보완했다.
  1. Food Score Band Rule이 우선순위상 도달 불가 → Score Band 제거, Mood Item + Context Item 구조
  2. Music Rule 적용 순서 / Temperature / CLEAR·CLOUDY 누락 → Food와 같은 구조로 정의
  3. 추천 개수 미정 → `foods`, `music` 각각 항상 2개
  4. Edge Case 표 중복·모호 → 입력값과 기대값을 수치로 명시한 20개 Case
  5. 반올림 방식 미정 → 정수 연산 공식 `(35*sleep + 35*(100-stress) + 30*energy + 50) / 100`
  6. Summary Metric 선택 Rule 없음 → Mood 문장 + Context 문장 Template
- Reference 구현(Scratch, Repository 미포함)으로 확인했다.
  - 입력 0 ~ 100 전체 조합에서 Score가 0 ~ 100 범위를 벗어나지 않음
  - Mood Item과 Context Item 이름이 겹치지 않음
  - §16.8 Edge Case 표 20개 행이 Reference 계산 결과와 모두 일치
- §16.9에 API Spec 예시와의 차이를 정리했다. DEC-014 확정 시 API Spec 예시와 Mood label 정렬이 필요하다.

### Gate B Human Approval

승인 일자: 2026-09-30

- Human이 `docs/10-WELLNESS-RULE-PROPOSAL.md` 16절 확정 Rule을 승인했다.
- 16절 16.1 ~ 16.8 내용을 `docs/09-DECISIONS.md` DEC-014에 반영하고 상태를 `Human Approved`로 변경했다.
- Human Approval을 받아 `docs/05-API_SPEC.md`를 DEC-014 기준으로 맞췄다. (API Contract 변경)
  - Mood Enum에 code / label 표 추가 (CALM label: 평온함 → 차분함)
  - POST / Latest Response 예시: Score 78 → 76, Mood CALM → ENERGETIC, Summary 문장 변경
  - `foods`, `music` 예시를 각각 2개(Mood Item, Context Item)로 변경
  - History Response 예시의 Mood / Score도 같은 입력 기준으로 변경
- 검증
  - DEC-014 Edge Case 표 20개 행을 Reference 계산 결과와 다시 대조: 불일치 0건
  - API Spec의 JSON 예시 4개가 모두 유효한 JSON임을 확인

### 결과

Gate B Human Review 완료 / DONE

---

## TASK-006 — Backend Domain / API Core

### 상태

DONE

### 작업 내용

- TASK-006 Persistence Gate C Human Approval 반영
- DEC-019 Persistence Dependency / DB Schema 기록
- Spring Data JPA, Flyway, H2 Test DB Dependency 추가
- Flyway 초기 Schema `V1__create_checkin_tables.sql` 생성
- `wellness_checkin`, `checkin_food_recommendation`, `checkin_music_recommendation` Table 구성
- `WellnessCheckin` Entity와 Food / Music Recommendation `@ElementCollection` 구성
- `recorded_at` UTC `Instant` ↔ UTC `LocalDateTime` 변환 구성
- `java.time.Clock` 주입 구성
- DEC-014 Wellness Analysis / Recommendation Rule 구현
- Check-in 생성, 최신 조회, History 조회 구현
- Temperature 소수 첫째 자리 Validation 추가
- Repository / Controller Test 보강

### 승인된 Persistence 정책

- Spring Data JPA 사용
- H2 In-memory Test DB 사용
- H2 MySQL Compatibility Mode 사용
- CI MySQL Service Container 미사용
- Flyway + Hibernate `ddl-auto=validate`
- Recommendation 전용 Repository 미생성
- 실제 MySQL / Testcontainers 검증은 TASK-011에서 재검토

### Backend Verification

- `.\gradlew.bat test`
  - 1차 FAIL
  - 원인: Repository Test에서 `@ElementCollection` 기본 lazy loading 컬렉션을 트랜잭션 밖에서 접근했다.
  - 해결: Repository Test에 `@Transactional`을 적용했다.
- `.\gradlew.bat test`
  - 2차 FAIL
  - 원인: `Instant` 정밀도 검증에서 같은 영속성 컨텍스트의 Entity를 다시 읽어 DB 변환 결과가 반영되지 않았다.
  - 해결: 저장 후 `EntityManager.clear()`를 호출해 DB에서 다시 조회하도록 수정했다.
- `.\gradlew.bat test`
  - PASS
  - 결과: 17 tests completed
- `.\gradlew.bat build`
  - PASS
  - 결과: BUILD SUCCESSFUL

### Local Verification

- `powershell -ExecutionPolicy Bypass -File .\scripts\verify.ps1`
  - PASS
  - Frontend `npm test` PASS
  - Frontend `npm run build` PASS
  - Backend `gradlew.bat test` PASS
  - Backend `gradlew.bat build` PASS
- `bash scripts/verify.sh`
  - PASS
  - Frontend `npm test` PASS
  - Frontend `npm run build` PASS
  - Backend test PASS
  - Backend build PASS

### Dependency 확인

Backend:

- `spring-boot-starter-data-jpa` 추가
- `spring-boot-starter-flyway` 추가
- `flyway-mysql` 추가
- `mysql-connector-j` 추가
- `h2` Test Runtime 추가
- `spring-boot-starter-data-jpa-test` Test Dependency 추가
- Version은 직접 지정하지 않고 Spring Boot 4.1.1 Dependency Management를 사용한다.

제외 유지:

- MySQL Service Container 미추가
- Testcontainers 미추가
- Recommendation Repository 미추가
- Spring Security / OAuth / Actuator / Lombok 미추가
- Frontend 변경 없음
- scripts 변경 없음
- GitHub Actions Workflow 변경 없음

### Human Review 보완

검토 일자: 2026-09-30

Human Review에서 다음 문제가 발견되어 Human 지시에 따라 Claude가 보완했다.

발견 내용:

- `WellnessRulePolicy`의 문구 3곳이 DEC-014와 달랐다. (DEC-014 문구 72개를 코드와 기계적으로 대조해 발견)
  - TIRED Food 이름: `따뜻한 수프와 곡물밥` → DEC-014 `따뜻한 수프와 곡물빵`
  - RAIN Music tag: `차분한 감성` → DEC-014 `잔잔한 감성`
  - TIRED Summary 문장이 DEC-014 문장과 달랐다.
- TASK-006 Verification 항목(Wellness Analysis / Recommendation / Rule Boundary / Edge Case Test)에 해당하는 Rule Test가 없었다. DEC-014 Edge Case 20개 중 E01만 Controller Test로 확인되고 있었다.
- Mood label이 `WellnessRulePolicy`와 `CheckinServiceImpl.labelFor()` 두 곳에 중복되어 있었다. (DEC-014: Rule 값은 Rule Policy 한 곳에서 관리)

보완 내용:

- `WellnessRulePolicy` 문구 3곳을 DEC-014와 일치하도록 수정했다.
- `WellnessRulePolicy.moodLabel(String)`을 추가하고 `CheckinServiceImpl.labelFor()`를 제거했다.
- `WellnessRulePolicyTests`(Spring 없이 실행되는 Unit Test 36건)를 추가했다.
  - DEC-014 Edge Case E01 ~ E20: Score, Mood, Food 2개, Music 2개
  - Mood Item 4종: label, Food / Music name·tag·reason, Summary Mood 문장
  - Context Item 6종: Food / Music name·tag·reason, Summary Context 문장
  - Summary 결합 형식, heartRate / respiratoryRate 무영향, Mood label 4종
- Test가 실제로 문구 차이를 잡아내는지 확인했다. 수정 전 문구로 하나씩 되돌려 실행한 결과:
  - `곡물밥` → 6건 실패, `차분한 감성` → 1건 실패, 이전 TIRED Summary 문장 → 1건 실패
  - 확인 후 올바른 문구로 복구했다.

재검증 결과:

- `.\gradlew.bat test`
  - PASS
  - `WellnessRulePolicyTests` 36건, `CheckinControllerTests` 13건, `WellnessCheckinRepositoryTests` 3건, `MoodFitApplicationTests` 1건
- `powershell -ExecutionPolicy Bypass -File .\scripts\verify.ps1`
  - PASS

참고:

- Test와 CI는 H2 In-memory DB로 실행되므로 MySQL이 필요 없다.
- Local에서 Backend를 직접 실행(`bootRun`)하려면 MySQL과 `DB_URL`, `DB_USERNAME`, `DB_PASSWORD` 환경변수가 필요하다.

### Remote CI Verification

Human Review 보완 후 commit `e89ca5e`를 `main`에 push하여 Remote CI를 실행했다.

- Workflow run: https://github.com/youneedpython/today-v3/actions/runs/36675278212
- 결과: PASS (`success`)

| Job | 결과 | 소요 시간 |
|---|---|---|
| `frontend` | success | 약 12초 |
| `backend` | success | 약 68초 |

- Remote CI에서도 H2 In-memory DB로 Backend Test가 실행되며 MySQL Service Container는 사용하지 않는다.

Remote CI Verification 완료 후 TASK-006 상태를 REVIEW로 변경했다.

### Human Review — Local MySQL 실행 확인

검토 일자: 2026-09-30

Human이 Local MySQL 8.0에서 Backend를 직접 실행(`./gradlew bootRun`)하고 API를 호출해 확인했다.

발생한 문제와 해결:

- `'url' must start with "jdbc"`: DB 환경변수를 불러오기 전에 실행해 발생했다. `.env.local`을 환경변수로 불러온 뒤 해결되었다.
- `Found non-empty schema(s) moodfit but no schema history table`: Local `moodfit` DB를 today-v2가 이미 사용 중이었다. (`recommendation_history` 등 3개 Table과 데이터 존재)
  - v2 데이터를 보존하기 위해 `baselineOnMigrate`를 사용하거나 v2 Table을 삭제하지 않았다.
  - v3 전용 DB `moodfit_v3`를 생성하고 `.env.local`의 `DB_URL`만 변경해 해결했다. Repository 파일은 변경하지 않았다.

확인 결과 (`moodfit_v3`):

- Flyway: `1 create checkin tables` 적용 성공
- `POST /api/check-ins` 저장 결과: Score `76`, Mood `ENERGETIC`, Weather `RAIN`, Temperature `19.0`
- Recommendation 저장: Food `연어 샐러드`(position 0), `따뜻한 채소 스튜`(position 1) / Music `Light Motion Playlist`, `Rainy Indoor Playlist`
- 한글 문구가 `utf8mb4`로 올바르게 저장됨을 저장 Byte로 확인했다.
- `recorded_at`은 UTC로 저장되었다.
- today-v2의 `moodfit` DB Table 3개는 그대로 유지되었다.

### Human Review 승인

승인 일자: 2026-09-30

- Human이 TASK-006 Human Review를 승인했다.
- TASK-006 상태를 DONE으로 변경하고, TASK-007을 READY로 변경했다.

### 결과

Human Review 완료 / DONE

---

## Cleanup Checkpoint — TASK-006 Post-completion Cleanup

### 상태

실행 완료 / Human Review 완료

- 별도 Feature Task가 아니라 TASK-006 완료 후 Cleanup Checkpoint이다. (`prompts/17-TASK-006-POST-COMPLETION-CLEANUP.md`)
- TASK-006 DONE 유지, TASK-007 READY 유지. TASK-007은 시작하지 않았다.

### Preflight

- `git status --short`: 변경 없음 (clean)
- `git log -5 --oneline`: 최신 commit `3b3dcdb`
- `docs/07-TASKS.md`: TASK-006 `DONE`, TASK-007 `READY`
- 예상하지 못한 변경 없음

### 작업 내용

- `repository/package-info.java`: TASK-004 시절 "Repository boundary reserved for TASK-006..." 설명을 현재 설명(Spring Data JPA, DEC-019 `WellnessCheckin` 저장)으로 교체했다.
- `PendingImplementationException` 사용 여부 확인 (`git grep`, Local Git Bash에 `rg` 없음)
  - Production 사용처: `GlobalExceptionHandler`의 Handler뿐이었다. 이 예외를 던지던 `CheckinServiceSkeleton`은 TASK-006에서 이미 삭제되었다.
  - Test 사용처: 없음
  - `POST /api/check-ins`는 TASK-006 `CheckinServiceImpl.create`로 실제 구현되어 있다.
- Dead Code 삭제
  - `PendingImplementationException.java` 삭제
  - `GlobalExceptionHandler`의 `PendingImplementationException` → `501 NOT_IMPLEMENTED` Handler 삭제
- README 동기화
  - Backend 구조에 `config/`, `entity/` 추가
  - Backend 설명 `Spring Boot + Gradle Wrapper Skeleton` → `Spring Boot + Spring Data JPA + Flyway (Check-in API)`
  - Prompt History `01 ~ 16` → `01 ~ 17`
  - Local 실행 안내에 `.env.local` Commit 제외, 공유용 ZIP / 학생 배포본에서 `.env.local`과 `.git/` 폴더 제외 안내 추가
- `prompts/README.md`에 Prompt 17 추가
- WORK_LOG 제어문자 수정
  - TASK-006 `Human Review 보완` 기록의 `scripts` 경로에 0x0B(Vertical Tab) 1개가 있어 원래 문자인 역슬래시 + `v`로 복구했다.
  - 원인: Claude가 Python으로 기록을 추가할 때 명령 문자열의 역슬래시가 한 번 해석되어 `\v`가 0x0B로 바뀌었다. 복구는 Byte 값으로 수행했다.
  - Tracked / 신규 Text 파일 전체(md, txt, properties, yml, sql, java, ts, tsx, json, gradle, ps1, sh, html) 재검사: 제어문자 없음 (정상 TAB / CR / LF 제외)
  - 같은 원인으로 TAB / CR 변형이나 경로 역슬래시 누락이 생긴 곳이 없는지도 확인했다: 없음

### Secret / 배포 파일 확인

- `git check-ignore -v .env.local`: `.gitignore:26:.env.*` 규칙으로 제외
- `git ls-files .env.local`: 결과 없음 (tracked 아님)
- `git log --all -- .env.local`: Commit 이력 없음
- Secret 값은 Console Report와 문서에 출력하지 않았다.

### Verification

- `.\gradlew.bat test`: PASS
  - `WellnessRulePolicyTests` 36건, `CheckinControllerTests` 13건, `WellnessCheckinRepositoryTests` 3건, `MoodFitApplicationTests` 1건
- `.\gradlew.bat build`: PASS
- `powershell -ExecutionPolicy Bypass -File .\scripts\verify.ps1`: PASS
  - Frontend Test / Build, Backend Test / Build
- Cleanup 후 재검색
  - `backend/src/main`의 `NOT_IMPLEMENTED` / `PendingImplementation` / `501`: 없음
  - `PendingImplementationException`은 TASK-004 Work Log와 Prompt 17의 과거 / 작업 기록에만 남아 있다.

### 변경하지 않은 것

- Feature, Controller, Service Logic, Wellness Rule, Repository Query, Entity Mapping 변경 없음
- API Contract, DTO, Validation, DB Schema, Flyway Migration 변경 없음
- DEC-014, DEC-019 변경 없음
- `build.gradle`, `package.json`, `scripts/verify.ps1`, `scripts/verify.sh`, `.github/workflows/*` 변경 없음

### Human Review

- 2026-09-30 Human이 Cleanup 결과를 승인했다.

### 결과

Human Review 완료
