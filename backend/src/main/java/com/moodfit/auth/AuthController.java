package com.moodfit.auth;

import java.util.List;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final AuthSettings settings;
    private final UserLoginService users;
    private final HttpSessionSecurityContextRepository contexts;
    private final CookieCsrfTokenRepository csrfRepository;
    public AuthController(AuthSettings settings, UserLoginService users, HttpSessionSecurityContextRepository contexts,
            CookieCsrfTokenRepository csrfRepository) {
        this.settings = settings; this.users = users; this.contexts = contexts; this.csrfRepository = csrfRepository;
    }
    @GetMapping("/me")
    public AuthResponse me(Authentication authentication, HttpServletRequest request, HttpServletResponse response) {
        CsrfToken csrf = csrfRepository.loadToken(request);
        if (csrf == null) csrf = csrfRepository.generateToken(request);
        // Explicitly issue the cookie on every bootstrap, including after login/logout clears it.
        csrfRepository.saveToken(csrf, request, response);
        UserIdentity user = authentication != null && authentication.getPrincipal() instanceof UserIdentity identity ? identity : null;
        return new AuthResponse(user != null, user, settings.providers(), settings.guestEnabled());
    }
    @PostMapping("/guest")
    public ResponseEntity<Void> guest(HttpServletRequest request, HttpServletResponse response) {
        if (!settings.guestEnabled()) return ResponseEntity.notFound().build();
        AuthSecurityConfig.authenticate(users.guest(), request, response, contexts);
        csrfRepository.saveToken(null, request, response);
        return ResponseEntity.noContent().build();
    }
    // Configured login/callback requests are intercepted by OAuth filters; absent providers return 404.
    @GetMapping({"/login/{provider}", "/callback/{provider}"})
    public ResponseEntity<Void> unavailable() { return ResponseEntity.notFound().build(); }
    public record AuthResponse(boolean authenticated, UserIdentity user, List<String> providers, boolean guestEnabled) {}
}
