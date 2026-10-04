package com.moodfit.dto.request;

import java.math.BigDecimal;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CreateCheckinRequest(
        @NotNull @Min(40) @Max(180) Integer heartRate,
        @NotNull @Min(8) @Max(40) Integer respiratoryRate,
        @NotNull @Min(0) @Max(100) Integer sleepScore,
        @NotNull @Min(0) @Max(100) Integer stressLevel,
        @NotNull @Min(0) @Max(100) Integer energyLevel,
        @NotNull @DecimalMin("-30.0") @DecimalMax("50.0") @Digits(integer = 2, fraction = 1) BigDecimal temperature,
        @NotNull WeatherCondition weather,
        @Size(max = 80) @Pattern(regexp = "\\P{Cc}*") String region) {
    public CreateCheckinRequest {
        // Preserve control characters for validation, including leading/trailing newlines.
        if (region != null && region.codePoints().noneMatch(Character::isISOControl)) {
            region = region.strip();
            if (region.isEmpty()) region = null;
        }
    }

    public CreateCheckinRequest(Integer heartRate, Integer respiratoryRate, Integer sleepScore,
            Integer stressLevel, Integer energyLevel, BigDecimal temperature, WeatherCondition weather) {
        this(heartRate, respiratoryRate, sleepScore, stressLevel, energyLevel, temperature, weather, null);
    }
}
