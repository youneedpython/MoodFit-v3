package com.moodfit.insight;

import java.time.*;
import java.time.temporal.ChronoUnit;
import com.moodfit.auth.UserIdentity;
import com.anthropic.errors.AnthropicServiceException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import tools.jackson.databind.ObjectMapper;

@Service
public class InsightService {
    private static final Logger log = LoggerFactory.getLogger(InsightService.class);
    public record InsightResponse(boolean enabled, boolean available, String text, Instant generatedAt) {}
    public record ReportResponse(boolean enabled, boolean available, String text, LocalDate periodStart, LocalDate periodEnd, Instant generatedAt, int recordCount) {}
    private final LlmSettings settings;
    private final InsightGenerator generator;
    private final InsightData data;
    private final InsightStore store;
    private final Clock clock;
    private final ObjectMapper mapper;
    public InsightService(LlmSettings settings, InsightGenerator generator, InsightData data, InsightStore store, Clock clock, ObjectMapper mapper) {
        this.settings = settings; this.generator = generator; this.data = data; this.store = store; this.clock = clock; this.mapper = mapper;
    }
    private boolean available(UserIdentity user) { return settings.enabled() && ("google".equals(user.provider()) || "kakao".equals(user.provider())); }
    private void requireAvailable(UserIdentity user) {
        if (!available(user)) throw new InsightException(403, "LLM_UNAVAILABLE", "AI generation is unavailable.");
    }
    public InsightResponse insight(Long id, boolean generate) {
        var user = UserIdentity.current();
        var input = data.checkin(id, user.id()); // Ownership is checked even when disabled or cached.
        if (generate) requireAvailable(user);
        var saved = store.insight(id).orElse(null);
        if (generate && saved == null) {
            store.reserve(user.id(), false, settings.limit(false), now());
            String text = generate(input, false);
            if (text != null) saved = store.saveInsight(id, text, settings.model(), now());
        }
        return new InsightResponse(settings.enabled(), available(user), saved == null ? null : saved.text(), saved == null ? null : saved.generatedAt());
    }
    public ReportResponse report(boolean generate) {
        var user = UserIdentity.current();
        InsightStore.Report saved;
        if (!generate) saved = store.report(user.id()).orElse(null);
        else {
            requireAvailable(user);
            var end = now().atZone(ZoneId.of("Asia/Seoul")).toLocalDate();
            var start = end.minusDays(6);
            var input = data.weekly(user.id(), start.atStartOfDay(ZoneId.of("Asia/Seoul")).toInstant(),
                    end.plusDays(1).atStartOfDay(ZoneId.of("Asia/Seoul")).toInstant());
            if (input.size() < 3) throw new InsightException(422, "LLM_INSUFFICIENT_RECORDS", "At least three records are required.");
            store.reserve(user.id(), true, settings.limit(true), now());
            String text = generate(input, true);
            saved = text == null ? null : store.saveReport(user.id(), text, settings.model(), now(), start, end, input.size());
            if (saved == null) return new ReportResponse(settings.enabled(), available(user), null, start, end, null, input.size());
        }
        return new ReportResponse(settings.enabled(), available(user), saved == null ? null : saved.text(), saved == null ? null : saved.periodStart(),
                saved == null ? null : saved.periodEnd(), saved == null ? null : saved.generatedAt(), saved == null ? 0 : saved.recordCount());
    }
    private Instant now() { return clock.instant().truncatedTo(ChronoUnit.MICROS); }
    private String generate(Object input, boolean weekly) {
        try {
            String text = InsightText.clean(generator.generate(mapper.writeValueAsString(input), weekly), weekly);
            if (text == null) log.warn("LLM generation failure kind=empty_response");
            return text;
        }
        catch (RuntimeException failure) {
            if (failure instanceof BedrockInsightGenerator.ResponseRejected rejected) {
                log.warn("LLM generation failure kind={}", rejected.reason());
            } else if (failure instanceof AnthropicServiceException service) {
                log.warn("LLM generation failure kind={} status={} errorType={} message={}",
                        failure.getClass().getSimpleName(), service.statusCode(),
                        cleanFailureMessage(service.errorType().orElse("")), cleanFailureMessage(service.getMessage()));
            } else {
                log.warn("LLM generation failure kind={}", failure.getClass().getSimpleName());
            }
            return null;
        }
    }
    static String cleanFailureMessage(String message) {
        if (message == null || message.isBlank()) return "";
        String cleaned = message.replaceAll("[\\p{Cc}\\p{Zl}\\p{Zp}]", " ")
                .replaceAll("arn:[^\\s]+", "<arn>")
                .replaceAll("[0-9]{12}", "<acct>");
        int length = cleaned.codePointCount(0, cleaned.length());
        return cleaned.substring(0, cleaned.offsetByCodePoints(0, Math.min(300, length)));
    }
}
