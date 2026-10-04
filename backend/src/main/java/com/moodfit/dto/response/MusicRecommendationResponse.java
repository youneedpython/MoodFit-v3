package com.moodfit.dto.response;

public record MusicRecommendationResponse(
        String title,
        String artist,
        String tag,
        String reason,
        String videoId) {
}
