import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router";
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
    expect(within(header).getByRole("navigation", { name: "주요 메뉴" })).toBeTruthy();
  });
});
