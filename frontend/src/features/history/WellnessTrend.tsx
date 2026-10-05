import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Button } from "../../components/Button/Button";
import { Card } from "../../components/Card/Card";
import type { HistoryItem } from "../../types/api";
import { formatTrendDate } from "../../utils/dateTime";

import { dailyTrend } from "./dailyTrend";

const GRID_SCORES = [100, 50, 0];
export function pinchZoom(startDistance: number, distance: number, startZoom: number, maximum: number) {
  const next = Math.min(maximum, Math.max(1, startDistance > 0 ? startZoom * distance / startDistance : startZoom));
  return next <= 1.05 ? 1 : next;
}
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
  const viewport = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [zoom, setZoom] = useState(1);
  const manual = useRef(false);
  const pendingScroll = useRef<number | null>(null);
  const gesture = useRef<{ distance: number; zoom: number; anchor: number } | null>(null);
  const maximum = width > 0 ? Math.max(1, items.length * 48 / width) : 1;
  const crowded = width > 0 && items.length * 24 > width;
  const averageMode = crowded && zoom === 1;
  const readableZoom = width > 0 ? Math.min(maximum, Math.max(1.5, items.length * 24 / width)) : 1;
  const previousZoom = useRef(1);
  useEffect(() => {
    if (!viewport.current || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(viewport.current);
    return () => observer.disconnect();
  }, []);
  useLayoutEffect(() => {
    setZoom((previous) => manual.current ? Math.min(maximum, Math.max(1, previous)) :
      1);
  }, [width, items.length, maximum]);
  useLayoutEffect(() => {
    const element = viewport.current;
    if (!element) return;
    if (pendingScroll.current !== null) {
      element.scrollLeft = pendingScroll.current;
      pendingScroll.current = null;
    } else if (zoom > 1 && previousZoom.current === 1) element.scrollLeft = element.scrollWidth;
    else if (zoom === 1) element.scrollLeft = 0;
    previousZoom.current = zoom;
  }, [zoom, width, items.length]);
  function changeZoom(next: number) {
    manual.current = true;
    setZoom(Math.min(maximum, Math.max(1, next)));
  }
  // 두 손가락 확대 / 축소. 확대된 그래프는 가로로 스크롤되므로 Pointer Events는 Browser가 두 손가락 이동을
  // 스크롤로 가져가면서 pointercancel로 끊긴다. Touch Events를 passive가 아닌 Listener로 받아 두 손가락일 때만
  // 기본 동작을 막는다. 한 손가락 스크롤(가로 / 세로)은 Browser에 맡긴다.
  const live = useRef({ zoom, maximum });
  live.current = { zoom, maximum };
  useEffect(() => {
    const element = viewport.current;
    if (!element) return;
    const measure = (touches: TouchList) => {
      const [a, b] = [touches[0], touches[1]];
      return { distance: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY),
        midpoint: (a.clientX + b.clientX) / 2 - element.getBoundingClientRect().left };
    };
    const start = (event: TouchEvent) => {
      if (event.touches.length !== 2) { gesture.current = null; return; }
      const { distance, midpoint } = measure(event.touches);
      const current = live.current.zoom;
      gesture.current = { distance, zoom: current, anchor: (element.scrollLeft + midpoint) / current };
    };
    const move = (event: TouchEvent) => {
      const begun = gesture.current;
      if (event.touches.length !== 2 || !begun) return;
      event.preventDefault();
      const { distance, midpoint } = measure(event.touches);
      const next = pinchZoom(begun.distance, distance, begun.zoom, live.current.maximum);
      const scroll = begun.anchor * next - midpoint;
      if (next === live.current.zoom) element.scrollLeft = scroll;
      else { pendingScroll.current = scroll; manual.current = true; setZoom(next); }
    };
    const end = (event: TouchEvent) => { if (event.touches.length < 2) gesture.current = null; };
    element.addEventListener("touchstart", start, { passive: true });
    element.addEventListener("touchmove", move, { passive: false });
    element.addEventListener("touchend", end, { passive: true });
    element.addEventListener("touchcancel", end, { passive: true });
    return () => {
      element.removeEventListener("touchstart", start);
      element.removeEventListener("touchmove", move);
      element.removeEventListener("touchend", end);
      element.removeEventListener("touchcancel", end);
    };
  }, []);
  const scores = items.map((item) => item.wellnessScore);
  const displayed = averageMode
    ? dailyTrend(items).map((day) => ({ key: `day:${day.key}`, label: day.label, score: day.average }))
    : items.map((item) => ({ key: `record:${item.id}`, label: formatTrendDate(item.recordedAt), score: item.wellnessScore }));
  const points = displayed.map((item, index) => ({ x: xFor(index, displayed.length), y: yFor(item.score), item }));
  const innerWidth = width * zoom;
  const labelStep = Math.max(1, Math.ceil(points.length * 56 / (innerWidth || 392)));
  const labels = points.map((_, index) => index).filter((index) => index % labelStep === 0);
  const last = points.length - 1;
  if (last >= 0 && labels[labels.length - 1] !== last) {
    const previous = labels[labels.length - 1];
    if (previous !== undefined && (xFor(last, points.length) - xFor(previous, points.length)) * (innerWidth || 392) / 100 < 56) labels.pop();
    labels.push(last);
  }
  const latest = scores[scores.length - 1];

  return (
    <Card className="wellness-trend-card" title="최근 7일 Wellness Score" aside={(crowded || maximum > 1) && <div className="wellness-trend__controls">
      <Button variant="secondary" aria-label="그래프 축소" disabled={zoom <= 1} onClick={() => changeZoom(zoom / 1.5 < readableZoom ? 1 : zoom / 1.5)}><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M5 12h14" stroke="currentColor" strokeWidth="2" /></svg></Button>
      <Button variant="secondary" aria-label="그래프 확대" disabled={zoom >= maximum} onClick={() => changeZoom(zoom === 1 ? readableZoom : zoom * 1.5)}><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M5 12h14M12 5v14" stroke="currentColor" strokeWidth="2" /></svg></Button>
      <Button variant="secondary" aria-label={crowded ? "그래프 날짜별 평균으로 보기" : "그래프 전체 보기"} disabled={zoom <= 1} onClick={() => changeZoom(1)}>{crowded ? "날짜별 평균" : "전체 보기"}</Button>
    </div>}>
    <figure className="wellness-trend">
      <div className="wellness-trend__plot">
        <div className="wellness-trend__y-labels" aria-hidden="true">
          {GRID_SCORES.map((score) => (
            <span key={score} style={{ top: `${yFor(score)}%` }}>
              {score}
            </span>
          ))}
        </div>
        <div ref={viewport} className="wellness-trend__viewport" role="group" aria-label="Wellness Score 그래프 (좌우로 스크롤)" tabIndex={zoom > 1 ? 0 : undefined}>
        <div className="wellness-trend__inner" style={{ width: `${zoom * 100}%` }} aria-hidden="true">
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
              key={point.item.key}
              className="wellness-trend__point"
              style={{ left: `${point.x}%`, top: `${point.y}%` }}
              data-testid="trend-point"
            />
          ))}
        </div>
        <div className="wellness-trend__x-labels">
          {points.map(
            (point, index) =>
              labels.includes(index) && (
                <span key={point.item.key} style={{ left: `${point.x}%` }}>
                  {point.item.label}
                </span>
              )
          )}
        </div>
        </div>
        </div>
      </div>
      <p className="wellness-trend__hint" aria-live="polite">{averageMode ? "날짜별 평균입니다. 확대하면 기록을 하나씩 볼 수 있습니다." : zoom > 1 ? "좌우로 밀어 전체 기록을 볼 수 있습니다." : ""}</p>
      <figcaption className="wellness-trend__summary">
        기록 {items.length}건 · 최저 {Math.min(...scores)}점 · 최고 {Math.max(...scores)}점 · 최근 {latest}점
      </figcaption>
    </figure>
    </Card>
  );
}
