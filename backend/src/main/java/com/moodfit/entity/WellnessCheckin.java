package com.moodfit.entity;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

import com.moodfit.dto.request.WeatherCondition;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OrderColumn;
import jakarta.persistence.Table;

@Entity
@Table(name = "wellness_checkin")
public class WellnessCheckin {

    @Column(name = "baseline_sample_count")
    private Integer baselineSampleCount;
    @Column(name = "baseline_heart_rate", precision = 4, scale = 1)
    private BigDecimal baselineHeartRate;
    @Column(name = "baseline_respiratory_rate", precision = 3, scale = 1)
    private BigDecimal baselineRespiratoryRate;
    @Column(name = "baseline_sleep_score", precision = 4, scale = 1)
    private BigDecimal baselineSleepScore;
    @Column(name = "baseline_stress_level", precision = 4, scale = 1)
    private BigDecimal baselineStressLevel;
    @Column(name = "baseline_energy_level", precision = 4, scale = 1)
    private BigDecimal baselineEnergyLevel;
    @Column(length = 10)
    private String tension;

    public void assignBaseline(com.moodfit.dto.response.BaselineResponse baseline) {
        if (!baseline.available()) return;
        baselineSampleCount = baseline.sampleCount();
        baselineHeartRate = baseline.averages().heartRate();
        baselineRespiratoryRate = baseline.averages().respiratoryRate();
        baselineSleepScore = baseline.averages().sleepScore();
        baselineStressLevel = baseline.averages().stressLevel();
        baselineEnergyLevel = baseline.averages().energyLevel();
        tension = baseline.tension();
    }
    public String getTension() { return tension; }
    public com.moodfit.dto.response.BaselineResponse getBaseline() {
        if (baselineSampleCount == null) return com.moodfit.dto.response.BaselineResponse.unavailable();
        var averages = new com.moodfit.dto.response.BaselineResponse.Values(baselineHeartRate,
                baselineRespiratoryRate, baselineSleepScore, baselineStressLevel, baselineEnergyLevel);
        return new com.moodfit.dto.response.BaselineResponse(true, baselineSampleCount, tension, averages,
                com.moodfit.service.PersonalBaseline.differences(averages, heartRate, respiratoryRate,
                        sleepScore, stressLevel, energyLevel));
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId = 1L;

    public void assignUser(Long userId) { this.userId = userId; }
    public Long getUserId() { return userId; }

    @Convert(converter = InstantUtcLocalDateTimeConverter.class)
    @Column(name = "recorded_at", nullable = false)
    private Instant recordedAt;

    @Column(name = "heart_rate", nullable = false)
    private int heartRate;

    @Column(name = "respiratory_rate", nullable = false)
    private int respiratoryRate;

    @Column(name = "sleep_score", nullable = false)
    private int sleepScore;

    @Column(name = "stress_level", nullable = false)
    private int stressLevel;

    @Column(name = "energy_level", nullable = false)
    private int energyLevel;

    @Column(nullable = false, precision = 3, scale = 1)
    private BigDecimal temperature;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private WeatherCondition weather;

    @Column(length = 80)
    private String region;

    public void assignRegion(String region) { this.region = region; }
    public String getRegion() { return region; }

    @Column(name = "wellness_score", nullable = false)
    private int wellnessScore;

    @Column(nullable = false, length = 20)
    private String mood;

    @Column(nullable = false, length = 500)
    private String summary;

    @ElementCollection
    @CollectionTable(name = "checkin_food_recommendation", joinColumns = @JoinColumn(name = "checkin_id"))
    @OrderColumn(name = "position")
    private List<FoodRecommendationValue> foodRecommendations = new ArrayList<>();

    @ElementCollection
    @CollectionTable(name = "checkin_music_recommendation", joinColumns = @JoinColumn(name = "checkin_id"))
    @OrderColumn(name = "position")
    private List<MusicRecommendationValue> musicRecommendations = new ArrayList<>();

    protected WellnessCheckin() {
    }

    public WellnessCheckin(
            Instant recordedAt,
            int heartRate,
            int respiratoryRate,
            int sleepScore,
            int stressLevel,
            int energyLevel,
            BigDecimal temperature,
            WeatherCondition weather,
            int wellnessScore,
            String mood,
            String summary,
            List<FoodRecommendationValue> foodRecommendations,
            List<MusicRecommendationValue> musicRecommendations) {
        this.recordedAt = recordedAt;
        this.heartRate = heartRate;
        this.respiratoryRate = respiratoryRate;
        this.sleepScore = sleepScore;
        this.stressLevel = stressLevel;
        this.energyLevel = energyLevel;
        this.temperature = temperature;
        this.weather = weather;
        this.wellnessScore = wellnessScore;
        this.mood = mood;
        this.summary = summary;
        this.foodRecommendations = new ArrayList<>(foodRecommendations);
        this.musicRecommendations = new ArrayList<>(musicRecommendations);
    }

    public Long getId() {
        return id;
    }

    public Instant getRecordedAt() {
        return recordedAt;
    }

    public int getHeartRate() {
        return heartRate;
    }

    public int getRespiratoryRate() {
        return respiratoryRate;
    }

    public int getSleepScore() {
        return sleepScore;
    }

    public int getStressLevel() {
        return stressLevel;
    }

    public int getEnergyLevel() {
        return energyLevel;
    }

    public BigDecimal getTemperature() {
        return temperature;
    }

    public WeatherCondition getWeather() {
        return weather;
    }

    public int getWellnessScore() {
        return wellnessScore;
    }

    public String getMood() {
        return mood;
    }

    public String getSummary() {
        return summary;
    }

    public List<FoodRecommendationValue> getFoodRecommendations() {
        return List.copyOf(foodRecommendations);
    }

    public List<MusicRecommendationValue> getMusicRecommendations() {
        return List.copyOf(musicRecommendations);
    }
}
