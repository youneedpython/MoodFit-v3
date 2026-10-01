package com.moodfit.mysql;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.testcontainers.DockerClientFactory;

/**
 * DEC-023: CI에서는 MySQL 연동 테스트가 Docker 부재로 조용히 건너뛰어지지 않도록 Docker를 요구한다.
 * Local(CI 환경변수 없음)에서는 실행하지 않는다.
 */
@EnabledIfEnvironmentVariable(named = "CI", matches = "true")
class DockerAvailabilityTests {

    @Test
    void dockerIsAvailableForMySqlIntegrationTestsInCi() {
        assertThat(DockerClientFactory.instance().isDockerAvailable())
                .as("CI에서는 MySQL 연동 테스트(DEC-023)를 위해 Docker가 필요하다.")
                .isTrue();
    }
}
