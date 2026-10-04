package com.moodfit.insight;

import org.junit.jupiter.api.Test;
import org.springframework.mock.env.MockEnvironment;
import static org.assertj.core.api.Assertions.*;

class LlmRuntimeTests {
    @Test void selectsRuntimeByDefaultAndOnlyExplicitMantleOverridesIt() {
        var environment = new MockEnvironment();
        var settings = new LlmSettings(environment);
        assertThat(settings.endpoint()).isEqualTo("runtime");
        for (String value : new String[]{"runtime", "", "unknown"}) {
            environment.setProperty("LLM_ENDPOINT", value);
            assertThat(settings.endpoint()).isEqualTo("runtime");
        }
        environment.setProperty("LLM_ENDPOINT", "mantle");
        assertThat(settings.endpoint()).isEqualTo("mantle");
    }

    @Test void masksIdentifiersAndFlattensControlsBeforeTruncation() {
        assertThat(InsightService.cleanFailureMessage("Account " + "123456" + "789012\r\narn:aws:bedrock:example\tfailed\u0000"))
                .isEqualTo("Account <acct>  <arn> failed ");
        assertThat(InsightService.cleanFailureMessage(null)).isEmpty();
        assertThat(InsightService.cleanFailureMessage("")).isEmpty();
        assertThat(InsightService.cleanFailureMessage(" \n\t")).isEmpty();
        assertThat(InsightService.cleanFailureMessage("x".repeat(310))).isEqualTo("x".repeat(300));
        String result = InsightService.cleanFailureMessage("🙂".repeat(301));
        assertThat(result.codePointCount(0, result.length())).isEqualTo(300);
        assertThat(InsightService.cleanFailureMessage("x".repeat(295) + "arn:aws:bedrock:example"))
                .isEqualTo("x".repeat(295) + "<arn>");
    }
}
