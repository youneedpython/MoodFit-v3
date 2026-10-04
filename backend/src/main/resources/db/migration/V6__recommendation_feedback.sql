CREATE TABLE recommendation_feedback (
    user_id BIGINT NOT NULL,
    kind VARCHAR(5) NOT NULL,
    item_name VARCHAR(120) NOT NULL,
    rating VARCHAR(7) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    PRIMARY KEY (user_id, kind, item_name),
    CONSTRAINT feedback_user_fk FOREIGN KEY (user_id) REFERENCES app_user(id),
    CONSTRAINT feedback_kind CHECK (kind IN ('FOOD', 'MUSIC')),
    CONSTRAINT feedback_rating CHECK (rating IN ('LIKE', 'DISLIKE'))
);
