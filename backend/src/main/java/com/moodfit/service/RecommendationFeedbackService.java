package com.moodfit.service;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import com.moodfit.auth.UserIdentity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class RecommendationFeedbackService {
    public enum Kind {
        FOOD, MUSIC;
        @com.fasterxml.jackson.annotation.JsonCreator
        public static Kind parse(String value) { return value == null ? null : valueOf(value); }
    }
    public enum Rating {
        LIKE, DISLIKE;
        @com.fasterxml.jackson.annotation.JsonCreator
        public static Rating parse(String value) { return value == null ? null : valueOf(value); }
    }
    public record Item(Kind kind, String item, Rating rating) {}
    public record Feedback(boolean enabled, boolean shared, List<Item> items) {
        Map<String, Rating> ratings(Kind kind) {
            return items.stream().filter(item -> item.kind() == kind)
                    .collect(Collectors.toMap(Item::item, Item::rating));
        }
    }
    private final JdbcTemplate jdbc;
    public RecommendationFeedbackService(JdbcTemplate jdbc) { this.jdbc = jdbc; }
    @Transactional(readOnly = true)
    public Feedback get(UserIdentity identity) {
        boolean shared = identity.id() == 1L || "guest".equals(identity.provider());
        return new Feedback(true, shared, jdbc.query(
                "SELECT kind, item_name, rating FROM recommendation_feedback WHERE user_id = ? ORDER BY kind, item_name",
                (row, n) -> new Item(Kind.valueOf(row.getString(1)), row.getString(2), Rating.valueOf(row.getString(3))), identity.id()));
    }
    @Transactional
    public void put(UserIdentity identity, Kind kind, String item, Rating rating) {
        // Serialize writes with account deletion and concurrent first-time ratings on both databases.
        var providers = jdbc.query("SELECT provider FROM app_user WHERE id = ? FOR UPDATE",
                (row, n) -> row.getString(1), identity.id());
        if (providers.isEmpty()) throw new org.springframework.security.authentication.AuthenticationCredentialsNotFoundException("Authentication required");
        jdbc.update("DELETE FROM recommendation_feedback WHERE user_id = ? AND kind = ? AND item_name = ?", identity.id(), kind.name(), item);
        if (rating != null) jdbc.update(
                "INSERT INTO recommendation_feedback (user_id, kind, item_name, rating, updated_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)",
                identity.id(), kind.name(), item, rating.name());
    }
}
