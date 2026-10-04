import { fireEvent, render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { routes } from "./router";

function renderAt(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  render(<RouterProvider router={router} />);
  return router;
}

describe("App routes", () => {
  beforeEach(() => {
    // Route Test에서는 기록이 없는 상태로 응답한다. (Dashboard: latest 404, History: 빈 목록)
    vi.stubGlobal(
      "fetch",
      vi.fn((input: string) =>
        Promise.resolve(
          input === "/api/auth/me"
            ? new Response(JSON.stringify({ authenticated: true, user: { id: 1, displayName: "체험 계정", provider: "guest" }, providers: [], guestEnabled: true }), { status: 200 })
            : input.startsWith("/api/check-ins/history")
            ? new Response(JSON.stringify({ days: 7, items: [] }), {
                status: 200,
                headers: { "Content-Type": "application/json" }
              })
            : new Response(JSON.stringify({ code: "CHECKIN_NOT_FOUND", message: "Not found", fieldErrors: {} }), {
                status: 404,
                headers: { "Content-Type": "application/json" }
              })
        )
      )
    );
  });

  it("renders the Dashboard at / inside the common layout", async () => {
    renderAt("/");

    expect(await screen.findByRole("heading", { level: 1, name: "Dashboard" })).toBeTruthy();
    expect(screen.getByRole("navigation", { name: "주요 메뉴" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "본문으로 건너뛰기" }).getAttribute("href")).toBe("#main-content");
    expect(screen.getByRole("main").id).toBe("main-content");
  });

  it.each([
    ["/check-in", "Daily Check-in"],
    ["/history", "History"]
  ])("renders %s", async (path, heading) => {
    renderAt(path);

    expect(await screen.findByRole("heading", { level: 1, name: heading })).toBeTruthy();
  });

  it("marks only the current navigation item with aria-current", async () => {
    renderAt("/history");
    await screen.findByRole("heading", { name: "History" });

    expect(screen.getByRole("link", { name: "History" }).getAttribute("aria-current")).toBe("page");
    expect(screen.getByRole("link", { name: "Dashboard" }).getAttribute("aria-current")).toBeNull();
    expect(screen.getByRole("link", { name: "Check-in" }).getAttribute("aria-current")).toBeNull();
  });

  it("navigates between screens through the navigation", async () => {
    const router = renderAt("/");
    await screen.findByRole("heading", { name: "Dashboard" });

    fireEvent.click(screen.getByRole("link", { name: "Check-in" }));

    expect(await screen.findByRole("heading", { level: 1, name: "Daily Check-in" })).toBeTruthy();
    expect(router.state.location.pathname).toBe("/check-in");
  });

  it("shows a not found state for unknown paths", async () => {
    renderAt("/unknown");

    expect(await screen.findByText("페이지를 찾을 수 없습니다.")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Dashboard로 이동" }).getAttribute("href")).toBe("/");
  });

  it("shows the history empty state when no records exist", async () => {
    renderAt("/history");

    expect(await screen.findByText("아직 충분한 기록이 없습니다.")).toBeTruthy();
  });

  it("shows the dashboard empty state when no check-in exists", async () => {
    renderAt("/");

    expect(await screen.findByText("아직 Check-in 기록이 없습니다.")).toBeTruthy();
  });
});
