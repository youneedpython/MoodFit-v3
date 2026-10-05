/**
 * docs/05-API_SPEC.md의 Request / Response 타입.
 * Backend DTO(com.moodfit.dto)와 필드 이름을 맞춘다.
 */

export type WeatherCondition = "CLEAR" | "CLOUDY" | "RAIN" | "SNOW";

export type MoodCode = "TIRED" | "ENERGETIC" | "CALM" | "BALANCED";

export type CreateCheckinRequest = {
  region?: string | null;
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
  region: string | null;
  temperature: number;
  condition: WeatherCondition;
};

export type FoodRecommendation = {
  name: string;
  tag: string;
  reason: string;
};

export type MusicRecommendation = {
  videoId?: string | null;
  title: string;
  artist: string;
  tag: string;
  reason: string;
};

export type CheckinResponse = {
  baseline: Baseline;
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
  tension: Tension | null;
  region: string | null;
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
  /** 추천 음식 이름 (Mood 3개, Context 2개; 기존 기록은 저장된 순서, DEC-020) */
  foodNames: string[];
  /** 추천 음악 제목 (Mood 3개, Context 2개; 기존 기록은 저장된 순서, DEC-020) */
  musicTitles: string[];
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

export type Tension = "HIGH" | "NORMAL" | "STABLE";
export type Baseline = {
  available: boolean;
  sampleCount: number;
  tension: Tension | null;
  averages: Metrics | null;
  deltas: Metrics | null;
};
