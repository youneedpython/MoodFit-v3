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
  /** Card 제목. 같은 화면에 추천 묶음이 둘일 때 구분한다. */
  foodTitle?: string;
  musicTitle?: string;
  /** 평가 안내 / 오류 문구. 같은 화면의 다른 묶음이 이미 보여 주면 끈다. */
  showNotice?: boolean;
};

function FeedbackButtons({ feedback, kind, item, label }: { feedback?: FeedbackControls; kind: FeedbackKind; item: string; label: string }) {
  if (!feedback?.data?.enabled) return null;
  const current = feedback.data.items.find(value => value.kind === kind && value.item === item)?.rating;
  return <div className="recommendation-feedback" role="group" aria-label={`${label} 평가`}>
    {(["LIKE", "DISLIKE"] as const).map(rating => <button type="button" key={rating}
      aria-label={`${label} ${rating === "LIKE" ? "좋아요" : "별로예요"}`} aria-pressed={current === rating}
      title={rating === "LIKE" ? "좋아요" : "별로예요"}
      disabled={feedback.pending.includes(`${kind}:${item}`)} onClick={() => void feedback.toggle(kind, item, rating)}>
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"
        fill={current === rating ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5"
        strokeLinecap="round" strokeLinejoin="round">
        <g transform={rating === "DISLIKE" ? "rotate(180 12 12)" : undefined}>
          <path d="M8 10v11H4V10zM8 10l5-7c1-1 3 0 3 2l-1 5h4c2 0 2 1 2 2l-2 7c0 1-1 2-2 2H8" />
        </g>
      </svg>
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
        <div className="recommendation-item__title">
          {videoId && <button type="button" className="music-playback__toggle" onClick={() => setPlaying(value => !value)}
            aria-expanded={playing} aria-label={playing ? `${track.title} 재생 닫기` : `${track.title} - ${track.artist} 재생`}
            title={playing ? `${track.title} 재생 닫기` : `${track.title} - ${track.artist} 재생`}>
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              {playing ? <path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" strokeWidth="2" />
                : <path d="M8 5l11 7-11 7z" fill="currentColor" />}
            </svg>
          </button>}
          <h3 className="recommendation-item__name">{track.title}</h3>
        </div>
        <div className="recommendation-item__tag">
          <Badge tone="accent">{track.tag}</Badge>
        </div>
        {videoId && <FeedbackButtons feedback={feedback} kind="MUSIC" item={videoId} label={track.title} />}
      </div>
      <p className="recommendation-item__artist"><span>{track.artist}</span>
        {videoId && <> · <a href={`https://www.youtube.com/watch?v=${videoId}`} target="_blank" rel="noopener noreferrer"
          aria-label={`${track.title} YouTube에서 열기 (새 탭)`}>YouTube에서 열기</a></>}
      </p>
      <p className="recommendation-item__reason">{track.reason}</p>
      {videoId && playing && (
        <div className="music-playback">
              <iframe
                className="music-playback__player"
                src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1`}
                title={`${track.title} - ${track.artist} YouTube 플레이어`}
                allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                allowFullScreen
                referrerPolicy="strict-origin-when-cross-origin"
              />
        </div>
      )}
    </li>
  );
}

/** Food / Music Recommendation. 이름, Tag, 추천 이유를 함께 표시한다. (UX Spec 3절 D) */
export function RecommendationCards({ foods, music, feedback, foodTitle = "추천 음식", musicTitle = "추천 음악", showNotice = true }: RecommendationCardsProps) {
  return (
    <>
    <div className="grid grid--two">
      <Card title={foodTitle}>
        <ul className="recommendation-list">
          {foods.map((food) => (
            <li key={food.name} className="recommendation-item">
              <div className="recommendation-item__header">
                <h3 className="recommendation-item__name recommendation-item__food">
                  <span className="recommendation-item__emoji" aria-hidden="true">{foodEmoji(food.name)}</span>
                  <span>{food.name}</span>
                </h3>
                <div className="recommendation-item__tag">
                  <Badge tone="info">{food.tag}</Badge>
                </div>
                <FeedbackButtons feedback={feedback} kind="FOOD" item={food.name} label={food.name} />
              </div>
              <p className="recommendation-item__reason">{food.reason}</p>
            </li>
          ))}
        </ul>
      </Card>
      <Card title={musicTitle}>
        <ul className="recommendation-list">
          {music.map((track) => (
            <MusicTrack key={`${track.title}:${track.videoId ?? "legacy"}`} track={track} feedback={feedback} />
          ))}
        </ul>
      </Card>
    </div>
    {showNotice && feedback?.data && <p className="recommendation-feedback__notice">{feedback.data.enabled
      ? feedback.data.shared
        ? "체험 계정의 평가는 모든 방문자가 함께 씁니다. 다음 Check-in의 추천부터 반영됩니다."
        : "평가는 다음 Check-in의 추천부터 반영됩니다. 지금 보이는 목록은 유지됩니다."
      : "소셜 로그인 후 추천을 평가하면 다음 추천에 반영됩니다"}</p>}
    {showNotice && feedback?.error && <p role="alert" className="recommendation-feedback__notice">{feedback.error}</p>}
    </>
  );
}
