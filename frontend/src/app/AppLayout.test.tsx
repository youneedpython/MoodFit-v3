import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { describe, expect, it } from "vitest";
import { AppLayout } from "./AppLayout";

describe("AppLayout brand", () => {
  it("renders the approved logo as decoration beside a single MoodFit name", () => {
    render(<MemoryRouter><AppLayout /></MemoryRouter>);

    const header = screen.getByRole("banner");
    const logo = header.querySelector("img");
    expect(logo).not.toBeNull();
    expect(logo?.getAttribute("src")).toBe("/favicon.svg");
    expect(logo?.getAttribute("alt")).toBe("");
    expect(within(header).queryByRole("img")).toBeNull();
    expect(within(header).getAllByText("MoodFit")).toHaveLength(1);
    const homeLink = within(header).getByRole("link", { name: "MoodFit", exact: true });
    expect(homeLink.getAttribute("href")).toBe("/");
    expect(homeLink.contains(logo)).toBe(true);
    expect(homeLink.querySelector(".app-header__date")).toBeNull();
    expect(within(header).getByRole("navigation", { name: "주요 메뉴" })).toBeTruthy();
  });

  it.each(["/check-in", "/history"])("navigates from %s to Dashboard inside the router", (path) => {
    render(
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route element={<AppLayout />}>
            <Route index element={<h1>Dashboard page</h1>} />
            <Route path="check-in" element={<h1>Check-in page</h1>} />
            <Route path="history" element={<h1>History page</h1>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(screen.queryByRole("heading", { name: "Dashboard page" })).toBeNull();
    fireEvent.click(screen.getByRole("link", { name: "MoodFit", exact: true }));
    expect(screen.getByRole("heading", { name: "Dashboard page" })).toBeTruthy();
  });
});
