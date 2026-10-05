import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CHECKIN_HISTORY } from "../../contracts/contracts";
import { pinchZoom, WellnessTrend } from "./WellnessTrend";

const items = Array.from({ length: 30 }, (_, index) => ({ ...CHECKIN_HISTORY.items[0]!, id: index + 1, recordedAt: `2026-10-${String(1 + Math.floor(index / 10)).padStart(2, "0")}T03:00:00Z` }));
function measure() {
  vi.stubGlobal("ResizeObserver", class {
    constructor(private callback: ResizeObserverCallback) {}
    observe() { this.callback([{ contentRect: { width: 320 } } as ResizeObserverEntry], this as unknown as ResizeObserver); }
    disconnect() {}
  });
}
afterEach(() => vi.unstubAllGlobals());
describe("trend zoom", () => {
  it("keeps the unmeasured chart at 100% without controls", () => {
    vi.stubGlobal("ResizeObserver", undefined);
    const { container } = render(<WellnessTrend items={items} />);
    expect((container.querySelector(".wellness-trend__inner") as HTMLElement).style.width).toBe("100%");
    expect(screen.queryByRole("button", { name: "그래프 확대" })).toBeNull();
  });
  it("initializes dense records, changes zoom, and clamps at both limits", () => {
    measure();
    const { container } = render(<WellnessTrend items={items} />);
    const inner = container.querySelector(".wellness-trend__inner") as HTMLElement;
    const labelCount = () => container.querySelectorAll(".wellness-trend__x-labels span").length;
    expect(inner.style.width).toBe("100%");
    const summary = container.querySelector("figcaption")!.textContent;
    expect(container.querySelectorAll('[data-testid="trend-point"]')).toHaveLength(3);
    const initialLabels = labelCount();
    const plus = screen.getByRole("button", { name: "그래프 확대" }) as HTMLButtonElement;
    fireEvent.click(plus);
    expect(inner.style.width).toBe("225%");
    expect(container.querySelectorAll('[data-testid="trend-point"]')).toHaveLength(30);
    expect(container.querySelector('[aria-live="polite"]')!.textContent).toBe("좌우로 밀어 전체 기록을 볼 수 있습니다.");
    expect(container.querySelector("figcaption")!.textContent).toBe(summary);
    expect(labelCount()).toBeGreaterThan(initialLabels);
    fireEvent.click(plus);
    expect(inner.style.width).toBe("337.5%");
    fireEvent.click(plus);
    expect(inner.style.width).toBe("450%");
    expect(plus.disabled).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "그래프 축소" }));
    expect(inner.style.width).toBe("300%");
    fireEvent.click(screen.getByRole("button", { name: "그래프 축소" }));
    expect(inner.style.width).toBe("100%");
    fireEvent.click(plus);
    fireEvent.click(screen.getByRole("button", { name: "그래프 날짜별 평균으로 보기" }));
    expect(inner.style.width).toBe("100%");
    expect(container.querySelectorAll('[data-testid="trend-point"]')).toHaveLength(3);
    expect(container.querySelector('[aria-live="polite"]')!.textContent).toBe("날짜별 평균입니다. 확대하면 기록을 하나씩 볼 수 있습니다.");
    expect(container.querySelector("figcaption")!.textContent).toBe(summary);
    expect((screen.getByRole("button", { name: "그래프 축소" }) as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByRole("group").getAttribute("tabindex")).toBeNull();
    const lastLabel = container.querySelector(".wellness-trend__x-labels span:last-child") as HTMLElement;
    expect(lastLabel.style.left).toBe("96%");
  });
  it("keeps sparse records at full view", () => {
    measure();
    const { container } = render(<WellnessTrend items={items.slice(0, 3)} />);
    expect(container.querySelectorAll('[data-testid="trend-point"]')).toHaveLength(3);
    expect(container.querySelector('[aria-live="polite"]')!.textContent).toBe("");
    expect(screen.queryByRole("button", { name: "그래프 확대" })).toBeNull();
  });
  it("calculates pinch ratios safely within bounds", () => {
    expect(pinchZoom(100, 150, 2, 4)).toBe(3);
    expect(pinchZoom(100, 400, 2, 4)).toBe(4);
    expect(pinchZoom(100, 10, 2, 4)).toBe(1);
    expect(pinchZoom(0, 100, 2, 4)).toBe(2);
    expect(pinchZoom(100, 105, 1, 4)).toBe(1);
    expect(pinchZoom(100, 106, 1, 4)).toBe(1.06);
  });
});
