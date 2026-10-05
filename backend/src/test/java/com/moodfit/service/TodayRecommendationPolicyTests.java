package com.moodfit.service;

import java.math.BigDecimal;
import java.time.*;
import java.util.*;
import com.moodfit.dto.request.*;
import com.moodfit.entity.*;
import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.assertThat;

class TodayRecommendationPolicyTests {
    private final Clock clock = Clock.fixed(Instant.parse("2026-10-04T16:00:00Z"), ZoneOffset.UTC);
    private final WellnessRulePolicy policy = new WellnessRulePolicy(clock);
    private final RecommendationFeedbackService.Feedback empty = new RecommendationFeedbackService.Feedback(true, false, List.of());
    private final long day = LocalDate.of(2026, 10, 5).toEpochDay();

    @Test void boundariesAndWeatherUseExistingContext() {
        for (WeatherCondition weather : WeatherCondition.values()) {
            for (String degrees : List.of("-30.0", "5.0", "5.1", "29.9", "30.0", "50.0")) {
                var result = policy.recommendToday(new BigDecimal(degrees), weather, empty);
                String expected = Double.parseDouble(degrees) <= 5 ? "COLD" : Double.parseDouble(degrees) >= 30 ? "HOT" : weather.name();
                assertThat(result.context().code()).isEqualTo(expected);
                assertThat(result.context().label()).isIn("추위", "더위", "맑음", "흐림", "비", "눈");
                assertThat(result.foods()).hasSize(2);
                assertThat(result.music()).hasSize(2);
                assertThat(result).isEqualTo(policy.recommendToday(new BigDecimal(degrees), weather, empty));
            }
        }
    }

    @Test void contextOnlyTakesFirstTwoInSeoulRotationWithoutMoodExclusions() {
        for (var context : WellnessRulePolicy.ContextType.values()) {
            var weather = context == WellnessRulePolicy.ContextType.COLD || context == WellnessRulePolicy.ContextType.HOT
                    ? WeatherCondition.CLEAR : WeatherCondition.valueOf(context.name());
            var degrees = new BigDecimal(context == WellnessRulePolicy.ContextType.COLD ? "5.0" : context == WellnessRulePolicy.ContextType.HOT ? "30.0" : "19.0");
            var result = policy.recommendToday(degrees, weather, empty);
            var foods = WellnessRulePolicy.CONTEXT_FOODS.get(context);
            var music = WellnessRulePolicy.CONTEXT_MUSIC.get(context);
            assertThat(result.foods().stream().map(value -> value.name()).toList()).containsExactly(
                    foods.get(Math.floorMod(day, foods.size())).getName(), foods.get(Math.floorMod(day + 1, foods.size())).getName());
            assertThat(result.music().stream().map(value -> value.videoId()).toList()).containsExactly(
                    music.get(Math.floorMod(day, music.size())).getVideoId(), music.get(Math.floorMod(day + 1, music.size())).getVideoId());
            foods.forEach(value -> assertThat(WellnessRulePolicy.contains(RecommendationFeedbackService.Kind.FOOD, value.getName())).isTrue());
            music.forEach(value -> assertThat(WellnessRulePolicy.contains(RecommendationFeedbackService.Kind.MUSIC, value.getVideoId())).isTrue());
        }
    }

    @Test void energeticColdCheckinMatchesContextFoodWhenMoodDoesNotOverlap() {
        var checkin = policy.analyze(new CreateCheckinRequest(68, 18, 86, 31, 74, new BigDecimal("5.0"), WeatherCondition.CLEAR));
        var result = policy.recommendToday(new BigDecimal("5.0"), WeatherCondition.CLEAR, empty);
        assertThat(result.foods().stream().map(value -> value.name()).toList()).isEqualTo(checkin.foods().subList(3, 5).stream().map(FoodRecommendationValue::getName).toList());
    }

    @Test void tiredColdCheckinCanDifferBecauseItsMoodFoodsExcludeContextCandidates() {
        // Accepted TASK-070 Run 2 difference: Check-in excludes its three mood foods; today has none.
        var checkin = policy.analyze(new CreateCheckinRequest(68, 18, 30, 31, 30, new BigDecimal("5.0"), WeatherCondition.CLEAR));
        var result = policy.recommendToday(new BigDecimal("5.0"), WeatherCondition.CLEAR, empty);
        assertThat(result.foods().stream().map(value -> value.name()).toList()).isNotEqualTo(checkin.foods().subList(3, 5).stream().map(FoodRecommendationValue::getName).toList());
    }

    @Test void energeticRainCheckinMatchesBothContextPoolsWithoutMoodOverlap() {
        var checkin = policy.analyze(new CreateCheckinRequest(68, 18, 86, 31, 74, new BigDecimal("19.0"), WeatherCondition.RAIN));
        var result = policy.recommendToday(new BigDecimal("19.0"), WeatherCondition.RAIN, empty);
        assertThat(result.foods().stream().map(value -> value.name()).toList()).isEqualTo(checkin.foods().subList(3, 5).stream().map(FoodRecommendationValue::getName).toList());
        assertThat(result.music().stream().map(value -> value.videoId()).toList()).isEqualTo(checkin.music().subList(3, 5).stream().map(MusicRecommendationValue::getVideoId).toList());
    }

    @Test void feedbackSkipsDislikedAndPromotesLikedForBothKinds() {
        var initial = policy.recommendToday(new BigDecimal("19.0"), WeatherCondition.RAIN, empty);
        var foods = WellnessRulePolicy.CONTEXT_FOODS.get(WellnessRulePolicy.ContextType.RAIN);
        var music = WellnessRulePolicy.CONTEXT_MUSIC.get(WellnessRulePolicy.ContextType.RAIN);
        String likedFood = foods.get(Math.floorMod(day + 2, foods.size())).getName();
        String likedMusic = music.get(Math.floorMod(day + 2, music.size())).getVideoId();
        var feedback = new RecommendationFeedbackService.Feedback(true, false, List.of(
                new RecommendationFeedbackService.Item(RecommendationFeedbackService.Kind.FOOD, initial.foods().getFirst().name(), RecommendationFeedbackService.Rating.DISLIKE),
                new RecommendationFeedbackService.Item(RecommendationFeedbackService.Kind.FOOD, likedFood, RecommendationFeedbackService.Rating.LIKE),
                new RecommendationFeedbackService.Item(RecommendationFeedbackService.Kind.MUSIC, initial.music().getFirst().videoId(), RecommendationFeedbackService.Rating.DISLIKE),
                new RecommendationFeedbackService.Item(RecommendationFeedbackService.Kind.MUSIC, likedMusic, RecommendationFeedbackService.Rating.LIKE)));
        var result = policy.recommendToday(new BigDecimal("19.0"), WeatherCondition.RAIN, feedback);
        assertThat(result.foods().getFirst().name()).isEqualTo(likedFood);
        assertThat(result.foods().stream().map(value -> value.name()).toList()).doesNotContain(initial.foods().getFirst().name());
        assertThat(result.music().getFirst().videoId()).isEqualTo(likedMusic);
        assertThat(result.music().stream().map(value -> value.videoId()).toList()).doesNotContain(initial.music().getFirst().videoId());
    }
}
