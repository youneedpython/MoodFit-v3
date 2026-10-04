package com.moodfit.service;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.moodfit.dto.request.CreateCheckinRequest;
import com.moodfit.dto.response.CheckinResponse;
import com.moodfit.dto.response.FoodRecommendationResponse;
import com.moodfit.dto.response.HistoryItemResponse;
import com.moodfit.dto.response.HistoryResponse;
import com.moodfit.dto.response.MetricsResponse;
import com.moodfit.dto.response.MoodResponse;
import com.moodfit.dto.response.MusicRecommendationResponse;
import com.moodfit.dto.response.WeatherResponse;
import com.moodfit.entity.FoodRecommendationValue;
import com.moodfit.entity.MusicRecommendationValue;
import com.moodfit.entity.WellnessCheckin;
import com.moodfit.exception.CheckinNotFoundException;
import com.moodfit.repository.WellnessCheckinRepository;

@Service
public class CheckinServiceImpl implements CheckinService {

    private final WellnessCheckinRepository repository;
    private final WellnessRulePolicy wellnessRulePolicy;
    private final Clock clock;
    private final RecommendationFeedbackService feedback;

    public CheckinServiceImpl(WellnessCheckinRepository repository, WellnessRulePolicy wellnessRulePolicy, Clock clock, RecommendationFeedbackService feedback) {
        this.repository = repository;
        this.wellnessRulePolicy = wellnessRulePolicy;
        this.clock = clock;
        this.feedback = feedback;
    }

    @Override
    @Transactional
    public CheckinResponse create(CreateCheckinRequest request) {
        WellnessRulePolicy.AnalysisResult analysis = wellnessRulePolicy.analyze(request, feedback.get(com.moodfit.auth.UserIdentity.current()));
        WellnessCheckin checkin = new WellnessCheckin(
                clock.instant().truncatedTo(ChronoUnit.MICROS),
                request.heartRate(),
                request.respiratoryRate(),
                request.sleepScore(),
                request.stressLevel(),
                request.energyLevel(),
                request.temperature(),
                request.weather(),
                analysis.wellnessScore(),
                analysis.moodCode(),
                analysis.summary(),
                analysis.foods(),
                analysis.music());

        checkin.assignUser(com.moodfit.auth.UserIdentity.current().id());
        checkin.assignRegion(request.region());
        return toCheckinResponse(repository.save(checkin), analysis.moodLabel());
    }

    @Override
    @Transactional(readOnly = true)
    public CheckinResponse getLatest() {
        WellnessCheckin checkin = repository.findTopByUserIdOrderByRecordedAtDescIdDesc(com.moodfit.auth.UserIdentity.current().id())
                .orElseThrow(CheckinNotFoundException::new);
        return toCheckinResponse(checkin, wellnessRulePolicy.moodLabel(checkin.getMood()));
    }

    @Override
    @Transactional(readOnly = true)
    public HistoryResponse getHistory(int days) {
        Instant from = clock.instant().truncatedTo(ChronoUnit.MICROS).minus(Duration.ofDays(days));
        List<HistoryItemResponse> items = repository.findByUserIdAndRecordedAtGreaterThanEqualOrderByRecordedAtAsc(com.moodfit.auth.UserIdentity.current().id(), from)
                .stream()
                .map(this::toHistoryItemResponse)
                .toList();
        return new HistoryResponse(days, items);
    }

    private CheckinResponse toCheckinResponse(WellnessCheckin checkin, String moodLabel) {
        return new CheckinResponse(
                checkin.getId(),
                checkin.getRecordedAt(),
                new MoodResponse(checkin.getMood(), moodLabel),
                checkin.getWellnessScore(),
                checkin.getSummary(),
                new MetricsResponse(
                        checkin.getHeartRate(),
                        checkin.getRespiratoryRate(),
                        checkin.getSleepScore(),
                        checkin.getStressLevel(),
                        checkin.getEnergyLevel()),
                new WeatherResponse(checkin.getTemperature(), checkin.getWeather(), checkin.getRegion()),
                checkin.getFoodRecommendations().stream()
                        .map(this::toFoodResponse)
                        .toList(),
                checkin.getMusicRecommendations().stream()
                        .map(this::toMusicResponse)
                        .toList());
    }

    private HistoryItemResponse toHistoryItemResponse(WellnessCheckin checkin) {
        return new HistoryItemResponse(
                checkin.getId(),
                checkin.getRecordedAt(),
                new MoodResponse(checkin.getMood(), wellnessRulePolicy.moodLabel(checkin.getMood())),
                checkin.getWellnessScore(),
                checkin.getHeartRate(),
                checkin.getRespiratoryRate(),
                checkin.getSleepScore(),
                checkin.getStressLevel(),
                checkin.getEnergyLevel(),
                checkin.getTemperature(),
                checkin.getWeather(),
                checkin.getRegion(),
                checkin.getFoodRecommendations().stream()
                        .map(FoodRecommendationValue::getName)
                        .toList(),
                checkin.getMusicRecommendations().stream()
                        .map(MusicRecommendationValue::getTitle)
                        .toList());
    }

    private FoodRecommendationResponse toFoodResponse(FoodRecommendationValue value) {
        return new FoodRecommendationResponse(value.getName(), value.getTag(), value.getReason());
    }

    private MusicRecommendationResponse toMusicResponse(MusicRecommendationValue value) {
        return new MusicRecommendationResponse(value.getTitle(), value.getArtist(), value.getTag(), value.getReason(), value.getVideoId());
    }
}
