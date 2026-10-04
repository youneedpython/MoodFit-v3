package com.moodfit.auth;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.web.servlet.MockMvc;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;

@SpringBootTest(properties = "AUTH_GUEST_ENABLED=false")
@AutoConfigureMockMvc
class DisabledGuestTests {
    @Autowired MockMvc mvc;
    @Test void disabledGuestReturns404() throws Exception {
        mvc.perform(get("/api/auth/me")).andExpect(jsonPath("$.guestEnabled").value(false));
        mvc.perform(post("/api/auth/guest").with(csrf())).andExpect(status().isNotFound());
    }
}
