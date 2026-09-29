package com.moodfit.dto.request;

import java.math.BigDecimal;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record CreateCheckinRequest(
        @NotNull @Min(40) @Max(180) Integer heartRate,
        @NotNull @Min(8) @Max(40) Integer respiratoryRate,
        @NotNull @Min(0) @Max(100) Integer sleepScore,
        @NotNull @Min(0) @Max(100) Integer stressLevel,
        @NotNull @Min(0) @Max(100) Integer energyLevel,
        @NotNull @DecimalMin("-30.0") @DecimalMax("50.0") BigDecimal temperature,
        @NotNull WeatherCondition weather) {
}
