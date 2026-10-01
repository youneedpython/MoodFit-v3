import type { WeatherCondition } from "../types/api";

/** API Weather Enum(docs/05-API_SPEC.md 3절)의 화면 표시 이름 */
export const WEATHER_LABELS: Record<WeatherCondition, string> = {
  CLEAR: "맑음",
  CLOUDY: "흐림",
  RAIN: "비",
  SNOW: "눈"
};
