package com.moodfit.repository;

import static org.assertj.core.api.Assertions.assertThat;

import java.sql.DriverManager;

import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Test;

class MusicVideoMigrationTests {
    @Test
    void upgradesV1WithoutChangingExistingRecommendations() throws Exception {
        String url = "jdbc:h2:mem:music_upgrade;MODE=MySQL;DB_CLOSE_DELAY=-1";
        Flyway.configure().dataSource(url, "sa", "").target("1").load().migrate();
        try (var connection = DriverManager.getConnection(url, "sa", "");
                var statement = connection.createStatement()) {
            statement.executeUpdate("""
                    INSERT INTO wellness_checkin VALUES
                    (1, '2026-09-30 00:00:00', 68, 18, 86, 31, 74, 19.0, 'RAIN', 76, 'ENERGETIC', 'Legacy')
                    """);
            statement.executeUpdate("""
                    INSERT INTO checkin_music_recommendation VALUES
                    (1, 0, 'Old mood track', 'MoodFit Curated', 'Mood', 'Reason'),
                    (1, 1, 'Old context track', 'MoodFit Curated', 'Context', 'Reason')
                    """);
            Flyway.configure().dataSource(url, "sa", "").load().migrate();
            try (var rows = statement.executeQuery("SELECT title, video_id FROM checkin_music_recommendation ORDER BY position")) {
                assertThat(rows.next()).isTrue();
                assertThat(rows.getString("title")).isEqualTo("Old mood track");
                assertThat(rows.getString("video_id")).isNull();
                assertThat(rows.next()).isTrue();
                assertThat(rows.getString("title")).isEqualTo("Old context track");
                assertThat(rows.getString("video_id")).isNull();
                assertThat(rows.next()).isFalse();
            }
        }
    }
}
