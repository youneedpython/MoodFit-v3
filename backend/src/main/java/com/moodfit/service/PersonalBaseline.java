package com.moodfit.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.function.ToIntFunction;
import com.moodfit.dto.request.CreateCheckinRequest;
import com.moodfit.dto.response.BaselineResponse;
import com.moodfit.dto.response.BaselineResponse.Values;
import com.moodfit.entity.WellnessCheckin;

public final class PersonalBaseline {
    private PersonalBaseline() {}

    public static BaselineResponse calculate(List<WellnessCheckin> records, Long userId,
            Instant now, CreateCheckinRequest today) {
        var from = now.minus(Duration.ofDays(14));
        var samples = records.stream().filter(row -> userId.equals(row.getUserId())
                && !row.getRecordedAt().isBefore(from) && row.getRecordedAt().isBefore(now)).toList();
        if (samples.size() < 5) return BaselineResponse.unavailable();
        var averages = new Values(mean(samples, WellnessCheckin::getHeartRate),
                mean(samples, WellnessCheckin::getRespiratoryRate), mean(samples, WellnessCheckin::getSleepScore),
                mean(samples, WellnessCheckin::getStressLevel), mean(samples, WellnessCheckin::getEnergyLevel));
        if (averages.heartRate().signum() == 0 || averages.respiratoryRate().signum() == 0)
            return BaselineResponse.unavailable();
        var deltas = differences(averages, today.heartRate(), today.respiratoryRate(), today.sleepScore(),
                today.stressLevel(), today.energyLevel());
        String tension = highHeart(averages, deltas) || highBreathing(averages, deltas) ? "HIGH"
                : atMost(deltas.heartRate(), averages.heartRate(), "0.10")
                    && atMost(deltas.respiratoryRate(), averages.respiratoryRate(), "0.10") ? "STABLE" : "NORMAL";
        return new BaselineResponse(true, samples.size(), tension, averages, deltas);
    }

    private static BigDecimal mean(List<WellnessCheckin> rows, ToIntFunction<WellnessCheckin> metric) {
        return BigDecimal.valueOf(rows.stream().mapToLong(row -> metric.applyAsInt(row)).sum())
                .divide(BigDecimal.valueOf(rows.size()), 1, RoundingMode.HALF_UP);
    }
    public static Values differences(Values a, int heart, int breathing, int sleep, int stress, int energy) {
        return new Values(delta(heart, a.heartRate()), delta(breathing, a.respiratoryRate()),
                delta(sleep, a.sleepScore()), delta(stress, a.stressLevel()), delta(energy, a.energyLevel()));
    }
    private static BigDecimal delta(int value, BigDecimal average) {
        return BigDecimal.valueOf(value).subtract(average).setScale(1, RoundingMode.HALF_UP);
    }
    private static boolean atMost(BigDecimal delta, BigDecimal average, String ratio) {
        return delta.compareTo(average.multiply(new BigDecimal(ratio))) <= 0;
    }
    private static boolean highHeart(Values a, Values d) {
        return d.heartRate().compareTo(a.heartRate().multiply(new BigDecimal("0.15"))) >= 0;
    }
    private static boolean highBreathing(Values a, Values d) {
        return d.respiratoryRate().compareTo(a.respiratoryRate().multiply(new BigDecimal("0.20"))) >= 0;
    }
    public static String summary(BaselineResponse baseline) {
        if (!"HIGH".equals(baseline.tension())) return "";
        boolean heart = highHeart(baseline.averages(), baseline.deltas());
        boolean breathing = highBreathing(baseline.averages(), baseline.deltas());
        String metric = heart && breathing ? "심박수와 호흡수가" : heart ? "심박수가" : "호흡수가";
        return " 평소보다 " + metric + " 높게 나타나 잠시 쉬어 가는 것이 어울립니다.";
    }
}
