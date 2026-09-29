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
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
class CheckinControllerTests {

    @Autowired
    private MockMvc mockMvc;

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
}
