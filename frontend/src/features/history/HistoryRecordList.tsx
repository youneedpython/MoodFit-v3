import { Badge } from "../../components/Badge/Badge";
import { useEffect, useRef, useState } from "react";
import { Button } from "../../components/Button/Button";
import { Card } from "../../components/Card/Card";
import { WEATHER_LABELS } from "../../constants/weather";
import type { HistoryItem } from "../../types/api";
import { formatDisplayDateTimeWithWeekday } from "../../utils/dateTime";

type HistoryRecordListProps = {
  /** recordedAt 오름차순 (API 순서) */
  items: HistoryItem[];
};

/** 날짜별 Mood, 주요 Metric, 추천 이력 요약. 최신 기록부터 표시한다. */
export function HistoryRecordList({ items }: HistoryRecordListProps) {
  const [page, setPage] = useState(1);
  const heading = useRef<HTMLHeadingElement>(null);
  const pageCount = Math.max(1, Math.ceil(items.length / 5));
  const currentPage = Math.min(page, pageCount);
  useEffect(() => { setPage((previous) => Math.min(previous, pageCount)); }, [pageCount]);
  const newestFirst = [...items].sort((a, b) => b.recordedAt.localeCompare(a.recordedAt) || b.id - a.id)
    .slice((currentPage - 1) * 5, currentPage * 5);
  function movePage(next: number) {
    setPage(next);
    heading.current?.focus();
  }

  return (
    <Card>
    <header className="card__header"><h2 ref={heading} tabIndex={-1} className="card__title">기록</h2></header>
    <section aria-label="기록">
    <ol className="history-records">
      {newestFirst.map((item) => (
        <li key={item.id} className="history-record">
          <div className="history-record__header">
            <time className="history-record__time" dateTime={item.recordedAt}>
              {formatDisplayDateTimeWithWeekday(item.recordedAt)}
            </time>
            <Badge tone="accent">{item.mood.label}</Badge>
            <span className="history-record__score">
              Wellness Score <strong>{item.wellnessScore}</strong>
            </span>
          </div>

          <dl className="history-record__metrics">
            <div>
              <dt>심박수</dt>
              <dd>{item.heartRate} bpm</dd>
            </div>
            <div>
              <dt>호흡수</dt>
              <dd>{item.respiratoryRate} 회/분</dd>
            </div>
            <div>
              <dt>수면</dt>
              <dd>{item.sleepScore}</dd>
            </div>
            <div>
              <dt>스트레스</dt>
              <dd>{item.stressLevel}</dd>
            </div>
            <div>
              <dt>에너지</dt>
              <dd>{item.energyLevel}</dd>
            </div>
            <div>
              <dt>날씨</dt>
              <dd>
                {WEATHER_LABELS[item.weather]} · {item.temperature.toFixed(1)}°C
                {item.region && <span className="weather-region">{item.region}</span>}
              </dd>
            </div>
          </dl>

          <dl className="history-record__recommendations">
            <div>
              <dt>추천 음식</dt>
              <dd>{item.foodNames.join(", ")}</dd>
            </div>
            <div>
              <dt>추천 음악</dt>
              <dd>{item.musicTitles.join(", ")}</dd>
            </div>
          </dl>
        </li>
      ))}
    </ol>
    {pageCount > 1 && <nav aria-label="기록 페이지" className="history-pagination">
      <Button variant="secondary" disabled={currentPage === 1} onClick={() => movePage(currentPage - 1)}>이전</Button>
      <span aria-live="polite">{currentPage} / {pageCount}</span>
      <Button variant="secondary" disabled={currentPage === pageCount} onClick={() => movePage(currentPage + 1)}>다음</Button>
    </nav>}
    </section>
    </Card>
  );
}
