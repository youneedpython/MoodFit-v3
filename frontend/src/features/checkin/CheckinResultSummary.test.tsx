import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it, vi } from "vitest";
import { CHECKIN_CREATED } from "../../contracts/contracts";
import { WEATHER_LABELS } from "../../constants/weather";
import { CheckinResultSummary } from "./CheckinResultSummary";
vi.mock("../insight/InsightCard", () => ({ InsightCard: () => <section className="insight-card">AI 코멘트</section> }));
vi.mock("../dashboard/useRecommendationFeedback", () => ({ useRecommendationFeedback: () => ({ data: null, error: "", pending: [], toggle: vi.fn() }) }));
describe("결과 화면 공유 Tile과 배치", () => {
  it.each(["서울특별시 구로5동", null])("shows tiles and ordered content with region %s", (region) => {
    const result = { ...CHECKIN_CREATED, weather: { ...CHECKIN_CREATED.weather, region } };
    const view = render(<MemoryRouter><CheckinResultSummary result={result} onStartOver={vi.fn()} /></MemoryRouter>);
    const score = view.container.querySelector(".wellness-hero__score")!;
    const weather = view.container.querySelector(".wellness-hero__weather")!;
    expect(score.textContent).toContain(String(result.wellnessScore));
    expect(score.textContent).toContain("/ 100");
    expect(weather.textContent).toContain(WEATHER_LABELS[result.weather.condition]);
    expect(weather.textContent).toContain(result.weather.temperature.toFixed(1) + "°C");
    expect(weather.querySelector(".wellness-hero__weather-icon")?.getAttribute("aria-hidden")).toBe("true");
    if (region) expect(weather.textContent).toContain(region);
    else expect(weather.querySelector(".weather-region")).toBeNull();
    const ordered = [score, weather, view.container.querySelector(".insight-card")!, screen.getByRole("heading", { name: "Body Metrics" }), view.container.querySelector(".checkin-result__recommendations")!, view.container.querySelector(".checkin-result__actions")!];
    ordered.slice(1).forEach((element, index) => {
      expect(ordered[index].compareDocumentPosition(element) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    });
    expect(view.container.querySelector(".checkin-result__weather")).toBeNull();
    expect(document.activeElement).toBe(screen.getByRole("heading", { name: "Check-in이 저장되었습니다." }));
    expect(screen.queryByRole("link", { name: "오늘 상태 입력" })).toBeNull();
  });
});
