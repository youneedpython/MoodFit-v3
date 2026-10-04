import { useEffect, useRef } from "react";
import { InsightCard } from "../insight/InsightCard";
import { Badge } from "../../components/Badge/Badge";
import { WEATHER_LABELS } from "../../constants/weather";
import { Button, ButtonLink } from "../../components/Button/Button";
import { Card } from "../../components/Card/Card";
import { RecommendationCards } from "../dashboard/RecommendationCards";
import type { CheckinResponse } from "../../types/api";
import { formatDisplayDateTime } from "../../utils/dateTime";
import { useRecommendationFeedback } from "../dashboard/useRecommendationFeedback";

type CheckinResultSummaryProps = {
  result: CheckinResponse;
  onStartOver: () => void;
};

/** 저장 완료 후 Backend 응답을 요약한다. 분석 값은 모두 API 응답을 그대로 사용한다. */
export function CheckinResultSummary({ result, onStartOver }: CheckinResultSummaryProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const feedback = useRecommendationFeedback();

  // 화면이 바뀌었음을 Keyboard / Screen Reader 사용자에게 알리기 위해 결과 제목으로 Focus를 이동한다.
  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <Card className="checkin-result">
      <div className="checkin-result__header">
        <h2 className="checkin-result__title" ref={headingRef} tabIndex={-1}>
          Check-in이 저장되었습니다.
        </h2>
        <p className="checkin-result__time">{formatDisplayDateTime(result.recordedAt)} 기록</p>
      </div>

      <div className="checkin-result__score">
        <Badge tone="accent">{result.mood.label}</Badge>
        <p>
          <span className="checkin-result__score-label">Wellness Score</span>
          <span className="checkin-result__score-value">{result.wellnessScore}</span>
        </p>
      </div>

      <p className="checkin-result__summary">{result.summary}</p>
      {result.weather.region && <p className="checkin-result__weather">
        {WEATHER_LABELS[result.weather.condition]} · {result.weather.temperature.toFixed(1)}°C
        <span className="weather-region">{result.weather.region}</span>
      </p>}

      <InsightCard checkinId={result.id} autoGenerate />

      <div className="checkin-result__recommendations">
        <RecommendationCards foods={result.foods} music={result.music} feedback={feedback} />
      </div>

      <div className="checkin-result__actions">
        <ButtonLink to="/">Dashboard로 이동</ButtonLink>
        <Button variant="secondary" onClick={onStartOver}>
          새로 입력하기
        </Button>
      </div>
    </Card>
  );
}
