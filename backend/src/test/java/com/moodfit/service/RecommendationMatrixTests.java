package com.moodfit.service;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import org.junit.jupiter.api.Test;
import com.moodfit.dto.request.CreateCheckinRequest;
import com.moodfit.dto.request.WeatherCondition;
import com.moodfit.entity.FoodRecommendationValue;
import com.moodfit.entity.MusicRecommendationValue;

class RecommendationMatrixTests {
    // Independent fixture: original tracks plus the forty Human-approved oEmbed triples.
    private static final Set<String> APPROVED = Set.of(
            "Weightless|Marconi Union|UfcAVejslrU",
            "Clair de Lune|Claude Debussy|CvFH_6DNRCY",
            "River Flows in You|Yiruma|7maJOI3QMu0",
            "Uptown Funk|Mark Ronson ft. Bruno Mars|OPf0YbXqDm0",
            "Can't Stop the Feeling!|Justin Timberlake|ru0K8uYEZWw",
            "Dynamite|BTS|gdZLi9oWNZg",
            "Canon in D Major|Johann Pachelbel|NlprozGcs80",
            "Perfect|Ed Sheeran|2Vv-BfVoq4g",
            "All of Me|John Legend|450p7goxZqg",
            "Counting Stars|OneRepublic|hT_nvWreIhg",
            "Sugar|Maroon 5|09R8_2nJtjg",
            "Memories|Maroon 5|SlPhMPnQ58k",
            "Let It Go|Idina Menzel|L0MK7qz13bU",
            "Thinking Out Loud|Ed Sheeran|lp-EO5I60KA",
            "Despacito|Luis Fonsi ft. Daddy Yankee|kJQP7kiw5Fk",
            "Waka Waka (This Time for Africa)|Shakira|pRpeEdMmmQ0",
            "Someone Like You|Adele|hLQl3WQQoQ0",
            "Wonderwall|Oasis|bx1Bh8ZvH84",
            "Happy|Pharrell Williams|ZbZSe6N_BXs",
            "Shake It Off|Taylor Swift|nfWlot6h_JM",
            "Paradise|Coldplay|1G4isv_Fylg",
            "Hymn for the Weekend|Coldplay|YykjpeuMNEk",
            "Viva La Vida|Coldplay|dvgZkm1xWPE",
            "Yellow|Coldplay|yKNxeF4KMsY",
            "Fix You|Coldplay|k4V3Mo61fJM",
            "Hello|Adele|YQHsXMglC9A",
            "Shape of You|Ed Sheeran|JGwWNGJdvx8",
            "Just the Way You Are|Bruno Mars|LjhCEhWiKXk",
            "Roar|Katy Perry|CevxZvSJLk8",
            "Firework|Katy Perry|QGJuMBdaqIw",
            "Believer|Imagine Dragons|7wtfhZwyrcc",
            "Thunder|Imagine Dragons|fKopy74weus",
            "Wake Me Up|Avicii|IcrbM1l_BoI",
            "Get Lucky|Daft Punk|5NV6Rdv1a3I",
            "Don't Stop Me Now|Queen|HgzGwKwLmgM",
            "Don't Stop Believin'|Journey|1k8craCGpgs",
            "Take On Me|a-ha|djV11Xbc914",
            "Don't Know Why|Norah Jones|tO4dxvguQDk",
            "Stay With Me|Sam Smith|pB-5XG-DbAA",
            "ocean eyes|Billie Eilish|viimfQi_pUw",
            "Someone You Loved|Lewis Capaldi|zABLecsR5UE",
            "Butter|BTS|WMweEpGlu_U",
            "봄날 (Spring Day)|BTS|xEeFrLSkMm8",
            "밤편지|IU|BzYnNdJhZQw",
            "Blueming|IU|D1PvIWdJ8xo",
            "Hype Boy|NewJeans|11cta61wi0g",
            "양화대교|Zion.T|uLUvHUzd4UA",
            "여행|볼빨간사춘기|xRbPAVnqtcs",
            "어떻게 이별까지 사랑하겠어, 널 사랑하는 거지|AKMU|m3DZsBw5bnE",
            "Nuvole Bianche|Ludovico Einaudi|4VR-6AS0-l4",
            "Riptide|Vance Joy|uJ_1HMAGb4k",
            "I'm Yours|Jason Mraz|EkHTsc9PU2A",
            "Lovely Day|Bill Withers|bEeaS6fuUoA",
            "September|Earth, Wind & Fire|Gs069dndIYk",
            "Good as Hell|Lizzo|SmbmeOgWsqE",
            "Levitating|Dua Lipa|TUVcZfQe-Kw",
            "Don't Start Now|Dua Lipa|oygrmJFKYZY",
            "Blinding Lights|The Weeknd|4NRXx6U8ABQ",
            "As It Was|Harry Styles|H5v3kku4y6Q",
            "Watermelon Sugar|Harry Styles|E07s5ZYygMg",
            "Circles|Post Malone|wXhTHyIgQ_U",
            "Sunflower|Post Malone, Swae Lee|ApXoWvfEYVU");

    private static WellnessRulePolicy policy(String instant) {
        return new WellnessRulePolicy(Clock.fixed(Instant.parse(instant), ZoneOffset.UTC));
    }
    private static CreateCheckinRequest request(int[] mood, int context) {
        String[] temperatures = {"5.0", "30.0", "19.0", "19.0", "19.0", "19.0"};
        WeatherCondition[] weather = {WeatherCondition.CLEAR, WeatherCondition.RAIN, WeatherCondition.RAIN,
                WeatherCondition.SNOW, WeatherCondition.CLEAR, WeatherCondition.CLOUDY};
        return new CreateCheckinRequest(68, 18, mood[0], mood[1], mood[2],
                new BigDecimal(temperatures[context]), weather[context]);
    }
    private static List<String> foods(WellnessRulePolicy.AnalysisResult r) {
        return r.foods().stream().map(FoodRecommendationValue::getName).toList();
    }
    private static List<String> music(WellnessRulePolicy.AnalysisResult r) {
        return r.music().stream().map(MusicRecommendationValue::getVideoId).toList();
    }

    @Test
    void candidatePoolsMeetMinimumSizesAndOnlyContainApprovedMetadata() {
        WellnessRulePolicy.MOOD_FOODS.values().forEach(p -> assertThat(p).hasSizeGreaterThanOrEqualTo(8));
        WellnessRulePolicy.CONTEXT_FOODS.values().forEach(p -> assertThat(p).hasSizeGreaterThanOrEqualTo(4));
        WellnessRulePolicy.MOOD_MUSIC.values().forEach(p -> assertThat(p).hasSizeGreaterThanOrEqualTo(8));
        WellnessRulePolicy.CONTEXT_MUSIC.values().forEach(p -> assertThat(p).hasSizeGreaterThanOrEqualTo(4));
        var tracks = Stream.concat(WellnessRulePolicy.MOOD_MUSIC.values().stream(),
                WellnessRulePolicy.CONTEXT_MUSIC.values().stream()).flatMap(List::stream).toList();
        tracks.forEach(t -> {
            assertThat(t.getVideoId()).matches("[A-Za-z0-9_-]{11}");
            assertThat(APPROVED).contains(t.getTitle() + "|" + t.getArtist() + "|" + t.getVideoId());
            assertThat(t.getTag()).isNotBlank();
            assertThat(t.getReason()).isNotBlank();
        });
        assertThat(tracks.stream().map(t -> t.getTitle() + "|" + t.getArtist() + "|" + t.getVideoId())
                .collect(Collectors.toSet())).isEqualTo(APPROVED);
    }

    @Test
    void everyMoodContextAcrossOneYearIsDeterministicDistinctAndRotatesDaily() {
        int[][] inputs = {{0, 0, 0}, {86, 31, 74}, {70, 35, 58}, {100, 100, 100}};
        String[] moods = {"TIRED", "ENERGETIC", "CALM", "BALANCED"};
        for (int day = 0; day < 366; day++) {
            Instant now = Instant.parse("2026-01-01T03:00:00Z").plusSeconds(day * 86400L);
            var current = policy(now.toString());
            var tomorrow = policy(now.plusSeconds(86400).toString());
            for (int m = 0; m < inputs.length; m++) {
                for (int c = 0; c < 6; c++) {
                    var input = request(inputs[m], c);
                    var r = current.analyze(input);
                    assertThat(r.moodCode()).isEqualTo(moods[m]);
                    assertThat(foods(r)).hasSize(5).doesNotHaveDuplicates();
                    assertThat(music(r)).hasSize(5).doesNotHaveDuplicates();
                    assertThat(r.music()).extracting(MusicRecommendationValue::getTitle).doesNotHaveDuplicates();
                    assertThat(foods(current.analyze(input))).isEqualTo(foods(r));
                    assertThat(music(current.analyze(input))).isEqualTo(music(r));
                    assertThat(foods(tomorrow.analyze(input))).isNotEqualTo(foods(r));
                    assertThat(music(tomorrow.analyze(input))).isNotEqualTo(music(r));
                    assertThat(tomorrow.analyze(input).summary()).isEqualTo(r.summary());
                }
            }
        }
    }

    @Test
    void wrapsAndSkipsOverlappingContextCandidatesIncludingAtPoolEnd() {
        assertThat(WellnessRulePolicy.select(List.of("a", "b", "c", "d"),
                List.of("d", "a", "e", "f", "g"), 3, v -> v))
                .containsExactly("d", "a", "b", "f", "g");
        assertThat(WellnessRulePolicy.select(List.of("a", "b", "c", "d"),
                List.of("d", "a", "e", "f", "g"), 4, v -> v))
                .containsExactly("a", "b", "c", "g", "d");
        assertThat(WellnessRulePolicy.select(List.of("a", "b", "c", "d"),
                List.of("d", "a", "e", "f", "g"), -1, v -> v))
                .containsExactly("d", "a", "b", "g", "e");
    }

    @Test
    void seoulMidnightIsUtcFifteenHoursRegardlessOfInjectedClockZone() {
        var input = request(new int[] {86, 31, 74}, 2);
        var before = policy("2026-09-28T14:59:59Z").analyze(input);
        var morning = policy("2026-09-28T00:00:00Z").analyze(input);
        var after = policy("2026-09-28T15:00:00Z").analyze(input);
        assertThat(foods(before)).isEqualTo(foods(morning));
        assertThat(music(before)).isEqualTo(music(morning));
        assertThat(foods(after)).isNotEqualTo(foods(before));
        assertThat(music(after)).isNotEqualTo(music(before));
        var otherZone = new WellnessRulePolicy(Clock.fixed(Instant.parse("2026-09-28T15:00:00Z"),
                ZoneOffset.ofHours(-7))).analyze(input);
        assertThat(foods(otherZone)).isEqualTo(foods(after));
        assertThat(music(otherZone)).isEqualTo(music(after));
    }
}
