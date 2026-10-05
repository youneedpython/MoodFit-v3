import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter, createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { AppLayout } from "../../app/AppLayout";
import { routes } from "../../app/router";
import { initializeInstall, resetInstallForTests } from "./installStore";
import { InstallAppButton } from "./InstallAppButton";

function offer(outcome: "accepted" | "dismissed" = "accepted") {
  const prompt = vi.fn(async () => {});
  const event = Object.assign(new Event("beforeinstallprompt", { cancelable: true }), {
    prompt, userChoice: Promise.resolve({ outcome })
  });
  act(() => { window.dispatchEvent(event); });
  return { prompt, event };
}
beforeEach(() => { resetInstallForTests(); initializeInstall(); });
afterEach(() => { resetInstallForTests(); });
function footer() { render(<MemoryRouter><AppLayout /></MemoryRouter>); }
describe("install", () => {
  it("captures an early event and consumes it once on acceptance", async () => {
    const { prompt, event } = offer();
    expect(event.defaultPrevented).toBe(true);
    footer();
    const button = within(screen.getByRole("contentinfo")).getByRole("button", { name: "앱 설치" });
    expect(button.classList.contains("button--secondary")).toBe(true);
    fireEvent.click(button);
    expect((button as HTMLButtonElement).disabled).toBe(true);
    await waitFor(() => expect(screen.queryByRole("button", { name: "앱 설치" })).toBeNull());
    expect(prompt).toHaveBeenCalledTimes(1);
  });
  it("receives late events, dismisses, offers again and hides on appinstalled", async () => {
    footer();
    expect(screen.queryByRole("button", { name: "앱 설치" })).toBeNull();
    const { prompt } = offer("dismissed");
    fireEvent.click(screen.getByRole("button", { name: "앱 설치" }));
    await waitFor(() => expect(screen.queryByRole("button", { name: "앱 설치" })).toBeNull());
    expect(prompt).toHaveBeenCalledTimes(1);
    offer();
    expect(screen.getByRole("button", { name: "앱 설치" })).toBeTruthy();
    act(() => { window.dispatchEvent(new Event("appinstalled")); });
    expect(screen.queryByRole("button", { name: "앱 설치" })).toBeNull();
  });
  it("hides in standalone even when an event arrives", () => {
    resetInstallForTests();
    vi.stubGlobal("matchMedia", () => ({ matches: true }));
    initializeInstall(); offer(); footer();
    expect(screen.queryByRole("button", { name: "앱 설치" })).toBeNull();
  });
  it.each(["iPhone", "iPad", "Macintosh"])("shows accessible instructions on %s", (ua) => {
    resetInstallForTests();
    vi.spyOn(navigator, "userAgent", "get").mockReturnValue(ua);
    vi.stubGlobal("navigator", { userAgent: ua, maxTouchPoints: 5 });
    initializeInstall();
    render(<InstallAppButton />);
    const trigger = screen.getByRole("button", { name: "앱 설치" });
    fireEvent.click(trigger);
    const dialog = screen.getByRole("dialog", { name: "홈 화면에 추가" });
    expect(dialog.getAttribute("aria-modal")).toBe("true");
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "닫기" }));
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull(); expect(document.activeElement).toBe(trigger);
    fireEvent.click(trigger); fireEvent.click(screen.getByRole("button", { name: "닫기" }));
    expect(document.activeElement).toBe(trigger);
    fireEvent.click(trigger); fireEvent.click(screen.getByRole("dialog").parentElement!);
    expect(screen.queryByRole("dialog")).toBeNull();
  });
  it.each([false, true])("orders the avatar menu and closes for a prompt: %s", async (available) => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ authenticated: true,
      user: { id: 1, displayName: "테스트", provider: "google" }, providers: [], guestEnabled: true }), { status: 200 })));
    if (available) offer();
    render(<RouterProvider router={createMemoryRouter(routes, { initialEntries: ["/history"] })} />);
    fireEvent.click(await screen.findByRole("button", { name: "테스트 사용자 메뉴" }));
    const menu = screen.getByRole("menu");
    const items = within(menu).getAllByRole("menuitem");
    expect(items.map((item) => item.textContent)).toEqual(available ?
      ["개인정보 처리 안내", "앱 설치", "로그아웃", "회원 탈퇴"] : ["개인정보 처리 안내", "로그아웃", "회원 탈퇴"]);
    if (available) {
      fireEvent.click(within(menu).getByRole("menuitem", { name: "앱 설치" }));
      expect(screen.queryByRole("menu")).toBeNull();
      await waitFor(() => expect(screen.queryByRole("button", { name: "앱 설치" })).toBeNull());
    } else expect(screen.queryByRole("button", { name: "앱 설치" })).toBeNull();
  });
  it("validates the manifest and HTML through filesystem reads", () => {
    const manifest = JSON.parse(readFileSync(resolve(process.cwd(), "public/app.webmanifest"), "utf8"));
    expect(manifest).toMatchObject({ name: "MoodFit", start_url: "/", display: "standalone", id: "/", scope: "/" });
    expect(manifest.icons).toContainEqual({ src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" });
    const html = readFileSync(resolve(process.cwd(), "index.html"), "utf8");
    expect(html).toContain('href="/app.webmanifest"');
    expect(html).toContain(`name="description" content="${manifest.description}"`);
  });
});
