package com.moodfit.auth;

import java.util.Map;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.env.MockEnvironment;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
class OAuthRedirectTests {
    @Autowired UserLoginService users;
    @Test void registeredUrisAreFixedAndUseMinimalScopes() {
        var environment = new MockEnvironment().withProperty("APP_PUBLIC_URL", "https://staging.moodfit.8949db.kr");
        environment.setProperty("GOOGLE_CLIENT_ID", "test-client");
        environment.setProperty("GOOGLE_CLIENT_SECRET", "test-client-value");
        environment.setProperty("KAKAO_CLIENT_ID", "test-client");
        environment.setProperty("KAKAO_CLIENT_SECRET", "test-client-value");
        var settings = new AuthSettings(environment);
        assertThat(settings.secure()).isTrue();
        assertThat(settings.registration("google").getRedirectUri()).isEqualTo("https://staging.moodfit.8949db.kr/api/auth/callback/google");
        assertThat(settings.registration("google").getScopes()).containsExactlyInAnyOrder("openid", "profile");
        assertThat(settings.registration("kakao").getScopes()).containsExactly("profile_nickname");
        assertThat(settings.registration("kakao").getClientAuthenticationMethod())
                .isEqualTo(org.springframework.security.oauth2.core.ClientAuthenticationMethod.CLIENT_SECRET_POST);
        environment.setProperty("GOOGLE_CLIENT_SECRET", "");
        assertThat(new AuthSettings(environment).providers()).containsExactly("kakao");
    }
    @Test void successUsesPublicLocationAndReplacesProviderAttributes() throws Exception {
        var settings = new AuthSettings(new MockEnvironment().withProperty("APP_PUBLIC_URL", "https://moodfit.8949db.kr"));
        for (String provider : List.of("google", "kakao")) {
            var request = new MockHttpServletRequest();
            request.setServerName("origin.staging.moodfit.8949db.kr");
            var response = new MockHttpServletResponse();
            Map<String, Object> attributes = provider.equals("google")
                    ? Map.of("sub", "handler-user", "name", "  Google  ", "email", "private@example.invalid")
                    : Map.of("id", 987654321, "properties", Map.of("nickname", "  Kakao  "));
            var principal = new DefaultOAuth2User(List.of(new SimpleGrantedAuthority("ROLE_USER")), attributes, provider.equals("google") ? "sub" : "id");
            try {
                AuthSecurityConfig.successHandler(settings, users, new HttpSessionSecurityContextRepository())
                        .onAuthenticationSuccess(request, response, new OAuth2AuthenticationToken(principal, principal.getAuthorities(), provider));
                assertThat(response.getRedirectedUrl()).isEqualTo("https://moodfit.8949db.kr/");
                assertThat(UserIdentity.current().provider()).isEqualTo(provider);
                var saved = (org.springframework.security.core.context.SecurityContext) request.getSession().getAttribute("SPRING_SECURITY_CONTEXT");
                assertThat(saved.getAuthentication().getPrincipal()).isInstanceOf(UserIdentity.class);
                assertThat(saved.getAuthentication().getCredentials()).isNull();
            } finally { SecurityContextHolder.clearContext(); }
        }
    }
    @Test void malformedIdentityUsesFixedFailureLocation() throws Exception {
        var settings = new AuthSettings(new MockEnvironment().withProperty("APP_PUBLIC_URL", "https://staging.moodfit.8949db.kr"));
        var principal = new DefaultOAuth2User(List.of(new SimpleGrantedAuthority("ROLE_USER")), Map.of("name", "missing id"), "name");
        var request = new MockHttpServletRequest();
        var response = new MockHttpServletResponse();
        AuthSecurityConfig.successHandler(settings, users, new HttpSessionSecurityContextRepository())
                .onAuthenticationSuccess(request, response, new OAuth2AuthenticationToken(principal, principal.getAuthorities(), "google"));
        assertThat(response.getRedirectedUrl()).isEqualTo("https://staging.moodfit.8949db.kr/login?error=oauth");
    }
}
