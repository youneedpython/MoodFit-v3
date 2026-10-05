import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { Button } from "../../components/Button/Button";
import { Card } from "../../components/Card/Card";
import { getTodayRecommendations } from "../../services/api";
import { fetchLocalWeather, WeatherError, type LocalWeather } from "../../services/weather";
import type { TodayRecommendationResponse } from "../../types/api";
import { RecommendationCards } from "./RecommendationCards";
import type { FeedbackControls } from "./useRecommendationFeedback";

const weatherLabels = { CLEAR: "맑음", CLOUDY: "흐림", RAIN: "비", SNOW: "눈" };

export function TodayWeatherRecommendations({ feedback }: { feedback: FeedbackControls }) {
  const controller = useRef<AbortController | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<{ message: string; weather: boolean } | null>(null);
  const [result, setResult] = useState<{ local: LocalWeather; recommendations: TodayRecommendationResponse } | null>(null);
  useEffect(() => () => controller.current?.abort(), []);

  async function load() {
    controller.current?.abort();
    const current = new AbortController();
    controller.current = current;
    setLoading(true);
    setError(null);
    setResult(null);
    let weatherStage = true;
    try {
      const local = await fetchLocalWeather(current.signal);
      if (current.signal.aborted) return;
      weatherStage = false;
      const recommendations = await getTodayRecommendations(local.temperature, local.weather, current.signal);
      if (!current.signal.aborted) setResult({ local, recommendations });
    } catch (failure) {
      if (!current.signal.aborted) setError({
        message: weatherStage && failure instanceof WeatherError ? failure.message
          : weatherStage ? "날씨를 조회하지 못했습니다. 다시 시도해 주세요." : "추천을 불러오지 못했습니다. 다시 시도해 주세요.",
        weather: weatherStage
      });
    } finally {
      if (!current.signal.aborted) setLoading(false);
    }
  }

  return <section className="dashboard dashboard-weather" aria-labelledby="today-weather-title">
    <Card className="dashboard-weather__intro">
      <h2 id="today-weather-title">오늘 날씨에 맞는 추천</h2>
      <p>현재 위치의 날씨로 어울리는 음식과 음악을 추천합니다. 위치는 날씨 조회에만 쓰고 저장하지 않습니다.</p>
      <p aria-live="polite">{loading ? "날씨를 조회하고 있습니다…" : result
        ? `${result.local.region || "현재 위치"} · ${weatherLabels[result.local.weather]} · ${result.local.temperature}°C 기준 추천` : ""}</p>
      {error && <>
        <p role="alert">{error.message}</p>
        {error.weather && <p>Check-in 화면에서는 날씨를 직접 입력할 수 있습니다. <Link to="/check-in">오늘 상태 입력</Link></p>}
      </>}
      {!result && <Button variant="secondary" disabled={loading} onClick={() => void load()}>오늘 날씨로 추천 받기</Button>}
      <p><a href="https://open-meteo.com/" target="_blank" rel="noopener noreferrer">날씨 데이터: Open-Meteo</a></p>
    </Card>
    {result && <>
      <RecommendationCards foods={result.recommendations.foods} music={result.recommendations.music} feedback={feedback} />
      <p>날씨만으로 고른 추천입니다. 오늘 상태를 입력하면 기분까지 반영한 추천 5개를 볼 수 있습니다.</p>
      <Button variant="ghost" disabled={loading} onClick={() => void load()}>다시 조회</Button>
    </>}
  </section>;
}
