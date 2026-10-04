package com.moodfit.auth;

import java.util.Map;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.jdbc.core.JdbcTemplate;
import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.*;

@SpringBootTest
@AutoConfigureMockMvc
class AuthTests {
    @Autowired MockMvc mvc;
    @Autowired UserLoginService users;
    @Autowired AppUserRepository repository;
    @Autowired JdbcTemplate jdbc;
    private static final String INPUT = """
            {"heartRate":68,"respiratoryRate":18,"sleepScore":86,"stressLevel":31,"energyLevel":74,"temperature":19.0,"weather":"RAIN"}
            """;
    @Test void anonymousAndCsrfErrorsAreJson() throws Exception {
        mvc.perform(get("/api/check-ins/latest")).andExpect(status().isUnauthorized()).andExpect(jsonPath("$.code").value("UNAUTHENTICATED"));
        mvc.perform(post("/api/auth/guest")).andExpect(status().isForbidden()).andExpect(jsonPath("$.code").value("FORBIDDEN"));
        mvc.perform(post("/api/auth/guest").with(csrf())).andExpect(status().isNoContent());
    }
    @Test void unconfiguredProvidersAndCsrfCookie() throws Exception {
        mvc.perform(get("/api/auth/me")).andExpect(status().isOk())
                .andExpect(jsonPath("$.authenticated").value(false)).andExpect(jsonPath("$.providers").isEmpty())
                .andExpect(cookie().exists("XSRF-TOKEN")).andExpect(cookie().httpOnly("XSRF-TOKEN", false));
        mvc.perform(get("/api/auth/login/google")).andExpect(status().isNotFound());
        mvc.perform(get("/api/auth/login/kakao")).andExpect(status().isNotFound());
    }
    @Test void guestSessionAndLogout() throws Exception {
        // Exercise a real JDBC-backed session through its response cookie, rather than mocking authentication.
        var login = mvc.perform(post("/api/auth/guest").with(csrf())).andExpect(status().isNoContent()).andReturn();
        var session = login.getResponse().getCookie("SESSION");
        assertThat(session).isNotNull();
        assertThat(session.isHttpOnly()).isTrue();
        var me = mvc.perform(get("/api/auth/me").cookie(session)).andExpect(jsonPath("$.authenticated").value(true))
                .andExpect(jsonPath("$.user.provider").value("guest")).andReturn();
        var mapper = new tools.jackson.databind.ObjectMapper();
        assertThat(mapper.readTree(me.getResponse().getContentAsString()))
                .isEqualTo(mapper.readTree(java.nio.file.Files.readString(java.nio.file.Path.of("..", "contracts", "auth-me-guest-200.json"))));
        mvc.perform(post("/api/auth/logout").cookie(session).with(csrf())).andExpect(status().isNoContent());
        mvc.perform(get("/api/check-ins/latest").cookie(session)).andExpect(status().isUnauthorized());
    }
    @Test void rawCookieCsrfWorksForSpaGuestAndWrites() throws Exception {
        var anonymous = mvc.perform(get("/api/auth/me")).andReturn().getResponse().getCookie("XSRF-TOKEN");
        assertThat(anonymous).isNotNull();
        var login = mvc.perform(post("/api/auth/guest").cookie(anonymous).header("X-XSRF-TOKEN", anonymous.getValue()))
                .andExpect(status().isNoContent()).andReturn();
        var session = login.getResponse().getCookie("SESSION");
        var fresh = mvc.perform(get("/api/auth/me").cookie(session)).andReturn().getResponse().getCookie("XSRF-TOKEN");
        assertThat(fresh).isNotNull();
        mvc.perform(post("/api/check-ins").cookie(session, fresh).header("X-XSRF-TOKEN", fresh.getValue())
                .contentType(MediaType.APPLICATION_JSON).content(INPUT)).andExpect(status().isCreated());
    }
    @Test void socialIdentityIsStableAndMinimal() {
        var google = users.social("google", Map.of("sub", "google-test", "name", "  " + "가".repeat(50) + "  ", "email", "private@example.invalid", "picture", "https://example.invalid/photo"));
        assertThat(google.displayName()).hasSize(40);
        var again = users.social("google", Map.of("sub", "google-test", "name", "새 이름"));
        assertThat(again.id()).isEqualTo(google.id());
        var kakao = users.social("kakao", Map.of("id", 1234567, "kakao_account", Map.of("profile", Map.of("nickname", " 카카오 "))));
        assertThat(kakao.displayName()).isEqualTo("카카오");
        assertThat(users.social("kakao", Map.of("id", 1234567, "properties", Map.of("nickname", "fallback"))).id()).isEqualTo(kakao.id());
        assertThat(users.social("google", Map.of("sub", "missing-name")).displayName()).isEqualTo("사용자");
        assertThat(jdbc.queryForMap("SELECT * FROM app_user WHERE id = ?", google.id()).keySet())
                .containsExactlyInAnyOrder("id", "provider", "provider_user_id", "display_name", "created_at", "last_login_at");
    }
    @Test void recordsAreScopedOnSaveLatestAndHistory() throws Exception {
        var a = users.social("google", Map.of("sub", "scope-a", "name", "A"));
        var b = users.social("google", Map.of("sub", "scope-b", "name", "B"));
        var authA = new UsernamePasswordAuthenticationToken(a, null, List.of(new SimpleGrantedAuthority("ROLE_USER")));
        var authB = new UsernamePasswordAuthenticationToken(b, null, List.of(new SimpleGrantedAuthority("ROLE_USER")));
        jdbc.update("DELETE FROM checkin_food_recommendation WHERE checkin_id IN (SELECT id FROM wellness_checkin WHERE user_id IN (?, ?))", a.id(), b.id());
        jdbc.update("DELETE FROM checkin_music_recommendation WHERE checkin_id IN (SELECT id FROM wellness_checkin WHERE user_id IN (?, ?))", a.id(), b.id());
        jdbc.update("DELETE FROM wellness_checkin WHERE user_id IN (?, ?)", a.id(), b.id());
        mvc.perform(post("/api/check-ins").with(authentication(authA)).with(csrf()).contentType(MediaType.APPLICATION_JSON).content(INPUT)).andExpect(status().isCreated());
        mvc.perform(get("/api/check-ins/latest").with(authentication(authA))).andExpect(status().isOk());
        mvc.perform(get("/api/check-ins/latest").with(authentication(authB))).andExpect(status().isNotFound());
        mvc.perform(get("/api/check-ins/history").with(authentication(authB))).andExpect(jsonPath("$.items").isEmpty());
        mvc.perform(get("/api/check-ins/history").with(authentication(authA))).andExpect(jsonPath("$.items.length()").value(1));
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM wellness_checkin WHERE user_id = ?", Integer.class, a.id())).isEqualTo(1);
        mvc.perform(post("/api/check-ins").with(authentication(authB)).contentType(MediaType.APPLICATION_JSON).content(INPUT)).andExpect(status().isForbidden());
    }
}
