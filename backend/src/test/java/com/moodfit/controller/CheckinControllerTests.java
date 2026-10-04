package com.moodfit.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;

import com.moodfit.dto.request.WeatherCondition;
import com.moodfit.entity.FoodRecommendationValue;
import com.moodfit.entity.MusicRecommendationValue;
import com.moodfit.entity.WellnessCheckin;
import com.moodfit.repository.WellnessCheckinRepository;

@SpringBootTest
@AutoConfigureMockMvc
class CheckinControllerTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private WellnessCheckinRepository repository;

    @org.junit.jupiter.api.BeforeEach
    void setUp() {
        repository.deleteAll();
    }

    @Test
    void validCreateRequestPersistsAndReturnsAnalysisResult() throws Exception {
        String request = """
                {
                  "heartRate": 68,
                  "respiratoryRate": 18,
                  "sleepScore": 86,
                  "stressLevel": 31,
                  "energyLevel": 74,
                  "temperature": 19.0,
                  "weather": "RAIN"
                }
                """;

        mockMvc.perform(post("/api/check-ins")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(request))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.recordedAt").value("2026-09-30T00:00:00Z"))
                .andExpect(jsonPath("$.mood.code").value("ENERGETIC"))
                .andExpect(jsonPath("$.mood.label").value("활기 있음"))
                .andExpect(jsonPath("$.wellnessScore").value(76))
                .andExpect(jsonPath("$.foods.length()").value(5))
                .andExpect(jsonPath("$.foods[0].name").value("연어 샐러드"))
                .andExpect(jsonPath("$.foods[3].name").value("따뜻한 채소 스튜"))
                .andExpect(jsonPath("$.music.length()").value(5))
                .andExpect(jsonPath("$.music[0].title").value("Uptown Funk"))
                .andExpect(jsonPath("$.music[3].title").value("Someone Like You"));
    }

    /**
     * DEC-019: History는 현재 시각 기준 최근 days × 24시간(Rolling Window)이며 경계 시각은 포함한다.
     * 고정 시계 현재 시각: 2026-09-30T00:00:00Z
     */
    @Test
    void historyIncludesOnlyCheckinsWithinTheDefaultSevenDayWindow() throws Exception {
        saveCheckinAt("2026-09-22T23:59:59Z"); // 7일 경계 1초 전 → 제외
        saveCheckinAt("2026-09-23T00:00:00Z"); // 정확히 7일 전 → 포함
        saveCheckinAt("2026-09-29T00:00:00Z"); // 1일 전 → 포함

        mockMvc.perform(get("/api/check-ins/history"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.days").value(7))
                .andExpect(jsonPath("$.items.length()").value(2))
                .andExpect(jsonPath("$.items[0].recordedAt").value("2026-09-23T00:00:00Z"))
                .andExpect(jsonPath("$.items[1].recordedAt").value("2026-09-29T00:00:00Z"));
    }

    @Test
    void historyWindowFollowsTheDaysParameter() throws Exception {
        saveCheckinAt("2026-09-28T23:59:59Z"); // 1일 경계 1초 전 → 제외
        saveCheckinAt("2026-09-29T00:00:00Z"); // 정확히 1일 전 → 포함
        saveCheckinAt("2026-09-01T00:00:00Z"); // 29일 전 → days=30에서만 포함
        saveCheckinAt("2026-08-31T00:00:00Z"); // 30일 전 → days=30에서 경계 포함

        mockMvc.perform(get("/api/check-ins/history").param("days", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items.length()").value(1))
                .andExpect(jsonPath("$.items[0].recordedAt").value("2026-09-29T00:00:00Z"));

        mockMvc.perform(get("/api/check-ins/history").param("days", "30"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items.length()").value(4))
                .andExpect(jsonPath("$.items[0].recordedAt").value("2026-08-31T00:00:00Z"));
    }

    private void saveCheckinAt(String recordedAt) {
        repository.save(new WellnessCheckin(
                Instant.parse(recordedAt),
                68,
                18,
                86,
                31,
                74,
                new BigDecimal("19.0"),
                WeatherCondition.RAIN,
                76,
                "ENERGETIC",
                "Summary",
                List.of(
                        new FoodRecommendationValue("Mood Food", "Tag", "Reason"),
                        new FoodRecommendationValue("Context Food", "Tag", "Reason")),
                List.of(
                        new MusicRecommendationValue("Mood Music", "MoodFit Curated", "Tag", "Reason"),
                        new MusicRecommendationValue("Context Music", "MoodFit Curated", "Tag", "Reason"))));
    }

    @Test
    void historyIncludesRecommendationNamesInOrder() throws Exception {
        String request = """
                {
                  "heartRate": 68,
                  "respiratoryRate": 18,
                  "sleepScore": 86,
                  "stressLevel": 31,
                  "energyLevel": 74,
                  "temperature": 19.0,
                  "weather": "RAIN"
                }
                """;

        mockMvc.perform(post("/api/check-ins")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(request))
                .andExpect(status().isCreated());

        mockMvc.perform(get("/api/check-ins/history"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items.length()").value(1))
                .andExpect(jsonPath("$.items[0].mood.code").value("ENERGETIC"))
                .andExpect(jsonPath("$.items[0].foodNames[0]").value("연어 샐러드"))
                .andExpect(jsonPath("$.items[0].foodNames[3]").value("따뜻한 채소 스튜"))
                .andExpect(jsonPath("$.items[0].musicTitles[0]").value("Uptown Funk"))
                .andExpect(jsonPath("$.items[0].musicTitles[3]").value("Someone Like You"));
    }

    @Test
    void invalidCreateRequestReturnsValidationErrorStructure() throws Exception {
        String request = """
                {
                  "heartRate": 39,
                  "respiratoryRate": 7,
                  "sleepScore": 101,
                  "stressLevel": -1,
                  "energyLevel": 101,
                  "temperature": 51,
                  "weather": null
                }
                """;

        mockMvc.perform(post("/api/check-ins")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(request))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"))
                .andExpect(jsonPath("$.message").isString())
                .andExpect(jsonPath("$.fieldErrors.heartRate").exists())
                .andExpect(jsonPath("$.fieldErrors.respiratoryRate").exists())
                .andExpect(jsonPath("$.fieldErrors.sleepScore").exists())
                .andExpect(jsonPath("$.fieldErrors.stressLevel").exists())
                .andExpect(jsonPath("$.fieldErrors.energyLevel").exists())
                .andExpect(jsonPath("$.fieldErrors.temperature").exists())
                .andExpect(jsonPath("$.fieldErrors.weather").exists());
    }

    @Test
    void latestReturnsNotFoundWhenNoCheckinExists() throws Exception {
        mockMvc.perform(get("/api/check-ins/latest"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("CHECKIN_NOT_FOUND"))
                .andExpect(jsonPath("$.message").isString())
                .andExpect(jsonPath("$.fieldErrors").isMap());
    }

    @Test
    void latestReturnsMostRecentCheckin() throws Exception {
        String request = """
                {
                  "heartRate": 68,
                  "respiratoryRate": 18,
                  "sleepScore": 86,
                  "stressLevel": 31,
                  "energyLevel": 74,
                  "temperature": 19.0,
                  "weather": "RAIN"
                }
                """;

        mockMvc.perform(post("/api/check-ins")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(request))
                .andExpect(status().isCreated());

        mockMvc.perform(get("/api/check-ins/latest"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.mood.code").value("ENERGETIC"))
                .andExpect(jsonPath("$.wellnessScore").value(76));
    }

    @Test
    void historyUsesDefaultSevenDays() throws Exception {
        mockMvc.perform(get("/api/check-ins/history"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.days").value(7))
                .andExpect(jsonPath("$.items").isArray());
    }

    @Test
    void historyRejectsDaysGreaterThanThirty() throws Exception {
        mockMvc.perform(get("/api/check-ins/history").param("days", "31"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"))
                .andExpect(jsonPath("$.message").isString())
                .andExpect(jsonPath("$.fieldErrors.days").exists());
    }

    @ParameterizedTest
    @ValueSource(strings = {"0", "-5"})
    void historyRejectsDaysLessThanOne(String days) throws Exception {
        mockMvc.perform(get("/api/check-ins/history").param("days", days))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"))
                .andExpect(jsonPath("$.message").isString())
                .andExpect(jsonPath("$.fieldErrors.days").exists());
    }

    @Test
    void historyRejectsNonNumericDays() throws Exception {
        mockMvc.perform(get("/api/check-ins/history").param("days", "abc"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"))
                .andExpect(jsonPath("$.message").isString())
                .andExpect(jsonPath("$.fieldErrors.days").exists());
    }

    @Test
    void unknownWeatherReturnsValidationErrorStructure() throws Exception {
        String request = """
                {
                  "heartRate": 68,
                  "respiratoryRate": 18,
                  "sleepScore": 86,
                  "stressLevel": 31,
                  "energyLevel": 74,
                  "temperature": 19.0,
                  "weather": "SUNNY"
                }
                """;

        mockMvc.perform(post("/api/check-ins")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(request))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"))
                .andExpect(jsonPath("$.message").isString())
                .andExpect(jsonPath("$.fieldErrors.weather").exists());
    }

    @Test
    void temperatureRejectsMoreThanOneFractionDigit() throws Exception {
        String request = """
                {
                  "heartRate": 68,
                  "respiratoryRate": 18,
                  "sleepScore": 86,
                  "stressLevel": 31,
                  "energyLevel": 74,
                  "temperature": 19.25,
                  "weather": "RAIN"
                }
                """;

        mockMvc.perform(post("/api/check-ins")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(request))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"))
                .andExpect(jsonPath("$.fieldErrors.temperature").exists());
    }

    @Test
    void nonNumericMetricReturnsValidationErrorStructure() throws Exception {
        String request = """
                {
                  "heartRate": "abc",
                  "respiratoryRate": 18,
                  "sleepScore": 86,
                  "stressLevel": 31,
                  "energyLevel": 74,
                  "temperature": 19.0,
                  "weather": "RAIN"
                }
                """;

        mockMvc.perform(post("/api/check-ins")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(request))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"))
                .andExpect(jsonPath("$.message").isString())
                .andExpect(jsonPath("$.fieldErrors.heartRate").exists());
    }

    @Test
    void malformedJsonReturnsValidationErrorStructure() throws Exception {
        mockMvc.perform(post("/api/check-ins")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"heartRate\":"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"))
                .andExpect(jsonPath("$.message").isString())
                .andExpect(jsonPath("$.fieldErrors").isMap());
    }

    @TestConfiguration
    static class FixedClockConfiguration {

        @Bean
        @Primary
        Clock fixedClock() {
            return Clock.fixed(Instant.parse("2026-09-30T00:00:00Z"), ZoneOffset.UTC);
        }
    }
}
