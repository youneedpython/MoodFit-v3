package com.moodfit.dto.response;

import java.time.Instant;
import java.util.List;

public record CheckinResponse(
        Long id,
        Instant recordedAt,
        MoodResponse mood,
        Integer wellnessScore,
        String summary,
        MetricsResponse metrics,
        WeatherResponse weather,
        List<FoodRecommendationResponse> foods,
        List<MusicRecommendationResponse> music,
        BaselineResponse baseline) {
}
