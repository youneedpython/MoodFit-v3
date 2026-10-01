package com.moodfit.contract;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

import com.moodfit.repository.WellnessCheckinRepository;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.node.ObjectNode;

/**
 * DEC-024: Backend 실제 응답이 공유 계약 파일(Repository Root {@code contracts/})과 같은지 검증한다.
 * 필드 누락 / 추가 / 이름 / 값이 다르면 실패한다. DB가 정하는 {@code id}는 숫자인지만 확인한다.
 */
@SpringBootTest
@AutoConfigureMockMvc
class CheckinContractTests {

    /** Gradle Test 작업 디렉터리는 {@code backend/}이다. */
    private static final Path CONTRACTS = Path.of("..", "contracts");

    /** docs/05-API_SPEC.md 4절 Request 예시와 같은 입력 */
    private static final String VALID_REQUEST = """
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

    private static final String INVALID_REQUEST = VALID_REQUEST.replace("\"heartRate\": 68", "\"heartRate\": 200");

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private WellnessCheckinRepository repository;

    @BeforeEach
    void setUp() {
        repository.deleteAll();
    }

    @Test
    void createMatchesContract() throws Exception {
        assertMatchesContract(create().andExpect(status().isCreated()), "checkin-create-201.json");
    }

    @Test
    void latestMatchesContract() throws Exception {
        create().andExpect(status().isCreated());

        assertMatchesContract(
                mockMvc.perform(get("/api/check-ins/latest")).andExpect(status().isOk()),
                "checkin-latest-200.json");
    }

    @Test
    void latestWithoutCheckinMatchesNotFoundContract() throws Exception {
        assertMatchesContract(
                mockMvc.perform(get("/api/check-ins/latest")).andExpect(status().isNotFound()),
                "checkin-latest-404.json");
    }

    @Test
    void historyMatchesContract() throws Exception {
        create().andExpect(status().isCreated());

        assertMatchesContract(
                mockMvc.perform(get("/api/check-ins/history")).andExpect(status().isOk()),
                "checkin-history-200.json");
    }

    @Test
    void invalidCreateMatchesValidationErrorContract() throws Exception {
        assertMatchesContract(
                mockMvc.perform(post("/api/check-ins").contentType(MediaType.APPLICATION_JSON).content(INVALID_REQUEST))
                        .andExpect(status().isBadRequest()),
                "checkin-create-400.json");
    }

    private ResultActions create() throws Exception {
        return mockMvc.perform(post("/api/check-ins").contentType(MediaType.APPLICATION_JSON).content(VALID_REQUEST));
    }

    private void assertMatchesContract(ResultActions result, String contractFile) throws IOException {
        JsonNode expected = objectMapper.readTree(Files.readString(CONTRACTS.resolve(contractFile), StandardCharsets.UTF_8));
        JsonNode actual = objectMapper.readTree(result.andReturn().getResponse().getContentAsString(StandardCharsets.UTF_8));

        alignGeneratedId(actual, expected);
        if (actual.has("items")) {
            for (int i = 0; i < actual.get("items").size() && i < expected.path("items").size(); i++) {
                alignGeneratedId(actual.get("items").get(i), expected.get("items").get(i));
            }
        }

        assertThat(actual).as("contracts/%s", contractFile).isEqualTo(expected);
    }

    /** DB가 정하는 id는 실행마다 다르므로 숫자인지 확인한 뒤 계약 값으로 맞춘다. */
    private void alignGeneratedId(JsonNode actual, JsonNode expected) {
        if (actual.has("id") && expected.has("id")) {
            assertThat(actual.get("id").isIntegralNumber()).as("id는 숫자여야 한다: %s", actual.get("id")).isTrue();
            ((ObjectNode) actual).set("id", expected.get("id"));
        }
    }

    @TestConfiguration
    static class FixedClockConfiguration {

        /** docs/05-API_SPEC.md Response 예시의 recordedAt */
        @Bean
        @Primary
        Clock fixedClock() {
            return Clock.fixed(Instant.parse("2026-09-28T03:00:00Z"), ZoneOffset.UTC);
        }
    }
}
