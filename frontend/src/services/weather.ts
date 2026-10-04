import type { WeatherCondition } from "../types/api";

export const WEATHER_TIMEOUT_MS = 10000;
export const AUTO_WEATHER_KEY = "moodfit.autoWeather";
export type LocalWeather = { temperature: number; weather: WeatherCondition };
export class WeatherError extends Error {}

// Open-Meteo WMO table: fog joins CLOUDY, drizzle/showers/thunderstorms join RAIN.
// Only documented codes are accepted; gaps in numeric ranges are not weather codes.
export function mapWeatherCode(code: number): WeatherCondition {
  if ([0, 1].includes(code)) return "CLEAR";
  if ([2, 3, 45, 48].includes(code)) return "CLOUDY";
  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99].includes(code)) return "RAIN";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "SNOW";
  throw new WeatherError("지원하지 않는 날씨 응답입니다. 직접 입력해 주세요.");
}

export function roundCoordinate(value: number, bound: number): number {
  if (!Number.isFinite(value) || Math.abs(value) > bound) {
    throw new WeatherError("위치를 확인하지 못했습니다. 직접 입력해 주세요.");
  }
  return Math.round(value * 10) / 10;
}

export function parseWeather(body: unknown): LocalWeather {
  const current = (body as { current?: { temperature_2m?: unknown; weather_code?: unknown } } | null)?.current;
  const temperature = current?.temperature_2m;
  const code = current?.weather_code;
  if (typeof temperature !== "number" || !Number.isFinite(temperature) || typeof code !== "number") {
    throw new WeatherError("날씨 응답 형식이 올바르지 않습니다. 직접 입력해 주세요.");
  }
  if (temperature < -30 || temperature > 50) {
    throw new WeatherError("조회한 기온이 입력 범위(-30 ~ 50°C)를 벗어났습니다. 직접 입력해 주세요.");
  }
  return { temperature: Math.round(temperature * 10) / 10, weather: mapWeatherCode(code) };
}

export function readAutoWeather(): boolean {
  try { return localStorage.getItem(AUTO_WEATHER_KEY) === "true"; } catch { return false; }
}
export function saveAutoWeather(enabled: boolean): boolean {
  try { localStorage.setItem(AUTO_WEATHER_KEY, String(enabled)); return true; } catch { return false; }
}

export async function fetchLocalWeather(signal: AbortSignal): Promise<LocalWeather> {
  if (!navigator.geolocation) throw new WeatherError("위치 조회를 지원하지 않는 브라우저입니다. 직접 입력해 주세요.");
  const coords = await new Promise<{ latitude: number; longitude: number }>((resolve, reject) => {
    let settled = false;
    const finish = (action: () => void) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      signal.removeEventListener("abort", abort);
      action();
    };
    const abort = () => finish(() => reject(new DOMException("Aborted", "AbortError")));
    const timer = setTimeout(() => finish(() => reject(new WeatherError("위치 조회 시간이 초과되었습니다. 직접 입력해 주세요."))), WEATHER_TIMEOUT_MS);
    signal.addEventListener("abort", abort, { once: true });
    if (signal.aborted) { abort(); return; }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => finish(() => {
        try { resolve({ latitude: roundCoordinate(coords.latitude, 90), longitude: roundCoordinate(coords.longitude, 180) }); }
        catch (error) { reject(error); }
      }),
      (error) => finish(() => reject(new WeatherError(error.code === 1
        ? "위치 권한이 거부되었습니다. 브라우저 설정을 확인하거나 직접 입력해 주세요."
        : error.code === 3 ? "위치 조회 시간이 초과되었습니다. 직접 입력해 주세요."
        : "위치를 확인하지 못했습니다. 직접 입력해 주세요."))),
      { enableHighAccuracy: false, timeout: WEATHER_TIMEOUT_MS, maximumAge: 0 }
    );
  });
  if (signal.aborted) throw new DOMException("Aborted", "AbortError");
  const controller = new AbortController();
  const abort = () => controller.abort();
  signal.addEventListener("abort", abort, { once: true });
  const timer = setTimeout(abort, WEATHER_TIMEOUT_MS);
  try {
    const query = new URLSearchParams({ latitude: String(coords.latitude), longitude: String(coords.longitude), current: "temperature_2m,weather_code", temperature_unit: "celsius" });
    const response = await fetch(`https://api.open-meteo.com/v1/forecast?${query}`, { signal: controller.signal, credentials: "omit", referrerPolicy: "no-referrer" });
    if (!response.ok) throw new WeatherError("날씨 서비스를 이용할 수 없습니다. 직접 입력해 주세요.");
    return parseWeather(await response.json());
  } catch (error) {
    if (signal.aborted) throw new DOMException("Aborted", "AbortError");
    if (error instanceof WeatherError) throw error;
    throw new WeatherError(controller.signal.aborted ? "날씨 조회 시간이 초과되었습니다. 직접 입력해 주세요." : "날씨 응답을 가져오지 못했습니다. 직접 입력해 주세요.");
  } finally {
    clearTimeout(timer);
    signal.removeEventListener("abort", abort);
  }
}
