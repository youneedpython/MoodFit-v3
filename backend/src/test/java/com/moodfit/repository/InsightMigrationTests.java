package com.moodfit.repository;

import java.sql.*;
import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.*;

public class InsightMigrationTests {
    @Test void h2UpgradeAddsOnlyNewTables() throws Exception {
        verifyUpgrade("jdbc:h2:mem:insight_upgrade;MODE=MySQL;DB_CLOSE_DELAY=-1", "sa", "");
    }
    public static void verifyUpgrade(String url, String username, String credential) throws Exception {
        Flyway.configure().dataSource(url, username, credential).target("4").load().migrate();
        try (var connection = DriverManager.getConnection(url, username, credential); var sql = connection.createStatement()) {
            String insert = "INSERT INTO wellness_checkin (id, recorded_at, heart_rate, respiratory_rate, sleep_score, stress_level, energy_level, temperature, weather, wellness_score, mood, summary) VALUES ";
            sql.executeUpdate(insert + "(1, CURRENT_TIMESTAMP, 68, 18, 86, 31, 74, 19.0, 'RAIN', 76, 'ENERGETIC', 'Legacy')");
            Flyway.configure().dataSource(url, username, credential).load().migrate();
            sql.executeUpdate(insert + "(2, CURRENT_TIMESTAMP, 68, 18, 86, 31, 74, 19.0, 'RAIN', 76, 'ENERGETIC', 'Rolling insert')");
            sql.executeUpdate("INSERT INTO checkin_insight (checkin_id, body, model_id, generated_at) VALUES (1, '참고 문장', 'test', CURRENT_TIMESTAMP)");
            assertThatThrownBy(() -> sql.executeUpdate("INSERT INTO checkin_insight (checkin_id, body, model_id, generated_at) VALUES (1, '중복', 'test', CURRENT_TIMESTAMP)")).isInstanceOf(SQLException.class);
            assertThatThrownBy(() -> sql.executeUpdate("INSERT INTO checkin_insight (checkin_id, body, model_id, generated_at) VALUES (999, '누락', 'test', CURRENT_TIMESTAMP)")).isInstanceOf(SQLException.class);
            sql.executeUpdate("INSERT INTO weekly_report (user_id, period_start, period_end, body, record_count, model_id, generated_at) VALUES (1, '2026-09-28', '2026-10-04', '주간 문장', 3, 'test', CURRENT_TIMESTAMP)");
            sql.executeUpdate("INSERT INTO llm_usage (user_id, kind, attempted_at) VALUES (1, 'REPORT', CURRENT_TIMESTAMP)");
            try (var rows = sql.executeQuery("SELECT COUNT(*) FROM wellness_checkin")) { rows.next(); assertThat(rows.getInt(1)).isEqualTo(2); }
        }
    }
}
