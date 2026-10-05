package com.moodfit.contract;

import java.math.BigDecimal;
import java.nio.file.*;
import java.time.*;
import java.util.*;
import com.moodfit.dto.request.WeatherCondition;
import com.moodfit.entity.WellnessCheckin;
import com.moodfit.repository.WellnessCheckinRepository;
import com.moodfit.insight.InsightData;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.*;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.*;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;
import jakarta.persistence.EntityManager;
import tools.jackson.databind.*;
import tools.jackson.databind.node.ObjectNode;
import static com.moodfit.auth.GuestRequests.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.assertj.core.api.Assertions.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class PersonalBaselineContractTests {
    static final Instant NOW = Instant.parse("2026-09-28T03:00:00Z");
    @TestConfiguration static class Config {
        @Bean @Primary Clock baselineClock() { return Clock.fixed(NOW, ZoneOffset.UTC); }
    }
    @Autowired MockMvc mvc;
    @Autowired WellnessCheckinRepository repository;
    @Autowired EntityManager entityManager;
    @Autowired InsightData insight;
    @Autowired com.moodfit.auth.AppUserRepository users;
    final ObjectMapper mapper = new ObjectMapper();
    @Test void guestBaselineMatchesContractAndSnapshotSurvivesNewSamples() throws Exception {
        repository.deleteAll();
        for (int i = 1; i <= 5; i++) seed(NOW.minusSeconds(i), 68, 18);
        var created = mapper.readTree(mvc.perform(post("/api/check-ins").contentType(MediaType.APPLICATION_JSON).content("""
            {"heartRate":68,"respiratoryRate":18,"sleepScore":86,"stressLevel":31,"energyLevel":74,"temperature":19.0,"weather":"RAIN"}
            """)).andExpect(status().isCreated()).andReturn().getResponse().getContentAsString(java.nio.charset.StandardCharsets.UTF_8));
        var expected = mapper.readTree(Files.readString(Path.of("../contracts/checkin-baseline-201.json")));
        long id = created.get("id").asLong();
        ((ObjectNode) expected).set("id", created.get("id"));
        assertThat(created).isEqualTo(expected);
        var latest = mapper.readTree(mvc.perform(get("/api/check-ins/latest")).andExpect(status().isOk()).andReturn().getResponse().getContentAsString(java.nio.charset.StandardCharsets.UTF_8));
        assertThat(latest).isEqualTo(created);
        seed(NOW.plusSeconds(1), 180, 40);
        repository.flush(); entityManager.clear();
        var snapshot = repository.findById(id).orElseThrow().getBaseline();
        assertThat(snapshot.sampleCount()).isEqualTo(5);
        assertThat(snapshot.averages().heartRate()).isEqualByComparingTo("68.0");
        assertThat(snapshot.tension()).isEqualTo("STABLE");
        var input = insight.checkin(id, 1L);
        assertThat(input).containsEntry("tension", "안정");
        assertThat(input.get("heartRateDelta")).isEqualTo(new BigDecimal("0.0"));
        assertThat(input).doesNotContainKeys("id", "userId", "displayName", "region", "email", "checkinId");
        var history = mapper.readTree(mvc.perform(get("/api/check-ins/history")).andExpect(status().isOk()).andReturn().getResponse().getContentAsString(java.nio.charset.StandardCharsets.UTF_8));
        JsonNode historyItem = null;
        for (int i = 0; i < history.get("items").size(); i++) {
            var item = history.get("items").get(i);
            if (item.get("id").asLong() == id) historyItem = item;
        }
        assertThat(historyItem).isNotNull();
        assertThat(historyItem.get("tension").asText()).isEqualTo("STABLE");
    }
    private WellnessCheckin seed(Instant time, int heart, int breathing) {
        return repository.save(new WellnessCheckin(time, heart, breathing, 86, 31, 74, new BigDecimal("19.0"),
                WeatherCondition.RAIN, 76, "ENERGETIC", "summary", List.of(), List.of()));
    }
    @Test void socialUsesOnlyOwnPriorWindowAndHighDoesNotChangeScore() throws Exception {
        var user = users.save(new com.moodfit.auth.AppUser("google", UUID.randomUUID().toString(), "Baseline test"));
        Long owner = user.getId();
        for (int i = 1; i <= 4; i++) seedOwner(owner, NOW.minusSeconds(i));
        seedOwner(owner, NOW.minus(Duration.ofDays(14)));
        seedOwner(owner, NOW.minus(Duration.ofDays(14)).minusNanos(1000));
        seedOwner(owner, NOW);
        seedOwner(owner, NOW.plusSeconds(1));
        seed(NOW.minusSeconds(10), 180, 40);
        var identity = com.moodfit.auth.UserIdentity.from(user);
        var authentication = new org.springframework.security.authentication.UsernamePasswordAuthenticationToken(identity, null,
                List.of(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_USER")));
        var result = mapper.readTree(mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post("/api/check-ins")
                .with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication(authentication))
                .with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf())
                .contentType(MediaType.APPLICATION_JSON).content("""
                {"heartRate":92,"respiratoryRate":20,"sleepScore":86,"stressLevel":31,"energyLevel":74,"temperature":19.0,"weather":"RAIN"}
                """)).andExpect(status().isCreated()).andReturn().getResponse().getContentAsString(java.nio.charset.StandardCharsets.UTF_8));
        assertThat(result.get("baseline").get("sampleCount").asInt()).isEqualTo(5);
        assertThat(result.get("baseline").get("averages").get("heartRate").asDouble()).isEqualTo(80.0);
        assertThat(result.get("baseline").get("tension").asText()).isEqualTo("HIGH");
        assertThat(result.get("mood").get("code").asText()).isEqualTo("BALANCED");
        assertThat(result.get("wellnessScore").asInt()).isEqualTo(76);
        var input = insight.checkin(result.get("id").asLong(), owner);
        assertThat(input).containsEntry("tension", "높음");
        assertThat(input).doesNotContainKeys("id", "userId", "displayName", "region", "email", "checkinId");
    }
    @Test void absentBaselineDoesNotAddAiFields() {
        var row = seed(NOW.minusSeconds(1), 68, 18);
        assertThat(insight.checkin(row.getId(), 1L)).doesNotContainKeys("tension", "heartRateDelta", "respiratoryRateDelta");
    }
    private void seedOwner(Long owner, Instant time) {
        var row = new WellnessCheckin(time, 80, 20, 86, 31, 74, new BigDecimal("19.0"),
                WeatherCondition.RAIN, 76, "ENERGETIC", "summary", List.of(), List.of());
        row.assignUser(owner);
        repository.save(row);
    }
}
