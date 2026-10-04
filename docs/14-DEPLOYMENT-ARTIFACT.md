# 14. Deployment Artifact / Container / Health Strategy

## 1. 승인 / 상태

TASK-024 Run 2는 2026-10-03 Human Gate C 승인과 명시 실행 지시에 따른 구현이다. 근거는 Task 문서의 Human 결정과 DEC-028이다. DEC-027 Linux x86 / 0.5 vCPU / 1 GiB / Desired Count 2를 유지한다. 이 Run의 PR에 TASK-024 DONE / TASK-025 READY를 포함하며 완료 승인은 Human Squash Merge다. Executor DONE은 구현 완료이며 Orchestrator Verify 성공 / Claude PASS를 대신하지 않는다. AWS / IAM / CI·CD / MySQL 버전 변경은 후속 Task 범위다.

## 2. Backend Container Build

기존 Java 21 / Gradle Wrapper로 Test·Build를 수행한다. bootJar 이름은 Version과 무관하게 `app.jar`이며 plain JAR는 사용하지 않는다. Repository root에서:

```bash
bash scripts/verify.sh
revision=$(git rev-parse HEAD)
docker build --platform linux/amd64 --build-arg "VCS_REF=$revision" \
  --tag "moodfit-backend:sha-$revision" backend
bash scripts/container-smoke.sh
```

Dockerfile 기본 base는 `eclipse-temurin@sha256:8c2dddf1bb2a8455160f4e23080059de5003eddc5cb839130b177c6be0c2cfe0`이다. Human 승인 시 Claude 세션이 `21-jre-jammy`의 linux/amd64 manifest / version `21.0.12.1_1-jre-jammy` / curl 포함을 확인했다. mutable tag를 기본값으로 사용하지 않는다. RUNTIME_IMAGE digest 교체는 별도 PR / Human 승인으로만 수행하며 자동 갱신 / package 설치는 하지 않는다.

Context는 backend이며 .dockerignore는 build/libs/app.jar만 허용한다. Source / Gradle / .env / 인증 파일은 layer에 복사하지 않는다. UID/GID 10001:10001, exec-form Java PID 1, read-only root / writable /tmp tmpfs를 사용한다. base curl로 liveness를 점검한다. ECS Task Definition은 후속 Task에서 같은 liveness 명령을 명시해야 한다.

JVM 최대 heap 60% / 초기 heap 20% / OOM 시 종료를 설정했다. 나머지는 native memory / metaspace / thread 여유이며 용량 보장이 아니다. Smoke startup 시간은 polling을 포함하며 memory는 단일 관측값이지 peak가 아니다. peak / 부하 용량은 미측정이다.

깨끗한 checkout / 승인 Runtime / lockfile / base digest로 산출하고 JAR checksum을 기록한다. byte-for-byte 동일 재빌드 digest를 보장하지 않으며 한 번 검증한 동일 artifact를 승격한다. JAR credential 파일 목록 검사와 패키징 resource 검토를 함께 수행한다. 파일명 검사만으로 모든 민감 값을 탐지한다고 주장하지 않는다.

## 3. Image / Tag 정책

- Backend tag는 sha-<full commit SHA>, OCI revision은 같은 full SHA다. ECR immutable 설정은 후속 IaC Task에서 수행한다. 재빌드 digest가 달라지면 기존 SHA tag를 덮어쓰지 않는다. ECS는 검증된 repository@sha256:<digest>를 사용한다.
- Smoke는 임시 image를 사용하고 종료 시 삭제한다. dirty Working Tree Smoke의 revision은 baseline HEAD이므로 배포 식별자로 사용하지 않는다. 배포 image는 Commit 이후 clean checkout에서 실제 Commit SHA로 만든다.
- Commit / base digest / image digest / JAR checksum / Verification 결과를 함께 보관한다. latest로 배포하지 않는다.
- v3.x.y는 DEC-025 Human 승인 Release와 검증된 main Commit에만 연결한다. 동일 digest에 Release alias를 붙이며 Tag push / Release 생성은 별도 Human 확인 대상이다.
- Frontend dist는 Commit SHA / 파일 checksum manifest로 식별한다. Artifact 승격 시 이전 dist와 Backend digest를 쌍으로 보관한다. TASK-029 Staging 수동 롤백은 DEC-032 승인에 따라 이전 Commit의 Frontend를 재빌드하며 Backend는 기존 immutable digest를 재사용한다. byte-for-byte 동일 dist는 보장하지 않는다. DB migration rollback은 별도다.

## 4. Frontend / Runtime Configuration

frontend에서 npm ci → npm test → npm run build를 수행한다. 배포 대상은 frontend/dist 내용이며 node_modules / Source / .env는 제외한다. lockfile / .nvmrc Version을 유지한다. 전체 Production Build 성공 판정은 이번 Run의 Orchestrator Verify 결과에 따른다.

현재 frontend/src/services/api.ts 상대 경로 /api를 유지한다. 같은 artifact를 Staging / Production에 사용한다. CloudFront /api 및 /api/*는 ALB HTTPS origin으로 전달하고 API cache를 비활성화한다. Vite localhost proxy는 개발 전용이다. 정적 dist에는 서버 runtime 환경변수 주입이 없으며 VITE 값은 공개 build 값이다. Secret을 넣지 않는다.

Backend 기존 DB_URL / DB_USERNAME / DB_PASSWORD를 runtime에 전달한다. 실제 값은 image / 명령 인자 / 문서 / 로그에 기록하지 않는다. ECS 전달 / IAM / RDS TLS는 후속 Task 대상이다. Flyway / ddl-auto=validate를 유지한다. DB 없이 startup하면 실패할 수 있으며 liveness DB 제외는 이미 시작한 앱에서 DB 장애를 분리하는 정책이다.

SPA rewrite는 정적 behavior GET / HEAD 화면 경로(/, /check-in, /history)만 /index.html로 변환한다. asset / 알 수 없는 경로 / /api에는 적용하지 않으며 distribution 전체 403 / 404 → 200 fallback은 사용하지 않는다. HTML 짧은 cache / hash asset immutable cache의 실제 구성은 후속 Task다.

## 5. 승인된 운영 Health 계약

TASK-027은 ECS에 Dockerfile과 같은 curl liveness를 명시하고 ALB readiness / 8080 / 120초 grace를 연결했다. ECR digest Parameter와 non-root 실행을 사용한다. DB 암호화 연결과 Data 생성 자격 증명의 시작 시 주입도 IaC에 반영했다. ECS는 /tmp 쓰기를 위한 기본 writable filesystem을 사용하며 Docker Smoke의 read-only / tmpfs 결과를 ECS의 증거로 간주하지 않는다. App은 IAM 소유의 기존 30일 Log Group을 사용한다. Flyway 2개 Task 동시 시작과 rolling 중 Schema 호환성 / rollback 위험은 [17번 문서](17-AWS-IAC-FOUNDATION.md)를 따르고 실제 검증은 TASK-028 범위다.

Spring Boot BOM 관리 spring-boot-starter-actuator를 Version 없이 추가했다. Health는 DEC-024 업무 API 계약과 별개이며 contracts / docs/05-API_SPEC.md는 변경하지 않는다.

| Endpoint | 구성 | 정상 | DB 장애 |
|---|---|---|---|
| /actuator/health/liveness | livenessState | 200 / UP | 200 / UP |
| /actuator/health/readiness | readinessState + db | 200 / UP | 503 / DOWN |

응답은 status만 포함하며 details / components를 항상 숨긴다. Health 이외 access는 none, health는 read-only, HTTP 노출은 health만 허용하고 JMX는 제외한다. 동일 앱 port 8080에서 probe하며 CloudFront 업무 API routing에 Health를 추가하지 않는다. 속성은 2026-10-03 [Spring Boot 4.1.1 공식 문서](https://docs.spring.io/spring-boot/reference/actuator/endpoints.html)의 access / exposure / groups / probes 설정으로 확인했다.

OperationalHealthTests는 실제 production properties를 로드하고 정상 DB 및 의도적인 DataSource 연결 실패에서 HTTP 상태 / status-only 전체 응답을 검사한다. 다른 Actuator Endpoint 404도 검사한다. 실제 MySQL 장애는 Container Smoke에서 별도 검증한다.

ALB 제안: readiness 200 matcher / interval 30초 / timeout 5초 / healthy·unhealthy 각 2회. ECS liveness: interval 30초 / timeout 5초 / retries 3 / startPeriod 120초, service grace 120초를 후속 IaC에서 startup 실측과 검토한다. 전체 target unhealthy일 때 ALB fail-open으로 요청이 도달할 수 있다. [AWS 공식 Health Check 문서](https://docs.aws.amazon.com/elasticloadbalancing/latest/application/target-group-health-checks.html)에 따라 접근 차단을 보장하지 않는다.

## 6. Smoke / Verification

scripts/container-smoke.sh는 bash / Git Bash에서 MSYS 인자 변환을 차단한다. app.jar 존재와 credential 파일 목록 검사 → linux/amd64 build → 전용 network / mysql:8.4.11(DEC-030) → 0.5 CPU / 1 GiB / read-only root / tmpfs 앱 → readiness·liveness 200 → UID 10001 / amd64 / OCI revision / filesystem .env 제외 → DB 정지 후 readiness 503 / liveness 200을 확인한다. probe는 docker exec로 수행하며 호스트 port를 열지 않는다.

일회용 DB 값은 OS 무작위 바이트에서 생성하고 제한된 임시 디렉터리 env-file로 전달한다. 고정값을 Source에 넣거나 CLI 인자로 값을 전달하지 않는다. 실패 단계와 앱 / DB log tail을 출력하되 생성값은 치환한다. EXIT / INT / TERM trap은 Container / network / 임시 image / 파일을 정리한다. Working Tree에 산출물을 쓰지 않는다.

Executor는 Docker 접근 불가가 확인된 Sandbox이므로 Image Build / Start / MySQL 장애 Smoke를 실행하지 않았다. startup / memory 실측은 미제공이며 Orchestrator Verify Log를 기준으로 Claude 세션이 WORK_LOG를 보완한다. bash -n은 성공했다. Backend 참고 Test는 C:\.gradle wrapper lock parent 생성 불가로 Test 시작 전에 종료했다. 코드 Test 실패와 구분하며 성공을 주장하지 않는다. 전체 scripts/verify.sh / Container Smoke는 Sandbox 밖 Orchestrator 결과가 기준이다.
