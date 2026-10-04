import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchLocalWeather, mapWeatherCode, parseWeather, parseRegion, roundCoordinate, WEATHER_TIMEOUT_MS } from "./weather";

afterEach(() => vi.useRealTimers());
const body = { current: { temperature_2m: 19.26, weather_code: 61 } };
function locationMock(code?: number) {
  const getCurrentPosition = vi.fn((success: PositionCallback, failure: PositionErrorCallback) => {
    if (code) failure({ code } as GeolocationPositionError);
    else success({ coords: { latitude: 37.5665, longitude: 126.978 } } as GeolocationPosition);
  });
  vi.stubGlobal("navigator", { geolocation: { getCurrentPosition } });
  return getCurrentPosition;
}

describe("weather service", () => {
  it("validates, deduplicates and bounds region parts", () => {
    expect(parseRegion({ principalSubdivision: "서울", locality: "명동" })).toBe("서울 명동");
    expect(parseRegion({ principalSubdivision: "서울", locality: " 서울 " })).toBe("서울");
    expect(parseRegion({ principalSubdivision: 42, locality: " " })).toBe("현재 위치");
    expect(parseRegion(null)).toBe("현재 위치");
    expect(parseRegion({ locality: "가".repeat(100) })).toHaveLength(40);
  });
  it("maps every documented WMO code and rejects every gap", () => {
    const groups = { CLEAR: [0, 1], CLOUDY: [2, 3, 45, 48], RAIN: [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99], SNOW: [71, 73, 75, 77, 85, 86] };
    for (let code = -1; code <= 100; code++) {
      const group = Object.entries(groups).find(([, codes]) => codes.includes(code));
      if (group) expect(mapWeatherCode(code)).toBe(group[0]);
      else expect(() => mapWeatherCode(code)).toThrow();
    }
    for (const code of [NaN, Infinity, 1.5]) expect(() => mapWeatherCode(code)).toThrow();
  });
  it("rounds both hemispheres and checks coordinate bounds", () => {
    expect(roundCoordinate(37.5665, 90)).toBe(37.57);
    expect(roundCoordinate(-126.978, 180)).toBe(-126.98);
    for (const value of [NaN, Infinity, 91]) expect(() => roundCoordinate(value, 90)).toThrow();
  });
  it("validates response types and original temperature bounds before rounding", () => {
    expect(parseWeather(body)).toEqual({ temperature: 19.3, weather: "RAIN" });
    for (const temperature of [-30, 50]) expect(parseWeather({ current: { temperature_2m: temperature, weather_code: 0 } }).temperature).toBe(temperature);
    for (const temperature of [-30.01, 50.01, NaN, Infinity, "20", null]) expect(() => parseWeather({ current: { temperature_2m: temperature, weather_code: 0 } })).toThrow();
    for (const value of [null, {}, { current: {} }, { current: { temperature_2m: 20, weather_code: "0" } }]) expect(() => parseWeather(value)).toThrow();
  });
  it("sends the same rounded coordinates to both APIs and returns weather with a region fallback", async () => {
    locationMock();
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(body)));
    vi.stubGlobal("fetch", fetchMock);
    expect(await fetchLocalWeather(new AbortController().signal)).toEqual({ temperature: 19.3, weather: "RAIN", region: "현재 위치" });
    const url = new URL(fetchMock.mock.calls[1][0]);
    expect(url.origin).toBe("https://api.open-meteo.com");
    expect(url.searchParams.get("latitude")).toBe("37.57");
    expect(url.searchParams.get("longitude")).toBe("126.98");
    const regionUrl = new URL(fetchMock.mock.calls[0][0]);
    expect(regionUrl.origin).toBe("https://api.bigdatacloud.net");
    expect(regionUrl.searchParams.get("latitude")).toBe("37.57");
    expect(regionUrl.searchParams.get("longitude")).toBe("126.98");
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ credentials: "omit", referrerPolicy: "no-referrer" });
    expect(fetchMock.mock.calls[1][1]).toMatchObject({ credentials: "omit", referrerPolicy: "no-referrer" });
  });
  it("bounds a stalled region lookup without losing successful weather", async () => {
    vi.useFakeTimers(); locationMock();
    vi.stubGlobal("fetch", vi.fn((url: string) => url.includes("bigdatacloud")
      ? new Promise<Response>(() => {})
      : Promise.resolve(new Response(JSON.stringify(body)))));
    const result = fetchLocalWeather(new AbortController().signal);
    await vi.advanceTimersByTimeAsync(WEATHER_TIMEOUT_MS);
    expect(await result).toEqual({ temperature: 19.3, weather: "RAIN", region: "현재 위치" });
  });
  it.each([1, 2, 3])("reports geolocation error %s without calling weather API", async (code) => {
    locationMock(code);
    const fetchMock = vi.fn(); vi.stubGlobal("fetch", fetchMock);
    await expect(fetchLocalWeather(new AbortController().signal)).rejects.toThrow(/직접 입력/);
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it("bounds location waiting even if the browser never calls back", async () => {
    vi.useFakeTimers();
    vi.stubGlobal("navigator", { geolocation: { getCurrentPosition: vi.fn() } });
    const result = expect(fetchLocalWeather(new AbortController().signal)).rejects.toThrow(/시간/);
    await vi.advanceTimersByTimeAsync(WEATHER_TIMEOUT_MS);
    await result;
  });
  it.each(["http", "network", "json", "shape"])("rejects %s failure", async (kind) => {
    locationMock();
    vi.stubGlobal("fetch", kind === "network" ? vi.fn().mockRejectedValue(new Error()) : vi.fn().mockResolvedValue(new Response(kind === "json" ? "broken" : JSON.stringify(kind === "shape" ? {} : body), { status: kind === "http" ? 503 : 200 })));
    await expect(fetchLocalWeather(new AbortController().signal)).rejects.toThrow(/직접 입력/);
  });
  it("aborts a weather request at its deadline", async () => {
    vi.useFakeTimers(); locationMock();
    vi.stubGlobal("fetch", vi.fn((_url, { signal }: RequestInit) => new Promise((_resolve, reject) => signal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError"))))));
    const result = expect(fetchLocalWeather(new AbortController().signal)).rejects.toThrow(/시간/);
    await vi.advanceTimersByTimeAsync(WEATHER_TIMEOUT_MS);
    await result;
  });
});
