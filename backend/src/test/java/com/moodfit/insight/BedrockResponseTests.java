package com.moodfit.insight;

import java.util.*;
import com.anthropic.models.messages.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.boot.test.system.CapturedOutput;
import org.springframework.boot.test.system.OutputCaptureExtension;
import static org.mockito.Mockito.*;
import static org.assertj.core.api.Assertions.*;

@ExtendWith(OutputCaptureExtension.class)
class BedrockResponseTests {
    @Test void refusesTruncatedRefusedAndEmptyResponsesAndUsesOnlyFirstText(CapturedOutput output) {
        var message = mock(Message.class);
        var block = mock(ContentBlock.class);
        var text = mock(TextBlock.class);
        when(block.isText()).thenReturn(true);
        when(block.asText()).thenReturn(text);
        when(text.text()).thenReturn("첫 문장");
        when(message.content()).thenReturn(List.of(block, block));
        when(message.stopReason()).thenReturn(Optional.of(StopReason.REFUSAL));
        assertThatThrownBy(() -> BedrockInsightGenerator.responseText(message))
                .isInstanceOf(BedrockInsightGenerator.ResponseRejected.class);
        when(message.stopReason()).thenReturn(Optional.of(StopReason.MAX_TOKENS));
        assertThatThrownBy(() -> BedrockInsightGenerator.responseText(message))
                .isInstanceOf(BedrockInsightGenerator.ResponseRejected.class);
        assertThat(output.getOut()).doesNotContain("LLM generation failure", "첫 문장");
        when(message.stopReason()).thenReturn(Optional.of(StopReason.END_TURN));
        assertThat(BedrockInsightGenerator.responseText(message)).isEqualTo("첫 문장");
        when(message.content()).thenReturn(List.of());
        assertThat(BedrockInsightGenerator.responseText(message)).isNull();
    }
}
