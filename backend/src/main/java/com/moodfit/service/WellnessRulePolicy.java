package com.moodfit.service;

import java.math.BigDecimal;
import java.util.List;

import org.springframework.stereotype.Component;

import com.moodfit.dto.request.CreateCheckinRequest;
import com.moodfit.dto.request.WeatherCondition;
import com.moodfit.entity.FoodRecommendationValue;
import com.moodfit.entity.MusicRecommendationValue;

@Component
class WellnessRulePolicy {

    AnalysisResult analyze(CreateCheckinRequest request) {
        int wellnessScore = calculateScore(request.sleepScore(), request.stressLevel(), request.energyLevel());
        MoodType mood = determineMood(request.sleepScore(), request.stressLevel(), request.energyLevel(), wellnessScore);
        ContextType context = determineContext(request.temperature(), request.weather());

        return new AnalysisResult(
                wellnessScore,
                mood.code(),
                mood.label(),
                mood.summarySentence() + " " + context.summarySentence(),
                List.of(foodForMood(mood), foodForContext(context)),
                List.of(musicForMood(mood), musicForContext(context)));
    }

    String moodLabel(String moodCode) {
        return MoodType.valueOf(moodCode).label();
    }

    private int calculateScore(int sleepScore, int stressLevel, int energyLevel) {
        int stressScore = 100 - stressLevel;
        return (35 * sleepScore + 35 * stressScore + 30 * energyLevel + 50) / 100;
    }

    private MoodType determineMood(int sleepScore, int stressLevel, int energyLevel, int wellnessScore) {
        if (energyLevel <= 35 || sleepScore <= 35) {
            return MoodType.TIRED;
        }
        if (energyLevel >= 70 && stressLevel <= 45 && sleepScore >= 60) {
            return MoodType.ENERGETIC;
        }
        if (stressLevel <= 35 && wellnessScore >= 65) {
            return MoodType.CALM;
        }
        return MoodType.BALANCED;
    }

    private ContextType determineContext(BigDecimal temperature, WeatherCondition weather) {
        if (temperature.compareTo(BigDecimal.valueOf(5)) <= 0) {
            return ContextType.COLD;
        }
        if (temperature.compareTo(BigDecimal.valueOf(30)) >= 0) {
            return ContextType.HOT;
        }
        return ContextType.valueOf(weather.name());
    }

    private FoodRecommendationValue foodForMood(MoodType mood) {
        return switch (mood) {
            case TIRED -> new FoodRecommendationValue(
                    "따뜻한 수프와 곡물빵",
                    "편안한 식사",
                    "부담이 적고 천천히 먹기 좋은 메뉴입니다.");
            case ENERGETIC -> new FoodRecommendationValue(
                    "연어 샐러드",
                    "에너지 균형",
                    "가볍게 에너지를 유지하기 좋은 메뉴입니다.");
            case CALM -> new FoodRecommendationValue(
                    "두부 채소 덮밥",
                    "균형 식사",
                    "차분한 컨디션에 어울리는 균형 잡힌 메뉴입니다.");
            case BALANCED -> new FoodRecommendationValue(
                    "닭가슴살 라이스볼",
                    "균형 식사",
                    "한쪽으로 치우치지 않은 기본 메뉴입니다.");
        };
    }

    private FoodRecommendationValue foodForContext(ContextType context) {
        return switch (context) {
            case COLD -> new FoodRecommendationValue(
                    "따뜻한 죽",
                    "따뜻한 메뉴",
                    "기온이 낮은 날에 어울리는 따뜻한 메뉴입니다.");
            case HOT -> new FoodRecommendationValue(
                    "그릭 요거트 볼",
                    "가벼운 메뉴",
                    "기온이 높은 날에 부담이 적은 메뉴입니다.");
            case RAIN, SNOW -> new FoodRecommendationValue(
                    "따뜻한 채소 스튜",
                    "따뜻한 메뉴",
                    (context == ContextType.RAIN ? "비" : "눈") + " 오는 날씨에 어울리는 따뜻한 메뉴입니다.");
            case CLEAR -> new FoodRecommendationValue(
                    "과일 곁들인 그린 샐러드",
                    "가벼운 메뉴",
                    "맑은 날씨에 어울리는 산뜻한 메뉴입니다.");
            case CLOUDY -> new FoodRecommendationValue(
                    "따뜻한 현미 주먹밥",
                    "부담 적은 메뉴",
                    "흐린 날씨에 부담 없이 먹기 좋은 메뉴입니다.");
        };
    }

    private MusicRecommendationValue musicForMood(MoodType mood) {
        return switch (mood) {
            case TIRED -> new MusicRecommendationValue(
                    "Soft Reset Playlist",
                    "MoodFit Curated",
                    "편안한 휴식",
                    "느린 페이스에 어울리는 분위기입니다.");
            case ENERGETIC -> new MusicRecommendationValue(
                    "Light Motion Playlist",
                    "MoodFit Curated",
                    "가벼운 활력",
                    "높은 에너지에 어울리는 밝은 흐름입니다.");
            case CALM -> new MusicRecommendationValue(
                    "Calm Focus Playlist",
                    "MoodFit Curated",
                    "차분한 분위기",
                    "차분한 컨디션을 유지하기 좋은 분위기입니다.");
            case BALANCED -> new MusicRecommendationValue(
                    "Daily Balance Playlist",
                    "MoodFit Curated",
                    "균형 있는 분위기",
                    "과하지 않은 기본 분위기입니다.");
        };
    }

    private MusicRecommendationValue musicForContext(ContextType context) {
        return switch (context) {
            case COLD, SNOW -> new MusicRecommendationValue(
                    "Warm Evening Playlist",
                    "MoodFit Curated",
                    "포근한 분위기",
                    (context == ContextType.COLD ? "기온이 낮은 날" : "눈 오는 날") + "에 어울리는 따뜻한 분위기입니다.");
            case HOT -> new MusicRecommendationValue(
                    "Cool Breeze Playlist",
                    "MoodFit Curated",
                    "가벼운 분위기",
                    "기온이 높은 날에 어울리는 산뜻한 분위기입니다.");
            case RAIN -> new MusicRecommendationValue(
                    "Rainy Indoor Playlist",
                    "MoodFit Curated",
                    "잔잔한 감성",
                    "비 오는 날의 실내 분위기에 어울립니다.");
            case CLEAR -> new MusicRecommendationValue(
                    "Bright Morning Playlist",
                    "MoodFit Curated",
                    "밝은 분위기",
                    "맑은 날씨에 어울리는 밝은 분위기입니다.");
            case CLOUDY -> new MusicRecommendationValue(
                    "Cloudy Focus Playlist",
                    "MoodFit Curated",
                    "집중하기 좋은 분위기",
                    "흐린 날씨에 차분히 집중하기 좋은 분위기입니다.");
        };
    }

    record AnalysisResult(
            int wellnessScore,
            String moodCode,
            String moodLabel,
            String summary,
            List<FoodRecommendationValue> foods,
            List<MusicRecommendationValue> music) {
    }

    private enum MoodType {
        TIRED(
                "피곤함",
                "현재 입력 기준으로 에너지나 수면 점수가 낮은 편이라 무리하지 않는 페이스가 어울립니다."),
        ENERGETIC(
                "활기 있음",
                "현재 입력 기준으로 에너지 수준은 비교적 높고, 스트레스 부담은 크지 않은 편입니다."),
        CALM(
                "차분함",
                "현재 입력 기준으로 스트레스 부담이 낮고 전반적인 컨디션이 안정적인 편입니다."),
        BALANCED(
                "균형 있음",
                "현재 입력 기준으로 컨디션이 한쪽으로 크게 치우치지 않은 편입니다.");

        private final String label;
        private final String summarySentence;

        MoodType(String label, String summarySentence) {
            this.label = label;
            this.summarySentence = summarySentence;
        }

        String code() {
            return name();
        }

        String label() {
            return label;
        }

        String summarySentence() {
            return summarySentence;
        }
    }

    private enum ContextType {
        COLD("기온이 낮은 날에는 따뜻한 식사와 느린 페이스가 어울립니다."),
        HOT("기온이 높은 날에는 가벼운 식사와 충분한 휴식이 어울립니다."),
        RAIN("비가 오는 날씨에는 차분한 실내 활동과 부담이 적은 식사가 어울립니다."),
        SNOW("눈이 오는 날씨에는 보온에 신경 쓰며 느린 페이스로 움직이는 것이 어울립니다."),
        CLEAR("맑은 날씨에는 가벼운 산책 같은 활동이 어울립니다."),
        CLOUDY("흐린 날씨에는 차분한 페이스로 하루를 이어 가는 것이 어울립니다.");

        private final String summarySentence;

        ContextType(String summarySentence) {
            this.summarySentence = summarySentence;
        }

        String summarySentence() {
            return summarySentence;
        }
    }
}
