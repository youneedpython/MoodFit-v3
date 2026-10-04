import { Badge } from "../../components/Badge/Badge";
import { useState } from "react";
import { Card } from "../../components/Card/Card";
import "./RecommendationCards.css";
import type { FoodRecommendation, MusicRecommendation } from "../../types/api";

type RecommendationCardsProps = {
  foods: FoodRecommendation[];
  music: MusicRecommendation[];
};

function MusicTrack({ track }: { track: MusicRecommendation }) {
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
export function RecommendationCards({ foods, music }: RecommendationCardsProps) {
  return (
    <div className="grid grid--two">
      <Card title="추천 음식">
        <ul className="recommendation-list">
          {foods.map((food) => (
            <li key={food.name} className="recommendation-item">
              <div className="recommendation-item__header">
                <h3 className="recommendation-item__name">{food.name}</h3>
                <Badge tone="info">{food.tag}</Badge>
              </div>
              <p className="recommendation-item__reason">{food.reason}</p>
            </li>
          ))}
        </ul>
      </Card>
      <Card title="추천 음악">
        <ul className="recommendation-list">
          {music.map((track) => (
            <MusicTrack key={`${track.title}:${track.videoId ?? "legacy"}`} track={track} />
          ))}
        </ul>
      </Card>
    </div>
  );
}
