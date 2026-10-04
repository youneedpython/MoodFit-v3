import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { describe, expect, it, vi } from "vitest";
import { routes } from "../../app/router";

function setup(path: string, provider: "google" | "guest" | null = null) {
  let authenticated = provider !== null;
  const fetchMock = vi.fn(async (url: string) => {
    if (url === "/api/auth/me") return new Response(JSON.stringify({ authenticated, user: authenticated ? { id: 2, displayName: "테스트", provider } : null, providers: ["google"], guestEnabled: true }));
    if (url === "/api/auth/account") { authenticated = false; return new Response(null, { status: 204 }); }
    return new Response(JSON.stringify({ code: "CHECKIN_NOT_FOUND", message: "No records", fieldErrors: {} }), { status: 404 });
  });
  vi.stubGlobal("fetch", fetchMock);
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  render(<RouterProvider router={router} />);
  return { router, fetchMock };
}
describe("privacy and account deletion", () => {
  it("opens privacy without authentication even when bootstrap is unavailable", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    const router = createMemoryRouter(routes, { initialEntries: ["/privacy"] });
    render(<RouterProvider router={router} />);
    expect(screen.getByRole("heading", { name: "개인정보 처리 안내", level: 1 })).toBeTruthy();
    await waitFor(() => expect(router.state.location.pathname).toBe("/privacy"));
    expect(screen.getAllByRole("columnheader")).toHaveLength(4);
    expect(screen.getByText(/국외 Region/)).toBeTruthy();
    expect(screen.getByRole("link", { name: /GitHub Issue/ }).getAttribute("rel")).toContain("noopener");
  });
  it("links from login and the footer", async () => {
    setup("/login");
    await screen.findByRole("heading", { name: "MoodFit에 로그인" });
    expect(screen.getAllByRole("link", { name: "개인정보 처리 안내" })).toHaveLength(2);
  });
  it("links from the menu and omits guest deletion", async () => {
    setup("/", "guest");
    fireEvent.click(await screen.findByRole("button", { name: "테스트 사용자 메뉴" }));
    expect(screen.getByRole("menuitem", { name: "개인정보 처리 안내" }).getAttribute("href")).toBe("/privacy");
    expect(screen.queryByRole("menuitem", { name: "내 데이터 삭제" })).toBeNull();
  });
  it("defaults to cancel, traps focus, closes with cancel/Escape and deletes after confirmation", async () => {
    const { router, fetchMock } = setup("/", "google");
    const avatar = await screen.findByRole("button", { name: "테스트 사용자 메뉴" });
    const open = () => { fireEvent.click(avatar); fireEvent.click(screen.getByRole("menuitem", { name: "내 데이터 삭제" })); };
    open();
    let dialog = screen.getByRole("dialog");
    expect(dialog.getAttribute("aria-modal")).toBe("true");
    expect(dialog.textContent).toContain("되돌릴 수 없습니다");
    const cancel = within(dialog).getByRole("button", { name: "취소" });
    expect(document.activeElement).toBe(cancel);
    avatar.focus();
    expect(document.activeElement).toBe(cancel);
    fireEvent.keyDown(cancel, { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(within(dialog).getByRole("button", { name: "삭제" }));
    fireEvent.keyDown(document.activeElement!, { key: "Tab" });
    expect(document.activeElement).toBe(cancel);
    fireEvent.click(cancel);
    expect(screen.queryByRole("dialog")).toBeNull(); expect(document.activeElement).toBe(avatar);
    open(); fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.activeElement).toBe(avatar);
    expect(fetchMock.mock.calls.filter(([url]) => url === "/api/auth/account")).toHaveLength(0);
    open(); dialog = screen.getByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: "삭제" }));
    await screen.findByText(/계정과 기록을 삭제했습니다/);
    expect(router.state.location.pathname).toBe("/login");
    expect(fetchMock).toHaveBeenCalledWith("/api/auth/account", expect.objectContaining({ method: "DELETE", credentials: "same-origin" }));
  });
});
