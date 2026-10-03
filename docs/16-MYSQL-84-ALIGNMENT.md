# MySQL 8.4 전환 기준과 Local 안내

## 승인 범위

DEC-030은 2026-10-03 Human이 Gate C에서 사전 승인한 TASK-033 기준이다. Testcontainers / CI / Container Smoke의 Image를 `mysql:8.4.11`로 고정한다. Claude 세션이 같은 날 RDS 최신 minor와 Docker Hub linux/amd64 manifest를 확인한 기록을 사용한다. Executor Sandbox에서는 Docker에 접근할 수 없어 Image pull / 실행을 재확인하지 않았다. Tag 고정은 버전 선택을 재현하지만 digest 불변성까지 보장하지 않는다.

## 영향 조사

아래 공식 근거는 2026-10-03 조회했다. 문서상 지원과 실제 프로젝트의 호환성은 구분하며, 실제 판정은 Sandbox 밖의 전체 Test / Container Smoke와 Remote CI 결과를 따른다.

| 항목 | 확인 결과와 프로젝트 영향 |
|---|---|
| 인증 | 기본은 `caching_sha2_password`이며 `mysql_native_password`는 8.4에서 기본 비활성이다. 저장소는 구 인증 Plugin을 강제하지 않는다. 기존 Local 계정은 Human이 Plugin을 확인하고 필요 시 전환해야 한다. [MySQL 공식 인증 안내](https://dev.mysql.com/doc/refman/8.4/en/native-pluggable-authentication.html) |
| 제거된 설정 | `default_authentication_plugin`이 제거되었다. 저장소의 앱 설정 / Smoke 인자에 이 옵션은 없다. Local my.ini에 남아 있으면 전환 전 점검한다. [MySQL 옵션 변경 목록](https://dev.mysql.com/doc/refman/8.4/en/added-deprecated-removed.html) |
| SQL / 서버 변경 | 8.4 기본 설정은 비표준 외래 키 참조를 제한한다. V1의 두 외래 키는 모두 `wellness_checkin(id)` PRIMARY KEY를 참조하므로 정적 조사상 변경 대상이 없다. 저장소 Migration은 제거된 replication 명령이나 구 인증 SQL을 쓰지 않는다. 서버 기본값 변화의 실제 영향은 Test로 확인한다. [MySQL 외래 키 제한](https://dev.mysql.com/doc/refman/8.4/en/create-table-foreign-keys.html), [8.4 변경 안내](https://dev.mysql.com/doc/refman/8.4/en/upgrading-from-previous-series.html) |
| JDBC Driver | `com.mysql:mysql-connector-j`는 Spring Boot 4.1.1 BOM이 관리한다. 최신 공식 호환 문서는 8.4 지원을 명시하지만 저장소가 실제 resolve한 Version의 검증을 대체하지 않는다. Version을 임의로 올리지 않으며 실제 연결은 Test / Smoke로 판정한다. [Connector/J 호환성](https://dev.mysql.com/doc/connector-j/en/connector-j-versions.html) |
| Flyway | 기존 `spring-boot-starter-flyway` / `flyway-mysql`을 유지한다. 공식 MySQL 페이지의 Verified Versions 목록만으로 현재 BOM 조합의 8.4 통과를 단정할 수 없다. 전체 Test의 V1 적용 / history 성공 확인과 Smoke의 앱 기동이 검증 근거다. [Flyway MySQL 문서](https://documentation.red-gate.com/fd/mysql-277579322.html) |
| Hibernate / DEC-019 | BOM 관리 JPA / Hibernate와 `ddl-auto=validate`를 유지한다. V1은 BIGINT AUTO_INCREMENT, DATETIME(6), INT, DECIMAL(3,1), VARCHAR, 복합 PRIMARY KEY 및 FK를 사용한다. 정적 조사상 Migration 수정 필요는 확인되지 않았다. 기존 MySQL Test가 UTC·마이크로초, 소수·한글, 추천 값 / 저장·조회 / FK 등 실제 동작을 검증한다. |

Dependency / 운영 Code / Migration을 변경해야 하는 오류가 확인되면 이번 승인 범위에서 수정하지 않고 Human Gate로 정지한다. 설치 MySQL을 사용하는 직접 앱 실행과 Container 기반 Test / CI / Smoke는 별개다.

## Human 선택 사항: 개발 PC 전환

Agent는 기존 MySQL 8.0 서비스, 설치 파일, Local 설정, 데이터와 계정을 변경하지 않는다. 기존 8.0 직접 실행을 유지해도 Container 검증은 8.4.11을 사용한다.

1. Human이 데이터와 계정의 백업 및 복구 가능성을 먼저 확인한다. 새 별도 8.4 인스턴스에 복원하는 방법을 권장하며 기존 데이터 디렉터리를 공유하지 않는다. 전환 전 현재 8.0 patch의 공식 upgrade 경로 지원을 확인한다.
2. MySQL Shell Upgrade Checker로 8.4 대상 호환성, 계정 Plugin, my.ini의 제거 옵션과 SQL을 점검한다. 기존 계정의 구 Plugin 전환은 Human이 수행한다. [공식 Upgrade Checker](https://dev.mysql.com/doc/mysql-shell/8.4/en/mysql-shell-utilities-upgrade.html)
3. 별도 서비스 / port / 데이터 디렉터리에 MySQL 8.4.11을 준비하고 v3 DB를 복원한다. 민감한 값은 기존 비추적 환경변수 경로로만 관리한다. 초기화나 기존 DB 삭제를 전환 절차로 사용하지 않는다.
4. 환경변수의 연결 대상을 Human이 바꾼 뒤 앱 기동, Flyway validate, 한글과 UTC 시간, Check-in 저장 / Dashboard / History 조회를 확인한다. 검증과 백업 복구 확인 전 기존 8.0 환경을 제거하지 않는다.
5. 8.4가 사용한 데이터 디렉터리를 8.0으로 되돌려 열지 않는다. 되돌릴 때는 보존한 8.0 환경과 백업을 사용한다. [공식 Upgrade 경로](https://dev.mysql.com/doc/refman/8.4/en/upgrade-paths.html)

이 안내는 선택적 Local 작업이며 TASK-033 구현 완료를 막는 미해결 Human 결정이 아니다.
