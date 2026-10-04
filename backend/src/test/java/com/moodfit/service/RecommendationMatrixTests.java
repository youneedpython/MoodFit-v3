package com.moodfit.service;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import java.util.List;

import org.junit.jupiter.api.Test;

import com.moodfit.dto.request.CreateCheckinRequest;
import com.moodfit.dto.request.WeatherCondition;
import com.moodfit.entity.FoodRecommendationValue;
import com.moodfit.entity.MusicRecommendationValue;

class RecommendationMatrixTests {
    private final WellnessRulePolicy policy = new WellnessRulePolicy();

    @Test
    void allTwentyFourMoodContextPairsHaveFiveDistinctRecommendationsAndApprovedTracks() {
        int[][] inputs = {{0, 0, 0}, {86, 31, 74}, {70, 35, 58}, {100, 100, 100}};
        String[] moods = {"TIRED", "ENERGETIC", "CALM", "BALANCED"};
        String[][] moodTracks = {
            {"Weightless|Marconi Union|UfcAVejslrU", "Clair de Lune|Claude Debussy|CvFH_6DNRCY", "River Flows in You|Yiruma|7maJOI3QMu0"},
            {"Uptown Funk|Mark Ronson ft. Bruno Mars|OPf0YbXqDm0", "Can't Stop the Feeling!|Justin Timberlake|ru0K8uYEZWw", "Dynamite|BTS|gdZLi9oWNZg"},
            {"Canon in D Major|Johann Pachelbel|NlprozGcs80", "Perfect|Ed Sheeran|2Vv-BfVoq4g", "All of Me|John Legend|450p7goxZqg"},
            {"Counting Stars|OneRepublic|hT_nvWreIhg", "Sugar|Maroon 5|09R8_2nJtjg", "Memories|Maroon 5|SlPhMPnQ58k"}
        };
        String[][] contextTracks = {
            {"Let It Go|Idina Menzel|L0MK7qz13bU", "Thinking Out Loud|Ed Sheeran|lp-EO5I60KA"},
            {"Despacito|Luis Fonsi ft. Daddy Yankee|kJQP7kiw5Fk", "Waka Waka (This Time for Africa)|Shakira|pRpeEdMmmQ0"},
            {"Someone Like You|Adele|hLQl3WQQoQ0", "Wonderwall|Oasis|bx1Bh8ZvH84"},
            {"Let It Go|Idina Menzel|L0MK7qz13bU", "Thinking Out Loud|Ed Sheeran|lp-EO5I60KA"},
            {"Happy|Pharrell Williams|ZbZSe6N_BXs", "Shake It Off|Taylor Swift|nfWlot6h_JM"},
            {"Paradise|Coldplay|1G4isv_Fylg", "Hymn for the Weekend|Coldplay|YykjpeuMNEk"}
        };
        String[] temperatures = {"5.0", "30.0", "19.0", "19.0", "19.0", "19.0"};
        WeatherCondition[] weather = {WeatherCondition.CLEAR, WeatherCondition.RAIN, WeatherCondition.RAIN,
                WeatherCondition.SNOW, WeatherCondition.CLEAR, WeatherCondition.CLOUDY};
        for (int m = 0; m < inputs.length; m++) {
            for (int c = 0; c < temperatures.length; c++) {
                int[] input = inputs[m];
                var result = policy.analyze(new CreateCheckinRequest(68, 18, input[0], input[1], input[2],
                        new BigDecimal(temperatures[c]), weather[c]));
                assertThat(result.moodCode()).isEqualTo(moods[m]);
                assertThat(result.foods()).hasSize(5).allSatisfy(food -> {
                    assertThat(food.getTag()).isNotBlank();
                    assertThat(food.getReason()).isNotBlank();
                });
                assertThat(result.foods()).extracting(FoodRecommendationValue::getName).doesNotHaveDuplicates();
                assertThat(result.music()).hasSize(5).allSatisfy(track -> {
                    assertThat(track.getVideoId()).matches("[A-Za-z0-9_-]{11}");
                    assertThat(track.getTag()).isNotBlank();
                    assertThat(track.getReason()).isNotBlank();
                });
                assertThat(result.music()).extracting(MusicRecommendationValue::getTitle).doesNotHaveDuplicates();
                assertThat(result.music()).extracting(MusicRecommendationValue::getVideoId).doesNotHaveDuplicates();
                assertTracks(result.music().subList(0, 3), moodTracks[m]);
                assertTracks(result.music().subList(3, 5), contextTracks[c]);
            }
        }
    }

    private void assertTracks(List<MusicRecommendationValue> tracks, String[] approved) {
        assertThat(tracks).extracting(track -> track.getTitle() + "|" + track.getArtist() + "|" + track.getVideoId())
                .containsExactly(approved);
    }
}
