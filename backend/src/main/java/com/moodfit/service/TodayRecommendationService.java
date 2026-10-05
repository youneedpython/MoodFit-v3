package com.moodfit.service;

import java.math.BigDecimal;
import com.moodfit.auth.UserIdentity;
import com.moodfit.dto.request.WeatherCondition;
import com.moodfit.dto.response.TodayRecommendationResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TodayRecommendationService {
    private final WellnessRulePolicy policy;
    private final RecommendationFeedbackService feedback;

    public TodayRecommendationService(WellnessRulePolicy policy, RecommendationFeedbackService feedback) {
        this.policy = policy;
        this.feedback = feedback;
    }

    @Transactional(readOnly = true)
    public TodayRecommendationResponse get(UserIdentity identity, BigDecimal temperature, WeatherCondition weather) {
        return policy.recommendToday(temperature, weather, feedback.get(identity));
    }
}
