import { Badge } from "../../components/Badge/Badge";
import { BaselineNotice, TensionBadge } from "./PersonalBaseline";
import { ButtonLink } from "../../components/Button/Button";
import { WEATHER_LABELS } from "../../constants/weather";
import type { CheckinResponse, WeatherCondition } from "../../types/api";
import { formatDisplayDateTime } from "../../utils/dateTime";

/** 장식용 Weather Visual. 의미는 옆의 Text로 전달한다. */
const WEATHER_ICONS: Record<WeatherCondition, string> = {
  CLEAR: "☀️",
  CLOUDY: "☁️",
  RAIN: "🌧️",
  SNOW: "❄️"
};

type WellnessHeroProps = {
  checkin: CheckinResponse;
};

export function WellnessHero({ checkin }: WellnessHeroProps) {
  const { mood, wellnessScore, summary, weather, recordedAt } = checkin;

  return (
    <section className="wellness-hero" aria-labelledby="wellness-hero-title">
      <div className="wellness-hero__main">
        <div className="wellness-hero__meta">
          <Badge tone="accent">{mood.label}</Badge>
          <TensionBadge tension={checkin.baseline.tension} />
          <span className="wellness-hero__time">{formatDisplayDateTime(recordedAt)} 기록</span>
        </div>
        <h2 id="wellness-hero-title" className="wellness-hero__title">
          지금 컨디션은 <strong>{mood.label}</strong>
        </h2>
        <p className="wellness-hero__summary">{summary}</p>
        <BaselineNotice baseline={checkin.baseline} />
        <ButtonLink to="/check-in">오늘 상태 입력</ButtonLink>
      </div>

      <div className="wellness-hero__side">
        <div className="wellness-hero__score">
          <span className="wellness-hero__score-label">Wellness Score</span>
          <span className="wellness-hero__score-value">{wellnessScore}</span>
          <span className="wellness-hero__score-max">/ 100</span>
        </div>
        <div className="wellness-hero__weather">
          <span className="wellness-hero__weather-icon" aria-hidden="true">
            {WEATHER_ICONS[weather.condition]}
          </span>
          <span>
            <span className="wellness-hero__weather-label">{WEATHER_LABELS[weather.condition]}</span>
            <span className="wellness-hero__temperature">{weather.temperature.toFixed(1)}°C</span>
            {weather.region && <span className="weather-region">{weather.region}</span>}
          </span>
        </div>
      </div>
    </section>
  );
}
