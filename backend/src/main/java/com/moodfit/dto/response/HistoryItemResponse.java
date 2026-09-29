package com.moodfit.dto.response;

import java.math.BigDecimal;
import java.time.Instant;

import com.moodfit.dto.request.WeatherCondition;

public record HistoryItemResponse(
        Long id,
        Instant recordedAt,
        MoodResponse mood,
        Integer wellnessScore,
        Integer heartRate,
        Integer respiratoryRate,
        Integer sleepScore,
        Integer stressLevel,
        Integer energyLevel,
        BigDecimal temperature,
        WeatherCondition weather) {
}
