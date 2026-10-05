package com.moodfit.controller;

import java.math.BigDecimal;
import java.util.LinkedHashMap;
import com.moodfit.auth.UserIdentity;
import com.moodfit.dto.request.WeatherCondition;
import com.moodfit.dto.response.ErrorResponse;
import com.moodfit.service.TodayRecommendationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class TodayRecommendationController {
    private final TodayRecommendationService service;

    public TodayRecommendationController(TodayRecommendationService service) { this.service = service; }

    @GetMapping("/api/recommendations/today")
    public ResponseEntity<?> get(@RequestParam(required = false) String temperature,
            @RequestParam(required = false) String weather) {
        var identity = UserIdentity.current();
        var errors = new LinkedHashMap<String, String>();
        BigDecimal degrees = null;
        WeatherCondition condition = null;
        try {
            if (temperature == null || temperature.isBlank()) throw new IllegalArgumentException();
            degrees = new BigDecimal(temperature);
            if (degrees.scale() > 1 || degrees.compareTo(new BigDecimal("-30.0")) < 0
                    || degrees.compareTo(new BigDecimal("50.0")) > 0) throw new IllegalArgumentException();
        } catch (IllegalArgumentException failure) {
            errors.put("temperature", "Temperature must be between -30.0 and 50.0 with at most one decimal place.");
        }
        try {
            if (weather == null) throw new IllegalArgumentException();
            condition = WeatherCondition.valueOf(weather);
        } catch (IllegalArgumentException failure) {
            errors.put("weather", "Weather must be CLEAR, CLOUDY, RAIN or SNOW.");
        }
        if (!errors.isEmpty()) return ResponseEntity.badRequest().body(
                new ErrorResponse("VALIDATION_ERROR", "Request validation failed.", errors));
        return ResponseEntity.ok(service.get(identity, degrees, condition));
    }
}
