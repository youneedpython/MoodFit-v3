package com.moodfit.auth;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.AuthenticationCredentialsNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AccountDeletionService {
    private final JdbcTemplate jdbc;
    public AccountDeletionService(JdbcTemplate jdbc) { this.jdbc = jdbc; }

    @Transactional
    public void delete(UserIdentity identity) {
        var providers = jdbc.query("SELECT provider FROM app_user WHERE id = ? FOR UPDATE",
                (row, n) -> row.getString(1), identity.id());
        if (providers.isEmpty()) throw new AuthenticationCredentialsNotFoundException("Authentication required");
        if (identity.id() == 1L || "guest".equals(providers.getFirst())) {
            throw new AccessDeniedException("Guest account cannot be deleted");
        }
        for (String table : new String[] {"checkin_insight", "checkin_food_recommendation", "checkin_music_recommendation"}) {
            jdbc.update("DELETE FROM " + table + " WHERE checkin_id IN (SELECT id FROM wellness_checkin WHERE user_id = ?)", identity.id());
        }
        jdbc.update("DELETE FROM weekly_report WHERE user_id = ?", identity.id());
        jdbc.update("DELETE FROM llm_usage WHERE user_id = ?", identity.id());
        jdbc.update("DELETE FROM wellness_checkin WHERE user_id = ?", identity.id());
        // End every existing session for this account, including sessions on other devices.
        jdbc.update("DELETE FROM SPRING_SESSION WHERE PRINCIPAL_NAME = ?", identity.getName());
        jdbc.update("DELETE FROM app_user WHERE id = ?", identity.id());
    }
}
