import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { StrictMode } from "react";
import { InsightCard } from "./InsightCard";
import type { AuthState } from "../auth/AuthProvider";
import disabled from "../../../../contracts/insight-disabled-200.json";
import generated from "../../../../contracts/insight-generated-200.json";
import weekly from "../../../../contracts/weekly-generated-200.json";
import insufficient from "../../../../contracts/weekly-insufficient-422.json";
import limited from "../../../../contracts/insight-limit-429.json";

const auth = vi.hoisted(() => ({ state: { authenticated: true, user: { id: 2, displayName: "사용자", provider: "google" }, providers: [], guestEnabled: true } as AuthState }));
vi.mock("../auth/AuthProvider", () => ({ useAuth: () => auth }));
function response(body: unknown, status = 200) { return new Response(JSON.stringify(body), { status }); }
function login(provider: "google" | "guest" = "google") { auth.state.user = { id: provider === "guest" ? 1 : 2, displayName: "사용자", provider }; }

describe("AI 코멘트와 주간 리포트", () => {
  it("hides disabled functionality", async () => {
    login(); const fetchMock = vi.fn().mockResolvedValue(response(disabled)); vi.stubGlobal("fetch", fetchMock);
    render(<InsightCard checkinId={1} autoGenerate />);
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(screen.queryByText("AI 코멘트")).toBeNull();
  });
  it("shows a social-login notice to guest accounts without generating", async () => {
    login("guest"); const fetchMock = vi.fn().mockResolvedValue(response({ ...disabled, enabled: true })); vi.stubGlobal("fetch", fetchMock);
    render(<InsightCard checkinId={1} autoGenerate />);
    expect(await screen.findByText("소셜 로그인 후 이용할 수 있습니다")).toBeTruthy();
    expect(screen.queryByRole("button")).toBeNull(); expect(fetchMock).toHaveBeenCalledTimes(1);
  });
  it("automatically generates once in the result view, even in StrictMode", async () => {
    login(); const fetchMock = vi.fn((_url: string, init: RequestInit) => Promise.resolve(response(init.method === "POST" ? generated : { ...disabled, enabled: true, available: true })));
    vi.stubGlobal("fetch", fetchMock);
    render(<StrictMode><InsightCard checkinId={1} autoGenerate /></StrictMode>);
    expect(await screen.findByText(generated.text)).toBeTruthy();
    expect(fetchMock.mock.calls.filter(([, init]) => init.method === "POST")).toHaveLength(1);
    expect(screen.getByText(/의학적 조언이 아닙니다/)).toBeTruthy();
  });
  it("automatically attempts once after null failure and retries only on click", async () => {
    login(); const fetchMock = vi.fn().mockImplementation(() => Promise.resolve(response({ ...disabled, enabled: true, available: true }))); vi.stubGlobal("fetch", fetchMock);
    const view = render(<StrictMode><InsightCard checkinId={1} autoGenerate /></StrictMode>);
    expect(await screen.findByText("지금은 AI 코멘트를 만들 수 없습니다")).toBeTruthy();
    view.rerender(<StrictMode><InsightCard checkinId={1} autoGenerate /></StrictMode>);
    expect(fetchMock.mock.calls.filter(([, init]) => init.method === "POST")).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: "다시 시도" }));
    await waitFor(() => expect(fetchMock.mock.calls.filter(([, init]) => init.method === "POST")).toHaveLength(2));
  });
  it("reads saved text with React escaping without regeneration", async () => {
    login(); const fetchMock = vi.fn().mockResolvedValue(response({ ...generated, text: "<script>문장</script>" })); vi.stubGlobal("fetch", fetchMock);
    const view = render(<InsightCard checkinId={1} autoGenerate />);
    expect(await screen.findByText("<script>문장</script>")).toBeTruthy();
    expect(view.container.querySelector("script")).toBeNull(); expect(fetchMock).toHaveBeenCalledTimes(1);
  });
  it.each([403, 429, "network"] as const)("자동 생성 실패 %s 뒤 반복 없이 수동 재시도를 제공한다", async (status) => {
    login();
    const fetchMock = vi.fn((_url: string, init: RequestInit) => {
      if (init.method !== "POST") return Promise.resolve(response({ ...disabled, enabled: true, available: true }));
      return status === "network" ? Promise.reject(new TypeError("Network failure"))
        : Promise.resolve(response({ code: "FAILED", message: "실패" }, status));
    });
    vi.stubGlobal("fetch", fetchMock);
    const view = render(<StrictMode><InsightCard checkinId={1} autoGenerate /></StrictMode>);
    expect(await screen.findByRole("alert")).toBeTruthy();
    expect(screen.getByRole("button", { name: "다시 시도" })).toBeTruthy();
    view.rerender(<StrictMode><InsightCard checkinId={1} autoGenerate /></StrictMode>);
    expect(fetchMock.mock.calls.filter(([, init]) => init.method === "POST")).toHaveLength(1);
  });
  it("shows generation progress and does not expose a second request while pending", async () => {
    login(); let finish: (value: Response) => void = () => undefined;
    vi.stubGlobal("fetch", vi.fn((_url: string, init: RequestInit) => init.method === "POST"
      ? new Promise<Response>((resolve) => { finish = resolve; })
      : Promise.resolve(response({ ...disabled, enabled: true, available: true }))));
    render(<InsightCard checkinId={1} autoGenerate />);
    expect(await screen.findByRole("status")).toBeTruthy();
    expect(screen.queryByRole("button")).toBeNull();
    await act(async () => finish(response(generated)));
    expect(await screen.findByText(generated.text)).toBeTruthy();
  });
  it("displays weekly period, regeneration, minimum and quota errors", async () => {
    login(); const fetchMock = vi.fn().mockResolvedValueOnce(response(weekly)).mockResolvedValueOnce(response(insufficient, 422)).mockResolvedValueOnce(response(limited, 429));
    vi.stubGlobal("fetch", fetchMock); render(<InsightCard weekly />);
    expect(await screen.findByText(weekly.text)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "주간 리포트 다시 만들기" }));
    expect(await screen.findByText("최근 7일 기록이 3건 이상 필요합니다.")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "주간 리포트 다시 만들기" }));
    expect(await screen.findByText(/오늘의 AI 생성 한도/)).toBeTruthy();
  });
  it("preserves the saved weekly report when regeneration returns null", async () => {
    login();
    const fetchMock = vi.fn().mockResolvedValueOnce(response(weekly))
      .mockResolvedValueOnce(response({ ...weekly, text: null, generatedAt: null }));
    vi.stubGlobal("fetch", fetchMock); render(<InsightCard weekly />);
    expect(await screen.findByText(weekly.text)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "주간 리포트 다시 만들기" }));
    expect(await screen.findByText("지금은 주간 리포트를 만들 수 없습니다")).toBeTruthy();
    expect(screen.getByText(weekly.text)).toBeTruthy();
    expect(screen.getByText(`${weekly.periodStart} ~ ${weekly.periodEnd} · ${weekly.recordCount}건`)).toBeTruthy();
    expect(screen.getByRole("button", { name: "주간 리포트 다시 만들기" })).toBeTruthy();
  });
  it("does not replace a new record with an older pending response", async () => {
    login(); let resolveOld: (value: Response) => void = () => undefined;
    const fetchMock = vi.fn().mockImplementationOnce(() => new Promise<Response>((resolve) => { resolveOld = resolve; })).mockResolvedValueOnce(response(generated));
    vi.stubGlobal("fetch", fetchMock); const view = render(<InsightCard checkinId={1} />);
    view.rerender(<InsightCard checkinId={2} />);
    expect(await screen.findByText(generated.text)).toBeTruthy();
    await act(async () => resolveOld(response({ ...generated, text: "예전 기록" })));
    expect(screen.queryByText("예전 기록")).toBeNull();
  });
});
