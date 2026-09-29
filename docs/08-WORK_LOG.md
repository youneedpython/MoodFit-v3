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

REVIEW

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
- `powershell -ExecutionPolicy Bypass -File .\scriptserify.ps1`
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

### 결과

Human Review 대기
