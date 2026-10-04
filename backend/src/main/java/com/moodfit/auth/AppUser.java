package com.moodfit.auth;

import java.time.Instant;
import jakarta.persistence.*;

@Entity
@Table(name = "app_user", uniqueConstraints = @UniqueConstraint(columnNames = {"provider", "provider_user_id"}))
public class AppUser {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false, length = 10)
    private String provider;
    @Column(name = "provider_user_id", nullable = false)
    private String providerUserId;
    @Column(name = "display_name", nullable = false, length = 40)
    private String displayName;
    @Column(name = "created_at", nullable = false)
    @Convert(converter = com.moodfit.entity.InstantUtcLocalDateTimeConverter.class)
    private Instant createdAt;
    @Column(name = "last_login_at", nullable = false)
    @Convert(converter = com.moodfit.entity.InstantUtcLocalDateTimeConverter.class)
    private Instant lastLoginAt;
    protected AppUser() {}
    public AppUser(String provider, String providerUserId, String displayName) {
        this.provider = provider;
        this.providerUserId = providerUserId;
        this.createdAt = Instant.now();
        login(displayName);
    }
    public void login(String name) {
        displayName = name;
        lastLoginAt = Instant.now();
    }
    public Long getId() { return id; }
    public String getProvider() { return provider; }
    public String getDisplayName() { return displayName; }
}
