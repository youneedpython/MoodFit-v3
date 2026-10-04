import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AUTO_WEATHER_KEY, WEATHER_TIMEOUT_MS } from "../../services/weather";
import { CHECKIN_CREATED } from "../../contracts/contracts";
import { CheckinPage } from "./CheckinPage";

vi.mock("../dashboard/useRecommendationFeedback", () => ({
  useRecommendationFeedback: () => ({ data: null, error: "", pending: [], toggle: vi.fn() })
}));

beforeEach(() => localStorage.clear());
afterEach(() => { localStorage.clear(); vi.useRealTimers(); });
const weatherBody = { current: { temperature_2m: 23.26, weather_code: 71 } };
function setup(code?: number, regionFails = false, weatherFails = false) {
  const location = vi.fn((success: PositionCallback, failure: PositionErrorCallback) => {
    if (code) failure({ code } as GeolocationPositionError);
    else success({ coords: { latitude: 37.5665, longitude: 126.978 } } as GeolocationPosition);
  });
  vi.stubGlobal("navigator", { geolocation: { getCurrentPosition: location } });
  const fetchMock = vi.fn(async (url: string, _options?: RequestInit): Promise<Response> => {
    if (url.includes("bigdatacloud")) {
      if (regionFails) throw new Error();
      return new Response(JSON.stringify({ principalSubdivision: "서울특별시", locality: "명동" }));
    }
    if (url.includes("open-meteo")) return new Response(JSON.stringify(weatherBody), { status: weatherFails ? 503 : 200 });
    return new Response(JSON.stringify(CHECKIN_CREATED));
  });
  vi.stubGlobal("fetch", fetchMock);
  render(<MemoryRouter><CheckinPage /></MemoryRouter>);
  return { location, fetchMock };
}
const temperature = () => screen.getByLabelText(/기온/) as HTMLInputElement;
const manual = () => fireEvent.click(screen.getByRole("button", { name: "직접 입력" }));
const automatic = () => fireEvent.click(screen.getByRole("button", { name: "자동으로 가져오기" }));

describe("Check-in weather modes", () => {
  it.each([false, true])("sends the fetched region, including after manual edits: %s", async (edit) => {
    const { fetchMock } = setup();
    await screen.findByText("서울특별시 명동 · 눈 · 23.3°C");
    if (edit) {
      manual();
      fireEvent.change(temperature(), { target: { value: "21" } });
      fireEvent.click(screen.getByLabelText("비"));
    }
    for (const [label, value] of [["심박수", "68"], ["호흡수", "18"], ["수면 점수", "86"], ["스트레스 수준", "31"], ["에너지 수준", "74"]]) {
      fireEvent.change(screen.getByLabelText(new RegExp(label)), { target: { value } });
    }
    fireEvent.click(screen.getByRole("button", { name: "분석 요청" }));
    await screen.findByText("Check-in이 저장되었습니다.");
    const request = JSON.parse(fetchMock.mock.calls.find(([url]) => url === "/api/check-ins")![1]?.body as string);
    expect(request.region).toBe("서울특별시 명동");
    expect(request.temperature).toBe(edit ? 21 : 23.3);
    expect(Object.keys(request).sort()).toEqual(["region", "energyLevel", "heartRate", "respiratoryRate", "sleepScore", "stressLevel", "temperature", "weather"].sort());
  });

  it.each([false, true])("omits region for fallback or initial manual mode: %s", async (initialManual) => {
    if (initialManual) localStorage.setItem(AUTO_WEATHER_KEY, "false");
    const { fetchMock } = setup(undefined, true);
    if (!initialManual) {
      await screen.findByText("현재 위치 · 눈 · 23.3°C");
      manual();
    }
    for (const [label, value] of [["심박수", "68"], ["호흡수", "18"], ["수면 점수", "86"], ["스트레스 수준", "31"], ["에너지 수준", "74"], ["기온", "19"]]) {
      fireEvent.change(screen.getByLabelText(new RegExp(label)), { target: { value } });
    }
    fireEvent.click(screen.getByLabelText("비"));
    fireEvent.click(screen.getByRole("button", { name: "분석 요청" }));
    await screen.findByText("Check-in이 저장되었습니다.");
    const request = JSON.parse(fetchMock.mock.calls.find(([url]) => url === "/api/check-ins")![1]?.body as string);
    expect(request).not.toHaveProperty("region");
    fireEvent.click(screen.getByRole("button", { name: "새로 입력하기" }));
    expect(temperature().value).toBe("");
  });
  it("shows existing validation guidance before automatic weather is available", async () => {
    setup();
    fireEvent.click(screen.getByRole("button", { name: "분석 요청" }));
    expect(screen.getAllByText("값을 입력해 주세요.").length).toBeGreaterThan(0);
    expect(screen.getByText("날씨를 선택해 주세요.")).toBeTruthy();
    await act(async () => {});
  });
  it("defaults to automatic and summarizes region, weather and temperature", async () => {
    const { location } = setup();
    await screen.findByText("서울특별시 명동 · 눈 · 23.3°C");
    expect(location).toHaveBeenCalledTimes(1);
    expect(screen.queryByLabelText(/기온/)).toBeNull();
    expect(localStorage.length).toBe(0);
    manual();
    expect(temperature().value).toBe("23.3");
    expect((screen.getByLabelText("눈") as HTMLInputElement).checked).toBe(true);
    expect(localStorage.getItem(AUTO_WEATHER_KEY)).toBe("false");
    fireEvent.change(temperature(), { target: { value: "21" } });
    expect(temperature().value).toBe("21");
  });
  it("preserves false until explicitly selecting automatic", async () => {
    localStorage.setItem(AUTO_WEATHER_KEY, "false");
    const { location } = setup();
    expect(temperature().value).toBe("");
    expect(location).not.toHaveBeenCalled();
    automatic();
    await screen.findByText("서울특별시 명동 · 눈 · 23.3°C");
    expect(localStorage.getItem(AUTO_WEATHER_KEY)).toBe("true");
    expect(localStorage.length).toBe(1);
  });
  it("uses a neutral region when the region service fails", async () => {
    setup(undefined, true);
    await screen.findByText("현재 위치 · 눈 · 23.3°C");
  });
  it.each([1, 2, 3])("falls back to editable fields on location error %s", async (code) => {
    setup(code);
    expect((await screen.findByRole("alert")).textContent).toContain("직접 입력");
    expect(temperature().disabled).toBe(false);
    fireEvent.change(temperature(), { target: { value: "18" } });
    fireEvent.click(screen.getByLabelText("맑음"));
    expect(temperature().value).toBe("18");
    expect(localStorage.getItem(AUTO_WEATHER_KEY)).toBe(code === 1 ? "false" : null);
  });
  it("preserves automatic preference after API failure and submits without location data", async () => {
    localStorage.setItem(AUTO_WEATHER_KEY, "true");
    const { fetchMock } = setup(undefined, false, true);
    await screen.findByRole("alert");
    expect(localStorage.getItem(AUTO_WEATHER_KEY)).toBe("true");
    for (const [label, value] of [["심박수", "68"], ["호흡수", "18"], ["수면 점수", "86"], ["스트레스 수준", "31"], ["에너지 수준", "74"], ["기온", "19"]]) {
      fireEvent.change(screen.getByLabelText(new RegExp(label)), { target: { value } });
    }
    fireEvent.click(screen.getByLabelText("비"));
    fireEvent.click(screen.getByRole("button", { name: "분석 요청" }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(3));
    const request = JSON.parse(fetchMock.mock.calls[2][1]?.body as string);
    expect(request.temperature).toBe(19);
    expect(request.weather).toBe("RAIN");
    expect(Object.keys(request).sort()).toEqual(["energyLevel", "heartRate", "respiratoryRate", "sleepScore", "stressLevel", "temperature", "weather"].sort());
  });
  it("does not overwrite manual input when an aborted response arrives late", async () => {
    localStorage.setItem(AUTO_WEATHER_KEY, "false");
    const { fetchMock } = setup();
    const pending: ((response: Response) => void)[] = [];
    fetchMock.mockImplementation(() => new Promise<Response>((done) => { pending.push(done); }));
    automatic();
    await act(async () => {});
    manual();
    fireEvent.change(temperature(), { target: { value: "18" } });
    fireEvent.click(screen.getByLabelText("비"));
    await act(async () => { pending.forEach((done) => done(new Response(JSON.stringify(weatherBody)))); });
    expect(temperature().value).toBe("18");
    expect((screen.getByLabelText("비") as HTMLInputElement).checked).toBe(true);
  });
  it("falls back on weather timeout without persisting manual mode", async () => {
    vi.useFakeTimers();
    const { fetchMock } = setup();
    fetchMock.mockImplementation((_url, options) => new Promise<Response>((_resolve, reject) => {
      options?.signal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")));
    }));
    await act(async () => { await vi.advanceTimersByTimeAsync(WEATHER_TIMEOUT_MS); });
    vi.useRealTimers();
    expect((await screen.findByRole("alert")).textContent).toContain("시간");
    expect(temperature().disabled).toBe(false);
    expect(localStorage.getItem(AUTO_WEATHER_KEY)).toBeNull();
  });
});
