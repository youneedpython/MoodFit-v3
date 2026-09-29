package com.moodfit.dto.response;

public record FoodRecommendationResponse(
        String name,
        String tag,
        String reason) {
}
