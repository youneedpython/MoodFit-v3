package com.moodfit.dto.response;

import java.math.BigDecimal;

import com.moodfit.dto.request.WeatherCondition;

public record WeatherResponse(
        BigDecimal temperature,
        WeatherCondition condition,
        String region) {
}
