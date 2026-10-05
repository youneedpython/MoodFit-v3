package com.moodfit.service;

import com.moodfit.auth.*;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.*;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import static org.assertj.core.api.Assertions.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_CLASS)
public abstract class RecommendationFeedbackAssertions {
    @Autowired protected MockMvc mvc;
    @Autowired protected JdbcTemplate jdbc;
    @Autowired protected UserLoginService users;
    @Autowired protected AccountDeletionService deletion;
    private final List<UserIdentity> fixtures = new ArrayList<>();
    private final List<Long> guestCheckins = new ArrayList<>();
    private static final String PATH = "/api/recommendations/feedback";
    private UserIdentity social() {
        var identity = users.social("google", Map.of("sub", UUID.randomUUID().toString(), "name", "피드백 테스트"));
        fixtures.add(identity); return identity;
    }
    @AfterEach public void cleanup() {
        jdbc.update("DELETE FROM recommendation_feedback WHERE user_id = 1");
        for (var id : guestCheckins) {
            jdbc.update("DELETE FROM checkin_food_recommendation WHERE checkin_id = ?", id);
            jdbc.update("DELETE FROM checkin_music_recommendation WHERE checkin_id = ?", id);
            jdbc.update("DELETE FROM wellness_checkin WHERE id = ?", id);
        }
        for (var user : fixtures) if (jdbc.queryForObject("SELECT COUNT(*) FROM app_user WHERE id = ?", Integer.class, user.id()) > 0) deletion.delete(user);
    }
    private MockHttpServletRequestBuilder as(MockHttpServletRequestBuilder request, UserIdentity user) {
        return request.with(authentication(new UsernamePasswordAuthenticationToken(user, null, List.of(new SimpleGrantedAuthority("ROLE_USER")))));
    }
    private MockHttpServletRequestBuilder withCsrf(MockHttpServletRequestBuilder request) throws Exception {
        var cookie = mvc.perform(get("/api/auth/me")).andReturn().getResponse().getCookie("XSRF-TOKEN");
        assertThat(cookie).isNotNull();
        return request.cookie(cookie).header("X-XSRF-TOKEN", cookie.getValue());
    }
    private MockHttpServletRequestBuilder write(UserIdentity user, String input) throws Exception {
        return withCsrf(as(put(PATH), user).contentType(MediaType.APPLICATION_JSON).content(input));
    }
    private String fixture(String name) throws Exception { return Files.readString(Path.of("../contracts/" + name + ".json")); }
    @Test public void savesReplacesDeletesAndSeparatesUsers() throws Exception {
        var own = social(); var other = social();
        var example = new tools.jackson.databind.ObjectMapper().readTree(fixture("recommendation-feedback-put-204"));
        assertThat(example.get("method").asText()).isEqualTo("PUT");
        assertThat(example.get("path").asText()).isEqualTo(PATH);
        mvc.perform(write(own, example.get("request").toString())).andExpect(status().is(example.get("status").asInt())).andExpect(content().string(""));
        mvc.perform(as(get(PATH), own)).andExpect(content().json(fixture("recommendation-feedback-200")));
        mvc.perform(as(get(PATH), other)).andExpect(jsonPath("$.enabled").value(true)).andExpect(jsonPath("$.items").isEmpty());
        mvc.perform(write(own, """
            {"kind":"FOOD","item":"  연어 샐러드  ","rating":"DISLIKE"}
            """)).andExpect(status().isNoContent());
        mvc.perform(as(get(PATH), own)).andExpect(jsonPath("$.items.length()").value(1)).andExpect(jsonPath("$.items[0].rating").value("DISLIKE"));
        assertThat(jdbc.queryForObject("SELECT updated_at FROM recommendation_feedback WHERE user_id = ?", java.sql.Timestamp.class, own.id())).isNotNull();
        mvc.perform(write(own, """
            {"kind":"FOOD","item":"연어 샐러드","rating":null}
            """)).andExpect(status().isNoContent());
        mvc.perform(as(get(PATH), own)).andExpect(jsonPath("$.items").isEmpty());
    }
    @Test public void validatesPoolAndEnumsAndItem() throws Exception {
        var own = social();
        for (String input : List.of(
                "{\"kind\":\"UNKNOWN\",\"item\":\"연어 샐러드\",\"rating\":\"LIKE\"}",
                "{\"kind\":\"FOOD\",\"item\":\"연어 샐러드\",\"rating\":\"UNKNOWN\"}",
                "{\"kind\":null,\"item\":\"연어 샐러드\",\"rating\":\"LIKE\"}",
                "{\"kind\":\"FOOD\",\"item\":\"arbitrary\",\"rating\":\"LIKE\"}",
                "{\"kind\":\"MUSIC\",\"item\":\"연어 샐러드\",\"rating\":\"LIKE\"}",
                "{\"kind\":\"FOOD\",\"item\":null,\"rating\":\"LIKE\"}",
                "{\"kind\":\"FOOD\",\"item\":\"   \",\"rating\":\"LIKE\"}",
                "{\"kind\":\"FOOD\",\"item\":\"연어\\u0000샐러드\",\"rating\":\"LIKE\"}",
                "{\"kind\":\"FOOD\",\"item\":\"" + "a".repeat(121) + "\",\"rating\":\"LIKE\"}")) {
            mvc.perform(write(own, input)).andExpect(status().isBadRequest()).andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
        }
        mvc.perform(write(own, "{\"kind\":\"MUSIC\",\"item\":\"gdZLi9oWNZg\",\"rating\":\"LIKE\"}"))
                .andExpect(status().isNoContent());
    }
    @Test public void guestSavesReplacesDeletesAndRemainsSeparateFromSocial() throws Exception {
        var guest = users.guest(); var own = social();
        String input = "{\"kind\":\"FOOD\",\"item\":\"연어 샐러드\",\"rating\":\"LIKE\"}";
        mvc.perform(as(get(PATH), guest)).andExpect(content().json(fixture("recommendation-feedback-guest-200")));
        mvc.perform(write(guest, input)).andExpect(status().isNoContent());
        mvc.perform(as(get(PATH), users.guest())).andExpect(jsonPath("$.enabled").value(true))
                .andExpect(jsonPath("$.shared").value(true)).andExpect(jsonPath("$.items[0].rating").value("LIKE"));
        mvc.perform(as(get(PATH), own)).andExpect(jsonPath("$.shared").value(false)).andExpect(jsonPath("$.items").isEmpty());
        mvc.perform(write(own, input)).andExpect(status().isNoContent());
        mvc.perform(write(guest, input.replace("LIKE", "DISLIKE"))).andExpect(status().isNoContent());
        mvc.perform(as(get(PATH), guest)).andExpect(jsonPath("$.items.length()").value(1))
                .andExpect(jsonPath("$.items[0].rating").value("DISLIKE"));
        mvc.perform(as(get(PATH), own)).andExpect(jsonPath("$.items[0].rating").value("LIKE"));
        mvc.perform(withCsrf(as(delete("/api/auth/account"), guest))).andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("GUEST_ACCOUNT_DELETION_FORBIDDEN"));
        mvc.perform(as(get(PATH), guest)).andExpect(jsonPath("$.items[0].rating").value("DISLIKE"));
        mvc.perform(write(guest, input.replace("\"LIKE\"", "null"))).andExpect(status().isNoContent());
        mvc.perform(as(get(PATH), guest)).andExpect(content().json(fixture("recommendation-feedback-guest-200")));
        mvc.perform(as(get(PATH), own)).andExpect(jsonPath("$.items[0].rating").value("LIKE"));
    }
    @Test public void deniesAnonymousAndMissingCsrf() throws Exception {
        var guest = users.guest(); var own = social();
        String input = "{\"kind\":\"FOOD\",\"item\":\"연어 샐러드\",\"rating\":\"LIKE\"}";
        mvc.perform(get(PATH)).andExpect(status().isUnauthorized());
        mvc.perform(withCsrf(put(PATH).contentType(MediaType.APPLICATION_JSON).content(input))).andExpect(status().isUnauthorized());
        mvc.perform(as(put(PATH).contentType(MediaType.APPLICATION_JSON).content(input), own)).andExpect(status().isForbidden());
        mvc.perform(as(put(PATH).contentType(MediaType.APPLICATION_JSON).content(input), guest)).andExpect(status().isForbidden());
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM recommendation_feedback WHERE user_id = 1", Integer.class)).isZero();
    }
    private String create(UserIdentity user) throws Exception {
        String body = mvc.perform(withCsrf(as(post("/api/check-ins"), user).contentType(MediaType.APPLICATION_JSON).content("""
            {"heartRate":68,"respiratoryRate":18,"sleepScore":86,"stressLevel":31,"energyLevel":74,"temperature":19.0,"weather":"RAIN"}
            """))).andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        if (user.id() == 1L) guestCheckins.add(new tools.jackson.databind.ObjectMapper().readTree(body).get("id").asLong());
        return body;
    }
    @Test public void guestFeedbackAffectsNextCheckinWithSameRulesAsSocial() throws Exception {
        var guest = users.guest(); var own = social();
        var mapper = new tools.jackson.databind.ObjectMapper();
        var original = mapper.readTree(create(guest));
        var socialOriginal = mapper.readTree(create(own));
        assertThat(original.get("foods")).isEqualTo(socialOriginal.get("foods"));
        assertThat(original.get("music")).isEqualTo(socialOriginal.get("music"));
        String dislikedFood = original.get("foods").get(0).get("name").asText();
        String likedFood = original.get("foods").get(2).get("name").asText();
        String dislikedMusic = original.get("music").get(0).get("videoId").asText();
        String likedMusic = original.get("music").get(2).get("videoId").asText();
        for (var user : List.of(guest, own)) {
            for (var entry : List.of(
                    Map.of("kind", "FOOD", "item", dislikedFood, "rating", "DISLIKE"),
                    Map.of("kind", "FOOD", "item", likedFood, "rating", "LIKE"),
                    Map.of("kind", "MUSIC", "item", dislikedMusic, "rating", "DISLIKE"),
                    Map.of("kind", "MUSIC", "item", likedMusic, "rating", "LIKE"))) {
                mvc.perform(write(user, mapper.writeValueAsString(entry))).andExpect(status().isNoContent());
            }
        }
        var next = mapper.readTree(create(guest));
        var socialNext = mapper.readTree(create(own));
        assertThat(next.get("foods")).isEqualTo(socialNext.get("foods"));
        assertThat(next.get("music")).isEqualTo(socialNext.get("music"));
        assertThat(next.get("foods").toString()).doesNotContain(dislikedFood);
        assertThat(next.get("music").toString()).doesNotContain(dislikedMusic);
        assertThat(next.get("foods").get(0).get("name").asText()).isEqualTo(likedFood);
        assertThat(next.get("music").get(0).get("videoId").asText()).isEqualTo(likedMusic);
        assertThat(next.get("foods").size()).isEqualTo(5);
        assertThat(next.get("music").size()).isEqualTo(5);
        assertThat(jdbc.queryForObject("SELECT name FROM checkin_food_recommendation WHERE checkin_id = ? AND position = 0",
                String.class, original.get("id").asLong())).isEqualTo(dislikedFood);
    }
    @Test public void affectsOnlyNextCheckinAndDeletesOnlyOwnFeedback() throws Exception {
        var own = social(); var other = social();
        var mapper = new tools.jackson.databind.ObjectMapper();
        var original = mapper.readTree(create(own));
        String firstFood = original.get("foods").get(0).get("name").asText();
        mvc.perform(write(own, mapper.writeValueAsString(Map.of("kind", "FOOD", "item", firstFood, "rating", "DISLIKE")))).andExpect(status().isNoContent());
        var next = mapper.readTree(create(own));
        assertThat(next.get("foods").toString()).doesNotContain(firstFood);
        assertThat(next.get("foods").size()).isEqualTo(5);
        assertThat(next.get("music")).isEqualTo(original.get("music"));
        assertThat(mapper.readTree(create(other)).get("foods")).isEqualTo(original.get("foods"));
        mvc.perform(write(other, "{\"kind\":\"FOOD\",\"item\":\"연어 샐러드\",\"rating\":\"LIKE\"}")).andExpect(status().isNoContent());
        String saved = jdbc.queryForObject("SELECT name FROM checkin_food_recommendation WHERE checkin_id = ? AND position = 0", String.class, original.get("id").asLong());
        assertThat(saved).isEqualTo(firstFood);
        mvc.perform(withCsrf(as(delete("/api/auth/account"), own))).andExpect(status().isNoContent());
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM recommendation_feedback WHERE user_id = ?", Integer.class, own.id())).isZero();
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM recommendation_feedback WHERE user_id = ?", Integer.class, other.id())).isEqualTo(1);
    }
}
