import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Button } from "../Button/Button";
import { EmptyState, ErrorState, LoadingState } from "./StateView";

describe("LoadingState", () => {
  it("announces loading through a polite status region", () => {
    render(<LoadingState message="최신 기록을 불러오는 중입니다." />);

    const status = screen.getByRole("status");
    expect(status.getAttribute("aria-live")).toBe("polite");
    expect(status.textContent).toContain("최신 기록을 불러오는 중입니다.");
  });
});

describe("ErrorState", () => {
  it("renders an alert with a retry action", () => {
    const onRetry = vi.fn();
    render(<ErrorState message="서버에 연결할 수 없습니다." onRetry={onRetry} />);

    expect(screen.getByRole("alert").textContent).toContain("서버에 연결할 수 없습니다.");
    fireEvent.click(screen.getByRole("button", { name: "다시 시도" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("hides the retry button when retry is not possible", () => {
    render(<ErrorState message="요청을 처리하지 못했습니다." />);

    expect(screen.queryByRole("button", { name: "다시 시도" })).toBeNull();
  });
});

describe("EmptyState", () => {
  it("guides the next action", () => {
    render(
      <EmptyState
        title="아직 충분한 기록이 없습니다."
        message="오늘의 상태를 입력해 보세요."
        action={<Button>오늘 상태 입력</Button>}
      />
    );

    expect(screen.getByText("아직 충분한 기록이 없습니다.")).toBeTruthy();
    expect(screen.getByText("오늘의 상태를 입력해 보세요.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "오늘 상태 입력" })).toBeTruthy();
  });
});
