package com.moodfit.repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.moodfit.entity.WellnessCheckin;

public interface WellnessCheckinRepository extends JpaRepository<WellnessCheckin, Long> {

    Optional<WellnessCheckin> findTopByOrderByRecordedAtDescIdDesc();

    List<WellnessCheckin> findByRecordedAtGreaterThanEqualOrderByRecordedAtAsc(Instant recordedAt);
}
