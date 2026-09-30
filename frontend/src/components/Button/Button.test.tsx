import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it, vi } from "vitest";
import { Button, ButtonLink } from "./Button";

describe("Button", () => {
  it("renders a button of type button with the variant class and handles click", () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>저장</Button>);

    const button = screen.getByRole("button", { name: "저장" });
    expect(button.getAttribute("type")).toBe("button");
    expect(button.className).toContain("button--primary");

    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("does not call onClick when disabled", () => {
    const onClick = vi.fn();
    render(
      <Button variant="secondary" disabled onClick={onClick}>
        저장 중
      </Button>
    );

    const button = screen.getByRole("button", { name: "저장 중" }) as HTMLButtonElement;
    expect(button.disabled).toBe(true);
    fireEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("renders ButtonLink as a link to the target route", () => {
    render(
      <MemoryRouter>
        <ButtonLink to="/check-in">오늘 상태 입력</ButtonLink>
      </MemoryRouter>
    );

    const link = screen.getByRole("link", { name: "오늘 상태 입력" });
    expect(link.getAttribute("href")).toBe("/check-in");
    expect(link.className).toContain("button");
  });
});
