package com.moodfit.dto.response;

public record MetricsResponse(
        Integer heartRate,
        Integer respiratoryRate,
        Integer sleepScore,
        Integer stressLevel,
        Integer energyLevel) {
}
