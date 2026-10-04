package com.moodfit.insight;

import java.nio.file.*;
import com.moodfit.auth.GuestRequests;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import tools.jackson.databind.ObjectMapper;
import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class DisabledInsightTests {
    @Autowired MockMvc mvc;
    ObjectMapper mapper = new ObjectMapper();
    @Test void defaultsAreDisabledAndResponsesMatchContracts() throws Exception {
        var create = mvc.perform(GuestRequests.post("/api/check-ins").contentType(MediaType.APPLICATION_JSON).content(InsightTests.INPUT)).andExpect(status().isCreated()).andReturn();
        long id = mapper.readTree(create.getResponse().getContentAsString()).get("id").asLong();
        var insight = mvc.perform(GuestRequests.get("/api/check-ins/" + id + "/insight")).andExpect(status().isOk()).andReturn();
        assertThat(mapper.readTree(insight.getResponse().getContentAsString())).isEqualTo(mapper.readTree(Files.readString(Path.of("..", "contracts", "insight-disabled-200.json"))));
        var report = mvc.perform(GuestRequests.get("/api/reports/weekly")).andExpect(status().isOk()).andReturn();
        assertThat(mapper.readTree(report.getResponse().getContentAsString())).isEqualTo(mapper.readTree(Files.readString(Path.of("..", "contracts", "weekly-disabled-200.json"))));
        mvc.perform(GuestRequests.post("/api/check-ins/" + id + "/insight")).andExpect(status().isForbidden()).andExpect(jsonPath("$.code").value("LLM_UNAVAILABLE"));
        mvc.perform(GuestRequests.post("/api/reports/weekly")).andExpect(status().isForbidden());
    }
}
