import { useEffect, useRef } from "react";
import { Badge } from "../../components/Badge/Badge";
import { Button, ButtonLink } from "../../components/Button/Button";
import { Card } from "../../components/Card/Card";
import type { CheckinResponse } from "../../types/api";
import { formatDisplayDateTime } from "../../utils/dateTime";

type CheckinResultSummaryProps = {
  result: CheckinResponse;
  onStartOver: () => void;
};

/** 저장 완료 후 Backend 응답을 요약한다. 분석 값은 모두 API 응답을 그대로 사용한다. */
export function CheckinResultSummary({ result, onStartOver }: CheckinResultSummaryProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);

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

      <div className="checkin-result__recommendations">
        <section>
          <h3>추천 음식</h3>
          <ul>
            {result.foods.map((food) => (
              <li key={food.name}>
                {food.name} <Badge>{food.tag}</Badge>
              </li>
            ))}
          </ul>
        </section>
        <section>
          <h3>추천 음악</h3>
          <ul>
            {result.music.map((track) => (
              <li key={track.title}>
                {track.title} <Badge>{track.tag}</Badge>
              </li>
            ))}
          </ul>
        </section>
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
