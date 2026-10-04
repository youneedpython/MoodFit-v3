package com.moodfit.mysql;

import org.junit.jupiter.api.Test;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.mysql.MySQLContainer;
import com.moodfit.auth.UserMigrationTests;

@Testcontainers(disabledWithoutDocker = true)
class MySqlUserMigrationTests {
    @Container static MySQLContainer mysql = new MySQLContainer("mysql:8.4.11");
    @Test void upgradesExistingMySqlAndAcceptsOldVersionInserts() throws Exception {
        UserMigrationTests.verifyUpgrade(mysql.getJdbcUrl(), mysql.getUsername(), mysql.getPassword());
    }
}
