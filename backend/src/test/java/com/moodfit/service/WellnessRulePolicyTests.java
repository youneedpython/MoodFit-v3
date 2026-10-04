package com.moodfit.service;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import com.moodfit.dto.request.CreateCheckinRequest;
import com.moodfit.dto.request.WeatherCondition;
import com.moodfit.entity.FoodRecommendationValue;
import com.moodfit.entity.MusicRecommendationValue;

/**
 * DEC-014 Wellness Analysis Rule 검증.
 * 기대값은 docs/09-DECISIONS.md DEC-014의 표를 그대로 옮긴 것이다.
 */
class WellnessRulePolicyTests {

    private final WellnessRulePolicy policy = new WellnessRulePolicy(java.time.Clock.fixed(java.time.Instant.EPOCH, java.time.ZoneOffset.UTC));

    @ParameterizedTest(name = "{0}")
    @CsvSource(delimiter = '|', textBlock = """
            E01 API 예시 입력                 | 86  | 31  | 74  | 19.0  | RAIN   | 76 | ENERGETIC | 연어 샐러드         | 따뜻한 채소 스튜         | Uptown Funk  | Someone Like You
            E02 모든 입력 최소                | 0   | 0   | 0   | 19.0  | RAIN   | 35 | TIRED     | 따뜻한 수프와 곡물빵 | 따뜻한 채소 스튜         | Weightless    | Someone Like You
            E03 모든 입력 최대                | 100 | 100 | 100 | 19.0  | RAIN   | 65 | BALANCED  | 닭가슴살 라이스볼    | 따뜻한 채소 스튜         | Counting Stars | Someone Like You
            E04 높은 Energy + 높은 Stress     | 80  | 80  | 90  | 19.0  | RAIN   | 62 | BALANCED  | 닭가슴살 라이스볼    | 따뜻한 채소 스튜         | Counting Stars | Someone Like You
            E05 낮은 Energy + 낮은 Stress     | 70  | 10  | 30  | 19.0  | RAIN   | 65 | TIRED     | 따뜻한 수프와 곡물빵 | 따뜻한 채소 스튜         | Weightless    | Someone Like You
            E06 energy = 35 TIRED 경계 포함   | 80  | 20  | 35  | 19.0  | RAIN   | 67 | TIRED     | 따뜻한 수프와 곡물빵 | 따뜻한 채소 스튜         | Weightless    | Someone Like You
            E07 sleep = 35 TIRED 경계 포함    | 35  | 20  | 80  | 19.0  | RAIN   | 64 | TIRED     | 따뜻한 수프와 곡물빵 | 따뜻한 채소 스튜         | Weightless    | Someone Like You
            E08 ENERGETIC 경계 포함           | 60  | 45  | 70  | 19.0  | RAIN   | 61 | ENERGETIC | 연어 샐러드         | 따뜻한 채소 스튜         | Uptown Funk  | Someone Like You
            E09 energy = 69 ENERGETIC 미달    | 60  | 45  | 69  | 19.0  | RAIN   | 61 | BALANCED  | 닭가슴살 라이스볼    | 따뜻한 채소 스튜         | Counting Stars | Someone Like You
            E10 stress = 46 ENERGETIC 미달    | 60  | 46  | 70  | 19.0  | RAIN   | 61 | BALANCED  | 닭가슴살 라이스볼    | 따뜻한 채소 스튜         | Counting Stars | Someone Like You
            E11 CALM 경계 포함                | 70  | 35  | 58  | 19.0  | RAIN   | 65 | CALM      | 두부 채소 덮밥       | 따뜻한 채소 스튜         | Canon in D Major    | Someone Like You
            E12 Score 64 CALM 미달            | 70  | 35  | 55  | 19.0  | RAIN   | 64 | BALANCED  | 닭가슴살 라이스볼    | 따뜻한 채소 스튜         | Counting Stars | Someone Like You
            E13 반올림 경계 3.50 → 4          | 10  | 100 | 0   | 19.0  | RAIN   | 4  | TIRED     | 따뜻한 수프와 곡물빵 | 따뜻한 채소 스튜         | Weightless    | Someone Like You
            E14 temperature = 5 COLD 포함     | 70  | 30  | 60  | 5.0   | CLEAR  | 67 | CALM      | 두부 채소 덮밥       | 따뜻한 죽               | Canon in D Major    | Let It Go
            E15 temperature = 5.1 COLD 아님   | 70  | 30  | 60  | 5.1   | CLEAR  | 67 | CALM      | 두부 채소 덮밥       | 과일 곁들인 그린 샐러드  | Canon in D Major    | Happy
            E16 temperature = 30 HOT 포함     | 70  | 30  | 60  | 30.0  | RAIN   | 67 | CALM      | 두부 채소 덮밥       | 그릭 요거트 볼           | Canon in D Major    | Despacito
            E17 temperature = 29.9 HOT 아님   | 70  | 30  | 60  | 29.9  | RAIN   | 67 | CALM      | 두부 채소 덮밥       | 따뜻한 채소 스튜         | Canon in D Major    | Someone Like You
            E18 temperature 최소 -30 + SNOW   | 70  | 30  | 60  | -30.0 | SNOW   | 67 | CALM      | 두부 채소 덮밥       | 따뜻한 죽               | Canon in D Major    | Let It Go
            E19 temperature 최대 50 + CLEAR   | 70  | 30  | 60  | 50.0  | CLEAR  | 67 | CALM      | 두부 채소 덮밥       | 그릭 요거트 볼           | Canon in D Major    | Despacito
            E20 CLOUDY 보통 기온              | 70  | 30  | 60  | 18.0  | CLOUDY | 67 | CALM      | 두부 채소 덮밥       | 따뜻한 현미 주먹밥       | Canon in D Major    | Paradise
            """)
    void analyzesDec014EdgeCases(
            String caseName,
            int sleepScore,
            int stressLevel,
            int energyLevel,
            BigDecimal temperature,
            WeatherCondition weather,
            int expectedScore,
            String expectedMood,
            String expectedMoodFood,
            String expectedContextFood,
            String expectedMoodMusic,
            String expectedContextMusic) {
        WellnessRulePolicy.AnalysisResult result =
                policy.analyze(request(sleepScore, stressLevel, energyLevel, temperature, weather));

        assertThat(result.wellnessScore()).isEqualTo(expectedScore);
        assertThat(result.moodCode()).isEqualTo(expectedMood);
        assertThat(result.foods())
                .extracting(FoodRecommendationValue::getName)
                .hasSize(5);
        assertThat(result.foods().get(0).getName()).isEqualTo(expectedMoodFood);
        assertThat(result.foods().get(3).getName()).isEqualTo(expectedContextFood);
        assertThat(result.music())
                .extracting(MusicRecommendationValue::getTitle)
                .hasSize(5);
        assertThat(result.music().get(0).getTitle()).isEqualTo(expectedMoodMusic);
        assertThat(result.music().get(3).getTitle()).isEqualTo(expectedContextMusic);
    }

    @ParameterizedTest(name = "{3}")
    @CsvSource(delimiter = '|', textBlock = """
            0  | 0   | 0  | TIRED     | 피곤함    | 따뜻한 수프와 곡물빵 | 편안한 식사 | 부담이 적고 천천히 먹기 좋은 메뉴입니다.         | Weightless    | 편안한 휴식      | 느린 페이스에 어울리는 분위기입니다.         | 현재 입력 기준으로 에너지나 수면 점수가 낮은 편이라 무리하지 않는 페이스가 어울립니다.
            86 | 31  | 74 | ENERGETIC | 활기 있음 | 연어 샐러드         | 에너지 균형 | 가볍게 에너지를 유지하기 좋은 메뉴입니다.        | Uptown Funk  | 가벼운 활력      | 높은 에너지에 어울리는 밝은 흐름입니다.       | 현재 입력 기준으로 에너지 수준은 비교적 높고, 스트레스 부담은 크지 않은 편입니다.
            70 | 35  | 58 | CALM      | 차분함    | 두부 채소 덮밥       | 균형 식사   | 차분한 컨디션에 어울리는 균형 잡힌 메뉴입니다.    | Canon in D Major    | 차분한 분위기    | 차분한 컨디션을 유지하기 좋은 분위기입니다.   | 현재 입력 기준으로 스트레스 부담이 낮고 전반적인 컨디션이 안정적인 편입니다.
            100| 100 | 100| BALANCED  | 균형 있음 | 닭가슴살 라이스볼    | 균형 식사   | 한쪽으로 치우치지 않은 기본 메뉴입니다.          | Counting Stars | 균형 있는 분위기 | 과하지 않은 기본 분위기입니다.               | 현재 입력 기준으로 컨디션이 한쪽으로 크게 치우치지 않은 편입니다.
            """)
    void producesDec014MoodItemsAndSentence(
            int sleepScore,
            int stressLevel,
            int energyLevel,
            String expectedMood,
            String expectedLabel,
            String foodName,
            String foodTag,
            String foodReason,
            String musicTitle,
            String musicTag,
            String musicReason,
            String moodSentence) {
        WellnessRulePolicy.AnalysisResult result = policy.analyze(
                request(sleepScore, stressLevel, energyLevel, new BigDecimal("19.0"), WeatherCondition.RAIN));

        assertThat(result.moodCode()).isEqualTo(expectedMood);
        assertThat(result.moodLabel()).isEqualTo(expectedLabel);
        assertFood(result.foods().get(0), foodName, foodTag, foodReason);
        assertMusic(result.music().get(0), musicTitle, musicTag, musicReason);
        assertThat(result.summary()).startsWith(moodSentence + " ");
    }

    @ParameterizedTest(name = "{2}")
    @CsvSource(delimiter = '|', textBlock = """
            5.0  | CLEAR  | COLD   | 따뜻한 죽               | 따뜻한 메뉴    | 기온이 낮은 날에 어울리는 따뜻한 메뉴입니다.   | Let It Go   | 포근한 분위기        | 기온이 낮거나 눈 오는 날에 어울리는 따뜻한 분위기입니다.     | 기온이 낮은 날에는 따뜻한 식사와 느린 페이스가 어울립니다.
            30.0 | RAIN   | HOT    | 그릭 요거트 볼           | 가벼운 메뉴    | 기온이 높은 날에 부담이 적은 메뉴입니다.       | Despacito    | 가벼운 분위기        | 기온이 높은 날에 어울리는 산뜻한 분위기입니다.     | 기온이 높은 날에는 가벼운 식사와 충분한 휴식이 어울립니다.
            19.0 | RAIN   | RAIN   | 따뜻한 채소 스튜         | 따뜻한 메뉴    | 비 오는 날씨에 어울리는 따뜻한 메뉴입니다.     | Someone Like You   | 잔잔한 감성          | 비 오는 날의 실내 분위기에 어울립니다.            | 비가 오는 날씨에는 차분한 실내 활동과 부담이 적은 식사가 어울립니다.
            19.0 | SNOW   | SNOW   | 따뜻한 채소 스튜         | 따뜻한 메뉴    | 눈 오는 날씨에 어울리는 따뜻한 메뉴입니다.     | Let It Go   | 포근한 분위기        | 기온이 낮거나 눈 오는 날에 어울리는 따뜻한 분위기입니다.         | 눈이 오는 날씨에는 보온에 신경 쓰며 느린 페이스로 움직이는 것이 어울립니다.
            19.0 | CLEAR  | CLEAR  | 과일 곁들인 그린 샐러드  | 가벼운 메뉴    | 맑은 날씨에 어울리는 산뜻한 메뉴입니다.        | Happy | 밝은 분위기          | 맑은 날씨에 어울리는 밝은 분위기입니다.            | 맑은 날씨에는 가벼운 산책 같은 활동이 어울립니다.
            18.0 | CLOUDY | CLOUDY | 따뜻한 현미 주먹밥       | 부담 적은 메뉴 | 흐린 날씨에 부담 없이 먹기 좋은 메뉴입니다.    | Paradise   | 집중하기 좋은 분위기 | 흐린 날씨에 차분히 집중하기 좋은 분위기입니다.     | 흐린 날씨에는 차분한 페이스로 하루를 이어 가는 것이 어울립니다.
            """)
    void producesDec014ContextItemsAndSentence(
            BigDecimal temperature,
            WeatherCondition weather,
            String context,
            String foodName,
            String foodTag,
            String foodReason,
            String musicTitle,
            String musicTag,
            String musicReason,
            String contextSentence) {
        WellnessRulePolicy.AnalysisResult result = policy.analyze(request(70, 30, 60, temperature, weather));

        assertFood(result.foods().get(3), foodName, foodTag, foodReason);
        assertMusic(result.music().get(3), musicTitle, musicTag, musicReason);
        assertThat(result.summary()).endsWith(" " + contextSentence);
    }

    @Test
    void summaryJoinsMoodSentenceAndContextSentenceWithSingleSpace() {
        WellnessRulePolicy.AnalysisResult result =
                policy.analyze(request(86, 31, 74, new BigDecimal("19.0"), WeatherCondition.RAIN));

        assertThat(result.summary()).isEqualTo(
                "현재 입력 기준으로 에너지 수준은 비교적 높고, 스트레스 부담은 크지 않은 편입니다. "
                        + "비가 오는 날씨에는 차분한 실내 활동과 부담이 적은 식사가 어울립니다.");
    }

    @Test
    void heartRateAndRespiratoryRateDoNotAffectAnalysis() {
        WellnessRulePolicy.AnalysisResult low = policy.analyze(new CreateCheckinRequest(
                40, 8, 86, 31, 74, new BigDecimal("19.0"), WeatherCondition.RAIN));
        WellnessRulePolicy.AnalysisResult high = policy.analyze(new CreateCheckinRequest(
                180, 40, 86, 31, 74, new BigDecimal("19.0"), WeatherCondition.RAIN));

        assertThat(low.wellnessScore()).isEqualTo(high.wellnessScore());
        assertThat(low.moodCode()).isEqualTo(high.moodCode());
        assertThat(low.summary()).isEqualTo(high.summary());
    }

    @ParameterizedTest
    @CsvSource(delimiter = '|', textBlock = """
            TIRED     | 피곤함
            ENERGETIC | 활기 있음
            CALM      | 차분함
            BALANCED  | 균형 있음
            """)
    void moodLabelFollowsDec014(String moodCode, String expectedLabel) {
        assertThat(policy.moodLabel(moodCode)).isEqualTo(expectedLabel);
    }

    private static CreateCheckinRequest request(
            int sleepScore, int stressLevel, int energyLevel, BigDecimal temperature, WeatherCondition weather) {
        return new CreateCheckinRequest(68, 18, sleepScore, stressLevel, energyLevel, temperature, weather);
    }

    private static void assertFood(FoodRecommendationValue food, String name, String tag, String reason) {
        assertThat(food.getName()).isEqualTo(name);
        assertThat(food.getTag()).isEqualTo(tag);
        assertThat(food.getReason()).isEqualTo(reason);
    }

    private static void assertMusic(MusicRecommendationValue music, String title, String tag, String reason) {
        assertThat(music.getTitle()).isEqualTo(title);
        assertThat(music.getArtist()).isNotBlank();
        assertThat(music.getVideoId()).matches("[A-Za-z0-9_-]{11}");
        assertThat(music.getTag()).isEqualTo(tag);
        assertThat(music.getReason()).isEqualTo(reason);
    }
}
