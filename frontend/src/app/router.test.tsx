import { fireEvent, render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { describe, expect, it } from "vitest";
import { routes } from "./router";

function renderAt(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  render(<RouterProvider router={router} />);
  return router;
}

describe("App routes", () => {
  it("renders the Dashboard at / inside the common layout", () => {
    renderAt("/");

    expect(screen.getByRole("heading", { level: 1, name: "Dashboard" })).toBeTruthy();
    expect(screen.getByRole("navigation", { name: "주요 메뉴" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "본문으로 건너뛰기" }).getAttribute("href")).toBe("#main-content");
    expect(screen.getByRole("main").id).toBe("main-content");
  });

  it.each([
    ["/check-in", "Daily Check-in"],
    ["/history", "History"]
  ])("renders %s", (path, heading) => {
    renderAt(path);

    expect(screen.getByRole("heading", { level: 1, name: heading })).toBeTruthy();
  });

  it("marks only the current navigation item with aria-current", () => {
    renderAt("/history");

    expect(screen.getByRole("link", { name: "History" }).getAttribute("aria-current")).toBe("page");
    expect(screen.getByRole("link", { name: "Dashboard" }).getAttribute("aria-current")).toBeNull();
    expect(screen.getByRole("link", { name: "Check-in" }).getAttribute("aria-current")).toBeNull();
  });

  it("navigates between screens through the navigation", async () => {
    const router = renderAt("/");

    fireEvent.click(screen.getByRole("link", { name: "Check-in" }));

    expect(await screen.findByRole("heading", { level: 1, name: "Daily Check-in" })).toBeTruthy();
    expect(router.state.location.pathname).toBe("/check-in");
  });

  it("shows a not found state for unknown paths", () => {
    renderAt("/unknown");

    expect(screen.getByText("페이지를 찾을 수 없습니다.")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Dashboard로 이동" }).getAttribute("href")).toBe("/");
  });

  it("does not present hard-coded analysis results on placeholder screens", () => {
    renderAt("/");

    expect(screen.getByText("준비 중인 화면입니다.")).toBeTruthy();
    expect(screen.queryByText(/wellness score/i)).toBeNull();
  });
});
