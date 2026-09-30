package com.moodfit.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

@Embeddable
public class MusicRecommendationValue {

    @Column(nullable = false, length = 100)
    private String title;

    @Column(nullable = false, length = 100)
    private String artist;

    @Column(nullable = false, length = 50)
    private String tag;

    @Column(nullable = false, length = 300)
    private String reason;

    protected MusicRecommendationValue() {
    }

    public MusicRecommendationValue(String title, String artist, String tag, String reason) {
        this.title = title;
        this.artist = artist;
        this.tag = tag;
        this.reason = reason;
    }

    public String getTitle() {
        return title;
    }

    public String getArtist() {
        return artist;
    }

    public String getTag() {
        return tag;
    }

    public String getReason() {
        return reason;
    }
}
