package com.moodfit.repository;

import java.sql.DriverManager;
import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.*;

public class BaselineMigrationTests {
    @Test void upgradesH2AndSupportsRollingInserts() throws Exception {
        verifyUpgrade("jdbc:h2:mem:baseline_upgrade;MODE=MySQL;DB_CLOSE_DELAY=-1", "sa", "");
    }
    public static void verifyUpgrade(String url, String username, String credential) throws Exception {
        Flyway.configure().dataSource(url, username, credential).target("6").load().migrate();
        try (var connection = DriverManager.getConnection(url, username, credential);
                var statement = connection.createStatement()) {
            String insert = "INSERT INTO wellness_checkin (recorded_at, heart_rate, respiratory_rate, sleep_score, stress_level, energy_level, temperature, weather, wellness_score, mood, summary) VALUES ('2026-10-05 00:00:00', 68, 18, 86, 31, 74, 19.0, 'RAIN', 76, 'ENERGETIC', 'Legacy')";
            statement.executeUpdate(insert);
            Flyway.configure().dataSource(url, username, credential).load().migrate();
            statement.executeUpdate(insert);
            try (var rows = statement.executeQuery("SELECT baseline_sample_count, baseline_heart_rate, baseline_respiratory_rate, baseline_sleep_score, baseline_stress_level, baseline_energy_level, tension FROM wellness_checkin")) {
                int count = 0;
                while (rows.next()) {
                    for (int i = 1; i <= 7; i++) assertThat(rows.getObject(i)).isNull();
                    count++;
                }
                assertThat(count).isEqualTo(2);
            }
            statement.executeUpdate("UPDATE wellness_checkin SET baseline_sample_count=5, baseline_heart_rate=68.1, baseline_respiratory_rate=18.2, baseline_sleep_score=86.3, baseline_stress_level=31.4, baseline_energy_level=74.5, tension='HIGH'");
            try (var rows = statement.executeQuery("SELECT baseline_heart_rate, tension FROM wellness_checkin")) {
                assertThat(rows.next()).isTrue();
                assertThat(rows.getBigDecimal(1)).isEqualByComparingTo("68.1");
                assertThat(rows.getString(2)).isEqualTo("HIGH");
            }
        }
    }
}
