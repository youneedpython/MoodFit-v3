package com.moodfit.mysql;

import org.junit.jupiter.api.Test;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.mysql.MySQLContainer;
import com.moodfit.repository.BaselineMigrationTests;

@Testcontainers(disabledWithoutDocker = true)
class MySqlBaselineMigrationTests {
    @Container static MySQLContainer mysql = new MySQLContainer("mysql:8.4.11");
    @Test void upgradesV6AndSupportsRollingInserts() throws Exception {
        BaselineMigrationTests.verifyUpgrade(mysql.getJdbcUrl(), mysql.getUsername(), mysql.getPassword());
    }
}
