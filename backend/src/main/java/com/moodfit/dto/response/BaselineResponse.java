package com.moodfit.dto.response;

import java.math.BigDecimal;

public record BaselineResponse(boolean available, int sampleCount, String tension,
        Values averages, Values deltas) {
    public record Values(BigDecimal heartRate, BigDecimal respiratoryRate, BigDecimal sleepScore,
            BigDecimal stressLevel, BigDecimal energyLevel) {}
    public static BaselineResponse unavailable() {
        return new BaselineResponse(false, 0, null, null, null);
    }
}
