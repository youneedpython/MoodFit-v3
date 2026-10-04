package com.moodfit.insight;

import java.time.*;
import java.util.Optional;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Repository
public class InsightStore {
    public record Saved(String text, Instant generatedAt) {}
    public record Report(String text, LocalDate periodStart, LocalDate periodEnd, Instant generatedAt, int recordCount) {}
    private final JdbcTemplate jdbc;
    public InsightStore(JdbcTemplate jdbc) { this.jdbc = jdbc; }
    // JDBC datetime values are explicitly UTC, independent of the JVM default timezone.
    static LocalDateTime utc(Instant instant) { return LocalDateTime.ofInstant(instant, ZoneOffset.UTC); }
    public Optional<Saved> insight(Long id) {
        return jdbc.query("SELECT body, generated_at FROM checkin_insight WHERE checkin_id = ?", (row, n) ->
                new Saved(row.getString(1), row.getObject(2, LocalDateTime.class).toInstant(ZoneOffset.UTC)), id).stream().findFirst();
    }
    public Saved saveInsight(Long id, String text, String model, Instant now) {
        try {
            jdbc.update("INSERT INTO checkin_insight (checkin_id, body, model_id, generated_at) VALUES (?, ?, ?, ?)", id, text, model, utc(now));
        } catch (DuplicateKeyException collision) {
            // Insert runs in autocommit: a unique conflict does not poison a surrounding transaction.
        }
        return insight(id).orElseThrow();
    }
    public Optional<Report> report(Long userId) {
        return jdbc.query("SELECT body, period_start, period_end, generated_at, record_count FROM weekly_report WHERE user_id = ? ORDER BY generated_at DESC, id DESC LIMIT 1",
                (row, n) -> new Report(row.getString(1), row.getObject(2, LocalDate.class), row.getObject(3, LocalDate.class),
                        row.getObject(4, LocalDateTime.class).toInstant(ZoneOffset.UTC), row.getInt(5)), userId).stream().findFirst();
    }
    public Report saveReport(Long userId, String text, String model, Instant now, LocalDate start, LocalDate end, int count) {
        jdbc.update("INSERT INTO weekly_report (user_id, period_start, period_end, body, record_count, model_id, generated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
                userId, start, end, text, count, model, utc(now));
        return new Report(text, start, end, now, count);
    }
    /** Commit each attempt BEFORE network I/O; the user row serializes limits across ECS instances. */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void reserve(Long userId, boolean weekly, int limit, Instant now) {
        jdbc.queryForObject("SELECT id FROM app_user WHERE id = ? FOR UPDATE", Long.class, userId);
        var start = now.atZone(ZoneId.of("Asia/Seoul")).toLocalDate().atStartOfDay(ZoneId.of("Asia/Seoul")).toInstant();
        var end = start.plus(Duration.ofDays(1));
        String kind = weekly ? "REPORT" : "INSIGHT";
        var count = jdbc.queryForObject("SELECT COUNT(*) FROM llm_usage WHERE user_id = ? AND kind = ? AND attempted_at >= ? AND attempted_at < ?",
                Long.class, userId, kind, utc(start), utc(end));
        if (count >= limit) throw new InsightException(429, "LLM_DAILY_LIMIT", "Daily generation limit reached.");
        jdbc.update("INSERT INTO llm_usage (user_id, kind, attempted_at) VALUES (?, ?, ?)", userId, kind, utc(now));
    }
}
