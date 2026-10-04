import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AUTO_WEATHER_KEY, WEATHER_TIMEOUT_MS } from "../../services/weather";
import { CheckinPage } from "./CheckinPage";

beforeEach(() => localStorage.clear());
afterEach(() => { localStorage.clear(); vi.useRealTimers(); });
function setup(state: PermissionState | "unsupported" = "prompt", locationError?: number, queryThrows = false, permission?: Promise<{ state: PermissionState }>) {
  const location = vi.fn((success: PositionCallback, failure: PositionErrorCallback) => {
    if (locationError) failure({ code: locationError } as GeolocationPositionError);
    else success({ coords: { latitude: 37.5665, longitude: 126.978 } } as GeolocationPosition);
  });
  const query = vi.fn().mockResolvedValue({ state });
  if (permission) query.mockReturnValue(permission);
  if (queryThrows) query.mockImplementation(() => { throw new TypeError("Unsupported permission"); });
  vi.stubGlobal("navigator", { geolocation: { getCurrentPosition: location }, ...(state === "unsupported" ? {} : { permissions: { query } }) });
  const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ current: { temperature_2m: 23.26, weather_code: 71 } })));
  vi.stubGlobal("fetch", fetchMock);
  render(<MemoryRouter><CheckinPage /></MemoryRouter>);
  return { location, query, fetchMock };
}
const button = () => screen.getByRole("button", { name: "현재 위치 날씨 가져오기" });
const temperature = () => screen.getByLabelText(/기온/) as HTMLInputElement;
const toggle = () => screen.getByRole("checkbox") as HTMLInputElement;

describe("Check-in weather autofill", () => {
  it("fills both inputs, enables persisted preference and allows editing", async () => {
    setup(); fireEvent.click(button());
    await screen.findByText(/현재 위치의 날씨를 가져왔습니다/);
    expect(temperature().value).toBe("23.3");
    expect((screen.getByLabelText("눈") as HTMLInputElement).checked).toBe(true);
    expect(toggle().checked).toBe(true);
    expect(localStorage.getItem(AUTO_WEATHER_KEY)).toBe("true");
    expect(localStorage.length).toBe(1);
    expect(screen.getByRole("link", { name: "Open-Meteo" }).getAttribute("href")).toBe("https://open-meteo.com/");
    fireEvent.change(temperature(), { target: { value: "21" } });
    expect(temperature().value).toBe("21");
  });
  it("automatically loads only with saved preference and granted permission", async () => {
    localStorage.setItem(AUTO_WEATHER_KEY, "true");
    const { location } = setup("granted");
    await waitFor(() => expect(temperature().value).toBe("23.3"));
    expect(location).toHaveBeenCalledTimes(1);
  });
  it.each(["prompt", "denied", "unsupported"] as const)("does not automatically request location for %s", async (state) => {
    localStorage.setItem(AUTO_WEATHER_KEY, "true");
    const { location } = setup(state);
    await act(async () => {});
    expect(location).not.toHaveBeenCalled();
  });
  it("does not automatically load without saved preference", async () => {
    const { location } = setup("granted"); await act(async () => {});
    expect(location).not.toHaveBeenCalled();
  });
  it("keeps button-only behavior when permission query throws synchronously", async () => {
    localStorage.setItem(AUTO_WEATHER_KEY, "true");
    const { location } = setup("granted", undefined, true);
    await act(async () => {});
    expect(location).not.toHaveBeenCalled();
    fireEvent.click(button());
    await waitFor(() => expect(temperature().value).toBe("23.3"));
    expect(location).toHaveBeenCalledTimes(1);
  });
  it("does not repeat a successful manual lookup when the permission reply arrives late", async () => {
    localStorage.setItem(AUTO_WEATHER_KEY, "true");
    let resolve!: (value: { state: PermissionState }) => void;
    const permission = new Promise<{ state: PermissionState }>((done) => { resolve = done; });
    const { location } = setup("granted", undefined, false, permission);
    fireEvent.click(button());
    await screen.findByText(/현재 위치의 날씨를 가져왔습니다/);
    await act(async () => { resolve({ state: "granted" }); });
    expect(location).toHaveBeenCalledTimes(1);
  });
  it.each([1, 2, 3])("keeps manual input available on location failure %s", async (code) => {
    setup("prompt", code); fireEvent.click(button());
    expect((await screen.findByRole("alert")).textContent).toContain("직접 입력");
    expect(temperature().disabled).toBe(false);
    fireEvent.change(temperature(), { target: { value: "18" } });
    fireEvent.click(screen.getByLabelText("맑음"));
    expect(temperature().value).toBe("18");
    expect(button().hasAttribute("disabled")).toBe(false);
  });
  it.each(["http", "shape", "timeout"])("shows guidance and keeps manual input on API %s", async (kind) => {
    const { fetchMock } = setup();
    if (kind === "timeout") {
      vi.useFakeTimers();
      fetchMock.mockImplementation((_url, { signal }: RequestInit) => new Promise((_resolve, reject) => signal?.addEventListener("abort", () => reject(new Error()))));
    } else fetchMock.mockResolvedValue(new Response("{}", { status: kind === "http" ? 500 : 200 }));
    fireEvent.click(button());
    if (kind === "timeout") { await act(async () => { await vi.advanceTimersByTimeAsync(WEATHER_TIMEOUT_MS); }); vi.useRealTimers(); }
    expect((await screen.findByRole("alert")).textContent).toContain("직접 입력");
    expect(temperature().disabled).toBe(false);
    expect(temperature().value).toBe("");
  });
  it("preserves edits before and during a delayed request, including cleared values", async () => {
    const { fetchMock } = setup();
    let resolve!: (value: Response) => void;
    fetchMock.mockImplementation(() => new Promise<Response>((done) => { resolve = done; }));
    fireEvent.change(temperature(), { target: { value: "18" } });
    fireEvent.click(button());
    expect(screen.getByRole("button", { name: "날씨 조회 중..." }).hasAttribute("disabled")).toBe(true);
    fireEvent.change(temperature(), { target: { value: "" } });
    fireEvent.click(screen.getByLabelText("비"));
    await act(async () => {});
    await act(async () => { resolve(new Response(JSON.stringify({ current: { temperature_2m: 23, weather_code: 0 } }))); });
    expect(temperature().value).toBe("");
    expect((screen.getByLabelText("비") as HTMLInputElement).checked).toBe(true);
    expect(screen.getByRole("status").textContent).toContain("유지");
  });
  it("persists disabling and cancels in-flight automatic fill", async () => {
    localStorage.setItem(AUTO_WEATHER_KEY, "true");
    const { fetchMock } = setup("granted");
    fetchMock.mockImplementation((_url, { signal }: RequestInit) => new Promise((_resolve, reject) => signal?.addEventListener("abort", () => reject(new Error()))));
    await screen.findByRole("button", { name: "날씨 조회 중..." });
    fireEvent.click(toggle());
    expect(toggle().checked).toBe(false);
    expect(localStorage.getItem(AUTO_WEATHER_KEY)).toBe("false");
    expect(temperature().value).toBe("");
    expect(button().hasAttribute("disabled")).toBe(false);
  });
});
