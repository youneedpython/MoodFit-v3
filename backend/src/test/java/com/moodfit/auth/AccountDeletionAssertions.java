package com.moodfit.auth;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.transaction.support.TransactionTemplate;
import static org.assertj.core.api.Assertions.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

// Existing suites use csrf() against cached filter chains. Start from a fresh context so these
// tests see the real cookie repository; they use the raw cookie flow and leave no test state behind.
@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_CLASS)
public abstract class AccountDeletionAssertions {
    @Autowired protected MockMvc mvc;
    @Autowired protected JdbcTemplate jdbc;
    @Autowired protected UserLoginService users;
    @Autowired protected AccountDeletionService deletion;
    @Autowired protected TransactionTemplate transactions;
    private final java.util.ArrayList<UserIdentity> created = new java.util.ArrayList<>();
    @AfterEach public void cleanupOwnFixtures() {
        for (var identity : created) {
            if (jdbc.queryForObject("SELECT COUNT(*) FROM app_user WHERE id = ?", Integer.class, identity.id()) > 0) deletion.delete(identity);
        }
    }
    private static final String INPUT = """
        {"heartRate":68,"respiratoryRate":18,"sleepScore":86,"stressLevel":31,"energyLevel":74,"temperature":19.0,"weather":"RAIN"}
        """;
    private UsernamePasswordAuthenticationToken auth(UserIdentity user) {
        return new UsernamePasswordAuthenticationToken(user, null, List.of(new SimpleGrantedAuthority("ROLE_USER")));
    }
    private UserIdentity social(String number) {
        var identity = users.social("google", Map.of("sub", number, "name", "삭제 테스트"));
        created.add(identity); return identity;
    }
    private org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder withCookieCsrf(
            org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder request) throws Exception {
        // Use the SPA cookie/header flow. csrf() replaces the shared filter's repository
        // with a test repository, which can leak into AuthTests through the cached context.
        var cookie = mvc.perform(get("/api/auth/me")).andExpect(status().isOk())
                .andReturn().getResponse().getCookie("XSRF-TOKEN");
        assertThat(cookie).isNotNull();
        return request.cookie(cookie).header("X-XSRF-TOKEN", cookie.getValue());
    }
    private jakarta.servlet.http.Cookie seed(UserIdentity user) throws Exception {
        mvc.perform(withCookieCsrf(post("/api/check-ins").with(authentication(auth(user)))
                .contentType(MediaType.APPLICATION_JSON).content(INPUT))).andExpect(status().isCreated());
        Long id = jdbc.queryForObject("SELECT id FROM wellness_checkin WHERE user_id = ?", Long.class, user.id());
        jdbc.update("UPDATE wellness_checkin SET baseline_sample_count=5, baseline_heart_rate=68.0, baseline_respiratory_rate=18.0, baseline_sleep_score=86.0, baseline_stress_level=31.0, baseline_energy_level=74.0, tension='STABLE' WHERE id=?", id);
        assertThat(jdbc.queryForObject("SELECT tension FROM wellness_checkin WHERE id=?", String.class, id)).isEqualTo("STABLE");
        jdbc.update("INSERT INTO checkin_insight (checkin_id, body, model_id, generated_at) VALUES (?, 'synthetic', 'test', CURRENT_TIMESTAMP)", id);
        jdbc.update("INSERT INTO weekly_report (user_id, period_start, period_end, body, record_count, model_id, generated_at) VALUES (?, CURRENT_DATE, CURRENT_DATE, 'synthetic', 1, 'test', CURRENT_TIMESTAMP)", user.id());
        jdbc.update("INSERT INTO llm_usage (user_id, kind, attempted_at) VALUES (?, 'INSIGHT', CURRENT_TIMESTAMP)", user.id());
        jdbc.update("INSERT INTO recommendation_feedback (user_id, kind, item_name, rating, updated_at) VALUES (?, 'FOOD', '연어 샐러드', 'LIKE', CURRENT_TIMESTAMP)", user.id());
        String session = UUID.randomUUID().toString();
        long now = System.currentTimeMillis();
        jdbc.update("INSERT INTO SPRING_SESSION (PRIMARY_ID, SESSION_ID, CREATION_TIME, LAST_ACCESS_TIME, MAX_INACTIVE_INTERVAL, EXPIRY_TIME, PRINCIPAL_NAME) VALUES (?, ?, ?, ?, 604800, ?, ?)", session, session, now, now, now + 604800000L, user.getName());
        var context = org.springframework.security.core.context.SecurityContextHolder.createEmptyContext();
        context.setAuthentication(auth(user));
        var bytes = new java.io.ByteArrayOutputStream();
        try (var stream = new java.io.ObjectOutputStream(bytes)) { stream.writeObject(context); }
        jdbc.update("INSERT INTO SPRING_SESSION_ATTRIBUTES (SESSION_PRIMARY_ID, ATTRIBUTE_NAME, ATTRIBUTE_BYTES) VALUES (?, 'SPRING_SECURITY_CONTEXT', ?)", session, bytes.toByteArray());
        return new jakarta.servlet.http.Cookie("SESSION", java.util.Base64.getEncoder().encodeToString(session.getBytes(java.nio.charset.StandardCharsets.UTF_8)));
    }
    private void assertCounts(UserIdentity user, int count) {
        for (String table : List.of("app_user", "wellness_checkin", "weekly_report", "llm_usage", "recommendation_feedback")) {
            String column = table.equals("app_user") ? "id" : "user_id";
            assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM " + table + " WHERE " + column + " = ?", Integer.class, user.id())).isEqualTo(count);
        }
        int sessions = jdbc.queryForObject("SELECT COUNT(*) FROM SPRING_SESSION WHERE PRINCIPAL_NAME = ?", Integer.class, user.getName());
        if (count == 0) assertThat(sessions).isZero(); else assertThat(sessions).isPositive();
    }
    @Test public void deletesOnlyOwnDataAndRecreatesNewIdentity() throws Exception {
        String number = UUID.randomUUID().toString();
        var own = social(number); var other = social(UUID.randomUUID().toString());
        var cookie = seed(own); seed(other);
        mvc.perform(get("/api/auth/me").cookie(cookie)).andExpect(jsonPath("$.authenticated").value(true));
        Long ownCheckin = jdbc.queryForObject("SELECT id FROM wellness_checkin WHERE user_id = ?", Long.class, own.id());
        Long otherCheckin = jdbc.queryForObject("SELECT id FROM wellness_checkin WHERE user_id = ?", Long.class, other.id());
        var contract = new tools.jackson.databind.ObjectMapper().readTree(Files.readString(Path.of("../contracts/account-delete-204.json")));
        assertThat(contract.get("method").asText()).isEqualTo("DELETE");
        assertThat(contract.get("body").isNull()).isTrue();
        mvc.perform(withCookieCsrf(delete(contract.get("path").asText()).cookie(cookie)))
                .andExpect(status().is(contract.get("status").asInt())).andExpect(content().string(""));
        assertCounts(own, 0); assertCounts(other, 1);
        for (String table : List.of("checkin_insight", "checkin_food_recommendation", "checkin_music_recommendation")) {
            assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM " + table + " WHERE checkin_id = ?", Integer.class, ownCheckin)).isZero();
            assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM " + table + " WHERE checkin_id = ?", Integer.class, otherCheckin)).isPositive();
        }
        var again = social(number);
        assertThat(again.id()).isNotEqualTo(own.id());
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM wellness_checkin WHERE user_id = ?", Integer.class, again.id())).isZero();
        mvc.perform(get("/api/auth/me").cookie(cookie)).andExpect(jsonPath("$.authenticated").value(false));
    }
    @Test public void deniesGuestAnonymousAndMissingCsrf() throws Exception {
        mvc.perform(withCookieCsrf(delete("/api/auth/account"))).andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("UNAUTHENTICATED"));
        var own = social(UUID.randomUUID().toString());
        mvc.perform(delete("/api/auth/account").with(authentication(auth(own))))
                .andExpect(status().isForbidden()).andExpect(jsonPath("$.code").value("FORBIDDEN"));
        String fixture = Files.readString(Path.of("../contracts/account-delete-guest-403.json"));
        mvc.perform(withCookieCsrf(delete("/api/auth/account").with(authentication(auth(users.guest())))))
                .andExpect(status().isForbidden()).andExpect(content().json(fixture));
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM app_user WHERE id IN (1, ?)", Integer.class, own.id())).isEqualTo(2);
    }
    @Test public void rollsBackEveryDeletionWhenTransactionFails() throws Exception {
        var own = social(UUID.randomUUID().toString()); seed(own);
        assertThatThrownBy(() -> transactions.executeWithoutResult(status -> {
            deletion.delete(own);
            throw new IllegalStateException("synthetic rollback");
        })).isInstanceOf(IllegalStateException.class);
        assertCounts(own, 1);
        for (String table : List.of("checkin_insight", "checkin_food_recommendation", "checkin_music_recommendation")) {
            assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM " + table + " WHERE checkin_id IN (SELECT id FROM wellness_checkin WHERE user_id = ?)", Integer.class, own.id())).isPositive();
        }
    }
}
