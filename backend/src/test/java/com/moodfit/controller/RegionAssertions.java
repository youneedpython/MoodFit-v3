package com.moodfit.controller;

import static com.moodfit.auth.GuestRequests.get;
import static com.moodfit.auth.GuestRequests.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import tools.jackson.databind.ObjectMapper;

/** Exercises the same region API boundary against H2 and MySQL. */
public final class RegionAssertions {
    private static final String INPUT = """
            {"heartRate":68,"respiratoryRate":18,"sleepScore":86,"stressLevel":31,"energyLevel":74,"temperature":19.0,"weather":"RAIN"}
            """;

    public static void verify(MockMvc mvc) throws Exception {
        var mapper = new ObjectMapper();
        for (String region : new String[] {"  서울특별시 명동  ", "  " + "가".repeat(80) + "  "}) {
            String expected = region.strip();
            mvc.perform(post("/api/check-ins").contentType(MediaType.APPLICATION_JSON)
                    .content(withRegion(mapper.writeValueAsString(region))))
                    .andExpect(status().isCreated()).andExpect(jsonPath("$.weather.region").value(expected));
            mvc.perform(get("/api/check-ins/latest"))
                    .andExpect(status().isOk()).andExpect(jsonPath("$.weather.region").value(expected));
            mvc.perform(get("/api/check-ins/history"))
                    .andExpect(status().isOk()).andExpect(jsonPath("$.items[*].region").value(org.hamcrest.Matchers.hasItem(expected)));
        }
        for (String region : new String[] {"null", "\"\"", "\"   \""}) {
            mvc.perform(post("/api/check-ins").contentType(MediaType.APPLICATION_JSON).content(withRegion(region)))
                    .andExpect(status().isCreated()).andExpect(jsonPath("$.weather.region").value(org.hamcrest.Matchers.nullValue()));
            mvc.perform(get("/api/check-ins/latest")).andExpect(status().isOk())
                    .andExpect(jsonPath("$.weather.region").value(org.hamcrest.Matchers.nullValue()));
        }
        mvc.perform(post("/api/check-ins").contentType(MediaType.APPLICATION_JSON).content(INPUT))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.weather.region").value(org.hamcrest.Matchers.nullValue()));
        mvc.perform(get("/api/check-ins/history")).andExpect(status().isOk())
                .andExpect(jsonPath("$.items[?(@.region == null)]").isNotEmpty());
        for (String region : new String[] {"가".repeat(81), "\n명동", "명동\n", "명\t동", "\u0000", "\u007f", "\u0085"}) {
            mvc.perform(post("/api/check-ins").contentType(MediaType.APPLICATION_JSON)
                    .content(withRegion(mapper.writeValueAsString(region))))
                    .andExpect(status().isBadRequest()).andExpect(jsonPath("$.code").value("VALIDATION_ERROR"))
                    .andExpect(jsonPath("$.fieldErrors.region").exists());
        }
    }

    private static String withRegion(String json) {
        return INPUT.strip().replace("}", ",\"region\":" + json + "}");
    }
}
