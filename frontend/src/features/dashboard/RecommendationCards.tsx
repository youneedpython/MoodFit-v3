import { Badge } from "../../components/Badge/Badge";
import { useState } from "react";
import { Card } from "../../components/Card/Card";
import { foodEmoji } from "./foodEmoji";
import "./RecommendationCards.css";
import type { FoodRecommendation, MusicRecommendation } from "../../types/api";
import type { FeedbackControls, FeedbackKind } from "./useRecommendationFeedback";

type RecommendationCardsProps = {
  foods: FoodRecommendation[];
  music: MusicRecommendation[];
  feedback?: FeedbackControls;
};

function FeedbackButtons({ feedback, kind, item, label }: { feedback?: FeedbackControls; kind: FeedbackKind; item: string; label: string }) {
  if (!feedback?.data?.enabled) return null;
  const current = feedback.data.items.find(value => value.kind === kind && value.item === item)?.rating;
  return <div className="recommendation-feedback">
    {(["LIKE", "DISLIKE"] as const).map(rating => <button type="button" key={rating}
      aria-label={`${label} ${rating === "LIKE" ? "좋아요" : "별로예요"}`} aria-pressed={current === rating}
      disabled={feedback.pending.includes(`${kind}:${item}`)} onClick={() => void feedback.toggle(kind, item, rating)}>
      <span aria-hidden="true">{rating === "LIKE" ? "👍" : "👎"}</span> {rating === "LIKE" ? "좋아요" : "별로예요"}
    </button>)}
  </div>;
}

function MusicTrack({ track, feedback }: { track: MusicRecommendation; feedback?: FeedbackControls }) {
  const [playing, setPlaying] = useState(false);
  const videoId = typeof track.videoId === "string" && track.videoId.length === 11 && /^[A-Za-z0-9_-]{11}$/.test(track.videoId)
    ? track.videoId
    : null;

  return (
    <li className="recommendation-item">
      <div className="recommendation-item__header">
        <h3 className="recommendation-item__name">{track.title}</h3>
        <Badge tone="accent">{track.tag}</Badge>
      </div>
      <p className="recommendation-item__artist">{track.artist}</p>
      <p className="recommendation-item__reason">{track.reason}</p>
      {videoId && <FeedbackButtons feedback={feedback} kind="MUSIC" item={videoId} label={track.title} />}
      {videoId && (
        <div className="music-playback">
          {playing ? (
            <>
              <iframe
                className="music-playback__player"
                src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1`}
                title={`${track.title} - ${track.artist} YouTube 플레이어`}
                allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                allowFullScreen
                referrerPolicy="strict-origin-when-cross-origin"
              />
              <button type="button" onClick={() => setPlaying(false)} aria-label={`${track.title} 재생 닫기`}>
                재생 닫기
              </button>
            </>
          ) : (
            <button type="button" onClick={() => setPlaying(true)} aria-label={`${track.title} - ${track.artist} 재생`}>
              바로 듣기
            </button>
          )}
          <a href={`https://www.youtube.com/watch?v=${videoId}`} target="_blank" rel="noopener noreferrer"
            aria-label={`${track.title} YouTube에서 열기 (새 탭)`}>
            YouTube에서 열기
          </a>
        </div>
      )}
    </li>
  );
}

/** Food / Music Recommendation. 이름, Tag, 추천 이유를 함께 표시한다. (UX Spec 3절 D) */
export function RecommendationCards({ foods, music, feedback }: RecommendationCardsProps) {
  return (
    <>
    <div className="grid grid--two">
      <Card title="추천 음식">
        <ul className="recommendation-list">
          {foods.map((food) => (
            <li key={food.name} className="recommendation-item">
              <div className="recommendation-item__header">
                <h3 className="recommendation-item__name recommendation-item__food">
                  <span className="recommendation-item__emoji" aria-hidden="true">{foodEmoji(food.name)}</span>
                  <span>{food.name}</span>
                </h3>
                <Badge tone="info">{food.tag}</Badge>
              </div>
              <p className="recommendation-item__reason">{food.reason}</p>
              <FeedbackButtons feedback={feedback} kind="FOOD" item={food.name} label={food.name} />
            </li>
          ))}
        </ul>
      </Card>
      <Card title="추천 음악">
        <ul className="recommendation-list">
          {music.map((track) => (
            <MusicTrack key={`${track.title}:${track.videoId ?? "legacy"}`} track={track} feedback={feedback} />
          ))}
        </ul>
      </Card>
    </div>
    {feedback?.data && <p className="recommendation-feedback__notice">{feedback.data.enabled
      ? "평가는 다음 Check-in의 추천부터 반영됩니다. 지금 보이는 목록은 유지됩니다."
      : "소셜 로그인 후 추천을 평가하면 다음 추천에 반영됩니다"}</p>}
    {feedback?.error && <p role="alert" className="recommendation-feedback__notice">{feedback.error}</p>}
    </>
  );
}
