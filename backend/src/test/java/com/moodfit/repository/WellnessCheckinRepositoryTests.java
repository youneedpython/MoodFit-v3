package com.moodfit.repository;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

import org.hibernate.SessionFactory;
import org.hibernate.stat.Statistics;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import com.moodfit.dto.request.WeatherCondition;
import com.moodfit.entity.FoodRecommendationValue;
import com.moodfit.entity.MusicRecommendationValue;
import com.moodfit.entity.WellnessCheckin;

import jakarta.persistence.EntityManager;

@SpringBootTest
@Transactional
class WellnessCheckinRepositoryTests {

    @Autowired
    private WellnessCheckinRepository repository;

    @Autowired
    private EntityManager entityManager;

    @BeforeEach
    void setUp() {
        repository.deleteAll();
    }

    @Test
    void persistsInstantAsUtcWithMicrosecondPrecision() {
        Instant recordedAt = Instant.parse("2026-09-30T12:34:56.123456789Z");

        WellnessCheckin saved = repository.save(sample(recordedAt, "ENERGETIC"));
        repository.flush();
        entityManager.clear();

        WellnessCheckin found = repository.findById(saved.getId()).orElseThrow();

        assertThat(found.getRecordedAt()).isEqualTo(Instant.parse("2026-09-30T12:34:56.123456Z"));
    }

    @Test
    void preservesRecommendationOrderByPosition() {
        WellnessCheckin saved = repository.save(sample(Instant.parse("2026-09-30T00:00:00Z"), "CALM"));
        repository.flush();
        entityManager.clear();

        WellnessCheckin found = repository.findById(saved.getId()).orElseThrow();

        assertThat(found.getFoodRecommendations())
                .extracting(FoodRecommendationValue::getName)
                .containsExactly("Mood Food", "Context Food");
        assertThat(found.getMusicRecommendations())
                .extracting(MusicRecommendationValue::getTitle)
                .containsExactly("Mood Music", "Context Music");
    }

    @Test
    void findsHistoryInRecordedAtAscendingOrderWithinRollingWindow() {
        repository.save(sample(Instant.parse("2026-09-28T00:00:00Z"), "TIRED"));
        repository.save(sample(Instant.parse("2026-09-29T00:00:00Z"), "BALANCED"));
        repository.save(sample(Instant.parse("2026-09-30T00:00:00Z"), "ENERGETIC"));
        repository.flush();

        List<WellnessCheckin> items = repository.findByRecordedAtGreaterThanEqualOrderByRecordedAtAsc(
                Instant.parse("2026-09-29T00:00:00Z"));

        assertThat(items)
                .extracting(WellnessCheckin::getRecordedAt)
                .containsExactly(
                        Instant.parse("2026-09-29T00:00:00Z"),
                        Instant.parse("2026-09-30T00:00:00Z"));
    }

    @Test
    void loadsHistoryRecommendationsWithoutAdditionalQueriesPerCheckin() {
        repository.save(sample(Instant.parse("2026-09-28T00:00:00Z"), "TIRED"));
        repository.save(sample(Instant.parse("2026-09-29T00:00:00Z"), "BALANCED"));
        repository.save(sample(Instant.parse("2026-09-30T00:00:00Z"), "ENERGETIC"));
        repository.flush();
        entityManager.clear();

        Statistics statistics = entityManager.getEntityManagerFactory().unwrap(SessionFactory.class).getStatistics();
        statistics.setStatisticsEnabled(true);
        statistics.clear();
        try {
            List<WellnessCheckin> items = repository.findByRecordedAtGreaterThanEqualOrderByRecordedAtAsc(
                    Instant.parse("2026-09-28T00:00:00Z"));

            assertThat(items).hasSize(3);
            assertThat(items).allSatisfy(item -> {
                assertThat(item.getFoodRecommendations())
                        .extracting(FoodRecommendationValue::getName)
                        .containsExactly("Mood Food", "Context Food");
                assertThat(item.getMusicRecommendations())
                        .extracting(MusicRecommendationValue::getTitle)
                        .containsExactly("Mood Music", "Context Music");
            });
            // DEC-020: 기록 수와 관계없이 Recommendation까지 하나의 Query로 조회한다. (N+1 없음)
            assertThat(statistics.getPrepareStatementCount()).isEqualTo(1);
        } finally {
            statistics.setStatisticsEnabled(false);
        }
    }

    private WellnessCheckin sample(Instant recordedAt, String mood) {
        return new WellnessCheckin(
                recordedAt,
                68,
                18,
                86,
                31,
                74,
                BigDecimal.valueOf(19.0),
                WeatherCondition.RAIN,
                76,
                mood,
                "Summary",
                List.of(
                        new FoodRecommendationValue("Mood Food", "Mood Tag", "Mood Reason"),
                        new FoodRecommendationValue("Context Food", "Context Tag", "Context Reason")),
                List.of(
                        new MusicRecommendationValue("Mood Music", "MoodFit Curated", "Mood Tag", "Mood Reason"),
                        new MusicRecommendationValue("Context Music", "MoodFit Curated", "Context Tag", "Context Reason")));
    }
}
