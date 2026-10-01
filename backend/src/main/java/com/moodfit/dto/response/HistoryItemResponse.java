package com.moodfit.dto.response;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

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
        WeatherCondition weather,
        /** 추천 음식 이름 (Mood Item, Context Item 순서, DEC-020) */
        List<String> foodNames,
        /** 추천 음악 제목 (Mood Item, Context Item 순서, DEC-020) */
        List<String> musicTitles) {
}
