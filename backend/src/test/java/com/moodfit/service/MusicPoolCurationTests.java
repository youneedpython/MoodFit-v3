package com.moodfit.service;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;

import org.junit.jupiter.api.Test;

import com.moodfit.entity.MusicRecommendationValue;

class MusicPoolCurationTests {
    @Test
    void curatedTracksBelongOnlyToApprovedPools() {
        assertMembership("11cta61wi0g", List.of("ENERGETIC", "HOT"));
        assertMembership("uLUvHUzd4UA", List.of("CALM", "BALANCED", "CLOUDY"));
        assertMembership("LjhCEhWiKXk", List.of("CALM", "BALANCED"));
        assertMembership("YQHsXMglC9A", List.of("RAIN"));
        assertMembership("zABLecsR5UE", List.of("RAIN"));
        assertMembership("m3DZsBw5bnE", List.of("CALM", "RAIN"));
        assertMembership("H5v3kku4y6Q", List.of("ENERGETIC", "BALANCED", "CLOUDY"));
    }

    @Test
    void energeticAndRainPreserveContractPositions() {
        var energetic = WellnessRulePolicy.MOOD_MUSIC.get(WellnessRulePolicy.MoodType.ENERGETIC);
        assertThat(energetic).hasSize(26);
        assertThat(energetic.subList(0, 5)).extracting(MusicRecommendationValue::getTitle)
                .containsExactly("Uptown Funk", "Can't Stop the Feeling!", "Dynamite", "Viva La Vida", "Shape of You");
        assertThat(energetic.subList(24, 26)).extracting(MusicRecommendationValue::getTitle)
                .containsExactly("Hype Boy", "As It Was");
        assertThat(WellnessRulePolicy.CONTEXT_MUSIC.get(WellnessRulePolicy.ContextType.RAIN))
                .extracting(MusicRecommendationValue::getVideoId)
                .containsExactly("hLQl3WQQoQ0", "bx1Bh8ZvH84", "YQHsXMglC9A", "tO4dxvguQDk",
                        "pB-5XG-DbAA", "viimfQi_pUw", "zABLecsR5UE", "BzYnNdJhZQw", "m3DZsBw5bnE");
    }

    @Test
    void poolSizesMatchApprovedCuration() {
        int[] moodSizes = {9, 26, 14, 14};
        for (var mood : WellnessRulePolicy.MoodType.values()) {
            assertThat(WellnessRulePolicy.MOOD_MUSIC.get(mood)).hasSize(moodSizes[mood.ordinal()]);
        }
        int[] contextSizes = {7, 8, 9, 5, 10, 8};
        for (var context : WellnessRulePolicy.ContextType.values()) {
            assertThat(WellnessRulePolicy.CONTEXT_MUSIC.get(context)).hasSize(contextSizes[context.ordinal()]);
        }
    }

    private static void assertMembership(String videoId, List<String> expectedPools) {
        WellnessRulePolicy.MOOD_MUSIC.forEach((pool, tracks) ->
                assertTrack(pool.name(), tracks, videoId, expectedPools));
        WellnessRulePolicy.CONTEXT_MUSIC.forEach((pool, tracks) ->
                assertTrack(pool.name(), tracks, videoId, expectedPools));
    }

    private static void assertTrack(String pool, List<MusicRecommendationValue> tracks,
            String videoId, List<String> expectedPools) {
        var matches = tracks.stream().filter(track -> videoId.equals(track.getVideoId())).toList();
        assertThat(matches).as("%s in %s", videoId, pool).hasSize(expectedPools.contains(pool) ? 1 : 0);
        matches.forEach(track -> {
            assertThat(track.getTag()).isEqualTo(tracks.getFirst().getTag());
            assertThat(track.getReason()).isEqualTo(tracks.getFirst().getReason());
        });
    }
}
