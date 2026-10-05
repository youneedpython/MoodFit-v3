package com.moodfit.service;

import java.math.BigDecimal;
import java.util.List;
import java.time.Clock;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.function.Function;

import org.springframework.stereotype.Component;

import com.moodfit.dto.request.CreateCheckinRequest;
import com.moodfit.dto.request.WeatherCondition;
import com.moodfit.entity.FoodRecommendationValue;
import com.moodfit.entity.MusicRecommendationValue;

@Component
class WellnessRulePolicy {
    private final Clock clock;

    WellnessRulePolicy(Clock clock) {
        this.clock = clock;
    }

    static <T> List<T> select(List<T> mood, List<T> context, long epochDay, Function<T, String> key) {
        return select(mood, context, epochDay, key, java.util.Map.of());
    }

    static <T> List<T> select(List<T> mood, List<T> context, long epochDay, Function<T, String> name,
            java.util.Map<String, RecommendationFeedbackService.Rating> ratings) {
        List<T> selected = new ArrayList<>(5);
        HashSet<String> used = new HashSet<>();
        if (!mood.isEmpty()) selectFrom(mood, 3, epochDay, name, selected, used, ratings);
        selectFrom(context, 2, epochDay, name, selected, used, ratings);
        return List.copyOf(selected);
    }

    private static <T> void selectFrom(List<T> pool, int count, long epochDay, Function<T, String> name,
            List<T> selected, HashSet<String> used, java.util.Map<String, RecommendationFeedbackService.Rating> ratings) {
        int start = Math.floorMod(epochDay, pool.size());
        List<T> group = new ArrayList<>();
        HashSet<String> prior = new HashSet<>(used);
        for (int pass = 0; pass < 2; pass++) {
            for (int offset = 0; offset < pool.size() && group.size() < count; offset++) {
                T item = pool.get((start + offset) % pool.size());
                boolean disliked = ratings.get(name.apply(item)) == RecommendationFeedbackService.Rating.DISLIKE;
                if (disliked == (pass == 1) && used.add(name.apply(item))) group.add(item);
            }
        }
        if (group.size() != count) throw new IllegalStateException("Insufficient distinct recommendation candidates");
        for (int offset = 0; offset < pool.size(); offset++) {
            T liked = pool.get((start + offset) % pool.size());
            if (ratings.get(name.apply(liked)) != RecommendationFeedbackService.Rating.LIKE || prior.contains(name.apply(liked))) continue;
            int index = -1;
            for (int i = 0; i < group.size(); i++) if (name.apply(group.get(i)).equals(name.apply(liked))) index = i;
            if (index >= 0) group.remove(index);
            else used.remove(name.apply(group.removeLast()));
            group.addFirst(liked);
            used.add(name.apply(liked));
            break;
        }
        selected.addAll(group);
    }


    AnalysisResult analyze(CreateCheckinRequest request) {
        return analyze(request, new RecommendationFeedbackService.Feedback(true, false, List.of()));
    }

    AnalysisResult analyze(CreateCheckinRequest request, RecommendationFeedbackService.Feedback feedback) {
        return analyze(request, feedback, com.moodfit.dto.response.BaselineResponse.unavailable());
    }

    AnalysisResult analyze(CreateCheckinRequest request, RecommendationFeedbackService.Feedback feedback,
            com.moodfit.dto.response.BaselineResponse baseline) {
        int wellnessScore = calculateScore(request.sleepScore(), request.stressLevel(), request.energyLevel());
        MoodType mood = determineMood(request.sleepScore(), request.stressLevel(), request.energyLevel(), wellnessScore);
        MoodType originalMood = mood;
        boolean high = "HIGH".equals(baseline.tension());
        if (high && mood == MoodType.ENERGETIC) mood = MoodType.BALANCED;
        MoodType poolMood = high && mood == MoodType.BALANCED ? MoodType.CALM : mood;
        ContextType context = determineContext(request.temperature(), request.weather());

        long epochDay = LocalDate.now(clock.withZone(ZoneId.of("Asia/Seoul"))).toEpochDay();
        return new AnalysisResult(
                wellnessScore,
                mood.code(),
                mood.label(),
                originalMood.summarySentence() + " " + context.summarySentence() + PersonalBaseline.summary(baseline),
                select(MOOD_FOODS.get(poolMood), CONTEXT_FOODS.get(context), epochDay, FoodRecommendationValue::getName, feedback.ratings(RecommendationFeedbackService.Kind.FOOD)),
                select(MOOD_MUSIC.get(poolMood), CONTEXT_MUSIC.get(context), epochDay, MusicRecommendationValue::getVideoId, feedback.ratings(RecommendationFeedbackService.Kind.MUSIC)));
    }

    com.moodfit.dto.response.TodayRecommendationResponse recommendToday(BigDecimal temperature, WeatherCondition weather,
            RecommendationFeedbackService.Feedback feedback) {
        ContextType context = determineContext(temperature, weather);
        long epochDay = LocalDate.now(clock.withZone(ZoneId.of("Asia/Seoul"))).toEpochDay();
        String label = switch (context) {
            case COLD -> "추위";
            case HOT -> "더위";
            case CLEAR -> "맑음";
            case CLOUDY -> "흐림";
            case RAIN -> "비";
            case SNOW -> "눈";
        };
        return new com.moodfit.dto.response.TodayRecommendationResponse(
                new com.moodfit.dto.response.TodayRecommendationResponse.Context(context.name(), label),
                select(List.of(), CONTEXT_FOODS.get(context), epochDay, FoodRecommendationValue::getName,
                        feedback.ratings(RecommendationFeedbackService.Kind.FOOD)).stream()
                        .map(value -> new com.moodfit.dto.response.FoodRecommendationResponse(value.getName(), value.getTag(), value.getReason())).toList(),
                select(List.of(), CONTEXT_MUSIC.get(context), epochDay, MusicRecommendationValue::getVideoId,
                        feedback.ratings(RecommendationFeedbackService.Kind.MUSIC)).stream()
                        .map(value -> new com.moodfit.dto.response.MusicRecommendationResponse(value.getTitle(), value.getArtist(), value.getTag(), value.getReason(), value.getVideoId())).toList());
    }

    static boolean contains(RecommendationFeedbackService.Kind kind, String item) {
        if (kind == RecommendationFeedbackService.Kind.FOOD) return java.util.stream.Stream.concat(MOOD_FOODS.values().stream(), CONTEXT_FOODS.values().stream())
                .flatMap(List::stream).anyMatch(value -> value.getName().equals(item));
        return java.util.stream.Stream.concat(MOOD_MUSIC.values().stream(), CONTEXT_MUSIC.values().stream())
                .flatMap(List::stream).anyMatch(value -> value.getVideoId().equals(item));
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

    static final java.util.Map<MoodType, List<FoodRecommendationValue>> MOOD_FOODS = java.util.Map.ofEntries(
            java.util.Map.entry(MoodType.TIRED, List.of(
                    new FoodRecommendationValue("따뜻한 수프와 곡물빵", "편안한 식사", "부담이 적고 천천히 먹기 좋은 메뉴입니다."),
                    new FoodRecommendationValue("달걀 채소 오트밀", "균형 식사", "현재 컨디션에 맞춰 천천히 즐기기 좋은 식사입니다."),
                    new FoodRecommendationValue("찐 감자와 달걀", "일상 메뉴", "일상 식사로 편하게 선택할 수 있는 메뉴입니다."),
                    new FoodRecommendationValue("닭죽", "일상 메뉴", "현재 컨디션에 맞춰 편하게 즐기기 좋은 메뉴입니다."),
                    new FoodRecommendationValue("소고기 미역국", "일상 메뉴", "현재 컨디션에 맞춰 편하게 즐기기 좋은 메뉴입니다."),
                    new FoodRecommendationValue("감자 수프", "일상 메뉴", "현재 컨디션에 맞춰 편하게 즐기기 좋은 메뉴입니다."),
                    new FoodRecommendationValue("달걀찜과 밥", "일상 메뉴", "현재 컨디션에 맞춰 편하게 즐기기 좋은 메뉴입니다."),
                    new FoodRecommendationValue("두부 된장국", "일상 메뉴", "현재 컨디션에 맞춰 편하게 즐기기 좋은 메뉴입니다."))),
            java.util.Map.entry(MoodType.ENERGETIC, List.of(
                    new FoodRecommendationValue("연어 샐러드", "에너지 균형", "가볍게 에너지를 유지하기 좋은 메뉴입니다."),
                    new FoodRecommendationValue("소고기 채소 비빔밥", "균형 식사", "현재 컨디션에 맞춰 천천히 즐기기 좋은 식사입니다."),
                    new FoodRecommendationValue("통밀 닭고기 샌드위치", "일상 메뉴", "일상 식사로 편하게 선택할 수 있는 메뉴입니다."),
                    new FoodRecommendationValue("닭고기 채소 덮밥", "일상 메뉴", "현재 컨디션에 맞춰 편하게 즐기기 좋은 메뉴입니다."),
                    new FoodRecommendationValue("새우 볶음밥", "일상 메뉴", "현재 컨디션에 맞춰 편하게 즐기기 좋은 메뉴입니다."),
                    new FoodRecommendationValue("불고기 정식", "일상 메뉴", "현재 컨디션에 맞춰 편하게 즐기기 좋은 메뉴입니다."),
                    new FoodRecommendationValue("콩나물 비빔밥", "일상 메뉴", "현재 컨디션에 맞춰 편하게 즐기기 좋은 메뉴입니다."),
                    new FoodRecommendationValue("참치 샌드위치", "일상 메뉴", "현재 컨디션에 맞춰 편하게 즐기기 좋은 메뉴입니다."))),
            java.util.Map.entry(MoodType.CALM, List.of(
                    new FoodRecommendationValue("두부 채소 덮밥", "균형 식사", "차분한 컨디션에 어울리는 균형 잡힌 메뉴입니다."),
                    new FoodRecommendationValue("버섯 메밀국수", "균형 식사", "현재 컨디션에 맞춰 천천히 즐기기 좋은 식사입니다."),
                    new FoodRecommendationValue("병아리콩 채소 볶음", "일상 메뉴", "일상 식사로 편하게 선택할 수 있는 메뉴입니다."),
                    new FoodRecommendationValue("나물 비빔밥", "일상 메뉴", "현재 컨디션에 맞춰 편하게 즐기기 좋은 메뉴입니다."),
                    new FoodRecommendationValue("채소 김밥", "일상 메뉴", "현재 컨디션에 맞춰 편하게 즐기기 좋은 메뉴입니다."),
                    new FoodRecommendationValue("단호박 수프", "일상 메뉴", "현재 컨디션에 맞춰 편하게 즐기기 좋은 메뉴입니다."),
                    new FoodRecommendationValue("두부 샐러드", "일상 메뉴", "현재 컨디션에 맞춰 편하게 즐기기 좋은 메뉴입니다."),
                    new FoodRecommendationValue("고구마와 우유", "일상 메뉴", "현재 컨디션에 맞춰 편하게 즐기기 좋은 메뉴입니다."))),
            java.util.Map.entry(MoodType.BALANCED, List.of(
                    new FoodRecommendationValue("닭가슴살 라이스볼", "균형 식사", "한쪽으로 치우치지 않은 기본 메뉴입니다."),
                    new FoodRecommendationValue("참치 채소 김밥", "균형 식사", "현재 컨디션에 맞춰 천천히 즐기기 좋은 식사입니다."),
                    new FoodRecommendationValue("달걀 토마토 볶음밥", "일상 메뉴", "일상 식사로 편하게 선택할 수 있는 메뉴입니다."),
                    new FoodRecommendationValue("제육 덮밥", "일상 메뉴", "현재 컨디션에 맞춰 편하게 즐기기 좋은 메뉴입니다."),
                    new FoodRecommendationValue("버섯 볶음밥", "일상 메뉴", "현재 컨디션에 맞춰 편하게 즐기기 좋은 메뉴입니다."),
                    new FoodRecommendationValue("생선구이 정식", "일상 메뉴", "현재 컨디션에 맞춰 편하게 즐기기 좋은 메뉴입니다."),
                    new FoodRecommendationValue("두부 된장국", "일상 메뉴", "현재 컨디션에 맞춰 편하게 즐기기 좋은 메뉴입니다."),
                    new FoodRecommendationValue("닭고기 채소 덮밥", "일상 메뉴", "현재 컨디션에 맞춰 편하게 즐기기 좋은 메뉴입니다."))));

    static final java.util.Map<ContextType, List<FoodRecommendationValue>> CONTEXT_FOODS = java.util.Map.ofEntries(
            java.util.Map.entry(ContextType.COLD, List.of(
                    new FoodRecommendationValue("따뜻한 죽", "따뜻한 메뉴", "기온이 낮은 날에 어울리는 따뜻한 메뉴입니다."),
                    new FoodRecommendationValue("따뜻한 우동", "날씨 맞춤", "오늘의 날씨에 어울리는 식사로 제안합니다."),
                    new FoodRecommendationValue("소고기 미역국", "날씨 맞춤", "오늘의 날씨에 어울리는 식사로 제안합니다."),
                    new FoodRecommendationValue("두부 된장국", "날씨 맞춤", "오늘의 날씨에 어울리는 식사로 제안합니다."),
                    new FoodRecommendationValue("어묵탕", "날씨 맞춤", "오늘의 날씨에 어울리는 식사로 제안합니다."),
                    new FoodRecommendationValue("닭죽", "날씨 맞춤", "오늘의 날씨에 어울리는 식사로 제안합니다."))),
            java.util.Map.entry(ContextType.HOT, List.of(
                    new FoodRecommendationValue("그릭 요거트 볼", "가벼운 메뉴", "기온이 높은 날에 부담이 적은 메뉴입니다."),
                    new FoodRecommendationValue("오이 냉국과 보리밥", "날씨 맞춤", "오늘의 날씨에 어울리는 식사로 제안합니다."),
                    new FoodRecommendationValue("냉메밀국수", "날씨 맞춤", "오늘의 날씨에 어울리는 식사로 제안합니다."),
                    new FoodRecommendationValue("물냉면", "날씨 맞춤", "오늘의 날씨에 어울리는 식사로 제안합니다."),
                    new FoodRecommendationValue("수박과 요거트", "날씨 맞춤", "오늘의 날씨에 어울리는 식사로 제안합니다."),
                    new FoodRecommendationValue("냉콩국수", "날씨 맞춤", "오늘의 날씨에 어울리는 식사로 제안합니다."))),
            java.util.Map.entry(ContextType.RAIN, List.of(
                    new FoodRecommendationValue("따뜻한 채소 스튜", "따뜻한 메뉴", "비 오는 날씨에 어울리는 따뜻한 메뉴입니다."),
                    new FoodRecommendationValue("버섯 칼국수", "날씨 맞춤", "오늘의 날씨에 어울리는 식사로 제안합니다."),
                    new FoodRecommendationValue("감자 수프", "날씨 맞춤", "오늘의 날씨에 어울리는 식사로 제안합니다."),
                    new FoodRecommendationValue("해물 파전", "날씨 맞춤", "오늘의 날씨에 어울리는 식사로 제안합니다."),
                    new FoodRecommendationValue("잔치국수", "날씨 맞춤", "오늘의 날씨에 어울리는 식사로 제안합니다."),
                    new FoodRecommendationValue("김치 수제비", "날씨 맞춤", "오늘의 날씨에 어울리는 식사로 제안합니다."))),
            java.util.Map.entry(ContextType.SNOW, List.of(
                    new FoodRecommendationValue("따뜻한 채소 스튜", "따뜻한 메뉴", "눈 오는 날씨에 어울리는 따뜻한 메뉴입니다."),
                    new FoodRecommendationValue("채소 만둣국", "날씨 맞춤", "오늘의 날씨에 어울리는 식사로 제안합니다."),
                    new FoodRecommendationValue("떡국", "날씨 맞춤", "오늘의 날씨에 어울리는 식사로 제안합니다."),
                    new FoodRecommendationValue("어묵탕", "날씨 맞춤", "오늘의 날씨에 어울리는 식사로 제안합니다."),
                    new FoodRecommendationValue("닭죽", "날씨 맞춤", "오늘의 날씨에 어울리는 식사로 제안합니다."),
                    new FoodRecommendationValue("소고기 미역국", "날씨 맞춤", "오늘의 날씨에 어울리는 식사로 제안합니다."))),
            java.util.Map.entry(ContextType.CLEAR, List.of(
                    new FoodRecommendationValue("과일 곁들인 그린 샐러드", "가벼운 메뉴", "맑은 날씨에 어울리는 산뜻한 메뉴입니다."),
                    new FoodRecommendationValue("토마토 파스타", "날씨 맞춤", "오늘의 날씨에 어울리는 식사로 제안합니다."),
                    new FoodRecommendationValue("두부 샐러드", "날씨 맞춤", "오늘의 날씨에 어울리는 식사로 제안합니다."),
                    new FoodRecommendationValue("참치 샌드위치", "날씨 맞춤", "오늘의 날씨에 어울리는 식사로 제안합니다."),
                    new FoodRecommendationValue("과일 요거트", "날씨 맞춤", "오늘의 날씨에 어울리는 식사로 제안합니다."),
                    new FoodRecommendationValue("나물 비빔밥", "날씨 맞춤", "오늘의 날씨에 어울리는 식사로 제안합니다."))),
            java.util.Map.entry(ContextType.CLOUDY, List.of(
                    new FoodRecommendationValue("따뜻한 현미 주먹밥", "부담 적은 메뉴", "흐린 날씨에 부담 없이 먹기 좋은 메뉴입니다."),
                    new FoodRecommendationValue("구운 채소 쿠스쿠스", "날씨 맞춤", "오늘의 날씨에 어울리는 식사로 제안합니다."),
                    new FoodRecommendationValue("버섯 볶음밥", "날씨 맞춤", "오늘의 날씨에 어울리는 식사로 제안합니다."),
                    new FoodRecommendationValue("단호박 수프", "날씨 맞춤", "오늘의 날씨에 어울리는 식사로 제안합니다."),
                    new FoodRecommendationValue("달걀찜과 밥", "날씨 맞춤", "오늘의 날씨에 어울리는 식사로 제안합니다."),
                    new FoodRecommendationValue("고구마와 우유", "날씨 맞춤", "오늘의 날씨에 어울리는 식사로 제안합니다."))));

    static final java.util.Map<MoodType, List<MusicRecommendationValue>> MOOD_MUSIC = java.util.Map.ofEntries(
            java.util.Map.entry(MoodType.TIRED, List.of(
                    new MusicRecommendationValue("Weightless", "Marconi Union", "편안한 휴식", "느린 페이스에 어울리는 분위기입니다.", "UfcAVejslrU"),
                    new MusicRecommendationValue("Clair de Lune", "Claude Debussy", "편안한 휴식", "느린 페이스에 어울리는 분위기입니다.", "CvFH_6DNRCY"),
                    new MusicRecommendationValue("River Flows in You", "Yiruma", "편안한 휴식", "느린 페이스에 어울리는 분위기입니다.", "7maJOI3QMu0"),
                    new MusicRecommendationValue("Fix You", "Coldplay", "편안한 휴식", "느린 페이스에 어울리는 분위기입니다.", "k4V3Mo61fJM"),
                    new MusicRecommendationValue("Don't Know Why", "Norah Jones", "편안한 휴식", "느린 페이스에 어울리는 분위기입니다.", "tO4dxvguQDk"),
                    new MusicRecommendationValue("Stay With Me", "Sam Smith", "편안한 휴식", "느린 페이스에 어울리는 분위기입니다.", "pB-5XG-DbAA"),
                    new MusicRecommendationValue("ocean eyes", "Billie Eilish", "편안한 휴식", "느린 페이스에 어울리는 분위기입니다.", "viimfQi_pUw"),
                    new MusicRecommendationValue("밤편지", "IU", "편안한 휴식", "느린 페이스에 어울리는 분위기입니다.", "BzYnNdJhZQw"),
                    new MusicRecommendationValue("Nuvole Bianche", "Ludovico Einaudi", "편안한 휴식", "느린 페이스에 어울리는 분위기입니다.", "4VR-6AS0-l4"))),
            java.util.Map.entry(MoodType.ENERGETIC, List.of(
                    new MusicRecommendationValue("Uptown Funk", "Mark Ronson ft. Bruno Mars", "가벼운 활력", "높은 에너지에 어울리는 밝은 흐름입니다.", "OPf0YbXqDm0"),
                    new MusicRecommendationValue("Can't Stop the Feeling!", "Justin Timberlake", "가벼운 활력", "높은 에너지에 어울리는 밝은 흐름입니다.", "ru0K8uYEZWw"),
                    new MusicRecommendationValue("Dynamite", "BTS", "가벼운 활력", "높은 에너지에 어울리는 밝은 흐름입니다.", "gdZLi9oWNZg"),
                    new MusicRecommendationValue("Viva La Vida", "Coldplay", "가벼운 활력", "높은 에너지에 어울리는 밝은 흐름입니다.", "dvgZkm1xWPE"),
                    new MusicRecommendationValue("Shape of You", "Ed Sheeran", "가벼운 활력", "높은 에너지에 어울리는 밝은 흐름입니다.", "JGwWNGJdvx8"),
                    new MusicRecommendationValue("Roar", "Katy Perry", "가벼운 활력", "높은 에너지에 어울리는 밝은 흐름입니다.", "CevxZvSJLk8"),
                    new MusicRecommendationValue("Firework", "Katy Perry", "가벼운 활력", "높은 에너지에 어울리는 밝은 흐름입니다.", "QGJuMBdaqIw"),
                    new MusicRecommendationValue("Believer", "Imagine Dragons", "가벼운 활력", "높은 에너지에 어울리는 밝은 흐름입니다.", "7wtfhZwyrcc"),
                    new MusicRecommendationValue("Thunder", "Imagine Dragons", "가벼운 활력", "높은 에너지에 어울리는 밝은 흐름입니다.", "fKopy74weus"),
                    new MusicRecommendationValue("Wake Me Up", "Avicii", "가벼운 활력", "높은 에너지에 어울리는 밝은 흐름입니다.", "IcrbM1l_BoI"),
                    new MusicRecommendationValue("Get Lucky", "Daft Punk", "가벼운 활력", "높은 에너지에 어울리는 밝은 흐름입니다.", "5NV6Rdv1a3I"),
                    new MusicRecommendationValue("Don't Stop Me Now", "Queen", "가벼운 활력", "높은 에너지에 어울리는 밝은 흐름입니다.", "HgzGwKwLmgM"),
                    new MusicRecommendationValue("Don't Stop Believin'", "Journey", "가벼운 활력", "높은 에너지에 어울리는 밝은 흐름입니다.", "1k8craCGpgs"),
                    new MusicRecommendationValue("Take On Me", "a-ha", "가벼운 활력", "높은 에너지에 어울리는 밝은 흐름입니다.", "djV11Xbc914"),
                    new MusicRecommendationValue("Butter", "BTS", "가벼운 활력", "높은 에너지에 어울리는 밝은 흐름입니다.", "WMweEpGlu_U"),
                    new MusicRecommendationValue("Blueming", "IU", "가벼운 활력", "높은 에너지에 어울리는 밝은 흐름입니다.", "D1PvIWdJ8xo"),
                    new MusicRecommendationValue("여행", "볼빨간사춘기", "가벼운 활력", "높은 에너지에 어울리는 밝은 흐름입니다.", "xRbPAVnqtcs"),
                    new MusicRecommendationValue("Lovely Day", "Bill Withers", "가벼운 활력", "높은 에너지에 어울리는 밝은 흐름입니다.", "bEeaS6fuUoA"),
                    new MusicRecommendationValue("September", "Earth, Wind & Fire", "가벼운 활력", "높은 에너지에 어울리는 밝은 흐름입니다.", "Gs069dndIYk"),
                    new MusicRecommendationValue("Good as Hell", "Lizzo", "가벼운 활력", "높은 에너지에 어울리는 밝은 흐름입니다.", "SmbmeOgWsqE"),
                    new MusicRecommendationValue("Levitating", "Dua Lipa", "가벼운 활력", "높은 에너지에 어울리는 밝은 흐름입니다.", "TUVcZfQe-Kw"),
                    new MusicRecommendationValue("Don't Start Now", "Dua Lipa", "가벼운 활력", "높은 에너지에 어울리는 밝은 흐름입니다.", "oygrmJFKYZY"),
                    new MusicRecommendationValue("Blinding Lights", "The Weeknd", "가벼운 활력", "높은 에너지에 어울리는 밝은 흐름입니다.", "4NRXx6U8ABQ"),
                    new MusicRecommendationValue("Watermelon Sugar", "Harry Styles", "가벼운 활력", "높은 에너지에 어울리는 밝은 흐름입니다.", "E07s5ZYygMg"),
                    new MusicRecommendationValue("Hype Boy", "NewJeans", "가벼운 활력", "높은 에너지에 어울리는 밝은 흐름입니다.", "11cta61wi0g"),
                    new MusicRecommendationValue("As It Was", "Harry Styles", "가벼운 활력", "높은 에너지에 어울리는 밝은 흐름입니다.", "H5v3kku4y6Q"))),
            java.util.Map.entry(MoodType.CALM, List.of(
                    new MusicRecommendationValue("Canon in D Major", "Johann Pachelbel", "차분한 분위기", "차분한 컨디션을 유지하기 좋은 분위기입니다.", "NlprozGcs80"),
                    new MusicRecommendationValue("Perfect", "Ed Sheeran", "차분한 분위기", "차분한 컨디션을 유지하기 좋은 분위기입니다.", "2Vv-BfVoq4g"),
                    new MusicRecommendationValue("All of Me", "John Legend", "차분한 분위기", "차분한 컨디션을 유지하기 좋은 분위기입니다.", "450p7goxZqg"),
                    new MusicRecommendationValue("Yellow", "Coldplay", "차분한 분위기", "차분한 컨디션을 유지하기 좋은 분위기입니다.", "yKNxeF4KMsY"),
                    new MusicRecommendationValue("Don't Know Why", "Norah Jones", "차분한 분위기", "차분한 컨디션을 유지하기 좋은 분위기입니다.", "tO4dxvguQDk"),
                    new MusicRecommendationValue("ocean eyes", "Billie Eilish", "차분한 분위기", "차분한 컨디션을 유지하기 좋은 분위기입니다.", "viimfQi_pUw"),
                    new MusicRecommendationValue("봄날 (Spring Day)", "BTS", "차분한 분위기", "차분한 컨디션을 유지하기 좋은 분위기입니다.", "xEeFrLSkMm8"),
                    new MusicRecommendationValue("밤편지", "IU", "차분한 분위기", "차분한 컨디션을 유지하기 좋은 분위기입니다.", "BzYnNdJhZQw"),
                    new MusicRecommendationValue("어떻게 이별까지 사랑하겠어, 널 사랑하는 거지", "AKMU", "차분한 분위기", "차분한 컨디션을 유지하기 좋은 분위기입니다.", "m3DZsBw5bnE"),
                    new MusicRecommendationValue("Nuvole Bianche", "Ludovico Einaudi", "차분한 분위기", "차분한 컨디션을 유지하기 좋은 분위기입니다.", "4VR-6AS0-l4"),
                    new MusicRecommendationValue("Riptide", "Vance Joy", "차분한 분위기", "차분한 컨디션을 유지하기 좋은 분위기입니다.", "uJ_1HMAGb4k"),
                    new MusicRecommendationValue("I'm Yours", "Jason Mraz", "차분한 분위기", "차분한 컨디션을 유지하기 좋은 분위기입니다.", "EkHTsc9PU2A"),
                    new MusicRecommendationValue("양화대교", "Zion.T", "차분한 분위기", "차분한 컨디션을 유지하기 좋은 분위기입니다.", "uLUvHUzd4UA"),
                    new MusicRecommendationValue("Just the Way You Are", "Bruno Mars", "차분한 분위기", "차분한 컨디션을 유지하기 좋은 분위기입니다.", "LjhCEhWiKXk"))),
            java.util.Map.entry(MoodType.BALANCED, List.of(
                    new MusicRecommendationValue("Counting Stars", "OneRepublic", "균형 있는 분위기", "과하지 않은 기본 분위기입니다.", "hT_nvWreIhg"),
                    new MusicRecommendationValue("Sugar", "Maroon 5", "균형 있는 분위기", "과하지 않은 기본 분위기입니다.", "09R8_2nJtjg"),
                    new MusicRecommendationValue("Memories", "Maroon 5", "균형 있는 분위기", "과하지 않은 기본 분위기입니다.", "SlPhMPnQ58k"),
                    new MusicRecommendationValue("Viva La Vida", "Coldplay", "균형 있는 분위기", "과하지 않은 기본 분위기입니다.", "dvgZkm1xWPE"),
                    new MusicRecommendationValue("Shape of You", "Ed Sheeran", "균형 있는 분위기", "과하지 않은 기본 분위기입니다.", "JGwWNGJdvx8"),
                    new MusicRecommendationValue("Just the Way You Are", "Bruno Mars", "균형 있는 분위기", "과하지 않은 기본 분위기입니다.", "LjhCEhWiKXk"),
                    new MusicRecommendationValue("Blueming", "IU", "균형 있는 분위기", "과하지 않은 기본 분위기입니다.", "D1PvIWdJ8xo"),
                    new MusicRecommendationValue("양화대교", "Zion.T", "균형 있는 분위기", "과하지 않은 기본 분위기입니다.", "uLUvHUzd4UA"),
                    new MusicRecommendationValue("여행", "볼빨간사춘기", "균형 있는 분위기", "과하지 않은 기본 분위기입니다.", "xRbPAVnqtcs"),
                    new MusicRecommendationValue("Riptide", "Vance Joy", "균형 있는 분위기", "과하지 않은 기본 분위기입니다.", "uJ_1HMAGb4k"),
                    new MusicRecommendationValue("I'm Yours", "Jason Mraz", "균형 있는 분위기", "과하지 않은 기본 분위기입니다.", "EkHTsc9PU2A"),
                    new MusicRecommendationValue("As It Was", "Harry Styles", "균형 있는 분위기", "과하지 않은 기본 분위기입니다.", "H5v3kku4y6Q"),
                    new MusicRecommendationValue("Circles", "Post Malone", "균형 있는 분위기", "과하지 않은 기본 분위기입니다.", "wXhTHyIgQ_U"),
                    new MusicRecommendationValue("Sunflower", "Post Malone, Swae Lee", "균형 있는 분위기", "과하지 않은 기본 분위기입니다.", "ApXoWvfEYVU"))));

    static final java.util.Map<ContextType, List<MusicRecommendationValue>> CONTEXT_MUSIC = java.util.Map.ofEntries(
            java.util.Map.entry(ContextType.COLD, List.of(
                    new MusicRecommendationValue("Let It Go", "Idina Menzel", "포근한 분위기", "기온이 낮거나 눈 오는 날에 어울리는 따뜻한 분위기입니다.", "L0MK7qz13bU"),
                    new MusicRecommendationValue("Thinking Out Loud", "Ed Sheeran", "포근한 분위기", "기온이 낮거나 눈 오는 날에 어울리는 따뜻한 분위기입니다.", "lp-EO5I60KA"),
                    new MusicRecommendationValue("Yellow", "Coldplay", "포근한 분위기", "기온이 낮거나 눈 오는 날에 어울리는 따뜻한 분위기입니다.", "yKNxeF4KMsY"),
                    new MusicRecommendationValue("Fix You", "Coldplay", "포근한 분위기", "기온이 낮거나 눈 오는 날에 어울리는 따뜻한 분위기입니다.", "k4V3Mo61fJM"),
                    new MusicRecommendationValue("봄날 (Spring Day)", "BTS", "포근한 분위기", "기온이 낮거나 눈 오는 날에 어울리는 따뜻한 분위기입니다.", "xEeFrLSkMm8"),
                    new MusicRecommendationValue("밤편지", "IU", "포근한 분위기", "기온이 낮거나 눈 오는 날에 어울리는 따뜻한 분위기입니다.", "BzYnNdJhZQw"),
                    new MusicRecommendationValue("Nuvole Bianche", "Ludovico Einaudi", "포근한 분위기", "기온이 낮거나 눈 오는 날에 어울리는 따뜻한 분위기입니다.", "4VR-6AS0-l4"))),
            java.util.Map.entry(ContextType.SNOW, List.of(
                    new MusicRecommendationValue("Let It Go", "Idina Menzel", "포근한 분위기", "기온이 낮거나 눈 오는 날에 어울리는 따뜻한 분위기입니다.", "L0MK7qz13bU"),
                    new MusicRecommendationValue("Thinking Out Loud", "Ed Sheeran", "포근한 분위기", "기온이 낮거나 눈 오는 날에 어울리는 따뜻한 분위기입니다.", "lp-EO5I60KA"),
                    new MusicRecommendationValue("봄날 (Spring Day)", "BTS", "포근한 분위기", "기온이 낮거나 눈 오는 날에 어울리는 따뜻한 분위기입니다.", "xEeFrLSkMm8"),
                    new MusicRecommendationValue("밤편지", "IU", "포근한 분위기", "기온이 낮거나 눈 오는 날에 어울리는 따뜻한 분위기입니다.", "BzYnNdJhZQw"),
                    new MusicRecommendationValue("Nuvole Bianche", "Ludovico Einaudi", "포근한 분위기", "기온이 낮거나 눈 오는 날에 어울리는 따뜻한 분위기입니다.", "4VR-6AS0-l4"))),
            java.util.Map.entry(ContextType.HOT, List.of(
                    new MusicRecommendationValue("Despacito", "Luis Fonsi ft. Daddy Yankee", "가벼운 분위기", "기온이 높은 날에 어울리는 산뜻한 분위기입니다.", "kJQP7kiw5Fk"),
                    new MusicRecommendationValue("Waka Waka (This Time for Africa)", "Shakira", "가벼운 분위기", "기온이 높은 날에 어울리는 산뜻한 분위기입니다.", "pRpeEdMmmQ0"),
                    new MusicRecommendationValue("Wake Me Up", "Avicii", "가벼운 분위기", "기온이 높은 날에 어울리는 산뜻한 분위기입니다.", "IcrbM1l_BoI"),
                    new MusicRecommendationValue("Butter", "BTS", "가벼운 분위기", "기온이 높은 날에 어울리는 산뜻한 분위기입니다.", "WMweEpGlu_U"),
                    new MusicRecommendationValue("Levitating", "Dua Lipa", "가벼운 분위기", "기온이 높은 날에 어울리는 산뜻한 분위기입니다.", "TUVcZfQe-Kw"),
                    new MusicRecommendationValue("Watermelon Sugar", "Harry Styles", "가벼운 분위기", "기온이 높은 날에 어울리는 산뜻한 분위기입니다.", "E07s5ZYygMg"),
                    new MusicRecommendationValue("Sunflower", "Post Malone, Swae Lee", "가벼운 분위기", "기온이 높은 날에 어울리는 산뜻한 분위기입니다.", "ApXoWvfEYVU"),
                    new MusicRecommendationValue("Hype Boy", "NewJeans", "가벼운 분위기", "기온이 높은 날에 어울리는 산뜻한 분위기입니다.", "11cta61wi0g"))),
            java.util.Map.entry(ContextType.RAIN, List.of(
                    new MusicRecommendationValue("Someone Like You", "Adele", "잔잔한 감성", "비 오는 날의 실내 분위기에 어울립니다.", "hLQl3WQQoQ0"),
                    new MusicRecommendationValue("Wonderwall", "Oasis", "잔잔한 감성", "비 오는 날의 실내 분위기에 어울립니다.", "bx1Bh8ZvH84"),
                    new MusicRecommendationValue("Hello", "Adele", "잔잔한 감성", "비 오는 날의 실내 분위기에 어울립니다.", "YQHsXMglC9A"),
                    new MusicRecommendationValue("Don't Know Why", "Norah Jones", "잔잔한 감성", "비 오는 날의 실내 분위기에 어울립니다.", "tO4dxvguQDk"),
                    new MusicRecommendationValue("Stay With Me", "Sam Smith", "잔잔한 감성", "비 오는 날의 실내 분위기에 어울립니다.", "pB-5XG-DbAA"),
                    new MusicRecommendationValue("ocean eyes", "Billie Eilish", "잔잔한 감성", "비 오는 날의 실내 분위기에 어울립니다.", "viimfQi_pUw"),
                    new MusicRecommendationValue("Someone You Loved", "Lewis Capaldi", "잔잔한 감성", "비 오는 날의 실내 분위기에 어울립니다.", "zABLecsR5UE"),
                    new MusicRecommendationValue("밤편지", "IU", "잔잔한 감성", "비 오는 날의 실내 분위기에 어울립니다.", "BzYnNdJhZQw"),
                    new MusicRecommendationValue("어떻게 이별까지 사랑하겠어, 널 사랑하는 거지", "AKMU", "잔잔한 감성", "비 오는 날의 실내 분위기에 어울립니다.", "m3DZsBw5bnE"))),
            java.util.Map.entry(ContextType.CLEAR, List.of(
                    new MusicRecommendationValue("Happy", "Pharrell Williams", "밝은 분위기", "맑은 날씨에 어울리는 밝은 분위기입니다.", "ZbZSe6N_BXs"),
                    new MusicRecommendationValue("Shake It Off", "Taylor Swift", "밝은 분위기", "맑은 날씨에 어울리는 밝은 분위기입니다.", "nfWlot6h_JM"),
                    new MusicRecommendationValue("Roar", "Katy Perry", "밝은 분위기", "맑은 날씨에 어울리는 밝은 분위기입니다.", "CevxZvSJLk8"),
                    new MusicRecommendationValue("Firework", "Katy Perry", "밝은 분위기", "맑은 날씨에 어울리는 밝은 분위기입니다.", "QGJuMBdaqIw"),
                    new MusicRecommendationValue("여행", "볼빨간사춘기", "밝은 분위기", "맑은 날씨에 어울리는 밝은 분위기입니다.", "xRbPAVnqtcs"),
                    new MusicRecommendationValue("Riptide", "Vance Joy", "밝은 분위기", "맑은 날씨에 어울리는 밝은 분위기입니다.", "uJ_1HMAGb4k"),
                    new MusicRecommendationValue("I'm Yours", "Jason Mraz", "밝은 분위기", "맑은 날씨에 어울리는 밝은 분위기입니다.", "EkHTsc9PU2A"),
                    new MusicRecommendationValue("Lovely Day", "Bill Withers", "밝은 분위기", "맑은 날씨에 어울리는 밝은 분위기입니다.", "bEeaS6fuUoA"),
                    new MusicRecommendationValue("September", "Earth, Wind & Fire", "밝은 분위기", "맑은 날씨에 어울리는 밝은 분위기입니다.", "Gs069dndIYk"),
                    new MusicRecommendationValue("Good as Hell", "Lizzo", "밝은 분위기", "맑은 날씨에 어울리는 밝은 분위기입니다.", "SmbmeOgWsqE"))),
            java.util.Map.entry(ContextType.CLOUDY, List.of(
                    new MusicRecommendationValue("Paradise", "Coldplay", "집중하기 좋은 분위기", "흐린 날씨에 차분히 집중하기 좋은 분위기입니다.", "1G4isv_Fylg"),
                    new MusicRecommendationValue("Hymn for the Weekend", "Coldplay", "집중하기 좋은 분위기", "흐린 날씨에 차분히 집중하기 좋은 분위기입니다.", "YykjpeuMNEk"),
                    new MusicRecommendationValue("Viva La Vida", "Coldplay", "집중하기 좋은 분위기", "흐린 날씨에 차분히 집중하기 좋은 분위기입니다.", "dvgZkm1xWPE"),
                    new MusicRecommendationValue("Yellow", "Coldplay", "집중하기 좋은 분위기", "흐린 날씨에 차분히 집중하기 좋은 분위기입니다.", "yKNxeF4KMsY"),
                    new MusicRecommendationValue("Fix You", "Coldplay", "집중하기 좋은 분위기", "흐린 날씨에 차분히 집중하기 좋은 분위기입니다.", "k4V3Mo61fJM"),
                    new MusicRecommendationValue("As It Was", "Harry Styles", "집중하기 좋은 분위기", "흐린 날씨에 차분히 집중하기 좋은 분위기입니다.", "H5v3kku4y6Q"),
                    new MusicRecommendationValue("Circles", "Post Malone", "집중하기 좋은 분위기", "흐린 날씨에 차분히 집중하기 좋은 분위기입니다.", "wXhTHyIgQ_U"),
                    new MusicRecommendationValue("양화대교", "Zion.T", "집중하기 좋은 분위기", "흐린 날씨에 차분히 집중하기 좋은 분위기입니다.", "uLUvHUzd4UA"))));

    record AnalysisResult(
            int wellnessScore,
            String moodCode,
            String moodLabel,
            String summary,
            List<FoodRecommendationValue> foods,
            List<MusicRecommendationValue> music) {
    }

    enum MoodType {
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

    enum ContextType {
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
