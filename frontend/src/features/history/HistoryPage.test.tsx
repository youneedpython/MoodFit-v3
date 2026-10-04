import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it, vi } from "vitest";
import { CHECKIN_HISTORY } from "../../contracts/contracts";
import type { HistoryItem } from "../../types/api";
import { HistoryPage } from "./HistoryPage";

/** DEC-024: 공유 계약 파일(contracts/checkin-history-200.json)의 Item 형식을 기본으로 사용한다. */
const CONTRACT_ITEM = CHECKIN_HISTORY.items[0]!;

function item(overrides: Partial<HistoryItem>): HistoryItem {
  return {
    ...CONTRACT_ITEM,
    id: 1,
    recordedAt: "2026-09-28T09:00:00Z",
    mood: { code: "TIRED", label: "피곤함" },
    wellnessScore: 35,
    heartRate: 72,
    respiratoryRate: 16,
    sleepScore: 30,
    stressLevel: 60,
    energyLevel: 25,
    temperature: 4,
    weather: "SNOW",
    foodNames: ["따뜻한 수프와 곡물빵", "따뜻한 죽"],
    musicTitles: ["Soft Reset Playlist", "Warm Evening Playlist"],
    ...overrides
  };
}

/** API 순서와 같이 recordedAt 오름차순 */
const ITEMS: HistoryItem[] = [
  item({ id: 1 }),
  item({
    id: 2,
    recordedAt: "2026-09-29T09:00:00Z",
    mood: { code: "BALANCED", label: "균형 있음" },
    wellnessScore: 62,
    temperature: 19,
    weather: "CLOUDY",
    foodNames: ["닭가슴살 라이스볼", "따뜻한 현미 주먹밥"],
    musicTitles: ["Daily Balance Playlist", "Cloudy Focus Playlist"]
  }),
  // 최신 기록은 계약 파일 Item 그대로 사용한다. (날짜만 Trend 순서에 맞춘다)
  { ...CONTRACT_ITEM, id: 3, recordedAt: "2026-09-30T09:00:00Z" }
];

function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

function renderPage() {
  render(
    <MemoryRouter>
      <HistoryPage />
    </MemoryRouter>
  );
}

describe("HistoryPage", () => {
  it("requests the last 7 days and shows a loading state first", async () => {
    let resolveFetch: (response: Response) => void = () => undefined;
    const fetchMock = vi.fn((_input: string) => new Promise<Response>((resolve) => (resolveFetch = resolve)));
    vi.stubGlobal("fetch", fetchMock);
    renderPage();

    expect(screen.getByRole("status").textContent).toContain("최근 기록을 불러오는 중입니다.");
    expect(fetchMock.mock.calls[0]?.[0]).toBe("/api/check-ins/history?days=7");

    await act(async () => resolveFetch(jsonResponse(200, { days: 7, items: ITEMS })));

    expect(screen.getByRole("region", { name: "최근 7일 Wellness Score" })).toBeTruthy();
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("renders the SVG trend with one point per record and a text summary", async () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(jsonResponse(200, { days: 7, items: ITEMS }))));
    renderPage();

    const trend = await screen.findByRole("region", { name: "최근 7일 Wellness Score" });
    expect(trend.querySelector(".wellness-trend__plot")?.getAttribute("aria-hidden")).toBe("true");
    expect(trend.querySelector("svg")).toBeTruthy();
    expect(within(trend).getAllByTestId("trend-point")).toHaveLength(3);
    expect(trend.querySelector("polyline")?.getAttribute("points")?.split(" ")).toHaveLength(3);
    expect(within(trend).getByText("기록 3건 · 최저 35점 · 최고 76점 · 최근 76점")).toBeTruthy();
  });

  it("draws a single point without a line when there is one record", async () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(jsonResponse(200, { days: 7, items: [ITEMS[2]] }))));
    renderPage();

    const trend = await screen.findByRole("region", { name: "최근 7일 Wellness Score" });
    expect(within(trend).getAllByTestId("trend-point")).toHaveLength(1);
    expect(trend.querySelector("polyline")).toBeNull();
  });

  it("lists records newest first with mood, metrics and recommendation history", async () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(jsonResponse(200, { days: 7, items: ITEMS }))));
    renderPage();

    const records = await screen.findByRole("region", { name: "기록" });
    const rows = within(records).getAllByRole("listitem");
    expect(rows).toHaveLength(3);

    const newest = rows[0]!;
    expect(within(newest).getByText("활기 있음")).toBeTruthy();
    expect(within(newest).getByText("76")).toBeTruthy();
    expect(within(newest).getByText("68 bpm")).toBeTruthy();
    expect(within(newest).getByText("비 · 19.0°C")).toBeTruthy();
    expect(within(newest).getByText("연어 샐러드, 소고기 채소 비빔밥, 통밀 닭고기 샌드위치, 따뜻한 채소 스튜, 버섯 칼국수")).toBeTruthy();
    expect(within(newest).getByText("Uptown Funk, Can't Stop the Feeling!, Dynamite, Someone Like You, Wonderwall")).toBeTruthy();
    expect(newest.querySelector("time")?.getAttribute("dateTime")).toBe("2026-09-30T09:00:00Z");

    expect(within(rows[2]!).getByText("피곤함")).toBeTruthy();
    expect(within(rows[2]!).getByText("눈 · 4.0°C")).toBeTruthy();
  });

  it("shows the UX spec empty state when there are no records", async () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(jsonResponse(200, { days: 7, items: [] }))));
    renderPage();

    expect(await screen.findByText("아직 충분한 기록이 없습니다.")).toBeTruthy();
    expect(screen.getByText("오늘의 상태를 입력해 보세요.")).toBeTruthy();
    expect(screen.getByRole("link", { name: "오늘 상태 입력" }).getAttribute("href")).toBe("/check-in");
    expect(screen.queryByRole("region", { name: "최근 7일 Wellness Score" })).toBeNull();
  });

  it("shows an API error and reloads on retry", async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new TypeError("Failed to fetch"))
      .mockResolvedValueOnce(jsonResponse(200, { days: 7, items: ITEMS }));
    vi.stubGlobal("fetch", fetchMock);
    renderPage();

    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toContain("History를 불러오지 못했습니다.");
    expect(alert.textContent).toContain("서버에 연결할 수 없습니다.");

    fireEvent.click(screen.getByRole("button", { name: "다시 시도" }));

    expect(await screen.findByRole("region", { name: "기록" })).toBeTruthy();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
