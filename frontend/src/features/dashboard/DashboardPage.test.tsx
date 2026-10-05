import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CHECKIN_LATEST, CHECKIN_LATEST_NOT_FOUND } from "../../contracts/contracts";
import { DashboardPage } from "./DashboardPage";

vi.mock("./useRecommendationFeedback", () => ({
  useRecommendationFeedback: () => ({ data: null, error: "", pending: [], toggle: vi.fn() })
}));
vi.mock("../auth/AuthProvider", () => ({ useAuth: () => ({ state: { user: { id: 2, provider: "google" } } }) }));

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
  beforeEach(() => { vi.useFakeTimers({ toFake: ["Date"] }); vi.setSystemTime(new Date(LATEST.recordedAt)); });
  afterEach(() => vi.useRealTimers());
  it("shows a loading state and then the latest check-in", async () => {
    let resolveFetch: (response: Response) => void = () => undefined;
    const fetchMock = vi.fn((_input: string) => new Promise<Response>((resolve) => (resolveFetch = resolve)));
    vi.stubGlobal("fetch", fetchMock);
    renderPage();

    expect(screen.getByRole("status").textContent).toContain("최신 기록을 불러오는 중입니다.");
    expect(fetchMock.mock.calls[0]?.[0]).toBe("/api/check-ins/latest");

    await act(async () => resolveFetch(jsonResponse(200, LATEST)));

    const hero = screen.getByRole("region", { name: /오늘 컨디션은/ });
    expect(within(hero).getAllByText("활기 있음").length).toBeGreaterThan(0);
    expect(within(hero).getByText("76")).toBeTruthy();
    expect(within(hero).getByText(LATEST.summary)).toBeTruthy();
    expect(within(hero).getByText("비")).toBeTruthy();
    expect(within(hero).getByText("19.0°C")).toBeTruthy();
    expect(within(hero).getByRole("link", { name: "다시 입력하기" }).getAttribute("href")).toBe("/check-in");
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
    expect(foodItems).toHaveLength(5);
    expect(within(foodItems[0]!).getByRole("heading", { name: "새우 볶음밥" })).toBeTruthy();
    expect(within(foodItems[0]!).getByText("일상 메뉴")).toBeTruthy();
    expect(within(foodItems[3]!).getByText("비 오는 날씨에 어울리는 따뜻한 메뉴입니다.")).toBeTruthy();

    const music = screen.getByRole("region", { name: "추천 음악" });
    const musicItems = within(music).getAllByRole("listitem");
    expect(musicItems).toHaveLength(5);
    expect(within(musicItems[3]!).getByRole("heading", { name: "Someone You Loved" })).toBeTruthy();
    expect(within(musicItems[3]!).getByText("Lewis Capaldi")).toBeTruthy();
    expect(within(musicItems[3]!).getByText("잔잔한 감성")).toBeTruthy();
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
    // 최신 기록 요청만 센다. AI 코멘트 / 추천 평가 요청은 화면이 그려진 뒤 따로 나간다.
    expect(fetchMock.mock.calls.filter(([url]) => url === "/api/check-ins/latest")).toHaveLength(2);
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

    const hero = await screen.findByRole("region", { name: /오늘 컨디션은/ });
    expect(within(hero).getByText("🌧️").getAttribute("aria-hidden")).toBe("true");
  });
  it.each([0, 1, 3])("distinguishes records %s days old and generates only today", async (days) => {
    vi.setSystemTime(new Date(new Date(LATEST.recordedAt).getTime() + days * 86400000));
    const fetchMock = vi.fn((url: string, init: RequestInit) => Promise.resolve(jsonResponse(200,
      url.endsWith("/latest") ? LATEST : { enabled: true, available: true, text: init.method === "POST" ? "코멘트" : null, generatedAt: null })));
    vi.stubGlobal("fetch", fetchMock);
    renderPage();
    if (!days) {
      expect(await screen.findByText("코멘트")).toBeTruthy();
      expect(screen.getByRole("link", { name: "다시 입력하기" })).toBeTruthy();
      expect(screen.queryByText("오늘 상태를 아직 입력하지 않았어요")).toBeNull();
    } else {
      expect(await screen.findByRole("button", { name: "AI 코멘트 받기" })).toBeTruthy();
      expect(screen.getByRole("heading", { name: "오늘 상태를 아직 입력하지 않았어요" })).toBeTruthy();
      expect(screen.getByText(new RegExp(`마지막 기록은 ${days === 1 ? "어제" : "3일 전"}`))).toBeTruthy();
      const last = screen.getByRole("region", { name: new RegExp(`^마지막 기록 · ${days}일 전`) });
      expect(within(last).getByText("76")).toBeTruthy();
      expect(within(last).getByRole("region", { name: "추천 음식" })).toBeTruthy();
      expect(screen.queryByRole("heading", { name: /오늘 컨디션은|지금 컨디션은/ })).toBeNull();
      expect(screen.getByRole("link", { name: "오늘 상태 입력" }).getAttribute("href")).toBe("/check-in");
    }
    expect(fetchMock.mock.calls.filter(([, init]) => init.method === "POST")).toHaveLength(days === 0 ? 1 : 0);
  });
  it.each([true, false])("shows saved averages only when available=%s", async (available) => {
    vi.setSystemTime(new Date(new Date(LATEST.recordedAt).getTime() + 86400000));
    vi.stubGlobal("fetch", vi.fn((url: string) => Promise.resolve(jsonResponse(200, url.endsWith("/latest")
      ? { ...LATEST, baseline: { ...LATEST.baseline, available, sampleCount: 5, averages: LATEST.metrics } }
      : { enabled: false }))));
    renderPage();
    await screen.findByRole("heading", { name: "오늘 상태를 아직 입력하지 않았어요" });
    const average = screen.queryByRole("region", { name: "최근 14일 평균" });
    expect(Boolean(average)).toBe(available);
    if (average) {
      expect(average.querySelectorAll("dd")).toHaveLength(5);
      expect(average.textContent).toContain("오늘 상태를 추정한 값이 아닙니다.");
    }
  });
  it("updates the day on visibility return", async () => {
    vi.stubGlobal("fetch", vi.fn((url: string) => Promise.resolve(jsonResponse(200, url.endsWith("/latest") ? LATEST : { enabled: false }))));
    renderPage();
    await screen.findByRole("heading", { name: /오늘 컨디션은/ });
    vi.setSystemTime(new Date(new Date(LATEST.recordedAt).getTime() + 86400000));
    await act(async () => document.dispatchEvent(new Event("visibilitychange")));
    expect(screen.getByRole("heading", { name: "오늘 상태를 아직 입력하지 않았어요" })).toBeTruthy();
  });
});
