package com.moodfit.repository;

import java.sql.DriverManager;
import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.assertThat;

public class RegionMigrationTests {
    @Test
    void upgradesH2FromV3WithNullRegionsAndAcceptsLegacyInserts() throws Exception {
        verifyUpgrade("jdbc:h2:mem:region_upgrade;MODE=MySQL;DB_CLOSE_DELAY=-1", "sa", "");
    }

    public static void verifyUpgrade(String url, String username, String credential) throws Exception {
        Flyway.configure().dataSource(url, username, credential).target("3").load().migrate();
        try (var connection = DriverManager.getConnection(url, username, credential);
                var statement = connection.createStatement()) {
            String insert = "INSERT INTO wellness_checkin (id, recorded_at, heart_rate, respiratory_rate, sleep_score, stress_level, energy_level, temperature, weather, wellness_score, mood, summary) VALUES ";
            statement.executeUpdate(insert + "(1, '2026-10-04 00:00:00', 68, 18, 86, 31, 74, 19.0, 'RAIN', 76, 'ENERGETIC', 'Legacy')");
            Flyway.configure().dataSource(url, username, credential).load().migrate();
            statement.executeUpdate(insert + "(2, '2026-10-04 00:00:01', 68, 18, 86, 31, 74, 19.0, 'RAIN', 76, 'ENERGETIC', 'Rolling insert')");
            try (var rows = statement.executeQuery("SELECT region FROM wellness_checkin ORDER BY id")) {
                assertThat(rows.next()).isTrue(); assertThat(rows.getString(1)).isNull();
                assertThat(rows.next()).isTrue(); assertThat(rows.getString(1)).isNull();
                assertThat(rows.next()).isFalse();
            }
            try (var update = connection.prepareStatement("UPDATE wellness_checkin SET region = ? WHERE id = 2")) {
                update.setString(1, "가".repeat(80));
                assertThat(update.executeUpdate()).isEqualTo(1);
            }
            try (var rows = statement.executeQuery("SELECT region FROM wellness_checkin WHERE id = 2")) {
                assertThat(rows.next()).isTrue(); assertThat(rows.getString(1)).isEqualTo("가".repeat(80));
            }
        }
    }
}
