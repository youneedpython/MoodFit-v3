CREATE TABLE wellness_checkin (
    id BIGINT NOT NULL AUTO_INCREMENT,
    recorded_at DATETIME(6) NOT NULL,
    heart_rate INT NOT NULL,
    respiratory_rate INT NOT NULL,
    sleep_score INT NOT NULL,
    stress_level INT NOT NULL,
    energy_level INT NOT NULL,
    temperature DECIMAL(3,1) NOT NULL,
    weather VARCHAR(10) NOT NULL,
    wellness_score INT NOT NULL,
    mood VARCHAR(20) NOT NULL,
    summary VARCHAR(500) NOT NULL,
    PRIMARY KEY (id)
);

CREATE INDEX idx_wellness_checkin_recorded_at ON wellness_checkin (recorded_at);

CREATE TABLE checkin_food_recommendation (
    checkin_id BIGINT NOT NULL,
    position INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    tag VARCHAR(50) NOT NULL,
    reason VARCHAR(300) NOT NULL,
    PRIMARY KEY (checkin_id, position),
    CONSTRAINT fk_checkin_food_recommendation_checkin
        FOREIGN KEY (checkin_id) REFERENCES wellness_checkin (id)
);

CREATE TABLE checkin_music_recommendation (
    checkin_id BIGINT NOT NULL,
    position INT NOT NULL,
    title VARCHAR(100) NOT NULL,
    artist VARCHAR(100) NOT NULL,
    tag VARCHAR(50) NOT NULL,
    reason VARCHAR(300) NOT NULL,
    PRIMARY KEY (checkin_id, position),
    CONSTRAINT fk_checkin_music_recommendation_checkin
        FOREIGN KEY (checkin_id) REFERENCES wellness_checkin (id)
);
