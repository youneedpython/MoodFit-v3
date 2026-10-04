package com.moodfit.service;

import java.util.*;
import java.util.function.Function;
import java.util.stream.Stream;
import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.assertThat;
import com.moodfit.entity.FoodRecommendationValue;
import com.moodfit.entity.MusicRecommendationValue;
import com.moodfit.service.RecommendationFeedbackService.Rating;

class RecommendationFeedbackRuleTests {
    @Test void emptyFeedbackMatchesOriginalRotationAcrossAllPoolsAndDates() {
        for (var mood : WellnessRulePolicy.MoodType.values()) for (var context : WellnessRulePolicy.ContextType.values()) {
            for (long day : List.of(-19L, 0L, 1L, 20600L, 20601L)) {
                checkPools(WellnessRulePolicy.MOOD_FOODS.get(mood), WellnessRulePolicy.CONTEXT_FOODS.get(context), day, FoodRecommendationValue::getName);
                checkPools(WellnessRulePolicy.MOOD_MUSIC.get(mood), WellnessRulePolicy.CONTEXT_MUSIC.get(context), day, MusicRecommendationValue::getVideoId);
            }
        }
    }
    private <T> void checkPools(List<T> mood, List<T> context, long day, Function<T, String> name) {
        List<T> original = new ArrayList<>(); Set<String> used = new HashSet<>();
        for (var pool : List.of(mood, context)) {
            int target = pool == mood ? 3 : 5;
            for (int i = 0; i < pool.size() && original.size() < target; i++) {
                T item = pool.get(Math.floorMod(day + i, pool.size()));
                if (used.add(name.apply(item))) original.add(item);
            }
        }
        assertThat(WellnessRulePolicy.select(mood, context, day, name, Map.of())).containsExactlyElementsOf(original);
        Map<String, Rating> ratings = new HashMap<>();
        Stream.concat(mood.stream(), context.stream()).forEach(item -> ratings.put(name.apply(item), Rating.DISLIKE));
        var allDisliked = WellnessRulePolicy.select(mood, context, day, name, ratings);
        assertThat(allDisliked).containsExactlyElementsOf(original);
        assertThat(allDisliked.stream().map(name).distinct()).hasSize(5);
        ratings.put(name.apply(mood.get(Math.floorMod(day + 4, mood.size()))), Rating.LIKE);
        var result = WellnessRulePolicy.select(mood, context, day, name, ratings);
        assertThat(result).hasSize(5);
        assertThat(result.stream().map(name).distinct()).hasSize(5);
        assertThat(WellnessRulePolicy.select(mood, context, day, name, ratings)).isEqualTo(result);
    }
    @Test void skipsDislikesAndPromotesOneLikePerPoolWithOverlap() {
        var mood = List.of("a", "b", "c", "d", "e");
        var context = List.of("e", "f", "g", "h", "i");
        assertThat(WellnessRulePolicy.select(mood, context, 0, Function.identity(), Map.of("a", Rating.DISLIKE)))
                .containsExactly("b", "c", "d", "e", "f");
        assertThat(WellnessRulePolicy.select(mood, context, 0, Function.identity(), Map.of("e", Rating.LIKE, "h", Rating.LIKE, "i", Rating.LIKE)))
                .containsExactly("e", "a", "b", "h", "f");
        assertThat(WellnessRulePolicy.select(mood, context, 0, Function.identity(), Map.of("c", Rating.LIKE, "f", Rating.LIKE)))
                .containsExactly("c", "a", "b", "f", "e");
    }
}
