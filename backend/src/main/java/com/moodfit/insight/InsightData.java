package com.moodfit.insight;

import java.time.*;
import java.util.*;
import com.moodfit.entity.WellnessCheckin;
import com.moodfit.entity.FoodRecommendationValue;
import com.moodfit.entity.MusicRecommendationValue;
import com.moodfit.exception.CheckinNotFoundException;
import com.moodfit.repository.WellnessCheckinRepository;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class InsightData {
    private final WellnessCheckinRepository repository;
    public InsightData(WellnessCheckinRepository repository) { this.repository = repository; }
    @Transactional(readOnly = true)
    public Map<String, Object> checkin(Long id, Long userId) {
        var row = repository.findById(id).filter(record -> record.getUserId().equals(userId)).orElseThrow(CheckinNotFoundException::new);
        var input = daily(row);
        input.put("heartRate", row.getHeartRate());
        input.put("respiratoryRate", row.getRespiratoryRate());
        input.put("summary", row.getSummary());
        input.put("foods", row.getFoodRecommendations().stream().map(FoodRecommendationValue::getName).toList());
        input.put("music", row.getMusicRecommendations().stream().map(MusicRecommendationValue::getTitle).toList());
        return input;
    }
    @Transactional(readOnly = true)
    public List<Map<String, Object>> weekly(Long userId, Instant from, Instant until) {
        var rows = repository.findByUserIdAndRecordedAtGreaterThanEqualOrderByRecordedAtAsc(userId, from).stream()
                .filter(row -> row.getRecordedAt().isBefore(until))
                .sorted(Comparator.comparing(WellnessCheckin::getRecordedAt).thenComparing(WellnessCheckin::getId).reversed())
                .limit(30).toList();
        return rows.stream().map(row -> {
            var input = daily(row);
            input.put("date", row.getRecordedAt().atZone(ZoneId.of("Asia/Seoul")).toLocalDate().toString());
            return input;
        }).toList();
    }
    private Map<String, Object> daily(WellnessCheckin row) {
        var input = new LinkedHashMap<String, Object>();
        input.put("score", row.getWellnessScore());
        input.put("status", row.getMood());
        input.put("sleepScore", row.getSleepScore());
        input.put("stressLevel", row.getStressLevel());
        input.put("energyLevel", row.getEnergyLevel());
        input.put("weather", row.getWeather().name());
        input.put("temperature", row.getTemperature());
        return input;
    }
}
