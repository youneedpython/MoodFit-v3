package com.moodfit.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

@Embeddable
public class FoodRecommendationValue {

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false, length = 50)
    private String tag;

    @Column(nullable = false, length = 300)
    private String reason;

    protected FoodRecommendationValue() {
    }

    public FoodRecommendationValue(String name, String tag, String reason) {
        this.name = name;
        this.tag = tag;
        this.reason = reason;
    }

    public String getName() {
        return name;
    }

    public String getTag() {
        return tag;
    }

    public String getReason() {
        return reason;
    }
}
