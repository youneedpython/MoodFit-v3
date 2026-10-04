package com.moodfit.insight;

import java.time.Duration;
import com.anthropic.bedrock.backends.BedrockMantleBackend;
import com.anthropic.bedrock.backends.BedrockBackend;
import com.anthropic.client.AnthropicClient;
import com.anthropic.client.okhttp.AnthropicOkHttpClient;
import com.anthropic.models.messages.ContentBlock;
import com.anthropic.models.messages.MessageCreateParams;
import com.anthropic.models.messages.Message;
import jakarta.annotation.PreDestroy;
import org.springframework.stereotype.Component;
import software.amazon.awssdk.auth.credentials.AwsCredentialsProvider;
import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.sts.StsClient;
import software.amazon.awssdk.services.sts.auth.StsAssumeRoleCredentialsProvider;
import software.amazon.awssdk.services.sts.model.AssumeRoleRequest;

@Component
public class BedrockInsightGenerator implements InsightGenerator {
    static final String SYSTEM = "당신은 웰니스 코치입니다. 주어진 Score와 상태를 바꾸거나 다시 계산하지 마세요. "
            + "진단, 치료, 약 권유를 하지 마세요. 목록 기호와 Markdown 없이 존댓말 문장으로만 쓰세요. "
            + "입력에 없는 사실을 지어내지 마세요. 수치가 걱정스러워도 전문가 상담을 가볍게 권하는 정도만 쓰세요. ";
    private final LlmSettings settings;
    private AnthropicClient client;
    private StsClient sts;
    private DefaultCredentialsProvider defaults;
    private StsAssumeRoleCredentialsProvider assumed;
    public BedrockInsightGenerator(LlmSettings settings) { this.settings = settings; }

    private synchronized AnthropicClient client() {
        if (!settings.enabled()) throw new IllegalStateException("LLM disabled");
        if (client == null) {
            try {
                var region = Region.of(settings.region());
                AwsCredentialsProvider provider;
                if (settings.role().isBlank()) {
                    defaults = DefaultCredentialsProvider.create();
                    provider = defaults;
                } else {
                    sts = StsClient.builder().region(region).build();
                    assumed = StsAssumeRoleCredentialsProvider.builder().stsClient(sts)
                            .refreshRequest(AssumeRoleRequest.builder().roleArn(settings.role()).roleSessionName("moodfit-llm").build()).build();
                    provider = assumed;
                }
                var builder = AnthropicOkHttpClient.builder();
                if ("mantle".equals(settings.endpoint())) {
                    builder.backend(BedrockMantleBackend.builder().awsCredentialsProvider(provider).region(region).build());
                } else {
                    builder.backend(BedrockBackend.builder().awsCredentialsProvider(provider).region(region).build());
                }
                client = builder.timeout(Duration.ofSeconds(20)).maxRetries(1).build();
            } catch (RuntimeException failure) {
                close();
                throw failure;
            }
        }
        return client;
    }
    @Override public String generate(String inputJson, boolean weekly) {
        var message = client().messages().create(MessageCreateParams.builder().model(settings.model())
                .maxTokens(2048L).system(SYSTEM + (weekly ? "리포트는 4 ~ 6문장으로 쓰세요." : "코멘트는 2 ~ 3문장에 실천 제안 1 ~ 2개를 담으세요."))
                .addUserMessage(inputJson).build());
        return responseText(message);
    }
    static String responseText(Message message) {
        String reason = message.stopReason().map(value -> value.asString()).orElse("");
        if ("refusal".equals(reason) || "max_tokens".equals(reason)) {
            throw new ResponseRejected(reason);
        }
        return message.content().stream().filter(ContentBlock::isText).findFirst().map(block -> block.asText().text()).orElse(null);
    }
    static final class ResponseRejected extends RuntimeException {
        private final String reason;
        ResponseRejected(String reason) { this.reason = reason; }
        String reason() { return reason; }
    }
    @PreDestroy public synchronized void close() {
        if (client != null) client.close();
        if (assumed != null) assumed.close();
        if (sts != null) sts.close();
        if (defaults != null) defaults.close();
        client = null;
        assumed = null;
        sts = null;
        defaults = null;
    }
}
