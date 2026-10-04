CREATE TABLE checkin_insight (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    checkin_id BIGINT NOT NULL,
    body VARCHAR(600) NOT NULL,
    model_id VARCHAR(255) NOT NULL,
    generated_at DATETIME(6) NOT NULL,
    CONSTRAINT insight_checkin_unique UNIQUE (checkin_id),
    CONSTRAINT insight_checkin_fk FOREIGN KEY (checkin_id) REFERENCES wellness_checkin(id)
);
CREATE TABLE weekly_report (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    body VARCHAR(1200) NOT NULL,
    record_count INT NOT NULL,
    model_id VARCHAR(255) NOT NULL,
    generated_at DATETIME(6) NOT NULL,
    CONSTRAINT report_user_fk FOREIGN KEY (user_id) REFERENCES app_user(id)
);
CREATE INDEX report_user_generated_idx ON weekly_report (user_id, generated_at, id);
CREATE TABLE llm_usage (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    kind VARCHAR(10) NOT NULL,
    attempted_at DATETIME(6) NOT NULL,
    CONSTRAINT usage_user_fk FOREIGN KEY (user_id) REFERENCES app_user(id)
);
CREATE INDEX usage_user_kind_time_idx ON llm_usage (user_id, kind, attempted_at);
