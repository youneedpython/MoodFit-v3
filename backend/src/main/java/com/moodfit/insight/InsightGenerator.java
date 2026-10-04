package com.moodfit.insight;

/** Input is an explicit numeric/weather/rule-result projection, never an entity or identity. */
public interface InsightGenerator {
    String generate(String inputJson, boolean weekly);
}
