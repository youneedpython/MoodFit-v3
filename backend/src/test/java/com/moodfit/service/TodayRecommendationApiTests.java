package com.moodfit.service;

import com.moodfit.auth.*;
import java.nio.file.*;
import java.util.*;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest @AutoConfigureMockMvc
class TodayRecommendationApiTests {
    @Autowired MockMvc mvc;
    @Autowired JdbcTemplate jdbc;
    @Autowired UserLoginService users;
    @Autowired AccountDeletionService deletion;
    @Autowired RecommendationFeedbackService feedback;
    private final List<UserIdentity> fixtures = new ArrayList<>();
    private static final String PATH = "/api/recommendations/today";
    private UserIdentity social() {
        var user = users.social("google", Map.of("sub", UUID.randomUUID().toString(), "name", "Today test"));
        fixtures.add(user);
        return user;
    }
    @AfterEach void cleanup() { fixtures.forEach(deletion::delete); }
    private MockHttpServletRequestBuilder as(MockHttpServletRequestBuilder request, UserIdentity user) {
        return request.with(authentication(new UsernamePasswordAuthenticationToken(user, null, List.of(new SimpleGrantedAuthority("ROLE_USER")))));
    }
    private String result(UserIdentity user) throws Exception {
        return mvc.perform(as(get(PATH).param("temperature", "19.0").param("weather", "RAIN"), user))
                .andExpect(status().isOk()).andExpect(jsonPath("$.foods.length()").value(2)).andExpect(jsonPath("$.music.length()").value(2))
                .andReturn().getResponse().getContentAsString(java.nio.charset.StandardCharsets.UTF_8);
    }
    @Test void authenticatedGetNeedsNoCsrfMatchesContractAndDoesNotWriteDomainRows() throws Exception {
        var user = social();
        var tables = List.of("wellness_checkin", "checkin_food_recommendation", "checkin_music_recommendation", "recommendation_feedback", "app_user");
        var before = tables.stream().map(table -> jdbc.queryForObject("SELECT COUNT(*) FROM " + table, Long.class)).toList();
        var mapper = new tools.jackson.databind.ObjectMapper();
        var actual = mapper.readTree(result(user));
        assertThat(result(user)).isEqualTo(actual.toString());
        var example = mapper.readTree(Files.readString(Path.of("../contracts/recommendations-today-200.json")));
        assertThat(actual.properties().stream().map(Map.Entry::getKey).toList()).containsExactlyInAnyOrderElementsOf(example.properties().stream().map(Map.Entry::getKey).toList());
        assertThat(actual.get("context").get("code").asText()).isEqualTo("RAIN");
        for (String kind : List.of("foods", "music")) {
            for (var item : actual.get(kind)) {
                assertThat(item.properties().stream().map(Map.Entry::getKey).toList()).containsExactlyInAnyOrderElementsOf(example.get(kind).get(0).properties().stream().map(Map.Entry::getKey).toList());
                for (var field : item.properties()) assertThat(field.getValue().isTextual()).isTrue();
            }
        }
        assertThat(tables.stream().map(table -> jdbc.queryForObject("SELECT COUNT(*) FROM " + table, Long.class)).toList()).isEqualTo(before);
        result(users.guest());
    }
    @Test void validationAndAnonymousErrorsHaveFieldErrors() throws Exception {
        mvc.perform(get(PATH).param("temperature", "19.0").param("weather", "RAIN")).andExpect(status().isUnauthorized());
        var user = social();
        for (String value : List.of("-30.1", "50.1", "5.12", "bad", "", "NaN")) {
            mvc.perform(as(get(PATH).param("temperature", value).param("weather", "RAIN"), user)).andExpect(status().isBadRequest()).andExpect(jsonPath("$.fieldErrors.temperature").isString());
        }
        mvc.perform(as(get(PATH).param("temperature", "19.0").param("weather", "BAD"), user)).andExpect(status().isBadRequest()).andExpect(jsonPath("$.fieldErrors.weather").isString());
        mvc.perform(as(get(PATH).param("temperature", "19.0"), user)).andExpect(status().isBadRequest()).andExpect(jsonPath("$.fieldErrors.weather").isString());
        mvc.perform(as(get(PATH).param("weather", "RAIN"), user)).andExpect(status().isBadRequest()).andExpect(jsonPath("$.fieldErrors.temperature").isString());
        mvc.perform(as(get(PATH), user)).andExpect(status().isBadRequest()).andExpect(content().json(Files.readString(Path.of("../contracts/recommendations-today-400.json"))));
    }
    @Test void otherUsersFeedbackDoesNotChangeResponseAndOwnFeedbackDoes() throws Exception {
        var own = social(); var other = social();
        var mapper = new tools.jackson.databind.ObjectMapper();
        String before = result(own);
        String item = mapper.readTree(before).get("foods").get(0).get("name").asText();
        feedback.put(other, RecommendationFeedbackService.Kind.FOOD, item, RecommendationFeedbackService.Rating.DISLIKE);
        assertThat(result(own)).isEqualTo(before);
        feedback.put(own, RecommendationFeedbackService.Kind.FOOD, item, RecommendationFeedbackService.Rating.DISLIKE);
        assertThat(result(own)).isNotEqualTo(before);
    }
}
