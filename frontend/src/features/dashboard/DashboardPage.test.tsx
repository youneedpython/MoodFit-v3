import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it, vi } from "vitest";
import { CHECKIN_LATEST, CHECKIN_LATEST_NOT_FOUND } from "../../contracts/contracts";
import { DashboardPage } from "./DashboardPage";

/** DEC-024: 공유 계약 파일(contracts/checkin-latest-200.json) */
const LATEST = CHECKIN_LATEST;

function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

/** DEC-024: 공유 계약 파일(contracts/checkin-latest-404.json) */
const NOT_FOUND = CHECKIN_LATEST_NOT_FOUND;

function renderPage() {
  render(
    <MemoryRouter>
      <DashboardPage />
    </MemoryRouter>
  );
}

describe("DashboardPage", () => {
  it("shows a loading state and then the latest check-in", async () => {
    let resolveFetch: (response: Response) => void = () => undefined;
    const fetchMock = vi.fn((_input: string) => new Promise<Response>((resolve) => (resolveFetch = resolve)));
    vi.stubGlobal("fetch", fetchMock);
    renderPage();

    expect(screen.getByRole("status").textContent).toContain("최신 기록을 불러오는 중입니다.");
    expect(fetchMock.mock.calls[0]?.[0]).toBe("/api/check-ins/latest");

    await act(async () => resolveFetch(jsonResponse(200, LATEST)));

    const hero = screen.getByRole("region", { name: /지금 컨디션은/ });
    expect(within(hero).getAllByText("활기 있음").length).toBeGreaterThan(0);
    expect(within(hero).getByText("76")).toBeTruthy();
    expect(within(hero).getByText(LATEST.summary)).toBeTruthy();
    expect(within(hero).getByText("비")).toBeTruthy();
    expect(within(hero).getByText("19.0°C")).toBeTruthy();
    expect(within(hero).getByRole("link", { name: "오늘 상태 입력" }).getAttribute("href")).toBe("/check-in");
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("shows all 5 body metrics from the API", async () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(jsonResponse(200, LATEST))));
    renderPage();

    const metrics = await screen.findByRole("region", { name: "Body Metrics" });
    const cards = within(metrics).getAllByRole("article");
    expect(cards).toHaveLength(5);
    expect(cards.map((card) => card.textContent)).toEqual([
      "심박수68bpm",
      "호흡수18회/분",
      "수면 점수86/ 100",
      "스트레스 수준31/ 100",
      "에너지 수준74/ 100"
    ]);
  });

  it("renders food and music recommendations with tag and reason", async () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(jsonResponse(200, LATEST))));
    renderPage();

    const foods = await screen.findByRole("region", { name: "추천 음식" });
    const foodItems = within(foods).getAllByRole("listitem");
    expect(foodItems).toHaveLength(2);
    expect(within(foodItems[0]!).getByRole("heading", { name: "연어 샐러드" })).toBeTruthy();
    expect(within(foodItems[0]!).getByText("에너지 균형")).toBeTruthy();
    expect(within(foodItems[1]!).getByText("비 오는 날씨에 어울리는 따뜻한 메뉴입니다.")).toBeTruthy();

    const music = screen.getByRole("region", { name: "추천 음악" });
    const musicItems = within(music).getAllByRole("listitem");
    expect(musicItems).toHaveLength(2);
    expect(within(musicItems[1]!).getByRole("heading", { name: "Rainy Indoor Playlist" })).toBeTruthy();
    expect(within(musicItems[1]!).getByText("MoodFit Curated")).toBeTruthy();
    expect(within(musicItems[1]!).getByText("잔잔한 감성")).toBeTruthy();
  });

  it("treats latest 404 CHECKIN_NOT_FOUND as an empty state with a check-in CTA", async () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(jsonResponse(404, NOT_FOUND))));
    renderPage();

    expect(await screen.findByText("아직 Check-in 기록이 없습니다.")).toBeTruthy();
    expect(screen.getByRole("link", { name: "오늘 상태 입력" }).getAttribute("href")).toBe("/check-in");
    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.queryByRole("region", { name: "Body Metrics" })).toBeNull();
  });

  it("shows an API error and reloads on retry", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(500, { code: "INTERNAL_ERROR", message: "Server error", fieldErrors: {} }))
      .mockResolvedValueOnce(jsonResponse(200, LATEST));
    vi.stubGlobal("fetch", fetchMock);
    renderPage();

    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toContain("Dashboard를 불러오지 못했습니다.");
    expect(alert.textContent).toContain("최신 기록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.");

    fireEvent.click(screen.getByRole("button", { name: "다시 시도" }));

    expect(await screen.findByRole("region", { name: "Body Metrics" })).toBeTruthy();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("shows the connection message on network failure", async () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.reject(new TypeError("Failed to fetch"))));
    renderPage();

    expect((await screen.findByRole("alert")).textContent).toContain("서버에 연결할 수 없습니다.");
  });

  it("keeps the weather icon decorative", async () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(jsonResponse(200, LATEST))));
    renderPage();

    const hero = await screen.findByRole("region", { name: /지금 컨디션은/ });
    expect(within(hero).getByText("🌧️").getAttribute("aria-hidden")).toBe("true");
  });
});
