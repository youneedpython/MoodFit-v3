/**
 * docs/05-API_SPEC.md의 Request / Response 타입.
 * Backend DTO(com.moodfit.dto)와 필드 이름을 맞춘다.
 */

export type WeatherCondition = "CLEAR" | "CLOUDY" | "RAIN" | "SNOW";

export type MoodCode = "TIRED" | "ENERGETIC" | "CALM" | "BALANCED";

export type CreateCheckinRequest = {
  heartRate: number;
  respiratoryRate: number;
  sleepScore: number;
  stressLevel: number;
  energyLevel: number;
  temperature: number;
  weather: WeatherCondition;
};

export type Mood = {
  code: MoodCode;
  label: string;
};

export type Metrics = {
  heartRate: number;
  respiratoryRate: number;
  sleepScore: number;
  stressLevel: number;
  energyLevel: number;
};

export type Weather = {
  temperature: number;
  condition: WeatherCondition;
};

export type FoodRecommendation = {
  name: string;
  tag: string;
  reason: string;
};

export type MusicRecommendation = {
  title: string;
  artist: string;
  tag: string;
  reason: string;
};

export type CheckinResponse = {
  id: number;
  /** ISO-8601 UTC (DEC-006) */
  recordedAt: string;
  mood: Mood;
  wellnessScore: number;
  summary: string;
  metrics: Metrics;
  weather: Weather;
  foods: FoodRecommendation[];
  music: MusicRecommendation[];
};

export type HistoryItem = {
  id: number;
  recordedAt: string;
  mood: Mood;
  wellnessScore: number;
  heartRate: number;
  respiratoryRate: number;
  sleepScore: number;
  stressLevel: number;
  energyLevel: number;
  temperature: number;
  weather: WeatherCondition;
};

export type HistoryResponse = {
  days: number;
  items: HistoryItem[];
};

export type ErrorResponse = {
  code: string;
  message: string;
  fieldErrors: Record<string, string>;
};
