import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { describe, expect, it, vi } from "vitest";
import { routes } from "../../app/router";

function setup(path = "/history", providers: string[] = [], initiallyAuthenticated = false) {
  let authenticated = initiallyAuthenticated;
  const fetchMock = vi.fn(async (url: string) => {
    if (url === "/api/auth/me") return new Response(JSON.stringify({ authenticated, user: authenticated ? { id: 1, displayName: "체험 계정", provider: "guest" } : null, providers, guestEnabled: true }), { status: 200 });
    if (url === "/api/auth/guest") { authenticated = true; return new Response(null, { status: 204 }); }
    if (url === "/api/auth/logout") { authenticated = false; return new Response(null, { status: 204 }); }
    if (url.includes("history")) return new Response(JSON.stringify({ days: 7, items: [] }), { status: 200 });
    return new Response(JSON.stringify({ code: "CHECKIN_NOT_FOUND", message: "No records", fieldErrors: {} }), { status: 404 });
  });
  vi.stubGlobal("fetch", fetchMock);
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  render(<RouterProvider router={router} />);
  return { router, fetchMock };
}
describe("authentication", () => {
  it("redirects anonymous visitors and offers only configured providers", async () => {
    const { router } = setup("/history", ["google"]);
    expect(await screen.findByRole("heading", { name: "MoodFit에 로그인" })).toBeTruthy();
    expect(router.state.location.pathname).toBe("/login");
    expect(screen.getByRole("link", { name: "Google로 로그인" }).getAttribute("href")).toBe("/api/auth/login/google");
    expect(screen.queryByText("Kakao로 로그인")).toBeNull();
    expect(screen.queryByRole("navigation")).toBeNull();
  });
  it("uses fixed error text and guest login when providers are absent", async () => {
    setup("/login?error=untrusted-value");
    await screen.findByRole("heading", { name: "MoodFit에 로그인" });
    expect(screen.getByRole("alert").textContent).not.toContain("untrusted-value");
    expect(screen.queryByRole("link", { name: "Google로 로그인" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "로그인 없이 둘러보기" }));
    expect(await screen.findByRole("heading", { name: "Dashboard" })).toBeTruthy();
  });
  it("opens the avatar menu, closes on Escape/outside click, and logs out", async () => {
    setup("/", [], true);
    const avatar = await screen.findByRole("button", { name: "체험 계정 사용자 메뉴" });
    expect(avatar.getAttribute("aria-haspopup")).toBe("menu");
    fireEvent.click(avatar);
    expect(avatar.getAttribute("aria-expanded")).toBe("true");
    expect(screen.getByRole("menu").textContent).toContain("체험 계정");
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("menu")).toBeNull();
    expect(document.activeElement).toBe(avatar);
    fireEvent.click(avatar); fireEvent.pointerDown(document.body);
    expect(screen.queryByRole("menu")).toBeNull();
    fireEvent.click(avatar); fireEvent.click(screen.getByRole("menuitem", { name: "로그아웃" }));
    await screen.findByRole("heading", { name: "MoodFit에 로그인" });
  });
  it("clears auth state when an API reports 401", async () => {
    const { router, fetchMock } = setup("/", [], true);
    await screen.findByRole("heading", { name: "Dashboard" });
    fetchMock.mockImplementation(async () => new Response(JSON.stringify({ code: "UNAUTHENTICATED", message: "Login required", fieldErrors: {} }), { status: 401 }));
    fireEvent.click(screen.getByRole("link", { name: "History" }));
    await waitFor(() => expect(router.state.location.pathname).toBe("/login"));
  });
});
