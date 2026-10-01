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

---

## TASK-007 — Frontend Foundation / Design System

### 상태

DONE

### 작업 내용

- Route 구조 (DEC-011): `/` Dashboard, `/check-in` Daily Check-in, `/history` History, 그 외 경로는 Not Found
  - `createBrowserRouter` + `RouterProvider` (`react-router` 8.4.0, `react-router-dom` 미사용)
  - Route 정의는 `src/app/router.tsx`의 `routes` 배열로 분리해 Test에서 `createMemoryRouter`로 재사용
- 공통 Layout (`src/app/AppLayout.tsx`): Brand, 오늘 날짜, 주요 메뉴(`NavLink`), 본문 건너뛰기 링크, `<main id="main-content">`
- 공통 Component (`src/components/`)
  - `Button` (primary / secondary / ghost, Hover / Focus / Disabled 상태), 화면 이동용 `ButtonLink`
  - `Card`, `Badge` (Text Label과 함께 사용), `MetricCard` (값이 없으면 임의 값 대신 "값 없음" 표시), `PageHeader`
  - `LoadingState` (`role="status"`), `ErrorState` (`role="alert"`, 선택적 재시도), `EmptyState` (다음 행동 안내)
- Style
  - `src/styles/tokens.css`: v1 Dark Wellness 방향의 색상 / 간격 / 반경 / Typography Token
  - `src/styles/global.css`: 기본 스타일, Focus Ring, Responsive Grid (Desktop > 860px, Tablet 561 ~ 860px, Mobile <= 560px), 한글 단어 단위 줄바꿈, `prefers-reduced-motion`
- API Client 기본 구조
  - `src/types/api.ts`: `docs/05-API_SPEC.md` / Backend DTO와 같은 Request / Response 타입
  - `src/services/api.ts`: `checkinApi.create`, `getLatest`, `getHistory`, `ApiError`(status, code, fieldErrors)
  - `getLatest`는 `404 CHECKIN_NOT_FOUND`를 오류가 아닌 Empty State로 보고 `null`을 반환한다. (API Spec 5절)
  - 네트워크 실패는 `NETWORK_ERROR`, ErrorResponse가 없는 오류는 `HTTP_ERROR`로 변환한다.
- 화면 3개는 TASK-008 ~ TASK-010 전까지 "준비 중인 화면입니다." 안내만 표시한다. Hard-coded 분석 결과를 표시하지 않는다.
- TASK-001 Bootstrap Placeholder(`src/App.tsx`, `src/App.test.tsx`)를 삭제하고 Router 구조로 대체했다.
- `index.html`: `lang="ko"`, title `MoodFit`
- Test 설정: `src/test/setup.ts`를 `vite.config.ts`의 `setupFiles`로 등록 (Vitest globals 미사용 환경에서 Test마다 DOM / Mock 정리)
- `src/vite-env.d.ts`: Vite 공식 Template과 같은 `vite/client` 타입 참조 (CSS import 타입 선언)

### Dependency

- 새로운 Dependency 추가 없음. `package.json`, `package-lock.json` 변경 없음.
- 승인된 React, React Router, Vitest, React Testing Library, jsdom만 사용했다. (Gate C 불필요)
- `@testing-library/user-event`, `jest-dom` 등 추가 Testing Utility 없이 `fireEvent`와 기본 Assertion을 사용했다.

### 오류 및 해결

- 오류: `npm run build`의 `tsc --noEmit`에서 CSS side-effect import에 대한 TS2882 오류가 발생했다.
  - 원인: TypeScript 6은 CSS import에 타입 선언이 필요하다.
  - 해결: `src/vite-env.d.ts`에 `/// <reference types="vite/client" />`를 추가했다.
- 오류: `api.test.ts`의 fetch Mock 호출 인자 타입이 빈 Tuple로 추론되어 TS2493 오류가 발생했다.
  - 해결: Mock 함수의 인자 타입을 명시했다.
- 화면 검토에서 발견: Page 제목이 Header에 붙어 보였다.
  - 원인: `global.css`가 Component CSS보다 나중에 로드되어 `.container`의 `padding` 축약형이 `.app-main`의 `padding-top`을 덮어썼다.
  - 해결: `.container`를 `padding-inline`으로 바꾸고, `main.tsx`에서 `global.css`를 먼저 import했다.
- 화면 검토에서 발견: 390px에서 한글 단어가 중간에서 줄바꿈되었다.
  - 해결: `body`에 `word-break: keep-all`, `overflow-wrap: break-word`를 적용했다.

### Verification

- `npm test`: PASS, Test File 5개 / Test 25건
  - Button / ButtonLink: 렌더링, 클릭, Disabled, Link 경로
  - Card / Badge / MetricCard: 렌더링, 값 없음 표시
  - Loading / Error / Empty State: `role`, 재시도, 다음 행동 안내
  - Route: 3개 화면, Not Found, 메뉴 이동, `aria-current` 현재 메뉴 표시, 건너뛰기 링크, Hard-coded 결과 미표시
  - API Client: POST 형식, `latest` 404 → `null`, History 기본 7일, 400 `fieldErrors`, 500 전파, ErrorResponse 없는 오류, 네트워크 오류
- `npm run build`: PASS (`tsc --noEmit` + `vite build`)
- 화면 검토: `vite preview` 결과를 Headless Edge로 캡처해 확인
  - Desktop 1280px, Tablet 768px, 560px, Mobile 390px
  - 390px는 Headless Edge 최소 창 너비 제한이 있어 iframe으로 정확한 너비를 만들어 확인했다.
  - 모든 너비에서 가로 넘침 없음, 메뉴 3개 표시, 현재 메뉴 강조, 560px 이하에서 Header / 메뉴 세로 배치
  - 캡처 (`docs/images/task-007/`)
    - 수정 전: Page 제목이 Header에 붙어 보임

      ![TASK-007 수정 전 Desktop](images/task-007/layout-desktop-before.png)

    - 수정 후: Desktop 1280px

      ![TASK-007 수정 후 Desktop](images/task-007/layout-desktop-after.png)

    - 수정 후: 390px / 560px / 768px

      ![TASK-007 390 / 560 / 768px](images/task-007/layout-390-560-768.png)

- Keyboard 접근성: 본문 건너뛰기 링크, 모든 Link / Button의 `:focus-visible` Focus Ring, 메뉴 Tap Target 최소 44px
- `powershell -ExecutionPolicy Bypass -File .\scripts\verify.ps1`: PASS
  - Frontend Test / Build, Backend Test / Build
  - 새 Frontend Test는 기존 `npm test`에 포함되므로 `verify.ps1`, `verify.sh`, CI Workflow 변경 없이 Local Verification과 CI 검증 범위가 확장된다.

### 변경하지 않은 것

- Backend, API Contract, DB Schema, DEC 문서 변경 없음
- `scripts/`, `.github/workflows/` 변경 없음

### Remote CI Verification

Commit `552ce70`을 `main`에 push하여 Remote CI를 실행했다.

- Workflow run: https://github.com/youneedpython/today-v3/actions/runs/36683691350
- 결과: PASS (`success`)

| Job | 결과 | 소요 시간 |
|---|---|---|
| `frontend` | success | 약 10초 (Test 25건 포함) |
| `backend` | success | 약 61초 |

- `Sync Milestones`: success (새로 DONE이 된 Task 없음, Close 대상 없음)

Remote CI Verification 완료 후 TASK-007 상태를 REVIEW로 변경했다.

### Human Review 승인

승인 일자: 2026-09-30

- Human이 TASK-007 Human Review를 승인했다.
- TASK-007 상태를 DONE으로 변경하고, TASK-008을 READY로 변경했다.

### 결과

Human Review 완료 / DONE

---

## TASK-008 — Daily Check-in

### 상태

DONE

### 작업 내용

- `src/features/checkin/checkinForm.ts`: 입력 정의와 Client-side Validation 보조
  - 기준은 `docs/05-API_SPEC.md` 4절 Validation, Backend `CreateCheckinRequest`와 같다.
  - Metric 5개는 정수, Temperature는 -30.0 ~ 50.0 소수 첫째 자리까지, Weather는 필수
  - 한국어 범위 안내 / 오류 메시지 제공
  - Backend `VALIDATION_ERROR`의 `fieldErrors`는 화면에 있는 필드만 같은 한국어 안내로 변환한다. (Backend 메시지는 실행 환경 Locale에 따라 언어가 달라질 수 있음)
- `src/features/checkin/CheckinPage.tsx`: Daily Check-in 화면 (UX Spec 4절 CHECK-001)
  - 입력 그룹: 신체 리듬(심박수, 호흡수), 컨디션(수면 / 스트레스 / 에너지), 날씨(기온, 날씨 상태 Radio)
  - 필드마다 Label, 단위, 범위 안내(`aria-describedby`)
  - Validation Error를 해당 필드 바로 아래에 표시하고 `aria-invalid`를 설정, 첫 번째 잘못된 필드로 Focus 이동
  - 입력을 수정하면 해당 필드 오류를 지운다.
  - 상태: Initial / Validation Error / Submitting / Success / API Error
  - 중복 제출 방지: 제출 중 Button과 입력 비활성화, `useRef` 기반 제출 중 Guard (Button 비활성화 전 연속 제출도 차단)
  - API Error: 네트워크 오류는 연결 안내, 그 외 오류는 일반 한국어 안내. 입력값을 유지하고 `다시 시도` 제공
- `src/features/checkin/CheckinResultSummary.tsx`: 저장 완료 후 결과 요약
  - Backend 응답의 Mood, Wellness Score, Summary, 추천 음식 / 음악, 기록 시각을 표시한다. (분석 Rule을 Frontend에 구현하지 않음)
  - 결과 제목으로 Focus 이동, `Dashboard로 이동` / `새로 입력하기` 제공
- `src/features/checkin/CheckinPage.css`: Form / 결과 Style (Desktop 3열, Tablet 2열, Mobile 1열, Mobile에서 Button 전체 폭)

### Dependency / Contract

- 새로운 Dependency 추가 없음. `package.json`, `package-lock.json`, `vite.config.ts` 변경 없음.
- API Contract, Backend, DB Schema 변경 없음. TASK-007의 `checkinApi.create`를 그대로 사용했다.

### Verification

- `npm test`: PASS, Test File 7개 / Test 57건 (TASK-008 추가 32건)
  - `checkinForm.test.ts`: 정상 변환, 필수 입력, 필드별 경계값 19건(범위 양끝 포함/초과, 정수 여부, Temperature 소수 둘째 자리), 한국어 메시지, 서버 오류 변환
  - `CheckinPage.test.tsx`: 입력 그룹과 범위 안내, 필드 옆 오류 / `aria-invalid` / 첫 오류 Focus / API 미호출, 수정 시 오류 해제, 제출 1회 / 제출 중 비활성화 / 결과 표시, 새로 입력하기, 서버 Validation 오류의 필드 표시, 네트워크 오류 후 입력 유지와 재시도, 서버 오류 일반 안내
- 중복 제출 Guard 검증: `useRef` Guard를 임시로 제거하면 "fetch 1회 호출" Test가 2회 호출로 실패함을 확인하고 원복했다.
- `npm run build`: PASS
- 화면 검토: `vite preview` 결과를 390px / 768px / 1280px로 캡처해 확인. 가로 넘침 없음, 입력 그룹 / 범위 안내 표시, 390px에서 1열과 전체 폭 Button
  - 캡처 (`docs/images/task-008/`): 390px / 768px / 1280px

    ![TASK-008 Daily Check-in 390 / 768 / 1280px](images/task-008/checkin-390-768-1280.png)

- Backend 관련 Test 재실행: PASS (`WellnessRulePolicyTests` 36건, `CheckinControllerTests` 13건, `WellnessCheckinRepositoryTests` 3건, `MoodFitApplicationTests` 1건)
- `powershell -ExecutionPolicy Bypass -File .\scripts\verify.ps1`: PASS
  - 새 Frontend Test는 기존 `npm test`에 포함되므로 Script / CI Workflow 변경 없이 검증 범위가 확장된다.

### Human Review 보완

검토 일자: 2026-09-30

발견 내용:

- Retry Validation UX 문제
  - API 오류 후 오류 상태에서도 입력을 수정할 수 있다.
  - 입력을 잘못된 값(예: 심박수 200)으로 고친 뒤 `다시 시도`를 누르면 `handleRetry`가 Validation 실패 시 아무 처리 없이 종료했다.
  - Field Error 미표시, Focus 미이동, 기존 API Error 상태 유지로 버튼이 반응하지 않는 것처럼 보였다.
- 같은 원인으로, 오류 상태에서 잘못된 값으로 고친 뒤 `분석 요청`을 누르면 Field Error는 표시되지만 API Error 알림이 함께 남아 있었다. (Claude 사전 검토에서 추가 확인)
- README가 `01 ~ 17 Prompt History`, Frontend `Skeleton` 표현으로 남아 있었다. (TASK-007, TASK-008 진행 중 갱신 누락)

보완 내용:

- `CheckinPage.tsx`: 제출과 재시도가 같은 `validateAndSubmit()` 경로를 사용하도록 통합했다.
  - Validation 실패 시 API를 호출하지 않고, Field Error 갱신, 이전 API Error 해제(`editing` 상태), 첫 번째 잘못된 필드로 Focus 이동
  - 기존 `handleRetry`를 제거하고 `ErrorState`의 재시도에 `validateAndSubmit`을 연결했다.
- `CheckinPage.test.tsx`: API 오류 후 입력을 잘못 고치고 `다시 시도` / `분석 요청`을 누르는 Test 2건 추가
  - API 추가 호출 없음, 필드 옆 오류, `aria-invalid`, 첫 오류 Focus, `role="alert"` 해제
  - API Error 해제 코드를 임시로 제거하면 두 Test가 모두 실패함을 확인하고 원복했다.
- README: Prompt History `01 ~ 19`, Frontend 설명 `React + TypeScript + Vite (Router / Design System / API Client / Daily Check-in)`로 동기화. 미구현 Dashboard / History 기능은 적지 않았다.

재검증 결과:

- `npm test`: PASS, Test File 7개 / Test 59건
- `npm run build`: PASS
- `powershell -ExecutionPolicy Bypass -File .\scripts\verify.ps1`: PASS
  - Backend Test Regression 없음 (`WellnessRulePolicyTests` 36건, `CheckinControllerTests` 13건, `WellnessCheckinRepositoryTests` 3건, `MoodFitApplicationTests` 1건)

### Remote CI Verification

Commit `0887711`을 `main`에 push하여 Remote CI를 실행했다.

- Workflow run: https://github.com/youneedpython/today-v3/actions/runs/36693834801
- 결과: PASS (`success`)

| Job | 결과 | 소요 시간 |
|---|---|---|
| `frontend` | success | 약 17초 (Test 59건 포함) |
| `backend` | success | 약 62초 |

- `Sync Milestones`: success (새로 DONE이 된 Task 없음)

Remote CI Verification 완료 후 TASK-008 상태를 REVIEW로 변경했다.

### Human Review 승인

승인 일자: 2026-09-30

- Human이 Local에서 Backend(MySQL `moodfit_v3`)와 Frontend 개발 서버를 함께 실행해 다음을 확인했다.
  - 빈 값 / 범위 밖 값 제출 시 필드 옆 Validation Error 표시
  - 정상 입력 제출 시 저장과 결과 요약 표시
  - Backend 중지 상태에서 제출 시 오류 안내와 `다시 시도` 표시
- Human이 TASK-008 Human Review를 승인했다.
- TASK-008 상태를 DONE으로 변경하고, TASK-009를 READY로 변경했다.

### 결과

Human Review 완료 / DONE

---

## TASK-009 — Dashboard

### 상태

DONE

### 작업 내용

- `src/features/dashboard/useLatestCheckin.ts`: 최신 Check-in 조회 Hook
  - 상태: loading / empty / error / ready
  - `404 CHECKIN_NOT_FOUND`는 `checkinApi.getLatest()`가 `null`로 반환하므로 오류가 아닌 empty 상태로 처리한다. (API Spec 5절, DEC-003)
  - 재시도 시 이전 요청의 늦은 응답이 최신 상태를 덮어쓰지 않도록 요청 번호로 구분하고, 화면을 떠난 뒤의 응답은 반영하지 않는다.
- `src/features/dashboard/WellnessHero.tsx`: Mood Badge / 기록 시각, 상태 Headline(`지금 컨디션은 {Mood label}`), Summary, `오늘 상태 입력` CTA, Wellness Score, 날씨 / 기온, 장식용 Weather Visual(`aria-hidden`)
- `src/features/dashboard/BodyMetrics.tsx`: 5개 Body Metric Card (심박수, 호흡수, 수면 점수, 스트레스 수준, 에너지 수준)
- `src/features/dashboard/RecommendationCards.tsx`: 추천 음식 / 추천 음악 Card (이름, Tag, 추천 이유, 음악은 Artist 포함)
- `src/features/dashboard/DashboardPage.tsx`: Loading / API Error + 다시 시도 / Empty State + Check-in CTA / 결과 화면
- `src/features/dashboard/DashboardPage.css`: Hero 2열 → Tablet / Mobile 1열, Metric 5 → 3 → 2열, 추천 2열 → 1열
- `src/constants/weather.ts`: 날씨 표시 이름을 Check-in / Dashboard 공통 상수로 분리 (`checkinForm.ts`의 `WEATHER_OPTIONS`는 같은 값을 사용, 동작 변경 없음)
- README: Frontend 설명에 Dashboard 추가, Prompt History `01 ~ 20` 동기화
- 모든 표시 값은 Backend 응답을 그대로 사용한다. 분석 Rule을 Frontend에 구현하지 않았다.

### 범위 밖

- 최근 7일 Wellness Trend는 UX Spec Dashboard 영역에 포함되지만 TASK-009 산출물 목록에 없고 TASK-010 History / Trend 범위이므로 구현하지 않았다.

### 오류 및 해결

- Test 작성 중 발견: 공통 `Card`의 `<section>`에 접근 가능한 이름이 없어 Screen Reader의 영역(region)으로 인식되지 않았다. (`Body Metrics`, `추천 음식` 등)
  - 해결: `Card`에 제목이 있으면 `useId`로 제목을 `aria-labelledby`에 연결했다. (TASK-007 공통 Component 접근성 보완)
  - `MetricCard.test.tsx`의 Card Test에 region 이름 확인을 추가했다.
- Route Test: Dashboard(`/`)가 이제 API를 호출하므로 `router.test.tsx`에서 fetch를 기록 없음(404)으로 Stub했다.
  - "준비 중 화면" 확인은 아직 준비 중인 `/history`로 옮기고, `/`의 Empty State 확인 Test를 추가했다.

### Dependency / Contract

- 새로운 Dependency, 외부 Chart / 시각화 Library 추가 없음. (DEC-010) `package.json`, `package-lock.json`, `vite.config.ts` 변경 없음.
- API Contract, Backend, DB Schema 변경 없음.

### Verification

- `npm test`: PASS, Test File 8개 / Test 67건 (TASK-009 추가 8건)
  - `DashboardPage.test.tsx`: Loading → 결과 표시(Hero의 Mood / Score / Summary / 날씨 / 기온 / CTA), 5개 Metric 값과 단위, 추천 음식 / 음악 이름 · Tag · 이유 · Artist, `404 CHECKIN_NOT_FOUND` → Empty State와 Check-in CTA, API 오류 → 다시 시도 → 결과 표시, 네트워크 오류 안내, Weather Visual 장식 처리
  - `router.test.tsx`: `/` Empty State 확인 추가
- `npm run build`: PASS
- 실제 Backend 연동 화면 검토
  - Local MySQL(`moodfit_v3`)로 Backend Jar를 실행하고, `vite preview`의 `/api` Proxy를 통해 최신 기록(id 3)을 조회했다.
  - 390px / 768px / 1280px로 캡처해 확인: 가로 넘침 없음, Hero / Metric / 추천 영역 Responsive 배치 정상
  - 표시된 Summary와 추천(기온 36.0°C → HOT Context)이 DEC-014 Rule 결과와 일치했다.
  - 확인 후 Backend와 Preview 서버를 종료했다.
  - 캡처 (`docs/images/task-009/`): 실제 Backend 데이터, 390px / 768px / 1280px

    ![TASK-009 Dashboard 390 / 768 / 1280px](images/task-009/dashboard-390-768-1280.png)

- Backend 관련 Test 재실행: PASS (`WellnessRulePolicyTests` 36건, `CheckinControllerTests` 13건, `WellnessCheckinRepositoryTests` 3건, `MoodFitApplicationTests` 1건)
- `powershell -ExecutionPolicy Bypass -File .\scripts\verify.ps1`: PASS

### Remote CI Verification

Commit `c78d438`을 `main`에 push하여 Remote CI를 실행했다.

- Workflow run: https://github.com/youneedpython/today-v3/actions/runs/36796003446
- 결과: PASS (`success`)

| Job | 결과 | 소요 시간 |
|---|---|---|
| `frontend` | success | 약 14초 (Test 67건 포함) |
| `backend` | success | 약 57초 |

- `Sync Milestones`: success (새로 DONE이 된 Task 없음)

Remote CI Verification 완료 후 TASK-009 상태를 REVIEW로 변경했다.

### Human Review 승인

승인 일자: 2026-10-01

- Human이 TASK-009 Human Review를 승인했다.
- TASK-009 상태를 DONE으로 변경하고, TASK-010을 READY로 변경했다.

### 결과

Human Review 완료 / DONE

---

## TASK-010 — History / Trend

### 상태

DONE

### 문서 충돌과 Gate C 결정 (DEC-020)

- 실행 전 확인한 충돌: TASKS / PLAN / UX Spec은 History에 "추천 이력 요약"을 요구하지만, API Spec 6절은 History 응답을 최소 정보로 두고 "상세 Recommendation은 최신 또는 상세 조회에서 처리"로 정했다. 상세 조회 API는 명세에 없다.
- AGENTS.md 3.1절에 따라 구현 전에 선택지(A: History에 추천 이름 추가 / B: 요구사항 제외 / C: 최신 추천 재표시)를 보고했다.
- Human이 A안을 승인했다. → DEC-020, `prompts/21-TASK-010-HISTORY-TREND.md`

### 작업 내용

Backend (DEC-020):

- `HistoryItemResponse`에 `foodNames`, `musicTitles` 추가 (기존 필드 변경 없음)
- `CheckinServiceImpl`: 저장된 추천을 순서대로(Mood Item, Context Item) 이름 목록으로 변환
- `WellnessCheckinRepository`: History 조회 메서드에 `@EntityGraph(foodRecommendations, musicRecommendations)`를 적용해 추천까지 하나의 Query로 조회 (N+1 방지)
- DB Schema, Flyway Migration 변경 없음

Frontend:

- `src/features/history/useHistory.ts`: 최근 7일 History 조회 Hook (loading / empty / error / ready, 늦은 응답 무시)
- `src/features/history/WellnessTrend.tsx`: 최근 7일 Wellness Score Trend
  - 외부 Chart Library 없이 SVG + CSS로 구현 (DEC-010)
  - SVG는 Grid와 선만 그리고, 점과 축 Label은 HTML로 % 위치에 배치해 화면 폭과 관계없이 글자 크기를 유지
  - 그래프는 장식(`aria-hidden`)으로 처리하고 "기록 N건 · 최저 · 최고 · 최근" Text 요약 제공
  - 기록이 1건이면 선 없이 점 하나만 표시
- `src/features/history/HistoryRecordList.tsx`: 최신 기록부터 날짜 / 시각(`<time>`), Mood, Wellness Score, 주요 Metric, 날씨 / 기온, 추천 음식 / 음악 이력
- `src/features/history/HistoryPage.tsx`: Loading / API Error + 다시 시도 / Empty State(UX Spec 문구 "아직 충분한 기록이 없습니다. 오늘의 상태를 입력해 보세요." + Check-in CTA) / 결과
- `src/types/api.ts`: `HistoryItem`에 `foodNames`, `musicTitles` 추가

문서:

- `docs/05-API_SPEC.md` 6절 예시와 설명 갱신, `docs/09-DECISIONS.md` DEC-020 추가
- README: Frontend 설명에 History 추가, Prompt History `01 ~ 21`, `docs/images/` 구조 추가
- 화면 검토 캡처 기록 (Human 요청)
  - TASK-007 ~ TASK-010 화면 검토 캡처 8장을 `docs/images/task-XXX/`에 저장하고 각 Task Verification에 연결했다.
  - Pillow(기존 Local Python 환경)로 가로 최대 1600px, 256색 PNG로 압축했다. (3.9MB → 1.25MB)
  - AGENTS.md 8.1절에 "화면이 바뀌는 Task는 캡처를 `docs/images/task-XXX/`에 남기고 WORK_LOG에 연결한다" 규칙을 추가했다.

### 오류 및 해결

- 화면 검토에서 발견: 처음에는 SVG 전체가 화면 폭에 맞춰 확대 / 축소되어 1280px에서는 축 글자가 지나치게 커지고 390px에서는 약 6px로 읽기 어려웠다. (`preserveAspectRatio="none"`을 쓰면 점이 타원으로 찌그러짐)
  - 해결: SVG는 Grid / 선만 그리고 점과 Label을 HTML로 배치하는 구조로 변경했다. 재캡처로 모든 폭에서 같은 글자 크기와 원형 점을 확인했다.
- Route Test: History(`/history`)도 API를 호출하므로 fetch Stub을 URL별로 나눴다. (History는 빈 목록, Latest는 404) 준비 중 화면이 더 이상 없으므로 "준비 중" 확인 Test를 History Empty State 확인으로 바꿨다.

### Dependency / Contract

- 새로운 Dependency, 외부 Chart Library 추가 없음. `package.json`, `package-lock.json`, `build.gradle` 변경 없음.
- API Contract 변경: History 응답 필드 추가(DEC-020, Gate C 승인). 기존 필드 변경 없음.

### Verification

- Backend `gradlew test`: PASS, 55건 (추가 2건)
  - `CheckinControllerTests`: 저장 후 History 응답의 `foodNames` / `musicTitles` 순서 확인
  - `WellnessCheckinRepositoryTests`: 3건 조회 + 추천 접근 시 SQL 1회 (Hibernate Statistics)
  - `@EntityGraph`를 임시로 제거하면 N+1 Test가 실패함을 확인하고 원복했다.
- Frontend `npm test`: PASS, Test File 9개 / Test 73건 (TASK-010 추가 6건 + Route Test 조정)
  - `HistoryPage.test.tsx`: `days=7` 요청과 Loading, Trend 점 수 / 선 / Text 요약, 1건일 때 점만 표시, 최신순 기록 / Mood / Metric / 날씨 / 추천 이력, UX Spec Empty State, 오류 후 다시 시도
- Frontend `npm run build`: PASS
- 실제 Backend 연동 화면 검토
  - 새 Backend Jar를 Local MySQL(`moodfit_v3`)로 실행해 History 응답(4건, 각 `foodNames` / `musicTitles` 2개)을 확인했다.
  - `vite preview` + `/api` Proxy로 390px / 768px / 1280px 캡처: 가로 넘침 없음, Trend 글자 크기 일정, 기록 목록 Responsive 배치 정상
  - 확인 후 Backend와 Preview 서버를 종료했다.
  - 캡처 (`docs/images/task-010/`): 실제 Backend 데이터, 390px / 768px / 1280px
    - Trend 수정 전: 화면 폭에 따라 축 글자 크기가 달라짐 (390px에서 읽기 어려움)

      ![TASK-010 Trend 수정 전](images/task-010/history-trend-before.png)

    - Trend 수정 후: 모든 폭에서 같은 글자 크기와 원형 점

      ![TASK-010 Trend 수정 후](images/task-010/history-trend-after.png)

    - 기록 목록 (추천 이력 요약 포함)

      ![TASK-010 History 기록 목록](images/task-010/history-records-390-768-1280.png)

- 외부 Chart Library 미추가 확인: `package.json`에 Chart 관련 Dependency 없음
- `powershell -ExecutionPolicy Bypass -File .\scripts\verify.ps1`: PASS

### Remote CI Verification

Commit `c5bac2c`를 `main`에 push하여 Remote CI를 실행했다.

- Workflow run: https://github.com/youneedpython/today-v3/actions/runs/36802116810
- 결과: PASS (`success`)

| Job | 결과 | 소요 시간 |
|---|---|---|
| `frontend` | success | 약 20초 (Test 73건 포함) |
| `backend` | success | 약 67초 (Test 55건 포함) |

- `Sync Milestones`: success (새로 DONE이 된 Task 없음)

Remote CI Verification 완료 후 TASK-010 상태를 REVIEW로 변경했다.

### Human Review 승인

승인 일자: 2026-10-01

- Human이 TASK-010 Human Review를 승인했다.
- TASK-010 상태를 DONE으로 변경하고, TASK-011을 READY로 변경했다.
- Core Feature(Daily Check-in, Dashboard, History / Trend) 구현이 완료되었다.

### 결과

Human Review 완료 / DONE

---

## Out-of-Task — Repository 이름 변경 (`today-v3` → `MoodFit-v3`)

### 상태

DONE

### 작업 내용

- Human이 GitHub Repository 이름을 `today-v3`에서 `MoodFit-v3`로 변경했다. (2026-10-01)
  - 버전 표기는 관례에 따라 소문자 `v`를 사용했다.
- GitHub API로 변경을 확인했다.
  - `youneedpython/MoodFit-v3` 조회 성공
  - 이전 이름 `youneedpython/today-v3` 요청은 HTTP 301 Redirect
- Local `origin` Remote URL을 `https://github.com/youneedpython/MoodFit-v3.git`로 변경하고 `git fetch` / `git ls-remote`로 연결을 확인했다.
- `scripts/create-milestones.js`의 기본 `REPO_NAME`을 `MoodFit-v3`로 변경했다.
- README에 Repository 주소(이전 이름 포함)를 추가하고 구조의 Root 이름을 `MoodFit-v3/`로 변경했다.

### 변경하지 않은 것

- `docs/08-WORK_LOG.md`, `prompts/`의 과거 GitHub Actions 실행 링크(`today-v3`)는 과거 기록이므로 유지했다. GitHub Redirect로 열린다.
- `.github/workflows/`는 `$GITHUB_REPOSITORY`를 사용하므로 변경하지 않았다.
- Local 작업 폴더 이름(`today-v3`)은 변경하지 않았다.

---

## TASK-011 — Verification Hardening

### 상태

DONE

### 작업 내용

- Human이 TASK-011 실행을 승인했다.
- `docs/07-TASKS.md`의 TASK-011 상태를 `READY`에서 `IN_PROGRESS`로 변경한 뒤 Verification Hardening을 수행했다.
- Core Feature 완료 후 전체 Frontend / Backend Test와 Build를 Local Verification Harness로 다시 검증했다.
- Local Verification과 GitHub Actions CI의 검증 범위를 비교했다.
- 최신 Remote CI 실행 결과를 확인했다.
- TASK-012는 시작하지 않았다.

### Local Verification

PowerShell:

- Command: `powershell -ExecutionPolicy Bypass -File .\scripts\verify.ps1`
- Result: PASS
- Frontend Test: PASS, Test Files 9 passed / Tests 73 passed
- Frontend Build: PASS, `tsc --noEmit && vite build`
- Backend Test: PASS, `gradlew.bat test`
- Backend Build: PASS, `gradlew.bat build`

Bash:

- Command: `bash scripts/verify.sh`
- Result: PASS
- Frontend Test: PASS, Test Files 9 passed / Tests 73 passed
- Frontend Build: PASS, `tsc --noEmit && vite build`
- Backend Test: PASS, `./gradlew test`
- Backend Build: PASS, `./gradlew build`

### Local Verification / CI 범위 비교

| 검증 항목 | Local Verification | GitHub Actions CI | 동일 여부 |
|---|---|---|---|
| Frontend Test | `npm test` | `npm test` | 동일 |
| Frontend Build | `npm run build` | `npm run build` | 동일 |
| Backend Test | `gradlew test` | `./gradlew test` | 동등 |
| Backend Build | `gradlew build` | `./gradlew build` | 동등 |

### CI / Failure 정책 확인

- `.github/workflows/ci.yml`은 `frontend` / `backend` Job을 분리한다.
- Frontend Job은 `npm ci`, `npm test`, `npm run build`를 실행한다.
- Backend Job은 Java 21과 Gradle Wrapper를 사용해 `./gradlew test`, `./gradlew build`를 실행한다.
- MySQL Service Container는 사용하지 않는다.
- `continue-on-error`는 사용하지 않는다.
- Cache는 DEC-017 정책대로 사용하지 않는다.
- `git diff --check`: PASS. 단, Windows 작업 환경의 줄 끝 변환 경고가 표시되었으며 whitespace error는 없었다.

### Remote CI Verification

GitHub API로 최신 CI Workflow 실행 결과를 확인했다.

- Workflow run: https://github.com/youneedpython/MoodFit-v3/actions/runs/36807979956
- Head SHA: `c959f48cea85e9d10797017fdd4657d3d0ecc12a`
- Status: `completed`
- Conclusion: `success`
- Jobs: `frontend: success`, `backend: success`

현재 TASK-011의 문서 변경은 아직 Commit 전이므로, 이 문서 변경분에 대한 신규 Remote CI는 아직 실행되지 않았다.
다만 검증 대상 Source / Workflow는 최신 Commit `c959f48` 기준 Remote CI에서 성공했다.

### Verification Gap

> Human Review 보완(2026-10-01)에서 최초 기록("검증 공백은 발견하지 못했다")을 정정했다. 아래는 Claude 검토로 확인한 실제 Gap이다.

식별자: `GAP-n` = 검증 공백(Verification Gap), `FU-n` = 후속 보완 작업 후보(Follow-up). Gate A / B / C, DEC 번호와 구분하기 위해 두 글자 이상의 접두어를 사용한다.

Local Verification과 CI의 Core Test / Build 범위(Frontend Test / Build, Backend Test / Build)는 동일하거나 동등하다.
다만 다음 Verification Gap이 남아 있다.

| # | Gap | 내용 | 심각도 | 처리 |
|---|---|---|---|---|
| GAP-1 | History Rolling Window 미검증 | DEC-019 `days × 24시간` 규칙에서 Service가 Clock 기준으로 시작 시각을 계산하는 로직을 검증하는 Test가 없었다. (Repository Test는 시작 시각을 직접 전달) | 중 | **TASK-011에서 해결** (아래 Human Review 보완) |
| GAP-2 | Frontend / Backend Contract 자동 검증 없음 | Frontend Test는 모두 fetch Mock을 사용한다. Backend DTO 필드 이름이 바뀌어도 Frontend Test는 통과한다. 실제 연동은 수동 확인 / 캡처로만 검증했다. | 중 | 보완 Task 후보 FU-1 |
| GAP-3 | Local Verification의 의존성 설치 방식이 CI와 다름 | CI는 `npm ci`로 lock file 기준 설치, `verify.ps1` / `verify.sh`는 기존 `node_modules`를 사용한다. lock file 불일치가 Local에서 발견되지 않을 수 있다. | 하 | 보완 Task 후보 FU-2 |
| GAP-4 | Local Node.js Version 미강제 | CI는 Node.js `24.21.0` 고정, Local에는 `.nvmrc` / `engines`가 없다. (TASK-001 Review 당시 Local이 `24.16.0`이었던 사례 있음) | 하 | 보완 Task 후보 FU-2 |
| GAP-5 | 실제 MySQL 미검증 | Test / CI는 H2(MySQL Mode)만 사용한다. MySQL 고유 동작은 Human의 Local 실행으로만 확인했다. | 하 | 보완 Task 후보 FU-3 |
| GAP-6 | 날짜 / 시각 표시의 Timezone 의존 | 화면의 날짜 / 시각은 브라우저 Timezone을 따르며 이를 검증하는 Test가 없다. | 하 | 보완 Task 후보 FU-4 |

### 보완 Task 후보

| 후보 | 대상 Gap | 내용 | 필요 승인 |
|---|---|---|---|
| FU-1 | GAP-2 | API 계약 테스트 (Frontend / Backend): API 응답 형식을 양쪽이 지키는지 자동 검증 (예: 공유 예시 JSON 기반 Contract Test, 또는 E2E) | Gate C (검증 도구 / Dependency 추가) |
| FU-2 | GAP-3, GAP-4 | `verify.ps1` / `verify.sh`에 `npm ci` 단계 추가, `.nvmrc` 또는 `engines`로 Node.js Version 명시 | Human Approval (검증 Script 동작 변경) |
| FU-3 | GAP-5 | DB 연동 테스트 (실제 MySQL): Testcontainers 등으로 실제 MySQL에 연결한 Integration Test | Gate C (DEC-009 / DEC-019 재검토) |
| FU-4 | GAP-6 | 고정 Timezone 기준 날짜 표시 Test | Human Approval |
| FU-5 | — (TASK-012 CI Summary 관찰) | Gradle Wrapper Version 검토. `gradle/actions/setup-gradle` Summary가 승인 Version `8.14.5`(DEC-015)에 대해 "Gradle version is out of date"를 안내함. Spring Boot 4.1.1은 Gradle 8.14+ / 9.x를 지원 | Human Approval (DEC-015 기술 Version 변경) |

용어:

- API 계약 테스트(Contract Test): Frontend와 Backend를 함께 띄우지 않고, 약속한 API 형식을 양쪽이 각각 지키는지 검증한다.
- DB 연동 테스트(Integration Test): Backend를 실제 MySQL에 연결해 함께 동작하는지 검증한다.

FU-1 ~ FU-5는 2026-10-01 Human 지시로 TASK-013 ~ TASK-017에 등록되었다. (`docs/07-TASKS.md`)

| FU | 등록 Task |
|---|---|
| FU-2 | TASK-013 |
| FU-5 | TASK-014 |
| FU-4 | TASK-015 |
| FU-3 | TASK-016 |
| FU-1 | TASK-017 |

TASK-011 문서 변경분은 Commit / Push 후 Remote CI가 다시 실행된다.

### 오류 및 해결

- GitHub CLI(`gh`)가 Local 환경에 설치되어 있지 않아 `gh run list`는 사용할 수 없었다.
  - 해결: GitHub REST API를 사용해 최신 CI Workflow Run과 Job 결과를 확인했다.

### Human Review 보완

검토 일자: 2026-10-01

발견 내용:

- 최초 기록의 "Verification Gap 없음" 결론이 실제와 달랐다. TASK-011 완료 조건("남은 Verification Gap이 명확히 기록된다")을 충족하도록 위 Gap 목록(GAP-1 ~ GAP-6)과 보완 Task 후보(FU-1 ~ FU-4)로 정정했다.
- Claude가 `verify.ps1`, `verify.sh`를 다시 실행해 기록과 같은 결과(PASS)임을 확인했고, 인용된 Remote CI(`c959f48`)도 success임을 확인했다.

보완 내용 (GAP-1 해결, Human 지시):

- `CheckinControllerTests`에 History Rolling Window Test 2건 추가 (고정 Clock `2026-09-30T00:00:00Z`)
  - 기본 7일: 경계 1초 전 기록 제외, 정확히 7일 전 기록 포함, 오름차순
  - `days=1` / `days=30`: 각 경계의 포함 / 제외 확인
- Service의 기간 계산을 하루 늘리도록 임시 변경하면 두 Test가 모두 실패함을 확인하고 원복했다.
- Production Source, Dependency, 검증 Script, CI Workflow는 변경하지 않았다.

재검증 결과:

- Backend `gradlew test`: PASS, 57건 (`CheckinControllerTests` 16건, `WellnessRulePolicyTests` 36건, `WellnessCheckinRepositoryTests` 4건, `MoodFitApplicationTests` 1건)
- `powershell -ExecutionPolicy Bypass -File .\scripts\verify.ps1`: PASS
- Identifier 정리: Gate A / B / C와 혼동되지 않도록 `G1 ~ G6` → `GAP-1 ~ GAP-6`, `B1 ~ B4` → `FU-1 ~ FU-4`로 변경 (Human 승인)

Remote CI (commit `d799259`):

- Workflow run: https://github.com/youneedpython/MoodFit-v3/actions/runs/36810290844
- `frontend`: success, `backend`: success (Rolling Window Test 포함 57건)

### Human Review 승인

승인 일자: 2026-10-01

- Human이 TASK-011 Human Review를 승인했다.
- TASK-011 상태를 DONE으로 변경했다.
- TASK-012는 선행 조건을 충족했지만 Gate C 대상이므로 BLOCKED(Gate C 대기)로 유지했다.

### 결과

Human Review 완료 / DONE

---

## TASK-012 — GitHub Actions Bot

### 상태

DONE

### 작업 내용 (DEC-021)

- `.github/workflows/ci.yml`의 `frontend` / `backend` Job 마지막에 Step Summary 작성 Step 추가
  - `Write frontend summary`: `npm ci` / `npm test` / `npm run build` 결과
  - `Write backend summary`: `./gradlew test` / `./gradlew build` 결과
  - 공통: Commit SHA, Workflow Run URL, MySQL Service Container 미사용(DEC-009)
- 실패 시 기록 (DEC-021 Human Review 보완)
  - Summary Step은 `if: always()`로 실행한다.
  - 기존 Install / Test / Build Step에 `id`를 붙이고 `steps.<id>.outcome`을 그대로 기록한다. (success / failure / skipped / cancelled / 미실행)
  - Step outcome은 `env`로 전달해 Script에 직접 치환하지 않는다.
  - Summary Step은 항상 exit code 0으로 끝나며 Job의 성공 / 실패 판정을 바꾸지 않는다. `continue-on-error`는 사용하지 않는다.
- `.github/workflows/milestones.yml`(DEC-018)은 변경하지 않았다.

### 변경하지 않은 것

- Trigger(`push` / `pull_request` to `main`), Permissions(`contents: read`)
- 기존 Checkout / Setup / Install / Test / Build Step의 이름 · 명령 · 설정 (`id`만 추가)
- 추가 GitHub Action, Dependency, Secret / PAT 없음
- Source Code / 문서 자동 수정, Commit / Push / PR, Comment, Issue, Label, Release 없음
- Frontend / Backend Source, `scripts/verify.ps1`, `scripts/verify.sh`

### Verification

- Workflow 정적 확인 (이전 Commit의 `ci.yml`과 Python YAML 비교)
  - Trigger 동일, Permissions 동일(`contents: read`)
  - 기존 Step 이름 / 명령 / `uses` / `with` / `working-directory` 동일
  - 두 Summary Step 모두 `if: always()`, `continue-on-error` 없음, 추가 Action 없음
- Summary Script 실행 확인 (Workflow에서 Script를 추출해 Local bash로 실행)

| 시나리오 | 기록 결과 | Script exit code |
|---|---|---|
| Frontend 모두 성공 | Install / Test / Build `✅ success` | 0 |
| Frontend Test 실패 | Test `❌ failure`, Build `⏭️ skipped` | 0 |
| Frontend Install 실패 | Install `❌ failure`, Test / Build `⏭️ skipped` | 0 |
| Backend Build 실패 | Test `✅ success`, Build `❌ failure` | 0 |
| Backend Checkout 실패 (Step 미실행) | Test / Build `– not run` | 0 |

- 실패 경로의 실제 GitHub Actions 실행은 확인하지 않았다. 현재 Trigger가 `main` Push / Pull Request뿐이고 `main`에 실패 Commit을 올리지 않기 위해, 위 Local Script 시나리오와 Workflow 구조(`if: always()`, Step outcome)로 확인했다.
- `powershell -ExecutionPolicy Bypass -File .\scripts\verify.ps1`: PASS (Frontend 73건, Backend Test / Build)
- 화면(UI) 변경이 없는 Task이므로 AGENTS.md 8.1 캡처 대상이 아니다. Remote CI의 Summary 화면은 Human Review에서 확인한다.

### Remote CI Verification

Commit `e0f92de`를 `main`에 push하여 Remote CI를 실행했다.

- Workflow run: https://github.com/youneedpython/MoodFit-v3/actions/runs/36814475255
- 결과: PASS (`success`)

| Job | 결과 | 소요 시간 | Summary Step |
|---|---|---|---|
| `frontend` | success | 약 14초 | `Write frontend summary`: success |
| `backend` | success | 약 59초 | `Write backend summary`: success |

- GitHub REST API로 Job Step 목록을 조회해 두 Summary Step이 실행되었음을 확인했다.
- Step Summary 내용은 REST API로 조회할 수 없으므로 Human Review에서 Workflow Run의 Summary 화면으로 확인한다.
- `Sync Milestones`: success (새로 DONE이 된 Task 없음)

Remote CI Verification 완료 후 TASK-012 상태를 REVIEW로 변경했다.

### Human Review

검토 일자: 2026-10-01

- Human이 GitHub Actions Workflow Run의 Summary 화면을 확인하고 캡처를 첨부했다. (Run: https://github.com/youneedpython/MoodFit-v3/actions/runs/36814655358, commit `9c798e1`)
  - `## Frontend`: Install / Test / Build 모두 `✅ success`, Commit SHA, Workflow Run URL, MySQL 미사용 표시
  - `## Backend`: Test / Build 모두 `✅ success`, Commit SHA, Workflow Run URL, MySQL 미사용 표시
- 캡처 (`docs/images/task-012/`)

  ![TASK-012 Frontend Summary](images/task-012/ci-summary-frontend.png)

  ![TASK-012 Backend Summary](images/task-012/ci-summary-backend.png)

추가 관찰:

- Frontend Summary 위의 "Vitest Test Report"는 Vitest가 GitHub Actions 환경에서 자동으로 작성하는 Job Summary이다. (Test File 9개 / Test 73건) 설정 / Dependency 변경 없이 생성되며 DEC-021 범위와 충돌하지 않는다.
- Backend Summary 아래의 "Gradle Builds"는 `gradle/actions/setup-gradle`이 기본으로 작성하는 Summary이다.
  - "Caching was disabled"는 DEC-017(Cache 미사용)대로 동작함을 보여준다.
  - "Gradle version is out of date" 안내가 있어 Gradle Version 검토를 후속 보완 작업 후보 FU-5로 추가했다. (TASK-011 섹션, Human 승인)

### Human Review 승인

승인 일자: 2026-10-01

- Human이 TASK-012 Human Review를 승인했다.
- TASK-012 상태를 DONE으로 변경했다.
- TASK-001 ~ TASK-012 계획 Task가 모두 완료되었다.

### 결과

Human Review 완료 / DONE

---

## TASK-013 — Local Verification Environment Alignment

### 상태

DONE (Human Approval 완료: 2026-10-01)

### 작업 내용 (FU-2 — GAP-3 / GAP-4)

- Repository Root에 `.nvmrc` 추가: `24.21.0` (DEC-015, CI `setup-node`의 `node-version`과 동일)
- `scripts/verify.ps1`, `scripts/verify.sh`
  - 시작 시 Local Node.js Version을 `.nvmrc`와 비교한다.
    - 일치: `Node.js 24.21.0 (matches .nvmrc)` 출력
    - 불일치: 경고만 출력하고 검증은 계속 진행한다. (Version 강제는 범위 밖)
  - Frontend Test 전에 `Frontend install (npm ci)` 단계를 추가했다. CI와 같이 `package-lock.json` 기준으로 설치한다.
  - `npm ci` 실패 시 기존 단계와 같이 즉시 중단하고 exit code 1로 끝난다.

### 변경하지 않은 것

- `frontend/package.json`, `frontend/package-lock.json` (`engines` 미추가, Dependency 변경 없음 → Gate C 대상 아님)
- `.github/workflows/ci.yml` (`node-version: '24.21.0'` 유지)
- Backend 단계(`gradlew test` / `gradlew build`)

`engines` 대신 `.nvmrc`를 선택한 이유:

- `engines`는 npm 기본 설정에서 경고만 출력하고, Root package 변경이 `package-lock.json`에도 기록된다.
- `.nvmrc`는 lock file을 건드리지 않고, nvm / fnm 등 Version 관리 도구와 검증 Script가 같은 값을 읽을 수 있다.

### Local Verification / CI Frontend 단계 비교

| 단계 | CI (`frontend` Job) | `verify.ps1` | `verify.sh` |
|---|---|---|---|
| Node.js Version | `setup-node` `24.21.0` 고정 | `.nvmrc`와 비교, 불일치 시 경고 | `.nvmrc`와 비교, 불일치 시 경고 |
| 의존성 설치 | `npm ci` | `npm.cmd ci` | `npm ci` |
| Test | `npm test` | `npm.cmd test` | `npm test` |
| Build | `npm run build` | `npm.cmd run build` | `npm run build` |

남은 차이: CI는 Node.js Version을 설치해 고정하고, Local은 설치된 Node.js를 사용하며 불일치를 경고로 안내한다.

### Verification

성공 경로 (Local Node.js `24.21.0`):

| Script | 결과 |
|---|---|
| `sh scripts/verify.sh` | PASS (exit 0) — `npm ci` 99 packages, Frontend Test 73건, Build, Backend Test / Build |
| `powershell -ExecutionPolicy Bypass -File .\scripts\verify.ps1` | PASS (exit 0) — 같은 단계 모두 성공 |

실패 / 경고 경로 (임시 디렉터리의 가짜 `npm` / `node`를 PATH 앞에 두고 실행, 검증 후 삭제):

| 시나리오 | `verify.sh` | `verify.ps1` |
|---|---|---|
| `npm ci` 실패 | `Frontend install (npm ci)`에서 중단, exit 1, Test 미실행 | `Frontend install (npm ci) failed with exit code 1.`, exit 1, Test 미실행 |
| Node.js `22.0.0` (불일치) | `WARNING: Node.js 22.0.0 is in use, but .nvmrc expects 24.21.0` 출력 후 끝까지 진행, exit 0 | 같은 경고 출력 후 끝까지 진행, exit 0 |

- `git status` 확인: `npm ci` 실행 후 `frontend/package-lock.json` 변경 없음
- 화면(UI) 변경이 없는 Task이므로 AGENTS.md 8.1 캡처 대상이 아니다.

### 참고

- `npm ci`는 `node_modules`를 삭제 후 다시 설치한다. `npm run dev`(Vite) 등이 실행 중이면 Windows에서 파일 잠금으로 실패할 수 있으므로 검증 전에 종료한다.
- 검증 시간이 `npm ci`만큼(Local 약 3 ~ 9초) 늘어난다.

### Remote CI Verification

Commit을 둘로 나누어 `main`에 push했다. (Human 지시)

- `ffb8387` docs: Post-MVP 보완 Task 등록 및 Milestone 연결
- `db2567f` feat: TASK-013 Local Verification 환경 정렬

| Workflow | 결과 | 비고 |
|---|---|---|
| CI | success | Run: https://github.com/youneedpython/MoodFit-v3/actions/runs/36819501929 |
| `frontend` Job | success | 약 18초 (`npm ci` → `npm test` → `npm run build`) |
| `backend` Job | success | 약 66초 |
| Sync Milestones | success | 새로 DONE이 된 Task 없음 |

- CI Workflow는 변경하지 않았으므로 Local Script 변경이 CI 결과에 영향을 주지 않음을 확인했다.

Remote CI Verification 완료 후 TASK-013 상태를 REVIEW로 변경했다.

- REVIEW 반영 Commit `45f2c04`의 CI / Sync Milestones도 success (Run: https://github.com/youneedpython/MoodFit-v3/actions/runs/36820719335)

### Human Review 승인

승인 일자: 2026-10-01

- Human이 TASK-013 Human Review를 승인했다.
- TASK-013 상태를 DONE으로 변경했다. (Milestone 13은 `Sync Milestones`가 자동 Close)
- Current Task를 TASK-014(BLOCKED, Human Approval 대기)로 변경했다.

### 결과

Human Review 완료 / DONE

---

## TASK-014 — Gradle Wrapper Version Review

### 상태

DONE (Human Approval 완료: 2026-10-01, Human 결정: B안 `9.8.0`으로 변경)

### 검토 배경 (FU-5)

TASK-012 Human Review에서 `gradle/actions/setup-gradle` Summary에 "Gradle version is out of date" 안내가 표시되었다.

### 확인 자료 (2026-10-01 기준)

| 항목 | 내용 | 출처 |
|---|---|---|
| 현재 Wrapper | Gradle `8.14.5` (2026-05-07 배포, 8.14 계열 최신 Patch) | `backend/gradle/wrapper/gradle-wrapper.properties`, services.gradle.org |
| 최신 Gradle | `9.8.0` (2026-09-24 배포) | services.gradle.org `versions/current` |
| Spring Boot 4.1.1 지원 범위 | Gradle 8.x (8.14 이상)와 9.x | Spring Boot 4.1 System Requirements / Gradle Plugin 문서 |
| `io.spring.dependency-management` | `1.1.7` (현재 최신 배포) | Gradle Plugin Portal |
| Java | Local / CI 모두 Java 21 (Gradle 9 실행 요구 Java 17 이상 충족) | DEC-015, `ci.yml` |

### 검증

| 대상 | 명령 | 결과 |
|---|---|---|
| 현재 `8.14.5` (Repository) | `gradlew clean test build --warning-mode all --no-build-cache` | BUILD SUCCESSFUL, Test 57건 통과, Deprecation 경고 0건 |
| 후보 `9.8.0` (Repository 밖 임시 사본) | `gradlew clean test build --warning-mode all` | BUILD SUCCESSFUL, Test 57건 통과, Deprecation 경고 0건, 실행 Jar / plain Jar 생성 |

- 임시 사본은 `backend`를 Scratchpad에 복사하고 `distributionUrl`만 `gradle-9.8.0-bin.zip`으로 바꿔 실행했다. 검증 후 Daemon을 종료하고 사본을 삭제했다.
- Repository의 Wrapper 설정, Wrapper jar / Script, `build.gradle`, DEC-015는 변경하지 않았다.
- `build.gradle`은 Groovy DSL 기본 기능만 사용하며, 9.8.0에서 Build Script 수정 없이 동작했다.
- 9.8.0 실행 시 Configuration Cache 사용 권장 안내가 출력되었다. (선택 기능이며 이번 범위 밖)

### 선택지

| 선택지 | 장점 | 단점 / 영향 |
|---|---|---|
| A. `8.14.5` 유지 | 변경 없음, 이미 검증된 상태 | CI Summary의 "out of date" 안내가 계속 표시된다. Gradle 8은 이전 Major로 신규 기능 없이 중요 수정만 제공된다 |
| B. `9.8.0`으로 변경 | 최신 지원 Version, CI 안내 해소, Spring Boot 4.1.1 지원 범위 안 | `gradlew wrapper --gradle-version 9.8.0`으로 Wrapper jar / Script / properties 갱신, DEC-015 갱신, Local / Remote CI 재검증 필요 |

### Human 결정 및 변경 (B안)

Human이 B안(`9.8.0`으로 변경)을 선택했다.

- `gradlew wrapper --gradle-version 9.8.0 --distribution-type bin`을 두 번 실행했다. (첫 실행은 `8.14.5`로 properties 갱신, 두 번째 실행은 `9.8.0`으로 Wrapper jar / Script 재생성)
- 변경 파일
  - `backend/gradle/wrapper/gradle-wrapper.properties`: `distributionUrl` → `gradle-9.8.0-bin.zip`, Gradle 9 기본값 `retries=0`, `retryBackOffMs=500` 추가
  - `backend/gradle/wrapper/gradle-wrapper.jar`: SHA-256 `238e777f…21abd5`, Gradle 공식 `gradle-9.8.0-wrapper.jar.sha256`과 일치
  - `backend/gradlew`, `backend/gradlew.bat`: Gradle 9.8.0 표준 Template으로 재생성 (직접 수정 없음, 실행 권한 유지)
- `build.gradle`, `settings.gradle`, Plugin / Dependency Version은 변경하지 않았다.
- 문서: DEC-015 Version / 고정 정책 / 변경 이력, README 기술 스택, PLAN Gate A 규칙에 변경 사실 추가
- 과거 기록(Prompt 04 / 05 / 08 / 09, TASK-001 명세, 이전 Work Log)의 `8.14.5` 표기는 당시 결정 기록이므로 유지했다.

### Local Verification (`9.8.0`)

| 명령 | 결과 |
|---|---|
| `gradlew --version` | Gradle 9.8.0 |
| `sh scripts/verify.sh` (`gradlew clean` 후) | PASS (exit 0) — `npm ci`, Frontend Test 73건, Build, Backend Test / Build |
| `powershell -ExecutionPolicy Bypass -File .\scripts\verify.ps1` | PASS (exit 0) |

- Gradle 9.8.0은 Build마다 Configuration Cache 사용 권장 안내를 출력한다. 안내 문구일 뿐 결과에는 영향이 없으며, 사용 여부는 이번 범위 밖이다.
- Remote CI에서 `gradle/actions/setup-gradle`의 Wrapper jar 검증과 "out of date" 안내 해소를 확인한다.

### Remote CI Verification

Commit `3b33dff`를 `main`에 push하여 Remote CI를 실행했다.

- Workflow run: https://github.com/youneedpython/MoodFit-v3/actions/runs/36823802991
- 결과: PASS (`success`)

| Job | 결과 | 소요 시간 | 비고 |
|---|---|---|---|
| `frontend` | success | 약 17초 | 변경 없음 |
| `backend` | success | 약 61초 | `Setup Gradle`(Wrapper jar 검증 포함), Test, Build, Summary 모두 success |
| Sync Milestones | success | — | 새로 DONE이 된 Task 없음 |

- GitHub REST API로 Job Step 목록을 조회해 확인했다.
- Step Summary의 "Gradle Builds" 내용(Gradle Version, "out of date" 안내 해소)은 REST API로 조회할 수 없으므로 Human Review에서 Summary 화면으로 확인한다.

Remote CI Verification 완료 후 TASK-014 상태를 REVIEW로 변경했다.

- Human이 Summary 화면에서 "Gradle version is out of date" 안내가 사라진 것을 확인했다. (2026-10-01)

### Human Review 관찰 — Runner Annotation

Human이 Workflow Run 화면의 Annotations(notice 2건)를 캡처해 첨부했다.

![TASK-014 CI Annotations](images/task-014/ci-annotations-ubuntu-latest.png)

- `frontend` / `backend` Job: "The ubuntu-latest label will migrate to Ubuntu 26 beginning October 19, 2026."
- 의미: `runs-on: ubuntu-latest`를 사용하는 Job은 2026-10-19부터 Ubuntu 26 Runner에서 실행된다.
- 대상: `ci.yml`의 `frontend` / `backend`, `milestones.yml`의 Sync Job (DEC-017 / DEC-018 Runner: `ubuntu-latest`)
- 영향 예상: Node.js `24.21.0`(`setup-node`), Java 21(`setup-java`), Gradle Wrapper `9.8.0`은 Workflow에서 Version을 직접 지정하므로 OS 변경의 직접 영향은 작다. 다만 OS 기본 도구(`gh` 등) Version이 바뀔 수 있다.
- notice(정보) 수준이며 TASK-014 결과(Job 성공)에는 영향이 없다.
- 후속 보완 작업 후보 FU-6으로 기록한다.

| 후보 | 내용 | 필요 승인 |
|---|---|---|
| FU-6 | Runner OS 전환 대응: `ubuntu-latest` 유지 후 2026-10-19 이후 CI 결과 확인, 또는 `ubuntu-24.04`로 고정 | CI Workflow 변경 시 Gate C (DEC-017 / DEC-018) |

### Human Review 승인

승인 일자: 2026-10-01

- Human이 TASK-014 Human Review를 승인했다.
- TASK-014 상태를 DONE으로 변경했다. (Milestone 14는 `Sync Milestones`가 자동 Close)
- Current Task를 TASK-015(BLOCKED, Human Approval 대기)로 변경했다.
- FU-6의 Task 등록 여부는 Human 결정 대기이다.

### 결과

Human Review 완료 / DONE

---

## TASK-015 — Timezone-fixed Date Display Test

### 상태

DONE (Human Approval 완료: 2026-10-01)

### 작업 내용 (FU-4 — GAP-6)

- 화면의 날짜 / 시각 표시가 Runtime Timezone에 의존하던 문제를 보완했다.
- Frontend 날짜 / 시각 표시 기준 Timezone을 `Asia/Seoul`로 명시했다.
- 공통 포맷 유틸을 추가했다.
  - `frontend/src/utils/dateTime.ts`
  - `MOODFIT_TIME_ZONE = "Asia/Seoul"`
  - `formatDisplayDateTime`
  - `formatDisplayDateTimeWithWeekday`
  - `formatTrendDate`
  - `formatHeaderDate`
- 기존 날짜 표시 지점을 공통 유틸로 교체했다.
  - Header 오늘 날짜
  - Check-in 결과 기록 시각
  - Dashboard 최신 기록 시각
  - History 기록 목록 날짜 / 시각
  - History Trend 축 Label
- 고정 Timezone 기준 Frontend Test를 추가했다.
  - UTC 기준 `2026-09-30T15:30:00Z`가 `Asia/Seoul` 기준 `2026-10-01 00:30`으로 표시되는 경계값을 검증한다.

### 변경하지 않은 것

- 새로운 Dependency 추가 없음
- `package.json`, `package-lock.json` 변경 없음
- Backend Source 변경 없음
- CI Workflow 변경 없음
- TASK-016 이후 작업 시작하지 않음

### Verification

Frontend:

| Command | 결과 |
|---|---|
| `npm test` | PASS, Test Files 10 passed / Tests 76 passed |
| `npm run build` | PASS |

Local Verification:

| Script | 결과 |
|---|---|
| `powershell -ExecutionPolicy Bypass -File .\scripts\verify.ps1` | PASS, Node.js `24.21.0` matches `.nvmrc`, Frontend `npm ci` / Test / Build, Backend Test / Build |
| `bash scripts/verify.sh` | PASS, Frontend `npm ci` / Test / Build, Backend Test / Build |

`bash scripts/verify.sh` 실행 시 현재 Shell에서 `node --version` 탐지는 실패해 다음 경고가 출력되었다.

```text
WARNING: Node.js not found is in use, but .nvmrc expects 24.21.0 (CI uses 24.21.0).
```

이는 TASK-013에서 승인한 정책상 경고이며 검증은 계속 진행되었다. `npm ci`, `npm test`, `npm run build`는 모두 성공했다.

### Human Review 보완

검토 일자: 2026-10-01

Codex 구현 결과를 검토하며 다음을 확인했고, Human 결정에 따라 보완했다.

| # | 확인 내용 | Human 결정 / 보완 |
|---|---|---|
| 1 | Task 명세는 "고정 Timezone 기준 검증"이지만, 구현은 화면 표시 자체를 브라우저 Timezone → `Asia/Seoul`로 변경했다. 승인 기록(DEC)이 없었다. | A안 채택: `Asia/Seoul` 표시 유지, DEC-022로 기록 |
| 2 | 실행 Timezone이 `Asia/Seoul`이면 `timeZone` Option을 제거해도 Test가 통과했다. (회귀를 CI(UTC)에서만 발견) | `vite.config.ts`에 `test.env.TZ = "UTC"` 추가 |
| 3 | `docs/08-WORK_LOG.md`의 TASK-001 / TASK-002, TASK-002 / TASK-003 사이 구분선(`---`) 2개가 의도치 않게 삭제되었다. | 복구 |
| 4 | `verify.sh`가 `node`를 찾지 못한 Shell(WSL 등 `node.exe`만 실행 가능한 환경)에서 `Node.js not found is in use` 경고를 출력했다. (TASK-013 검사의 한계) | `node` 실패 시 `node.exe`로 재확인, 미탐지 시 별도 경고 문구. `verify.ps1`도 `node` 미탐지 시 별도 경고 후 계속 진행 |

보완 검증:

- 회귀 탐지 (`dateTime.ts`에서 `timeZone` Option을 임시 제거 후 실행, 검증 후 원복)

| 조건 | 보완 전 | 보완 후 (`test.env.TZ = "UTC"`) |
|---|---|---|
| Shell `TZ=Asia/Seoul` | 3건 모두 통과 (회귀 미발견) | 2건 실패 (회귀 발견) |
| Shell `TZ=UTC` | 2건 실패 | 2건 실패 |

- 실행 Timezone별 전체 Frontend Test (보완 전 구현 기준): `Asia/Seoul`, `UTC`, `America/Los_Angeles`, `Pacific/Kiritimati` 모두 76건 통과
- Node.js 탐지 (가짜 `npm` / `node.exe`를 PATH 앞에 두고 실행, 검증 후 삭제)

| 시나리오 | `verify.sh` | `verify.ps1` |
|---|---|---|
| `node` / `node.exe` 없음 | `WARNING: Node.js version could not be detected (node / node.exe not found)` 후 계속 진행 | `WARNING: Node.js version could not be detected (node not found)` 후 계속 진행 |
| `node.exe`만 있음 | `Node.js 24.21.0 (matches .nvmrc)` | 해당 없음 (PowerShell은 `node.exe`를 `node`로 찾음) |

- 보완 후 Local Verification: `sh scripts/verify.sh`, `verify.ps1` 모두 PASS (Node.js `24.21.0` matches `.nvmrc`, Frontend Test Files 10 / Tests 76, Build, Backend Test / Build)
- 화면 캡처: 생략 (Human 지시: 표시 형식이 이전과 같으면 생략)
  - 이전 구현(브라우저 Timezone, KST 환경)과 현재 구현(`Asia/Seoul` 고정)의 표시 문자열을 5개 표시 지점의 4개 형식 × 경계값 포함 3개 시각으로 비교한 결과 모두 같았다. (예: `10월 1일 (목) 오전 12:30`, `10. 1.`, `2026년 10월 1일 목요일`)

### Remote CI Verification

Commit `c8807a1`를 `main`에 push하여 Remote CI를 실행했다.

- Workflow run: https://github.com/youneedpython/MoodFit-v3/actions/runs/36828028771
- 결과: PASS (`success`)

| Job | 결과 | 소요 시간 |
|---|---|---|
| `frontend` | success | 약 19초 |
| `backend` | success | 약 52초 |
| Sync Milestones | success | — |

### Human Review 승인

승인 일자: 2026-10-01

- Human이 Commit / Push 지시와 함께 TASK-015 Human Review를 승인했다. ("커밋/푸시! 승인!")
- Remote CI 성공을 확인한 뒤 TASK-015 상태를 DONE으로 변경했다. (Milestone 15는 `Sync Milestones`가 자동 Close)
- Current Task를 TASK-016(BLOCKED, Gate C 승인 대기)으로 변경했다.

### 결과

Human Review 완료 / DONE

---

## TASK-016 — DB 연동 테스트 (실제 MySQL)

### 상태

REVIEW (Gate C 승인: DEC-023, 2026-10-01)

### Gate C 결정 (DEC-023)

| 항목 | 결정 |
|---|---|
| DB 연동 방식 | Testcontainers MySQL (Option A) |
| MySQL Image | `mysql:8.0.46` (Local 개발 MySQL과 동일) |
| Docker 없는 Local | 건너뛰고(SKIPPED) 표시 |
| CI Backend Summary | "MySQL: Testcontainers(`mysql:8.0.46`, DEC-023)"로 문구 변경 |

검토 자료: `prompts/29-TASK-016-DB-INTEGRATION-TEST-GATE-C-REVIEW.md`. DEC-009는 DEC-023으로 대체되었다.

### 작업 내용

- `backend/build.gradle`
  - `testImplementation` 추가 (Version은 Spring Boot `4.1.1` BOM 관리): `spring-boot-testcontainers` 4.1.1, `testcontainers-junit-jupiter` 2.0.5, `testcontainers-mysql` 2.0.5
  - `test` Task `testLogging.events 'skipped', 'failed'`: 건너뛴 / 실패한 Test를 Test 출력에 표시
- `backend/src/test/java/com/moodfit/mysql/MySqlIntegrationTests.java` (5건)
  - `@Testcontainers(disabledWithoutDocker = true)`, `@Container @ServiceConnection MySQLContainer("mysql:8.0.46")`

| Test | 검증 내용 |
|---|---|
| `connectsToMySqlAndAppliesFlywayMigration` | MySQL `8.0.46` 연결, Flyway V1 적용(`flyway_schema_history`), Table 3개 생성, `ddl-auto=validate` 통과 |
| `storesRecordedAtAsUtcWithMicrosecondPrecision` | DB에 저장된 원본 값이 `2026-09-30 12:34:56.123456`(UTC, Microsecond) — JVM Timezone(Local KST / CI UTC)과 무관 (DEC-019) |
| `preservesTemperatureDecimalAndKoreanText` | `DECIMAL(3,1)` 경계값 `-30.0` / `50.0`, 한글 Summary / 추천 이름 저장 / 조회 |
| `findsHistoryWithinRollingWindowInOneQuery` | Rolling Window 조회, 오름차순, 추천 순서, 추천까지 Query 1회 (DEC-020) |
| `createThenReadLatestAndHistoryThroughApi` | API 저장(`POST /api/check-ins`) → 최신 / History 조회 흐름 |

- `backend/src/test/java/com/moodfit/mysql/DockerAvailabilityTests.java`
  - `CI=true`일 때만 실행되어 Docker가 없으면 실패한다. (CI에서 MySQL 연동 테스트가 조용히 건너뛰어지는 것을 방지)
  - Local(`CI` 미설정)에서는 항상 SKIPPED로 표시된다.
- `.github/workflows/ci.yml`: Backend Summary의 MySQL 문구만 변경 (Frontend Summary의 "MySQL Service Container: 사용하지 않음" 문구는 Frontend가 MySQL을 사용하지 않으므로 유지)
- `README.md`: Local 실행 안내에 MySQL 연동 테스트 / Docker 조건 추가

### 변경하지 않은 것

- DB Schema / Flyway Migration, 운영 `application.properties`
- 기존 H2 Test(`src/test/resources/application.properties`, 기존 Test Class)
- `ci.yml` Trigger / Permission / Cache 정책 / 실행 명령 (GitHub Actions가 `CI=true`를 기본 설정)
- `scripts/verify.ps1`, `scripts/verify.sh`

### Verification

Docker 실행 / 미실행 경로 (`gradlew cleanTest test --tests "com.moodfit.mysql.*"`):

| 조건 | MySqlIntegrationTests | DockerAvailabilityTests | Build |
|---|---|---|---|
| Local, Docker 실행 | 5건 통과 (약 35초) | SKIPPED | 성공 |
| Local, Docker 미실행 | 5건 SKIPPED (출력에 표시) | SKIPPED | 성공 |
| `CI=true`, Docker 미실행 | 5건 SKIPPED | 실패 | 실패 |
| `CI=true`, Docker 실행 | 5건 통과 | 통과 | 성공 |

- Docker 미실행 경로는 `docker desktop stop`으로 실제로 중지해 확인한 뒤 `docker desktop start`로 다시 실행했다. (실행 중 Container 없음 확인 후)
- `DOCKER_HOST` / `TESTCONTAINERS_DOCKER_CLIENT_STRATEGY` 환경변수로는 재현되지 않았다. Testcontainers가 설정 Strategy 실패 시 다른 Strategy(Npipe)로 다시 연결하기 때문이다.
- 개발 중 오류: 트랜잭션 밖 Lazy 로딩(`LazyInitializationException`), 응답 JSON 경로(`$.weather.temperature`) — Test Code 수정으로 해결

Local Verification:

| Script | 결과 |
|---|---|
| `sh scripts/verify.sh` (Docker 실행) | PASS — Frontend Test 76, Build, Backend Test 63건(SKIPPED 1: CI 전용), Build |
| `powershell -ExecutionPolicy Bypass -File .\scripts\verify.ps1` (Docker 실행) | PASS |
| `sh scripts/verify.sh` (Docker 미실행) | PASS — Backend Test 출력에 MySQL 연동 테스트 5건 SKIPPED 표시 |

- Backend Test 시간: 약 2초 → 약 33 ~ 35초 (Container 시작 포함, Image 캐시 상태)
- 화면(UI) 변경이 없는 Task이므로 AGENTS.md 8.1 캡처 대상이 아니다.

### Remote CI Verification

Commit을 둘로 나누어 `main`에 push했다. (Human 지시)

- `74cdd3c` docs: TASK-016 Gate C 검토 및 승인 반영 (DEC-023)
- `2f693d4` test: TASK-016 MySQL DB 연동 테스트 (Testcontainers) 추가

- Workflow run: https://github.com/youneedpython/MoodFit-v3/actions/runs/36836934133
- 결과: PASS (`success`)

| Job / Step | 결과 | 소요 시간 |
|---|---|---|
| `frontend` | success | 약 17초 |
| `backend` | success | 약 97초 (이전 약 52 ~ 66초) |
| `backend` › Run backend tests | success | 약 89초 (MySQL Image Pull / Container 시작 포함) |
| Sync Milestones | success | — |

MySQL 연동 테스트 실제 실행 근거:

- GitHub Actions는 `CI=true`를 설정하므로 `DockerAvailabilityTests`가 실행된다. 이 Test는 Docker가 없으면 실패하며, `backend` Job이 성공했으므로 Runner에 Docker가 있었다.
- `MySqlIntegrationTests`는 Docker가 없을 때만 건너뛰므로(`disabledWithoutDocker`) CI에서 실행되었다.
- Job Log는 인증이 필요해 REST API로 조회하지 못했다(403). Test 출력의 SKIPPED 여부와 Backend Summary의 MySQL 문구는 Human Review에서 Workflow Run 화면으로 확인한다.

Remote CI Verification 완료 후 TASK-016 상태를 REVIEW로 변경했다.

### Human Review

검토 일자: 2026-10-01

- Human이 Workflow Run의 Backend Summary 화면을 캡처해 첨부했다.

  ![TASK-016 Backend Summary](images/task-016/ci-summary-backend.png)

- 확인 내용
  - Backend Test / Build `✅ success`, Commit `2f693d4`
  - "MySQL: Testcontainers (`mysql:8.0.46`, DEC-023)" 문구 표시 (DEC-023 문구 변경 반영)
  - Gradle Builds: Gradle Version `9.8.0`(TASK-014), Caching Disabled(DEC-017)
  - Annotations: `ubuntu-latest` → Ubuntu 26 전환 안내(2026-10-19)가 계속 표시됨 (FU-6, Task 등록 여부 Human 결정 대기)
- Job Log의 Test 출력(SKIPPED 여부)은 캡처에 포함되지 않았다. MySQL 연동 테스트 실행은 위 Remote CI Verification의 근거(`CI=true` + `DockerAvailabilityTests` 성공)로 판단한다.

### 결과

Verification 완료 / Human Review 대기
