# 14. Deployment Artifact / Container / Health Strategy

## 1. 상태 / 승인 경계

TASK-024 명시 실행 지시(2026-10-03), 최초 Working Tree clean. DEC-027의 Linux x86 / 0.5 vCPU / 1 GiB / Desired Count 2와 동일 origin `/api`를 기준으로 검토했다. 아래 Container Base Image와 Health 전략은 **Gate C 제안이며 승인된 결정이 아니다**. Executor는 HUMAN_REQUIRED로 정지한다. Dockerfile / Dependency / Health API / 계약 / CI를 구현하지 않았다.

현재 Backend에는 Health Endpoint와 Actuator Dependency가 없다. 기존 `/api/check-ins/latest`는 정상 Empty 상태에서도 404이며, `/api/check-ins/history?days=1`은 DB 조회와 사용자 데이터를 포함한다. 둘을 무조건 200인 Health API로 간주하지 않는다. DEC-024는 기존 업무 API 응답을 고정하며 신규 Health 계약을 승인하지 않았다.

## 2. Container Build / Base Image 제안

권장안은 승인된 Java 21의 Eclipse Temurin JRE 21 Ubuntu Jammy Linux amd64 이미지를 검토하고 **승인된 digest로 고정**하는 것이다. 현재 tag 가용성 / digest / 취약점 / 크기를 확인하지 않았으며 실제 값을 추측하지 않는다. 대안은 Java 21 distroless로 공격 표면을 줄이는 방식이지만 shell 기반 Container probe를 사용할 수 없고 진단 절차가 달라진다. Java major 변경 / 자동 base update는 제안하지 않는다. 선택된 digest 교체 정책도 Gate C에서 확정한다.

Build는 기존 Gradle Wrapper / Dependency를 사용해 호스트에서 Test / Build 후 bootJar를 만들고, runtime image에는 실행 JAR 하나만 복사한다. Gradle / Source / Test / 인증 설정을 image에 복사하지 않는다. 깨끗한 checkout, 승인된 Node / Java / Wrapper, 동일 lockfile과 base digest를 사용하고 산출물 SHA-256을 기록한다. 현재 build 설정으로 byte-for-byte 재현성을 검증하지 않았으므로 동일 Commit의 재빌드가 같은 image digest라는 보장은 하지 않는다. 배포 간에는 **한 번 만든 동일 digest**를 승격한다.

승인 후 생성할 최소 `backend/Dockerfile` 제안:

```dockerfile
ARG RUNTIME_IMAGE
FROM ${RUNTIME_IMAGE}
WORKDIR /app
COPY --chown=10001:10001 build/libs/moodfit-v3-backend-0.0.1-SNAPSHOT.jar /app/app.jar
USER 10001:10001
ENV JAVA_TOOL_OPTIONS="-XX:MaxRAMPercentage=60.0 -XX:InitialRAMPercentage=20.0 -XX:+ExitOnOutOfMemoryError"
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
```

`RUNTIME_IMAGE`은 승인된 `repository@sha256:<digest>`만 전달한다. Dockerfile 기본값으로 mutable tag를 넣지 않는다. COPY는 현재 settings.gradle의 project name / build.gradle version에 대응하는 bootJar 하나를 지정하며 `-plain.jar`를 사용하지 않는다. Version 변경 시 경로를 재검토한다. shell 없이 Java를 PID 1로 실행하고 numeric UID/GID로 root 실행을 방지한다. `/tmp`를 writable tmpfs로 제공하는 read-only root filesystem smoke를 검증한다. 60% heap 제안은 1 GiB에서 약 614 MiB이며 나머지는 metaspace / thread / native memory 여유다. 실측값이나 용량 보장이 아니며 실제 0.5 CPU / 1 GiB smoke의 startup / peak memory를 기록한 후 조정한다.

승인 후 생성할 최소 `backend/.dockerignore` 제안:

```dockerignore
**
!build/
!build/libs/
!build/libs/moodfit-v3-backend-0.0.1-SNAPSHOT.jar
```

Build context는 `backend/`로 한정한다. JAR allowlist로 `.env.local`, `.aws`, `.docker`, `.gradle`, Source와 credential 파일을 제외한다. Secret을 build arg / ENV / COPY로 전달하지 않는다. JAR 자체에도 민감 값이 들어 있지 않은지 archive 목록과 패키징 대상 resources를 확인해야 한다. 현재 application.properties는 DB 환경변수 placeholder만 가진다. Context 제외만으로 JAR 내부 Secret 검증을 대체하지 않는다.

## 3. Image / Tag / Artifact 정책

- Backend tag: `sha-<full commit SHA>`, OCI revision label: 같은 full SHA. ECR immutable tag 설정은 후속 IaC Task에서 수행한다. 재빌드 digest가 다르면 기존 SHA tag를 덮어쓰지 않고 원래 artifact를 사용하거나 별도 식별자를 승인한다.
- ECS는 검증된 `repository@sha256:<digest>`로 고정한다. Commit / base digest / image digest / JAR checksum / 검증 결과를 함께 보관한다. `latest`로 배포하지 않는다.
- `v3.x.y`는 DEC-025에 따라 Human이 승인한 Release와 검증된 main Commit에만 연결한다. 기존 digest에 Release alias를 붙이며 새 Release를 임의 생성하지 않는다. Tag push / Release 생성 승인은 Task 실행 승인과 별개다.
- Frontend `dist/`는 같은 Commit SHA / 파일 checksum manifest로 식별한다. 이전 dist와 Backend digest를 한 쌍으로 보관해 rollback 시 재빌드하지 않는다. DB migration rollback은 image rollback과 별개다.

## 4. Frontend Artifact / Runtime Configuration

Repository root에서 `cd frontend`, `npm ci`, `npm test`, `npm run build` 순서로 검증한다. 배포 대상은 생성된 `frontend/dist/` 내용이며 node_modules / 개발 Source / `.env`를 업로드하지 않는다. npm lockfile과 `.nvmrc`의 승인 Version을 유지한다. 이번 실행에서 Production Build 성공을 주장하지 않는다.

현재 `frontend/src/services/api.ts`의 `/api` 상대 경로는 Staging / Production 공통 artifact에 적합하므로 수정하지 않는다. Vite dev proxy는 localhost:8080 개발 전용이다. 정적 dist에는 서버 runtime 환경변수 주입이 없으며 VITE 변수는 공개 build 값이므로 Secret을 넣지 않는다. 환경별 API hostname 주입이나 별도 config fetch는 필요하지 않다.

Backend는 기존 `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`를 runtime에서 전달받는다. 실제 값은 image / 명령 인자 / 문서 / 로그에 기록하지 않는다. ECS Secret 전달 / IAM 정책은 TASK-025에서 확정한다. DB URL의 RDS TLS 검증 설정은 후속 배포 검증 대상이다. Flyway 실행과 `ddl-auto=validate`를 유지하며 DB 장애로 시작에 실패하는 경우를 smoke에서 구분한다.

CloudFront 구성 제안은 default private S3 origin, `/api` 및 `/api/*` ALB HTTPS origin, API cache 비활성화다. SPA rewrite는 default 정적 behavior의 viewer request에서 GET / HEAD의 승인된 화면 경로(`/`, `/check-in`, `/history`)만 `/index.html`로 변환한다. 실제 router 경로와 일치시키고 asset / 알 수 없는 경로 / `/api` / `/api/*`에는 적용하지 않는다. distribution 전체 403 / 404 → 200 fallback은 사용하지 않는다. HTML은 재검증 가능한 짧은 cache, hash asset은 긴 immutable cache를 제안한다. 실제 CloudFront Function / IaC / CI는 후속 Task 범위다.

## 5. Health 전략 Gate C

**권장안 A: Actuator의 liveness / readiness 분리.** 승인 후 Spring Boot BOM 관리 `spring-boot-starter-actuator`를 추가하고 Health만 노출한다. ALB는 `/actuator/health/readiness`의 HTTP 200만 성공으로 보며 readiness group에는 `readinessState,db`를 포함한다. DB 장애는 503 / target unhealthy로 해석한다. ECS Container probe는 `/actuator/health/liveness`를 사용하며 DB를 포함하지 않는다. DB 장애를 Container restart loop로 번지게 하지 않는다. 응답 상세 / component는 숨기고 credentials / DB URL을 노출하지 않는다. 이 경로는 CloudFront의 업무 API routing에 포함하지 않는다.

제안 값: ALB interval 30초 / timeout 5초 / healthy 2회 / unhealthy 2회, ECS liveness interval 30초 / timeout 5초 / retries 3 / startPeriod 120초, ECS service healthCheckGracePeriod 120초. 실측 startup 이후 값의 적합성을 검토한다. DB 장애 시 ALB 전체 target이 unhealthy여도 fail-open으로 요청이 도달할 수 있으므로 접근 차단 / 무오류 보장을 주장하지 않는다. 앱의 업무 API 오류와 관측도 함께 검증한다.

ALB의 200 matcher / 설정 범위 / 전체 unhealthy 시 fail-open 동작은 [AWS ALB Health Check 공식 문서](https://docs.aws.amazon.com/elasticloadbalancing/latest/application/target-group-health-checks.html)를 2026-10-03 확인했다. 실제 AWS 조회 / Resource 작업은 수행하지 않았다.

**대안 B: 신규 Dependency 없이 전용 Health API 구현.** `/internal/health/live`와 `/internal/health/ready`를 추가해 live는 앱 상태, ready는 제한 시간 DB probe 결과를 반환한다. 새 API / 계약 / 오류 처리 / probe timeout과 테스트 설계가 필요하므로 현재 승인 없이 구현할 수 없다.

**대안 C: 기존 history API 재사용.** 새 Dependency가 없고 빈 DB도 200이지만 DB 장애와 앱 장애를 분리하지 못하며 사용자 데이터 조회를 반복한다. ECS liveness로 쓰면 DB 장애에 불필요한 restart가 발생한다. Deployment 전용 Health 대신 사용하려면 이 한계에 대한 Human의 명시 결정이 필요하며 권장하지 않는다.

### 승인 후 최소 Diff / 허용 경로 확대 제안

1. `backend/build.gradle`: `implementation 'org.springframework.boot:spring-boot-starter-actuator'` 한 줄 추가(BOM 관리, 별도 Version 없음). 현재 forbidden_paths이므로 미변경.
2. `backend/src/main/resources/application.properties`: health 노출만 허용, probe 활성화, liveness group `livenessState`, readiness group `readinessState,db`, details / components `never` 설정. 실제 Spring Boot 4.1.1 속성과 동작은 승인 후 검증한다.
3. `backend/src/test/`: live 200, ready 200, DB 연결 장애의 ready 503 / live 200, 상세 비노출 회귀 Test. 의도적 실패 DB probe와 실제 Docker DB 장애 smoke를 구분한다.
4. `contracts/`의 Health 200 / 503 fixture와 Backend 계약 Test, 필요 시 `docs/05-API_SPEC.md`에 operational endpoint를 분리 문서화. 두 경로는 현재 허용 밖이므로 미변경. Human이 Health를 DEC-024 업무 계약과 별도 운영 계약으로 승인하는 대안도 결정할 수 있다.
5. 승인된 base digest로 Dockerfile / .dockerignore를 생성한다. ECS probe에서 curl을 쓸 경우 **선택한 image에 도구가 존재하는지 먼저 확인**하며 임의 package 설치를 하지 않는다. 도구가 없다면 Java 기반 probe 또는 probe 포함 image 정책을 Gate에 명시한다.
6. Docker build / start / 성공·실패 Health / non-root / metadata / Secret 제외 smoke를 Task 검증에 추가할지 결정한다. Contract / scripts / harness 변경은 Executor가 하지 않는다.

Gate 결정은 A / B / C 선택, base repository / digest 고정·교체 및 probe 도구 정책, operational Health 계약 취급과 필요한 허용 경로 확대, Docker smoke를 검증 기준에 포함할지 여부다. 권장안은 A + digest 고정 + 전용 Health 계약 + Docker smoke 포함이다. 승인 전 Dependency / 새 API / Container 정책을 확정하지 않는다.

## 6. Local Smoke / Verification 기록

2026-10-03 Executor에서 `docker version --format '{{.Server.Version}}'` 실행은 Exit 1이었다. Docker CLI는 있으나 config 접근과 Docker daemon named pipe 연결이 Access denied로 실패했다. credential 파일 내용을 읽거나 로그인 / 권한 변경 / 설치를 시도하지 않았다. Docker Desktop이 중지됐다고 단정하지 않으며 Sandbox 접근 제약으로 기록한다.

아직 Dockerfile 구현이 없고 Gate 승인이 필요하므로 image build / start / Health 성공·실패 / image metadata / JVM startup·memory 측정은 **미실행**이다. Docker 접근 실패 자체가 Human Gate 사유는 아니다. Human Gate 사유는 위의 승인되지 않은 Health / Base Image 정책이다. 승인된 실행에서 Docker Desktop 접근 가능 환경으로 smoke를 수행하고 결과를 갱신한다.

승인 후 smoke는 Linux amd64 image, 0.5 CPU / 1 GiB, UID 10001, read-only root / writable tmpfs, localhost bind에서 합성 DB 데이터로 수행한다. 기존 DEC-023 mysql:8.0.46을 유지한다. 정상 DB / 빈 DB의 readiness 200, runtime DB 연결 차단의 readiness 503 및 liveness 200, DB 없이 startup 실패, SIGTERM 종료를 확인한다. Secret 값은 명령 인자에 넣지 않고 승인된 runtime 전달 방식을 사용한다. Artifact와 base digest, startup 시간, memory peak, image user / architecture / label, archive / context 검사 결과를 기록한다.

Contract의 `bash scripts/verify.sh` 전체 Test / Build와 `git diff --check`는 Orchestrator의 기준이다. Gate 제안 단계에서는 전체 Test / Build를 Executor가 실행하지 않았다. 문서 Diff / UTF-8 검사 결과는 WORK_LOG와 Executor JSON에 기록한다. TASK-024 DONE / TASK-025 READY / 마지막 PR 반영은 현재 실행에서 수행하지 않는다.
