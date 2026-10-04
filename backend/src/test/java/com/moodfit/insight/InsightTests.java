package com.moodfit.insight;

import java.nio.file.*;
import java.util.*;
import java.util.concurrent.*;
import com.moodfit.auth.*;
import com.moodfit.repository.WellnessCheckinRepository;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.boot.test.system.CapturedOutput;
import org.springframework.boot.test.system.OutputCaptureExtension;
import com.anthropic.errors.AnthropicServiceException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.*;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.web.servlet.*;
import tools.jackson.databind.ObjectMapper;
import static org.assertj.core.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.*;
import static org.mockito.Mockito.*;

@SpringBootTest(properties = {"LLM_ENABLED=true", "LLM_DAILY_INSIGHT_LIMIT=2", "LLM_DAILY_REPORT_LIMIT=1"})
@AutoConfigureMockMvc
@ExtendWith(OutputCaptureExtension.class)
class InsightTests {
    @TestConfiguration static class Config {
        @Bean @Primary Fake generator() { return new Fake(); }
        @Bean @Primary java.time.Clock insightClock() { return java.time.Clock.fixed(java.time.Instant.parse("2026-10-04T03:00:00Z"), java.time.ZoneOffset.UTC); }
    }
    static class Fake implements InsightGenerator {
        int calls;
        String input;
        String output = "오늘은 가볍게 산책해 보세요.";
        boolean fail;
        RuntimeException exception;
        @Override public String generate(String json, boolean weekly) {
            calls++; input = json;
            if (exception != null) throw exception;
            if (fail) throw new IllegalStateException("Not logged");
            return output;
        }
    }
    @Autowired MockMvc mvc;
    @Autowired JdbcTemplate jdbc;
    @Autowired Fake fake;
    @Autowired AppUserRepository users;
    @Autowired WellnessCheckinRepository checkins;
    @Autowired InsightStore store;
    final ObjectMapper mapper = new ObjectMapper();
    UserIdentity user;
    static final String INPUT = """
        {"heartRate":68,"respiratoryRate":18,"sleepScore":86,"stressLevel":31,"energyLevel":74,"temperature":19.0,"weather":"RAIN","region":"비공개지역"}
        """;
    @BeforeEach void setup() {
        clean();
        user = UserIdentity.from(users.save(new AppUser("google", UUID.randomUUID().toString(), "비공개이름")));
        fake.calls = 0; fake.input = null; fake.output = "오늘은 가볍게 산책해 보세요."; fake.fail = false; fake.exception = null;
    }
    @AfterEach void clean() {
        jdbc.update("DELETE FROM checkin_insight"); jdbc.update("DELETE FROM weekly_report"); jdbc.update("DELETE FROM llm_usage");
    }
    org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder asUser(
            org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder builder, UserIdentity identity) {
        return builder.with(authentication(new UsernamePasswordAuthenticationToken(identity, null, List.of(new SimpleGrantedAuthority("ROLE_USER")))));
    }
    long create() throws Exception {
        var result = mvc.perform(asUser(post("/api/check-ins").with(csrf()).contentType(MediaType.APPLICATION_JSON).content(INPUT), user))
                .andExpect(status().isCreated()).andReturn();
        return mapper.readTree(result.getResponse().getContentAsString()).get("id").asLong();
    }
    ResultActions generate(long id) throws Exception {
        return mvc.perform(asUser(post("/api/check-ins/" + id + "/insight").with(csrf()), user));
    }
    @Test void weeklyRequiresAuthenticationForGetAndPostWithCsrf() throws Exception {
        mvc.perform(get("/api/reports/weekly")).andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("UNAUTHENTICATED"));
        mvc.perform(post("/api/reports/weekly").with(csrf())).andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("UNAUTHENTICATED"));
        assertThat(fake.calls).isZero();
    }
    @Test void savesReusesAndProjectsOnlyApprovedData() throws Exception {
        long id = create();
        generate(id).andExpect(status().isOk()).andExpect(jsonPath("$.text").value(fake.output));
        generate(id).andExpect(status().isOk()); assertThat(fake.calls).isEqualTo(1);
        assertThat(fake.input).doesNotContain("비공개", "userId", "region", "recordedAt", "displayName", "checkinId");
        assertThat(mapper.readTree(fake.input).propertyNames()).containsExactlyInAnyOrder("score", "status", "sleepScore", "stressLevel", "energyLevel", "weather", "temperature", "heartRate", "respiratoryRate", "summary", "foods", "music");
        var saved = store.insight(id).orElseThrow();
        assertThat(saved.text()).isEqualTo(fake.output);
        var response = mvc.perform(asUser(get("/api/check-ins/" + id + "/insight"), user)).andReturn();
        assertThat(mapper.readTree(response.getResponse().getContentAsString())).isEqualTo(mapper.readTree(Files.readString(Path.of("..", "contracts", "insight-generated-200.json"))));
    }
    @Test void blocksGuestForeignOwnerAndMissingCsrf() throws Exception {
        long id = create();
        var guest = new UserIdentity(1L, "체험", "guest");
        mvc.perform(asUser(post("/api/check-ins/" + id + "/insight").with(csrf()), guest)).andExpect(status().isNotFound());
        var other = UserIdentity.from(users.save(new AppUser("kakao", UUID.randomUUID().toString(), "다른이름")));
        mvc.perform(asUser(get("/api/check-ins/" + id + "/insight"), other)).andExpect(status().isNotFound());
        mvc.perform(asUser(post("/api/check-ins/" + id + "/insight"), user)).andExpect(status().isForbidden());
        mvc.perform(asUser(post("/api/reports/weekly").with(csrf()), guest)).andExpect(status().isForbidden()).andExpect(jsonPath("$.code").value("LLM_UNAVAILABLE"));
        var guestRecord = mvc.perform(asUser(post("/api/check-ins").with(csrf()).contentType(MediaType.APPLICATION_JSON).content(INPUT), guest)).andReturn();
        long guestId = mapper.readTree(guestRecord.getResponse().getContentAsString()).get("id").asLong();
        mvc.perform(asUser(post("/api/check-ins/" + guestId + "/insight").with(csrf()), guest)).andExpect(status().isForbidden());
        mvc.perform(asUser(get("/api/reports/weekly"), guest)).andExpect(jsonPath("$.enabled").value(true)).andExpect(jsonPath("$.available").value(false));
        assertThat(fake.calls).isZero();
    }
    @Test void failuresConsumeLimitAndAreNeverSaved(CapturedOutput output) throws Exception {
        long id = create(); fake.fail = true;
        generate(id).andExpect(status().isOk()).andExpect(jsonPath("$.text").isEmpty());
        fake.fail = false; fake.output = " \u0000 ";
        generate(id).andExpect(status().isOk()).andExpect(jsonPath("$.text").isEmpty());
        generate(id).andExpect(status().isTooManyRequests()).andExpect(jsonPath("$.code").value("LLM_DAILY_LIMIT"));
        assertThat(store.insight(id)).isEmpty(); assertThat(fake.calls).isEqualTo(2);
        assertThat(output.getOut()).contains("kind=IllegalStateException", "kind=empty_response")
                .doesNotContain("Not logged", "비공개지역", "비공개이름");
    }
    @Test void serviceFailuresLogOnlyClassAndHttpStatus(CapturedOutput output) throws Exception {
        long id = create();
        var exception = mock(AnthropicServiceException.class);
        when(exception.statusCode()).thenReturn(429);
        when(exception.getMessage()).thenReturn("PRIVATE_RESPONSE_BODY");
        fake.exception = exception;
        generate(id).andExpect(status().isOk()).andExpect(jsonPath("$.text").isEmpty());
        assertThat(output.getOut()).contains("kind=" + exception.getClass().getSimpleName(), "status=429")
                .doesNotContain("PRIVATE_RESPONSE_BODY", "비공개지역", "비공개이름");
        assertThat(store.insight(id)).isEmpty();
    }
    @Test void weeklyMinimumProjectionPersistenceAndLimit() throws Exception {
        create(); create();
        mvc.perform(asUser(post("/api/reports/weekly").with(csrf()), user)).andExpect(status().isUnprocessableEntity());
        assertThat(fake.calls).isZero(); create();
        fake.output = mapper.readTree(Files.readString(Path.of("..", "contracts", "weekly-generated-200.json"))).get("text").asText();
        mvc.perform(asUser(post("/api/reports/weekly").with(csrf()), user)).andExpect(status().isOk()).andExpect(jsonPath("$.recordCount").value(3));
        assertThat(fake.input).doesNotContain("비공개", "userId", "region", "heartRate", "summary", "foods", "music");
        assertThat(mapper.readTree(fake.input).get(0).propertyNames()).containsExactlyInAnyOrder("date", "score", "status", "sleepScore", "stressLevel", "energyLevel", "weather", "temperature");
        var response = mvc.perform(asUser(get("/api/reports/weekly"), user)).andExpect(status().isOk()).andExpect(jsonPath("$.text").value(fake.output)).andReturn();
        assertThat(mapper.readTree(response.getResponse().getContentAsString())).isEqualTo(mapper.readTree(Files.readString(Path.of("..", "contracts", "weekly-generated-200.json"))));
        mvc.perform(asUser(post("/api/reports/weekly").with(csrf()), user)).andExpect(status().isTooManyRequests());
        assertThat(fake.calls).isEqualTo(1);
    }
    @Test void uniqueCollisionReturnsExistingCommentAndConcurrentQuotaIsAtomic() throws Exception {
        long id = create();
        var now = java.time.Instant.now().truncatedTo(java.time.temporal.ChronoUnit.MICROS);
        store.saveInsight(id, "첫 문장", "test", now);
        assertThat(store.saveInsight(id, "다른 문장", "test", now).text()).isEqualTo("첫 문장");
        var latch = new CountDownLatch(1);
        try (var executor = Executors.newFixedThreadPool(2)) {
            List<Future<Boolean>> attempts = new ArrayList<>();
            for (int i = 0; i < 2; i++) attempts.add(executor.submit(() -> {
                latch.await();
                try { store.reserve(user.id(), true, 1, now); return true; }
                catch (InsightException error) { assertThat(error.status).isEqualTo(429); return false; }
            }));
            latch.countDown();
            assertThat(List.of(attempts.get(0).get(10, TimeUnit.SECONDS), attempts.get(1).get(10, TimeUnit.SECONDS))).containsExactlyInAnyOrder(true, false);
        }
    }
    @Test void failedReportDoesNotReplaceSavedReportAndStillConsumesAttempt() throws Exception {
        create(); create(); create();
        store.saveReport(user.id(), "이전 리포트", "test", java.time.Instant.parse("2026-10-03T03:00:00Z"),
                java.time.LocalDate.parse("2026-09-27"), java.time.LocalDate.parse("2026-10-03"), 3);
        fake.fail = true;
        mvc.perform(asUser(post("/api/reports/weekly").with(csrf()), user)).andExpect(status().isOk()).andExpect(jsonPath("$.text").isEmpty());
        mvc.perform(asUser(get("/api/reports/weekly"), user)).andExpect(jsonPath("$.text").value("이전 리포트"));
        mvc.perform(asUser(post("/api/reports/weekly").with(csrf()), user)).andExpect(status().isTooManyRequests());
        assertThat(fake.calls).isEqualTo(1);
    }
    @Test void dailyQuotaResetsAtSeoulMidnight() {
        store.reserve(user.id(), true, 1, java.time.Instant.parse("2026-10-04T14:59:59Z"));
        assertThatThrownBy(() -> store.reserve(user.id(), true, 1, java.time.Instant.parse("2026-10-04T14:59:59Z"))).isInstanceOf(InsightException.class);
        assertThatCode(() -> store.reserve(user.id(), true, 1, java.time.Instant.parse("2026-10-04T15:00:00Z"))).doesNotThrowAnyException();
    }
    @Test void cleaningHasUnicodeSafeLimits() {
        assertThat(InsightText.clean(" 첫 문장.\r\n둘째\t문장.\r셋째\u0007 문장. ", false))
                .isEqualTo("첫 문장.\n둘째 문장.\n셋째 문장.");
        assertThat(InsightText.clean(" \u0000좋아요\u0007 ", false)).isEqualTo("좋아요");
        assertThat(InsightText.clean(" ", false)).isNull();
        assertThat(InsightText.clean("가".repeat(700), false)).hasSize(600);
        assertThat(InsightText.clean("가".repeat(1300), true)).hasSize(1200);
        String emoji = InsightText.clean("🙂".repeat(650), false);
        assertThat(emoji.codePointCount(0, emoji.length())).isEqualTo(600);
    }
}
