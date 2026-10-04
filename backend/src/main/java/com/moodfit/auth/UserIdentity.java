package com.moodfit.auth;

import java.io.Serializable;
import org.springframework.security.core.context.SecurityContextHolder;

public record UserIdentity(Long id, String displayName, String provider) implements Serializable, java.security.Principal {
    @Override @com.fasterxml.jackson.annotation.JsonIgnore
    public String getName() { return id.toString(); }
    public static UserIdentity from(AppUser user) {
        return new UserIdentity(user.getId(), user.getDisplayName(), user.getProvider());
    }
    public static UserIdentity current() {
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof UserIdentity identity)) {
            throw new org.springframework.security.authentication.AuthenticationCredentialsNotFoundException("Authentication required");
        }
        return identity;
    }
}
