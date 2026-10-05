ALTER TABLE wellness_checkin ADD COLUMN baseline_sample_count INT NULL;
ALTER TABLE wellness_checkin ADD COLUMN baseline_heart_rate DECIMAL(4,1) NULL;
ALTER TABLE wellness_checkin ADD COLUMN baseline_respiratory_rate DECIMAL(3,1) NULL;
ALTER TABLE wellness_checkin ADD COLUMN baseline_sleep_score DECIMAL(4,1) NULL;
ALTER TABLE wellness_checkin ADD COLUMN baseline_stress_level DECIMAL(4,1) NULL;
ALTER TABLE wellness_checkin ADD COLUMN baseline_energy_level DECIMAL(4,1) NULL;
ALTER TABLE wellness_checkin ADD COLUMN tension VARCHAR(10) NULL;
