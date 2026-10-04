package com.moodfit.mysql;

import static org.assertj.core.api.Assertions.assertThat;
import static com.moodfit.auth.GuestRequests.get;
import static com.moodfit.auth.GuestRequests.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;

import org.hibernate.SessionFactory;
import org.hibernate.stat.Statistics;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.support.TransactionTemplate;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.mysql.MySQLContainer;

import com.moodfit.dto.request.WeatherCondition;
import com.moodfit.entity.FoodRecommendationValue;
import com.moodfit.entity.MusicRecommendationValue;
import com.moodfit.entity.WellnessCheckin;
import com.moodfit.repository.WellnessCheckinRepository;

import jakarta.persistence.EntityManager;

/**
 * DEC-023 / DEC-030: 실제 MySQL(mysql:8.4.11)에서 Flyway Schema와 저장 / 조회를 검증한다.
 * Docker가 없는 Local 환경에서는 건너뛴다. CI에서는 {@link DockerAvailabilityTests}가 Docker를 요구한다.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Testcontainers(disabledWithoutDocker = true)
class MySqlIntegrationTests {

    @Test
    void validatesAndPersistsRegionsInMySql() throws Exception {
        com.moodfit.controller.RegionAssertions.verify(mockMvc);
    }

    static final String MYSQL_IMAGE = "mysql:8.4.11";

    @Container
    @ServiceConnection
    static MySQLContainer mysql = new MySQLContainer(MYSQL_IMAGE);

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private WellnessCheckinRepository repository;

    @Autowired
    private EntityManager entityManager;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private TransactionTemplate transactionTemplate;

    @BeforeEach
    void setUp() {
        repository.deleteAll();
    }

    @Test
    void connectsToMySqlAndAppliesFlywayMigration() {
        assertThat(jdbcTemplate.queryForObject("SELECT VERSION()", String.class)).startsWith("8.4.");
        assertThat(jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM flyway_schema_history WHERE version IN ('1', '2', '3', '4') AND success = 1", Integer.class))
                .isEqualTo(4);
        assertThat(jdbcTemplate.queryForList(
                "SELECT table_name FROM information_schema.tables WHERE table_schema = DATABASE()", String.class))
                .contains("wellness_checkin", "checkin_food_recommendation", "checkin_music_recommendation", "app_user", "SPRING_SESSION", "SPRING_SESSION_ATTRIBUTES");
    }

    @Test
    void storesRecordedAtAsUtcWithMicrosecondPrecision() {
        Instant recordedAt = Instant.parse("2026-09-30T12:34:56.123456789Z");

        WellnessCheckin saved = repository.saveAndFlush(sample(recordedAt, new BigDecimal("19.0"), "Summary"));

        // DEC-019: JVM / DB Timezone과 관계없이 UTC 값이 DATETIME(6)에 그대로 저장된다.
        String stored = jdbcTemplate.queryForObject(
                "SELECT DATE_FORMAT(recorded_at, '%Y-%m-%d %H:%i:%s.%f') FROM wellness_checkin WHERE id = ?",
                String.class, saved.getId());
        assertThat(stored).isEqualTo("2026-09-30 12:34:56.123456");

        WellnessCheckin found = repository.findById(saved.getId()).orElseThrow();
        assertThat(found.getRecordedAt()).isEqualTo(Instant.parse("2026-09-30T12:34:56.123456Z"));
    }

    @Test
    void preservesTemperatureDecimalAndKoreanText() {
        WellnessCheckin cold = repository.saveAndFlush(
                sample(Instant.parse("2026-09-30T00:00:00Z"), new BigDecimal("-30.0"), "추운 날씨에는 보온에 신경 쓰세요."));
        WellnessCheckin hot = repository.saveAndFlush(
                sample(Instant.parse("2026-09-30T01:00:00Z"), new BigDecimal("50.0"), "더운 날씨에는 수분을 충분히 섭취하세요."));
        entityManager.clear();

        transactionTemplate.executeWithoutResult(status -> {
            WellnessCheckin foundCold = repository.findById(cold.getId()).orElseThrow();
            WellnessCheckin foundHot = repository.findById(hot.getId()).orElseThrow();

            assertThat(foundCold.getTemperature()).isEqualByComparingTo("-30.0");
            assertThat(foundHot.getTemperature()).isEqualByComparingTo("50.0");
            assertThat(foundCold.getSummary()).isEqualTo("추운 날씨에는 보온에 신경 쓰세요.");
            assertThat(foundCold.getFoodRecommendations())
                    .extracting(FoodRecommendationValue::getName)
                    .containsExactly("따뜻한 채소 스튜", "따뜻한 현미 주먹밥");
        });
    }

    @Test
    void findsHistoryWithinRollingWindowInOneQuery() {
        repository.save(sample(Instant.parse("2026-09-28T00:00:00Z"), new BigDecimal("19.0"), "Summary"));
        repository.save(sample(Instant.parse("2026-09-29T00:00:00Z"), new BigDecimal("19.0"), "Summary"));
        repository.save(sample(Instant.parse("2026-09-30T00:00:00Z"), new BigDecimal("19.0"), "Summary"));
        repository.flush();
        entityManager.clear();

        Statistics statistics = entityManager.getEntityManagerFactory().unwrap(SessionFactory.class).getStatistics();
        statistics.setStatisticsEnabled(true);
        statistics.clear();
        try {
            List<WellnessCheckin> items = transactionTemplate.execute(status -> {
                List<WellnessCheckin> found = repository.findByRecordedAtGreaterThanEqualOrderByRecordedAtAsc(
                        Instant.parse("2026-09-29T00:00:00Z"));
                found.forEach(item -> {
                    item.getFoodRecommendations().size();
                    item.getMusicRecommendations().size();
                });
                return found;
            });

            assertThat(items)
                    .extracting(WellnessCheckin::getRecordedAt)
                    .containsExactly(Instant.parse("2026-09-29T00:00:00Z"), Instant.parse("2026-09-30T00:00:00Z"));
            assertThat(items).allSatisfy(item -> {
                assertThat(item.getFoodRecommendations())
                        .extracting(FoodRecommendationValue::getName)
                        .containsExactly("따뜻한 채소 스튜", "따뜻한 현미 주먹밥");
                assertThat(item.getMusicRecommendations())
                        .extracting(MusicRecommendationValue::getTitle)
                        .containsExactly("Rainy Indoor Playlist", "Cloudy Focus Playlist");
            });
            // DEC-020: 실제 MySQL에서도 Recommendation까지 하나의 Query로 조회한다. (N+1 없음)
            assertThat(statistics.getPrepareStatementCount()).isEqualTo(1);
        } finally {
            statistics.setStatisticsEnabled(false);
        }
    }

    @Test
    void createThenReadLatestAndHistoryThroughApi() throws Exception {
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

        mockMvc.perform(post("/api/check-ins").contentType(MediaType.APPLICATION_JSON).content(request))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.recordedAt").value("2026-09-30T00:00:00Z"))
                .andExpect(jsonPath("$.mood.label").value("활기 있음"));

        mockMvc.perform(get("/api/check-ins/latest"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.recordedAt").value("2026-09-30T00:00:00Z"))
                .andExpect(jsonPath("$.weather.temperature").value(19.0))
                .andExpect(jsonPath("$.foods[0].name").value("연어 샐러드"))
                .andExpect(jsonPath("$.music[3].title").value("Someone Like You"))
                .andExpect(jsonPath("$.music.length()").value(5))
                .andExpect(jsonPath("$.foods.length()").value(5))
                .andExpect(jsonPath("$.music[0].videoId").value("OPf0YbXqDm0"))
                .andExpect(jsonPath("$.music[3].videoId").value("hLQl3WQQoQ0"));

        mockMvc.perform(get("/api/check-ins/history"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items.length()").value(1))
                .andExpect(jsonPath("$.items[0].recordedAt").value("2026-09-30T00:00:00Z"))
                .andExpect(jsonPath("$.items[0].temperature").value(19.0));
    }

    @Test
    void preservesLegacyTwoItemRecordsWithNullVideoIdThroughLatestAndHistory() throws Exception {
        repository.saveAndFlush(sample(Instant.parse("2026-09-30T00:00:00Z"), new BigDecimal("19.0"), "Legacy"));
        entityManager.clear();
        mockMvc.perform(get("/api/check-ins/latest"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.foods.length()").value(2))
                .andExpect(jsonPath("$.music.length()").value(2))
                .andExpect(jsonPath("$.music[0].title").value("Rainy Indoor Playlist"))
                .andExpect(jsonPath("$.music[0].videoId").value(org.hamcrest.Matchers.nullValue()));
        mockMvc.perform(get("/api/check-ins/history"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[0].musicTitles.length()").value(2))
                .andExpect(jsonPath("$.items[0].musicTitles[0]").value("Rainy Indoor Playlist"));
        assertThat(jdbcTemplate.queryForObject(
                "SELECT is_nullable FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'checkin_music_recommendation' AND column_name = 'video_id'", String.class))
                .isEqualTo("YES");
    }

    private WellnessCheckin sample(Instant recordedAt, BigDecimal temperature, String summary) {
        return new WellnessCheckin(
                recordedAt,
                68,
                18,
                86,
                31,
                74,
                temperature,
                WeatherCondition.RAIN,
                76,
                "CALM",
                summary,
                List.of(
                        new FoodRecommendationValue("따뜻한 채소 스튜", "따뜻한 메뉴", "비 오는 날씨에 어울리는 따뜻한 메뉴입니다."),
                        new FoodRecommendationValue("따뜻한 현미 주먹밥", "부담 적은 메뉴", "부담 없이 먹기 좋은 메뉴입니다.")),
                List.of(
                        new MusicRecommendationValue("Rainy Indoor Playlist", "MoodFit Curated", "차분한 분위기", "Reason"),
                        new MusicRecommendationValue("Cloudy Focus Playlist", "MoodFit Curated", "집중하기 좋은 분위기", "Reason")));
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
