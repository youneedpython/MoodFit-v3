package com.moodfit.auth;

import java.util.List;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;

public final class GuestRequests {
    private GuestRequests() {}
    private static MockHttpServletRequestBuilder signedIn(MockHttpServletRequestBuilder request) {
        return request.with(authentication(new UsernamePasswordAuthenticationToken(
                new UserIdentity(1L, "체험 계정", "guest"), null, List.of(new SimpleGrantedAuthority("ROLE_USER")))));
    }
    public static MockHttpServletRequestBuilder get(String path, Object... args) {
        return signedIn(MockMvcRequestBuilders.get(path, args));
    }
    public static MockHttpServletRequestBuilder post(String path, Object... args) {
        return signedIn(MockMvcRequestBuilders.post(path, args)).with(csrf());
    }
}
