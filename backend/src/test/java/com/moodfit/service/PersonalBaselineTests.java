package com.moodfit.service;

import java.math.BigDecimal;
import java.time.*;
import java.util.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import com.moodfit.dto.request.*;
import com.moodfit.entity.WellnessCheckin;
import static org.assertj.core.api.Assertions.*;

class PersonalBaselineTests {
    static final Instant NOW = Instant.parse("2026-10-05T03:00:00Z");
    static CreateCheckinRequest request(int heart, int breathing) {
        return new CreateCheckinRequest(heart, breathing, 86, 31, 74, new BigDecimal("19.0"), WeatherCondition.RAIN);
    }
    static WellnessCheckin row(Long user, Instant time, int heart, int breathing) {
        var row = new WellnessCheckin(time, heart, breathing, 86, 31, 74, new BigDecimal("19.0"),
                WeatherCondition.RAIN, 76, "ENERGETIC", "summary", List.of(), List.of());
        row.assignUser(user);
        return row;
    }
    static List<WellnessCheckin> samples(int heart, int breathing) {
        return java.util.stream.IntStream.range(1, 6)
                .mapToObj(i -> row(1L, NOW.minusSeconds(i), heart, breathing)).toList();
    }
    @ParameterizedTest
    @CsvSource({"115,20,HIGH", "100,24,HIGH", "110,22,STABLE", "111,20,NORMAL", "114,23,NORMAL", "80,16,STABLE"})
    void comparesExactThresholdsWithoutFloatingPointError(int heart, int breathing, String expected) {
        var result = PersonalBaseline.calculate(samples(100, 20), 1L, NOW, request(heart, breathing));
        assertThat(result.tension()).isEqualTo(expected);
        assertThat(result.sampleCount()).isEqualTo(5);
    }
    @Test void respectsWindowCountOwnerAndCurrentRecord() {
        var rows = new ArrayList<>(samples(100, 20).subList(0, 4));
        rows.add(row(1L, NOW.minus(Duration.ofDays(14)).minusNanos(1000), 180, 40));
        rows.add(row(2L, NOW.minusSeconds(10), 180, 40));
        rows.add(row(1L, NOW, 180, 40));
        rows.add(row(1L, NOW.plusSeconds(1), 180, 40));
        assertThat(PersonalBaseline.calculate(rows, 1L, NOW, request(100, 20)).available()).isFalse();
        rows.add(row(1L, NOW.minus(Duration.ofDays(14)), 100, 20));
        var result = PersonalBaseline.calculate(rows, 1L, NOW, request(100, 20));
        assertThat(result.sampleCount()).isEqualTo(5);
        assertThat(result.averages().heartRate()).isEqualByComparingTo("100.0");
        assertThat(result.deltas().heartRate()).isEqualByComparingTo("0.0");
    }
    @Test void roundsMeansAndHandlesZeroDenominator() {
        var rows = new ArrayList<>(samples(100, 20));
        rows.set(0, row(1L, NOW.minusSeconds(1), 101, 21));
        var result = PersonalBaseline.calculate(rows, 1L, NOW, request(115, 24));
        assertThat(result.averages().heartRate()).isEqualByComparingTo("100.2");
        assertThat(result.deltas().heartRate()).isEqualByComparingTo("14.8");
        assertThat(PersonalBaseline.calculate(samples(0, 20), 1L, NOW, request(100, 20)).available()).isFalse();
    }
    @Test void onlyHighAdjustsMoodAndPoolKeepingScoreContextAndFeedback() {
        var policy = new WellnessRulePolicy(Clock.fixed(NOW, ZoneOffset.UTC));
        var feedback = new RecommendationFeedbackService.Feedback(true, List.of());
        var input = request(115, 24);
        var plain = policy.analyze(input, feedback);
        var high = PersonalBaseline.calculate(samples(100, 20), 1L, NOW, input);
        var adjusted = policy.analyze(input, feedback, high);
        assertThat(adjusted.wellnessScore()).isEqualTo(plain.wellnessScore());
        assertThat(adjusted.moodCode()).isEqualTo("BALANCED");
        assertThat(adjusted.summary()).isEqualTo(plain.summary() + " 평소보다 심박수와 호흡수가 높게 나타나 잠시 쉬어 가는 것이 어울립니다.");
        long date = LocalDate.of(2026, 10, 5).toEpochDay();
        var expected = WellnessRulePolicy.select(WellnessRulePolicy.MOOD_FOODS.get(WellnessRulePolicy.MoodType.CALM),
                WellnessRulePolicy.CONTEXT_FOODS.get(WellnessRulePolicy.ContextType.RAIN), date,
                com.moodfit.entity.FoodRecommendationValue::getName);
        assertThat(adjusted.foods()).extracting(com.moodfit.entity.FoodRecommendationValue::getName)
                .containsExactlyElementsOf(expected.stream().map(com.moodfit.entity.FoodRecommendationValue::getName).toList());
        for (var baseline : List.of(PersonalBaseline.calculate(samples(110, 24), 1L, NOW, input),
                PersonalBaseline.calculate(samples(103, 21), 1L, NOW, input))) {
            var unchanged = policy.analyze(input, feedback, baseline);
            assertThat(unchanged.moodCode()).isEqualTo(plain.moodCode());
            assertThat(unchanged.summary()).isEqualTo(plain.summary());
            assertThat(unchanged.foods()).extracting(com.moodfit.entity.FoodRecommendationValue::getName)
                    .containsExactlyElementsOf(plain.foods().stream().map(com.moodfit.entity.FoodRecommendationValue::getName).toList());
        }
    }
    @Test void namesOnlyElevatedMetric() {
        assertThat(PersonalBaseline.summary(PersonalBaseline.calculate(samples(100, 20), 1L, NOW, request(115, 20))))
                .contains("심박수가").doesNotContain("호흡수");
        assertThat(PersonalBaseline.summary(PersonalBaseline.calculate(samples(100, 20), 1L, NOW, request(100, 24))))
                .contains("호흡수가").doesNotContain("심박수");
    }
    @ParameterizedTest
    @CsvSource({"30,31,74,TIRED", "86,31,50,CALM", "86,60,50,BALANCED"})
    void highPreservesOtherMoodsAndUsesApprovedPools(int sleep, int stress, int energy, String mood) {
        var policy = new WellnessRulePolicy(Clock.fixed(NOW, ZoneOffset.UTC));
        var input = new CreateCheckinRequest(115, 24, sleep, stress, energy, new BigDecimal("19.0"), WeatherCondition.RAIN);
        var baseline = PersonalBaseline.calculate(samples(100, 20), 1L, NOW, input);
        var feedback = new RecommendationFeedbackService.Feedback(true, List.of(
                new RecommendationFeedbackService.Item(RecommendationFeedbackService.Kind.FOOD, "두부 채소 덮밥", RecommendationFeedbackService.Rating.LIKE),
                new RecommendationFeedbackService.Item(RecommendationFeedbackService.Kind.MUSIC,
                        WellnessRulePolicy.MOOD_MUSIC.get(WellnessRulePolicy.MoodType.CALM).getFirst().getVideoId(),
                        RecommendationFeedbackService.Rating.DISLIKE)));
        var result = policy.analyze(input, feedback, baseline);
        assertThat(result.moodCode()).isEqualTo(mood);
        assertThat(result.wellnessScore()).isEqualTo(policy.analyze(input).wellnessScore());
        var pool = WellnessRulePolicy.MoodType.valueOf(mood.equals("BALANCED") ? "CALM" : mood);
        long date = LocalDate.of(2026, 10, 5).toEpochDay();
        var foods = WellnessRulePolicy.select(WellnessRulePolicy.MOOD_FOODS.get(pool),
                WellnessRulePolicy.CONTEXT_FOODS.get(WellnessRulePolicy.ContextType.RAIN), date,
                com.moodfit.entity.FoodRecommendationValue::getName, feedback.ratings(RecommendationFeedbackService.Kind.FOOD));
        var music = WellnessRulePolicy.select(WellnessRulePolicy.MOOD_MUSIC.get(pool),
                WellnessRulePolicy.CONTEXT_MUSIC.get(WellnessRulePolicy.ContextType.RAIN), date,
                com.moodfit.entity.MusicRecommendationValue::getVideoId, feedback.ratings(RecommendationFeedbackService.Kind.MUSIC));
        assertThat(result.foods()).extracting(com.moodfit.entity.FoodRecommendationValue::getName)
                .containsExactlyElementsOf(foods.stream().map(com.moodfit.entity.FoodRecommendationValue::getName).toList());
        assertThat(result.music()).extracting(com.moodfit.entity.MusicRecommendationValue::getVideoId)
                .containsExactlyElementsOf(music.stream().map(com.moodfit.entity.MusicRecommendationValue::getVideoId).toList());
    }
}
