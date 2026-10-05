package com.moodfit.auth;

import java.io.IOException;
import java.util.List;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClient;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.oauth2.client.web.OAuth2AuthorizedClientRepository;
import org.springframework.security.oauth2.client.web.DefaultOAuth2AuthorizationRequestResolver;
import org.springframework.security.oauth2.client.web.OAuth2AuthorizationRequestResolver;
import org.springframework.security.oauth2.core.endpoint.OAuth2AuthorizationRequest;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import org.springframework.security.web.csrf.CsrfTokenRequestAttributeHandler;
import org.springframework.session.jdbc.config.annotation.web.http.EnableJdbcHttpSession;
import org.springframework.session.web.http.CookieSerializer;
import org.springframework.session.web.http.DefaultCookieSerializer;

@Configuration
@EnableJdbcHttpSession(maxInactiveIntervalInSeconds = 604800)
public class AuthSecurityConfig {
    @Bean
    CookieSerializer cookieSerializer(AuthSettings settings) {
        var serializer = new DefaultCookieSerializer();
        serializer.setUseHttpOnlyCookie(true);
        serializer.setUseSecureCookie(settings.secure());
        serializer.setSameSite("Lax");
        serializer.setCookiePath("/");
        return serializer;
    }
    @Bean
    CookieCsrfTokenRepository csrfRepository(AuthSettings settings) {
        var repository = CookieCsrfTokenRepository.withHttpOnlyFalse();
        repository.setCookieCustomizer(cookie -> cookie.path("/").secure(settings.secure()).sameSite("Lax"));
        return repository;
    }
    @Bean
    ClientRegistrationRepository clientRegistrations(AuthSettings settings) {
        return settings::registration;
    }
    @Bean
    HttpSessionSecurityContextRepository sessionContexts() {
        return new HttpSessionSecurityContextRepository();
    }
    @Bean
    SecurityFilterChain security(HttpSecurity http, AuthSettings settings, UserLoginService users,
            CookieCsrfTokenRepository csrfRepository, HttpSessionSecurityContextRepository contexts) throws Exception {
        http.authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/auth/account").authenticated()
                .requestMatchers("/actuator/health", "/actuator/health/**", "/api/auth/**").permitAll()
                .requestMatchers("/api/check-ins", "/api/check-ins/**", "/api/reports/**", "/api/recommendations/feedback", "/api/recommendations/today").authenticated()
                .anyRequest().permitAll());
        http.csrf(csrf -> csrf.csrfTokenRepository(csrfRepository)
                .csrfTokenRequestHandler(new CsrfTokenRequestAttributeHandler()));
        http.securityContext(context -> context.securityContextRepository(contexts));
        http.requestCache(cache -> cache.disable());
        http.logout(logout -> logout.logoutUrl("/api/auth/logout")
                .logoutSuccessHandler((request, response, authentication) -> response.setStatus(204)));
        http.exceptionHandling(errors -> errors
                .authenticationEntryPoint((request, response, failure) -> error(response, 401, "UNAUTHENTICATED", "로그인이 필요합니다."))
                .accessDeniedHandler((request, response, failure) -> error(response, 403, "FORBIDDEN", "요청을 허용할 수 없습니다.")));
        if (!settings.providers().isEmpty()) {
            var resolver = new DefaultOAuth2AuthorizationRequestResolver(settings::registration, "/api/auth/login");
            http.oauth2Login(oauth -> oauth
                    .authorizationEndpoint(endpoint -> endpoint.baseUri("/api/auth/login").authorizationRequestResolver(new OAuth2AuthorizationRequestResolver() {
                        public OAuth2AuthorizationRequest resolve(HttpServletRequest request) {
                            String path = request.getServletPath();
                            String provider = path.substring(path.lastIndexOf('/') + 1);
                            return settings.registration(provider) == null ? null : resolver.resolve(request);
                        }
                        public OAuth2AuthorizationRequest resolve(HttpServletRequest request, String provider) {
                            return settings.registration(provider) == null ? null : resolver.resolve(request, provider);
                        }
                    }))
                    .redirectionEndpoint(endpoint -> endpoint.baseUri("/api/auth/callback/*"))
                    .authorizedClientRepository(new DiscardAuthorizedClients())
                    .successHandler(successHandler(settings, users, contexts))
                    .failureHandler((request, response, failure) -> response.sendRedirect(settings.publicUrl() + "/login?error=oauth")));
        }
        return http.build();
    }
    static org.springframework.security.web.authentication.AuthenticationSuccessHandler successHandler(
            AuthSettings settings, UserLoginService users, HttpSessionSecurityContextRepository contexts) {
        return (request, response, authentication) -> {
            try {
                var social = (OAuth2AuthenticationToken) authentication;
                UserIdentity identity = users.social(social.getAuthorizedClientRegistrationId(), social.getPrincipal().getAttributes());
                authenticate(identity, request, response, contexts);
                response.sendRedirect(settings.publicUrl() + "/");
            } catch (RuntimeException failure) {
                if (request.getSession(false) != null) request.getSession(false).invalidate();
                SecurityContextHolder.clearContext();
                response.sendRedirect(settings.publicUrl() + "/login?error=oauth");
            }
        };
    }
    static void authenticate(UserIdentity identity, HttpServletRequest request, HttpServletResponse response,
            HttpSessionSecurityContextRepository contexts) {
        request.getSession();
        request.changeSessionId();
        var context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(new UsernamePasswordAuthenticationToken(identity, null, List.of(new SimpleGrantedAuthority("ROLE_USER"))));
        SecurityContextHolder.setContext(context);
        contexts.saveContext(context, request, response);
    }
    static void error(HttpServletResponse response, int status, String code, String message) throws IOException {
        response.setStatus(status);
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        response.getWriter().write("{\"code\":\"" + code + "\",\"message\":\"" + message + "\",\"fieldErrors\":{}}");
    }
    // Provider credentials and responses are used during the handshake only, never stored in JDBC sessions.
    private static class DiscardAuthorizedClients implements OAuth2AuthorizedClientRepository {
        public <T extends OAuth2AuthorizedClient> T loadAuthorizedClient(String id, Authentication authentication, HttpServletRequest request) { return null; }
        public void saveAuthorizedClient(OAuth2AuthorizedClient client, Authentication authentication, HttpServletRequest request, HttpServletResponse response) {}
        public void removeAuthorizedClient(String id, Authentication authentication, HttpServletRequest request, HttpServletResponse response) {}
    }
}
