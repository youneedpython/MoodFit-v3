package com.moodfit.auth;

import java.sql.DriverManager;
import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.assertThat;

public class UserMigrationTests {
    @Test void upgradesH2AndPreservesLegacyInserts() throws Exception {
        verifyUpgrade("jdbc:h2:mem:users_upgrade;MODE=MySQL;DB_CLOSE_DELAY=-1", "sa", "");
    }
    public static void verifyUpgrade(String url, String username, String credential) throws Exception {
        Flyway.configure().dataSource(url, username, credential).target("2").load().migrate();
        try (var connection = DriverManager.getConnection(url, username, credential); var statement = connection.createStatement()) {
            String columns = "(id, recorded_at, heart_rate, respiratory_rate, sleep_score, stress_level, energy_level, temperature, weather, wellness_score, mood, summary)";
            statement.executeUpdate("INSERT INTO wellness_checkin " + columns + " VALUES (1, '2026-09-30 00:00:00', 68, 18, 86, 31, 74, 19.0, 'RAIN', 76, 'ENERGETIC', 'Legacy')");
            Flyway.configure().dataSource(url, username, credential).load().migrate();
            statement.executeUpdate("INSERT INTO wellness_checkin " + columns + " VALUES (2, '2026-09-30 00:00:01', 68, 18, 86, 31, 74, 19.0, 'RAIN', 76, 'ENERGETIC', 'Rolling legacy insert')");
            try (var rows = statement.executeQuery("SELECT user_id FROM wellness_checkin ORDER BY id")) {
                assertThat(rows.next()).isTrue(); assertThat(rows.getLong(1)).isEqualTo(1);
                assertThat(rows.next()).isTrue(); assertThat(rows.getLong(1)).isEqualTo(1);
            }
            try (var rows = statement.executeQuery("SELECT COUNT(*) FROM app_user WHERE provider = 'guest'")) {
                assertThat(rows.next()).isTrue(); assertThat(rows.getInt(1)).isEqualTo(1);
            }
            try (var rows = statement.executeQuery("SELECT COUNT(*) FROM SPRING_SESSION")) {
                assertThat(rows.next()).isTrue(); assertThat(rows.getInt(1)).isZero();
            }
        }
    }
}
