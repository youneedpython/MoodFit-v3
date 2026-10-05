import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { DashboardPage } from "./DashboardPage";
import { CHECKIN_LATEST } from "../../contracts/contracts";
import { fetchLocalWeather, LocationDeniedError, WeatherError } from "../../services/weather";

vi.mock("../../services/weather", async importOriginal => {
  const original = await importOriginal<typeof import("../../services/weather")>();
  return { ...original, fetchLocalWeather: vi.fn() };
});
vi.mock("../auth/AuthProvider", () => ({ useAuth: () => ({ state: { user: { id: 2, provider: "google" } } }) }));
const today: unknown = JSON.parse(readFileSync(resolve(process.cwd(), "../contracts/recommendations-today-200.json"), "utf8"));
const weather = vi.mocked(fetchLocalWeather);
const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
let latest: unknown;
let apiFails: boolean;

function page() { return render(<MemoryRouter><DashboardPage /></MemoryRouter>); }
function requests(path: string) {
  return vi.mocked(fetch).mock.calls.filter(([url]) => String(url).split("?")[0] === path);
}

describe("Dashboard today weather recommendations", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(CHECKIN_LATEST.recordedAt));
    latest = null;
    apiFails = false;
    weather.mockReset();
    weather.mockResolvedValue({ temperature: 19, weather: "RAIN", region: "서울" });
    vi.stubGlobal("fetch", vi.fn(async (url: string, init?: RequestInit) => {
      if (url === "/api/check-ins/latest") return latest ? json(200, latest) : json(404, { code: "CHECKIN_NOT_FOUND", message: "none" });
      if (url === "/api/recommendations/feedback") return init?.method === "PUT" ? new Response(null, { status: 204 }) : json(200, { enabled: true, shared: false, items: [] });
      if (url.startsWith("/api/recommendations/today?")) return apiFails ? json(500, {}) : json(200, today);
      return json(200, { enabled: false, available: false });
    }));
  });
  afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

  it("does nothing until clicked, sends only weather and temperature, reuses cards and saves feedback", async () => {
    page();
    const button = await screen.findByRole("button", { name: "오늘 날씨로 추천 받기" });
    expect(button.className).toContain("button--secondary");
    expect(weather).not.toHaveBeenCalled();
    expect(requests("/api/recommendations/today")).toHaveLength(0);
    fireEvent.click(button);
    await screen.findByText("서울 · 비 · 19°C 기준 추천");
    // 지난 기록의 추천과 구분되는 제목을 쓰고, 평가 안내 문구는 화면에 한 번만 나온다.
    expect(screen.getByRole("heading", { name: "오늘 날씨 추천 음식" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "오늘 날씨 추천 음악" })).toBeTruthy();
    expect(screen.queryAllByText(/평가는 다음 Check-in의 추천부터 반영됩니다/).length).toBeLessThanOrEqual(1);
    const calls = requests("/api/recommendations/today");
    expect(calls).toHaveLength(1);
    const query = new URL(String(calls[0][0]), "https://example.test").searchParams;
    expect(Array.from(query.entries())).toEqual([["temperature", "19"], ["weather", "RAIN"]]);
    const region = screen.getByRole("region", { name: "오늘 날씨에 맞는 추천" });
    expect(within(region).getAllByRole("listitem")).toHaveLength(4);
    expect(within(region).getByText(/날씨만으로 고른 추천입니다/)).toBeTruthy();
    await screen.findByRole("button", { name: "따뜻한 채소 스튜 좋아요" });
    fireEvent.click(screen.getByRole("button", { name: "따뜻한 채소 스튜 좋아요" }));
    await waitFor(() => expect(requests("/api/recommendations/feedback").filter(([, init]) => init?.method === "PUT")).toHaveLength(1));
    fireEvent.click(screen.getByRole("button", { name: "Someone Like You - Adele 재생" }));
    expect(screen.getByTitle("Someone Like You - Adele YouTube 플레이어")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "다시 조회" }));
    await waitFor(() => expect(weather).toHaveBeenCalledTimes(2));
  });

  it.each([
    new LocationDeniedError("위치 권한이 거부되었습니다."),
    new WeatherError("위치를 확인하지 못했습니다."),
    new WeatherError("날씨 서비스를 이용할 수 없습니다.")
  ])("shows weather failure and allows retry: %s", async failure => {
    weather.mockRejectedValueOnce(failure);
    page();
    fireEvent.click(await screen.findByRole("button", { name: "오늘 날씨로 추천 받기" }));
    expect((await screen.findByRole("alert")).textContent).toBe(failure.message);
    expect(screen.getByText(/Check-in 화면에서는 날씨를 직접 입력/)).toBeTruthy();
    expect(requests("/api/recommendations/today")).toHaveLength(0);
    fireEvent.click(screen.getByRole("button", { name: "오늘 날씨로 추천 받기" }));
    await screen.findByText("서울 · 비 · 19°C 기준 추천");
  });

  it("shows API failure and retry succeeds with current location fallback", async () => {
    apiFails = true;
    weather.mockResolvedValue({ temperature: 19, weather: "RAIN" });
    page();
    fireEvent.click(await screen.findByRole("button", { name: "오늘 날씨로 추천 받기" }));
    expect((await screen.findByRole("alert")).textContent).toBe("추천을 불러오지 못했습니다. 다시 시도해 주세요.");
    apiFails = false;
    fireEvent.click(screen.getByRole("button", { name: "오늘 날씨로 추천 받기" }));
    await screen.findByText("현재 위치 · 비 · 19°C 기준 추천");
  });

  it("hides section for today's checkin", async () => {
    latest = CHECKIN_LATEST;
    page();
    await screen.findByText(CHECKIN_LATEST.summary);
    expect(screen.queryByRole("region", { name: "오늘 날씨에 맞는 추천" })).toBeNull();
    expect(weather).not.toHaveBeenCalled();
  });

  it("places section above last record and shares pressed state across duplicate items", async () => {
    const sample = today as { foods: typeof CHECKIN_LATEST.foods; music: typeof CHECKIN_LATEST.music };
    latest = { ...CHECKIN_LATEST, recordedAt: new Date(new Date(CHECKIN_LATEST.recordedAt).getTime() - 86400000).toISOString(), foods: sample.foods, music: sample.music };
    page();
    fireEvent.click(await screen.findByRole("button", { name: "오늘 날씨로 추천 받기" }));
    await screen.findByText("서울 · 비 · 19°C 기준 추천");
    const buttons = screen.getAllByRole("button", { name: "따뜻한 채소 스튜 좋아요" });
    expect(buttons).toHaveLength(2);
    fireEvent.click(buttons[0]);
    await waitFor(() => buttons.forEach(button => expect(button.getAttribute("aria-pressed")).toBe("true")));
    const section = screen.getByRole("region", { name: "오늘 날씨에 맞는 추천" });
    const last = screen.getByRole("region", { name: /마지막 기록/ });
    expect(section.compareDocumentPosition(last) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("disables the pending button and aborts on leaving the page", async () => {
    weather.mockImplementation(() => new Promise(() => {}));
    const view = page();
    const button = await screen.findByRole("button", { name: "오늘 날씨로 추천 받기" });
    fireEvent.click(button);
    expect((button as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByText("날씨를 조회하고 있습니다…").getAttribute("aria-live")).toBe("polite");
    const signal = weather.mock.calls[0][0];
    view.unmount();
    expect(signal.aborted).toBe(true);
  });
});
