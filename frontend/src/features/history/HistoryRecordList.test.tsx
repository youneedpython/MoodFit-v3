import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CHECKIN_HISTORY } from "../../contracts/contracts";
import { HistoryRecordList } from "./HistoryRecordList";

const items = Array.from({ length: 11 }, (_, index) => ({
  ...CHECKIN_HISTORY.items[0]!, id: index + 1,
  recordedAt: `2026-10-04T${String(index).padStart(2, "0")}:00:00Z`,
}));

describe("기록 페이지", () => {
  it.each([0, 1, 5])("%i개는 이동 UI 없이 표시한다", (count) => {
    render(<HistoryRecordList items={items.slice(0, count)} />);
    expect(screen.queryByRole("navigation", { name: "기록 페이지" })).toBeNull();
    expect(screen.queryAllByRole("listitem")).toHaveLength(count);
  });
  it("최신 5개부터 표시하고 남은 기록과 제목 focus를 제공한다", () => {
    render(<HistoryRecordList items={items.slice(0, 6)} />);
    const nav = screen.getByRole("navigation", { name: "기록 페이지" });
    expect(screen.getAllByRole("listitem")).toHaveLength(5);
    expect(screen.getAllByRole("listitem")[0]?.querySelector("time")?.dateTime).toBe(items[5]!.recordedAt);
    expect((within(nav).getByRole("button", { name: "이전" }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(within(nav).getByRole("button", { name: "다음" }));
    expect(screen.getAllByRole("listitem")).toHaveLength(1);
    expect(screen.getByText("2 / 2").getAttribute("aria-live")).toBe("polite");
    expect((within(nav).getByRole("button", { name: "다음" }) as HTMLButtonElement).disabled).toBe(true);
    expect((within(nav).getByRole("button", { name: "이전" }) as HTMLButtonElement).disabled).toBe(false);
    expect(document.activeElement).toBe(screen.getByRole("heading", { name: "기록" }));
    fireEvent.click(within(nav).getByRole("button", { name: "이전" }));
    expect(screen.getAllByRole("listitem")).toHaveLength(5);
  });
  it("기록이 줄면 마지막 페이지로 맞춘다", () => {
    const view = render(<HistoryRecordList items={items} />);
    fireEvent.click(screen.getByRole("button", { name: "다음" }));
    fireEvent.click(screen.getByRole("button", { name: "다음" }));
    view.rerender(<HistoryRecordList items={items.slice(0, 6)} />);
    expect(screen.getByText("2 / 2")).toBeTruthy();
    expect(screen.getAllByRole("listitem")).toHaveLength(1);
  });
});
