package com.moodfit.repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import com.moodfit.entity.WellnessCheckin;

public interface WellnessCheckinRepository extends JpaRepository<WellnessCheckin, Long> {

    Optional<WellnessCheckin> findTopByUserIdOrderByRecordedAtDescIdDesc(Long userId);

    @EntityGraph(attributePaths = {"foodRecommendations", "musicRecommendations"})
    List<WellnessCheckin> findByUserIdAndRecordedAtGreaterThanEqualOrderByRecordedAtAsc(Long userId, Instant recordedAt);

    Optional<WellnessCheckin> findTopByOrderByRecordedAtDescIdDesc();

    /** History 추천 이력 요약(DEC-020)을 위해 Recommendation을 함께 조회해 기록마다 추가 Query가 발생하지 않게 한다. */
    @EntityGraph(attributePaths = {"foodRecommendations", "musicRecommendations"})
    List<WellnessCheckin> findByRecordedAtGreaterThanEqualOrderByRecordedAtAsc(Instant recordedAt);
}
