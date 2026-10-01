import type { HistoryItem } from "../../types/api";
import { formatTrendDate } from "../../utils/dateTime";

const GRID_SCORES = [100, 50, 0];
const MAX_LABELS = 7;
/** 양 끝 점이 잘리지 않도록 가로 여백(%)을 둔다. */
const X_INSET = 4;

/** 0 ~ 100 좌표계에서의 가로 위치 */
function xFor(index: number, count: number) {
  return count === 1 ? 50 : X_INSET + ((100 - X_INSET * 2) * index) / (count - 1);
}

/** 0 ~ 100 좌표계에서의 세로 위치 (Score 100이 위) */
function yFor(score: number) {
  return 100 - score;
}

type WellnessTrendProps = {
  /** recordedAt 오름차순 */
  items: HistoryItem[];
};

/**
 * 최근 Wellness Score Trend. 외부 Chart Library 없이 SVG + CSS로 그린다. (DEC-010)
 * SVG는 Grid와 선만 그리고, 점과 Label은 HTML로 배치해 화면 폭과 관계없이 글자 크기를 유지한다.
 * 그래프는 장식으로 처리하고, 같은 정보를 Text 요약으로 제공한다.
 */
export function WellnessTrend({ items }: WellnessTrendProps) {
  const scores = items.map((item) => item.wellnessScore);
  const points = items.map((item, index) => ({ x: xFor(index, items.length), y: yFor(item.wellnessScore), item }));
  const labelStep = Math.max(1, Math.ceil(items.length / MAX_LABELS));
  const latest = scores[scores.length - 1];

  return (
    <figure className="wellness-trend">
      <div className="wellness-trend__plot" aria-hidden="true">
        <div className="wellness-trend__y-labels">
          {GRID_SCORES.map((score) => (
            <span key={score} style={{ top: `${yFor(score)}%` }}>
              {score}
            </span>
          ))}
        </div>
        <div className="wellness-trend__area">
          <svg className="wellness-trend__chart" viewBox="0 0 100 100" preserveAspectRatio="none" focusable="false">
            {GRID_SCORES.map((score) => (
              <line key={score} className="wellness-trend__grid" x1={0} x2={100} y1={yFor(score)} y2={yFor(score)} />
            ))}
            {points.length > 1 && (
              <polyline
                className="wellness-trend__line"
                points={points.map((point) => `${point.x},${point.y}`).join(" ")}
              />
            )}
          </svg>
          {points.map((point) => (
            <span
              key={point.item.id}
              className="wellness-trend__point"
              style={{ left: `${point.x}%`, top: `${point.y}%` }}
              data-testid="trend-point"
            />
          ))}
        </div>
        <div className="wellness-trend__x-labels">
          {points.map(
            (point, index) =>
              (index % labelStep === 0 || index === points.length - 1) && (
                <span key={point.item.id} style={{ left: `${point.x}%` }}>
                  {formatTrendDate(point.item.recordedAt)}
                </span>
              )
          )}
        </div>
      </div>
      <figcaption className="wellness-trend__summary">
        기록 {items.length}건 · 최저 {Math.min(...scores)}점 · 최고 {Math.max(...scores)}점 · 최근 {latest}점
      </figcaption>
    </figure>
  );
}
