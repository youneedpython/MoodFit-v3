package com.moodfit.health;

import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.reset;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.sql.SQLException;
import javax.sql.DataSource;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoSpyBean;
import org.springframework.test.web.servlet.MockMvc;

// Load production health settings as well as the test datasource configuration.
@SpringBootTest(properties = "spring.config.additional-location=file:src/main/resources/application.properties")
@AutoConfigureMockMvc
class OperationalHealthTests {
    @DynamicPropertySource
    static void testDatabase(DynamicPropertyRegistry properties) {
        properties.add("DB_URL", () -> "jdbc:h2:mem:health;MODE=MySQL;DATABASE_TO_LOWER=TRUE;DB_CLOSE_DELAY=-1");
        properties.add("DB_USERNAME", () -> "sa");
        properties.add("DB_PASSWORD", () -> "");
    }

    @Autowired
    private MockMvc mvc;

    @MockitoSpyBean
    private DataSource dataSource;

    @AfterEach
    void restoreDataSource() {
        reset(dataSource);
    }

    @Test
    void healthyProbesExposeOnlyStatus() throws Exception {
        mvc.perform(get("/actuator/health/liveness"))
                .andExpect(status().isOk()).andExpect(content().json("{\"status\":\"UP\"}",
                        org.springframework.test.json.JsonCompareMode.STRICT));
        mvc.perform(get("/actuator/health/readiness"))
                .andExpect(status().isOk()).andExpect(content().json("{\"status\":\"UP\"}",
                        org.springframework.test.json.JsonCompareMode.STRICT));
    }

    @Test
    void databaseFailureOnlyFailsReadinessAndHidesDetails() throws Exception {
        doThrow(new SQLException("synthetic DB outage")).when(dataSource).getConnection();
        mvc.perform(get("/actuator/health/readiness"))
                .andExpect(status().isServiceUnavailable())
                .andExpect(content().json("{\"status\":\"DOWN\"}",
                        org.springframework.test.json.JsonCompareMode.STRICT));
        mvc.perform(get("/actuator/health/liveness"))
                .andExpect(status().isOk()).andExpect(content().json("{\"status\":\"UP\"}",
                        org.springframework.test.json.JsonCompareMode.STRICT));
    }

    @Test
    void otherActuatorEndpointsAreUnavailable() throws Exception {
        for (String endpoint : new String[] {"env", "info", "beans", "metrics", "configprops", "mappings"}) {
            mvc.perform(get("/actuator/" + endpoint)).andExpect(status().isNotFound());
        }
    }
}
