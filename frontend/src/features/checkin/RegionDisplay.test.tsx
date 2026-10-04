import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it, vi } from "vitest";
import { CHECKIN_CREATED, CHECKIN_HISTORY } from "../../contracts/contracts";
import { DashboardPage } from "../dashboard/DashboardPage";
import { HistoryPage } from "../history/HistoryPage";
import { CheckinResultSummary } from "./CheckinResultSummary";

const region = "<명동>" + "가".repeat(70);
describe("recorded region display", () => {
  it.each([region, null])("shows Dashboard region only when present: %s", async (name) => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({
      ...CHECKIN_CREATED, weather: { ...CHECKIN_CREATED.weather, region: name }
    }))));
    const { container } = render(<MemoryRouter><DashboardPage /></MemoryRouter>);
    await screen.findByText("19.0°C");
    expect(container.querySelector(".weather-region")?.textContent ?? null).toBe(name);
    expect(container.querySelector("명동")).toBeNull();
  });
  it.each([region, null])("shows History region only when present: %s", async (name) => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({
      ...CHECKIN_HISTORY, items: CHECKIN_HISTORY.items.map((item) => ({ ...item, region: name }))
    }))));
    const { container } = render(<MemoryRouter><HistoryPage /></MemoryRouter>);
    await screen.findByText("비 · 19.0°C");
    expect(container.querySelector(".weather-region")?.textContent ?? null).toBe(name);
    expect(container.querySelector("명동")).toBeNull();
  });
  it.each([region, null])("shows result region only when present: %s", (name) => {
    const result = { ...CHECKIN_CREATED, weather: { ...CHECKIN_CREATED.weather, region: name } };
    const { container } = render(<MemoryRouter><CheckinResultSummary result={result} onStartOver={() => {}} /></MemoryRouter>);
    expect(container.querySelector(".weather-region")?.textContent ?? null).toBe(name);
    expect(container.querySelector("명동")).toBeNull();
  });
});
