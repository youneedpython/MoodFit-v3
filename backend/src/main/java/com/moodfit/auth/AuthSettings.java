package com.moodfit.auth;

import java.net.URI;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;
import org.springframework.security.oauth2.client.registration.ClientRegistration;
import org.springframework.security.oauth2.core.AuthorizationGrantType;
import org.springframework.security.oauth2.core.ClientAuthenticationMethod;

@Component
public class AuthSettings {
    private final String publicUrl;
    private final boolean guestEnabled;
    private final Map<String, ClientRegistration> registrations = new LinkedHashMap<>();
    public AuthSettings(Environment environment) {
        publicUrl = environment.getProperty("APP_PUBLIC_URL", "http://localhost:5173").replaceAll("/+$", "");
        URI uri = URI.create(publicUrl);
        if (!("http".equals(uri.getScheme()) || "https".equals(uri.getScheme()))
                || uri.getHost() == null || uri.getUserInfo() != null || uri.getQuery() != null
                || uri.getFragment() != null || !(uri.getPath().isEmpty() || "/".equals(uri.getPath()))) {
            throw new IllegalArgumentException("APP_PUBLIC_URL must be an HTTP origin");
        }
        guestEnabled = environment.getProperty("AUTH_GUEST_ENABLED", Boolean.class, true);
        add(environment, "google");
        add(environment, "kakao");
    }
    private void add(Environment environment, String provider) {
        String prefix = provider.toUpperCase(java.util.Locale.ROOT);
        if (!has(environment.getProperty(prefix + "_CLIENT_ID"))
                || !has(environment.getProperty(prefix + "_CLIENT_SECRET"))) return;
        var builder = ClientRegistration.withRegistrationId(provider)
                .clientId(environment.getProperty(prefix + "_CLIENT_ID"))
                .clientSecret(environment.getProperty(prefix + "_CLIENT_SECRET"))
                .authorizationGrantType(AuthorizationGrantType.AUTHORIZATION_CODE)
                .redirectUri(publicUrl + "/api/auth/callback/" + provider)
                .clientName(provider);
        if ("google".equals(provider)) {
            builder.clientAuthenticationMethod(ClientAuthenticationMethod.CLIENT_SECRET_BASIC)
                    .scope("openid", "profile")
                    .authorizationUri("https://accounts.google.com/o/oauth2/v2/auth")
                    .tokenUri("https://oauth2.googleapis.com/token")
                    .jwkSetUri("https://www.googleapis.com/oauth2/v3/certs")
                    .issuerUri("https://accounts.google.com")
                    .userInfoUri("https://openidconnect.googleapis.com/v1/userinfo")
                    .userNameAttributeName("sub");
        } else {
            builder.clientAuthenticationMethod(ClientAuthenticationMethod.CLIENT_SECRET_POST)
                    .scope("profile_nickname")
                    .authorizationUri("https://kauth.kakao.com/oauth/authorize")
                    .tokenUri("https://kauth.kakao.com/oauth/token")
                    .userInfoUri("https://kapi.kakao.com/v2/user/me")
                    .userNameAttributeName("id");
        }
        registrations.put(provider, builder.build());
    }
    private boolean has(String value) { return value != null && !value.isBlank(); }
    public String publicUrl() { return publicUrl; }
    public boolean secure() { return publicUrl.startsWith("https://"); }
    public boolean guestEnabled() { return guestEnabled; }
    public List<String> providers() { return List.copyOf(registrations.keySet()); }
    public ClientRegistration registration(String provider) { return registrations.get(provider); }
}
