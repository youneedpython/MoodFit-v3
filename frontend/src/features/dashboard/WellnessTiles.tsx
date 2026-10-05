import { WEATHER_LABELS } from "../../constants/weather";
import type { CheckinResponse, WeatherCondition } from "../../types/api";
import "./WellnessTiles.css";

/** 장식용 Weather Visual. 의미는 옆의 Text로 전달한다. */
const WEATHER_ICONS: Record<WeatherCondition, string> = {
  CLEAR: "☀️",
  CLOUDY: "☁️",
  RAIN: "🌧️",
  SNOW: "❄️"
};

export function WellnessTiles({ wellnessScore, weather }: Pick<CheckinResponse, "wellnessScore" | "weather">) {
  return (
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
  );
}
