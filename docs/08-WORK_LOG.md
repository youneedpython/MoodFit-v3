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
