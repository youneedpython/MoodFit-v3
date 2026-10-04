package com.moodfit.mysql;
import com.moodfit.service.RecommendationFeedbackAssertions;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.mysql.MySQLContainer;
@SpringBootTest @AutoConfigureMockMvc @Testcontainers(disabledWithoutDocker = true)
class MySqlRecommendationFeedbackTests extends RecommendationFeedbackAssertions {
    @Container @ServiceConnection static MySQLContainer mysql = new MySQLContainer("mysql:8.4.11");
}
