package com.moodfit.auth;

import java.util.Map;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserLoginService {
    private final AppUserRepository users;
    public UserLoginService(AppUserRepository users) { this.users = users; }
    @Transactional
    public UserIdentity guest() {
        var user = users.findById(1L).orElseThrow();
        user.login("체험 계정");
        return UserIdentity.from(user);
    }
    @Transactional
    public UserIdentity social(String provider, Map<String, Object> attributes) {
        Object number;
        Object name;
        if ("google".equals(provider)) {
            number = attributes.get("sub");
            name = attributes.get("name");
        } else if ("kakao".equals(provider)) {
            number = attributes.get("id");
            name = nested(nested(attributes.get("kakao_account"), "profile"), "nickname");
            if (!(name instanceof String text) || text.isBlank()) {
                name = nested(attributes.get("properties"), "nickname");
            }
        } else {
            throw new IllegalArgumentException("Unsupported provider");
        }
        if (number == null || number.toString().isBlank()) {
            throw new IllegalArgumentException("Missing provider identity");
        }
        String cleaned = cleanName(name);
        var user = users.findByProviderAndProviderUserId(provider, number.toString())
                .orElseGet(() -> new AppUser(provider, number.toString(), cleaned));
        user.login(cleaned);
        return UserIdentity.from(users.saveAndFlush(user));
    }
    private Object nested(Object value, String field) {
        return value instanceof Map<?, ?> map ? map.get(field) : null;
    }
    static String cleanName(Object value) {
        String result = value instanceof String text ? text.strip() : "";
        if (result.isBlank()) return "사용자";
        int count = result.codePointCount(0, result.length());
        return result.substring(0, result.offsetByCodePoints(0, Math.min(40, count)));
    }
}
