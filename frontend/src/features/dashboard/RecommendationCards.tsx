import { Badge } from "../../components/Badge/Badge";
import { Card } from "../../components/Card/Card";
import type { FoodRecommendation, MusicRecommendation } from "../../types/api";

type RecommendationCardsProps = {
  foods: FoodRecommendation[];
  music: MusicRecommendation[];
};

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
            <li key={track.title} className="recommendation-item">
              <div className="recommendation-item__header">
                <h3 className="recommendation-item__name">{track.title}</h3>
                <Badge tone="accent">{track.tag}</Badge>
              </div>
              <p className="recommendation-item__artist">{track.artist}</p>
              <p className="recommendation-item__reason">{track.reason}</p>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
