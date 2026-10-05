package com.moodfit.service;

import java.util.Map;
import com.moodfit.auth.UserIdentity;
import com.moodfit.dto.response.ErrorResponse;
import com.moodfit.service.RecommendationFeedbackService.Kind;
import com.moodfit.service.RecommendationFeedbackService.Rating;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/recommendations/feedback")
public class RecommendationFeedbackController {
    private final RecommendationFeedbackService feedback;
    public RecommendationFeedbackController(RecommendationFeedbackService feedback) { this.feedback = feedback; }
    public record Input(Kind kind, String item, Rating rating) {}
    @GetMapping
    public RecommendationFeedbackService.Feedback get() { return feedback.get(UserIdentity.current()); }
    @PutMapping
    public ResponseEntity<?> put(@RequestBody Input input) {
        var identity = UserIdentity.current();
        String item = input.item() == null ? "" : input.item().strip();
        if (input.kind() == null || item.isEmpty() || item.length() > 120
                || item.codePoints().anyMatch(Character::isISOControl)
                || !WellnessRulePolicy.contains(input.kind(), item)) {
            return ResponseEntity.badRequest().body(new ErrorResponse("VALIDATION_ERROR", "Request validation failed.", Map.of("item", "Invalid recommendation item.")));
        }
        feedback.put(identity, input.kind(), item, input.rating());
        return ResponseEntity.noContent().build();
    }
}
