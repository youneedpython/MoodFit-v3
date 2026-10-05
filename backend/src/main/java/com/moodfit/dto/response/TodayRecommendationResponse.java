package com.moodfit.dto.response;

import java.util.List;

public record TodayRecommendationResponse(Context context, List<FoodRecommendationResponse> foods,
        List<MusicRecommendationResponse> music) {
    public record Context(String code, String label) {}
}
