import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it, vi } from "vitest";
import { CHECKIN_CREATED } from "../../contracts/contracts";
import { CheckinResultSummary } from "./CheckinResultSummary";

vi.mock("../insight/InsightCard", () => ({ InsightCard: () => <section className="insight-card">AI 코멘트</section> }));

describe("결과 화면 AI 코멘트 배치", () => {
  it("places the comment after weather, before recommendations and actions", () => {
    const result = { ...CHECKIN_CREATED, weather: { ...CHECKIN_CREATED.weather, region: "서울특별시 구로5동" } };
    const view = render(<MemoryRouter><CheckinResultSummary result={result} onStartOver={vi.fn()} /></MemoryRouter>);
    const children = Array.from(view.container.querySelector(".checkin-result")!.children);
    const index = (name: string) => children.findIndex(element => element.classList.contains(name));
    expect(index("checkin-result__weather")).toBeGreaterThan(index("checkin-result__summary"));
    expect(index("insight-card")).toBeGreaterThan(index("checkin-result__weather"));
    expect(index("checkin-result__recommendations")).toBeGreaterThan(index("insight-card"));
    expect(index("checkin-result__actions")).toBeGreaterThan(index("checkin-result__recommendations"));
    expect(children.slice(index("insight-card") + 1).some(element => element.classList.contains("checkin-result__weather"))).toBe(false);
  });
});
