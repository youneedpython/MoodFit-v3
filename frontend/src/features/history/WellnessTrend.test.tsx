import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CHECKIN_HISTORY } from "../../contracts/contracts";
import { pinchZoom, WellnessTrend } from "./WellnessTrend";

const items = Array.from({ length: 30 }, (_, index) => ({ ...CHECKIN_HISTORY.items[0]!, id: index + 1 }));
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
    expect(screen.queryByRole("button", { name: "그래프 확대", exact: true })).toBeNull();
  });
  it("initializes dense records, changes zoom, and clamps at both limits", () => {
    measure();
    const { container } = render(<WellnessTrend items={items} />);
    const inner = container.querySelector(".wellness-trend__inner") as HTMLElement;
    const labelCount = () => container.querySelectorAll(".wellness-trend__x-labels span").length;
    expect(inner.style.width).toBe("225%");
    expect(container.querySelectorAll('[data-testid="trend-point"]')).toHaveLength(30);
    const initialLabels = labelCount();
    const plus = screen.getByRole("button", { name: "그래프 확대", exact: true }) as HTMLButtonElement;
    fireEvent.click(plus);
    expect(inner.style.width).toBe("337.5%");
    expect(labelCount()).toBeGreaterThan(initialLabels);
    fireEvent.click(plus);
    expect(inner.style.width).toBe("450%");
    expect(plus.disabled).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "그래프 축소", exact: true }));
    expect(inner.style.width).toBe("300%");
    fireEvent.click(screen.getByRole("button", { name: "그래프 전체 보기", exact: true }));
    expect(inner.style.width).toBe("100%");
    expect((screen.getByRole("button", { name: "그래프 축소", exact: true }) as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByRole("group").getAttribute("tabindex")).toBeNull();
    const lastLabel = container.querySelector(".wellness-trend__x-labels span:last-child") as HTMLElement;
    expect(lastLabel.style.left).toBe("96%");
  });
  it("keeps sparse records at full view", () => {
    measure();
    render(<WellnessTrend items={items.slice(0, 3)} />);
    expect(screen.queryByRole("button", { name: "그래프 확대", exact: true })).toBeNull();
  });
  it("calculates pinch ratios safely within bounds", () => {
    expect(pinchZoom(100, 150, 2, 4)).toBe(3);
    expect(pinchZoom(100, 400, 2, 4)).toBe(4);
    expect(pinchZoom(100, 10, 2, 4)).toBe(1);
    expect(pinchZoom(0, 100, 2, 4)).toBe(2);
  });
});
