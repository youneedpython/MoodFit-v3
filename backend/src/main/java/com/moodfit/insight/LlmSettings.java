package com.moodfit.insight;

import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

@Component
public class LlmSettings {
    private final Environment environment;
    public LlmSettings(Environment environment) { this.environment = environment; }
    public boolean enabled() { return "true".equalsIgnoreCase(environment.getProperty("LLM_ENABLED", "false")); }
    public String model() { return environment.getProperty("LLM_MODEL_ID", "anthropic.claude-sonnet-5-5"); }
    public String region() { return environment.getProperty("LLM_REGION", "ap-northeast-2"); }
    public String role() { return environment.getProperty("LLM_ROLE_ARN", ""); }
    public int limit(boolean weekly) {
        return Math.max(0, environment.getProperty(weekly ? "LLM_DAILY_REPORT_LIMIT" : "LLM_DAILY_INSIGHT_LIMIT", Integer.class, weekly ? 2 : 10));
    }
}
