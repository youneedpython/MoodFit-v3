import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Badge } from "../Badge/Badge";
import { Card } from "../Card/Card";
import { MetricCard } from "./MetricCard";

describe("MetricCard", () => {
  it("renders label, value and unit", () => {
    render(<MetricCard label="심박수" value={68} unit="bpm" hint="안정 시 기준" />);

    expect(screen.getByRole("heading", { name: "심박수" })).toBeTruthy();
    expect(screen.getByText("68")).toBeTruthy();
    expect(screen.getByText("bpm")).toBeTruthy();
    expect(screen.getByText("안정 시 기준")).toBeTruthy();
  });

  it("does not invent a value when data is missing", () => {
    render(<MetricCard label="수면 점수" value={null} />);

    expect(screen.getByText("값 없음")).toBeTruthy();
    expect(screen.queryByText("0")).toBeNull();
  });
});

describe("Card", () => {
  it("renders a titled section with aside content", () => {
    render(
      <Card title="추천 음식" aside={<Badge tone="info">2개</Badge>}>
        <p>본문</p>
      </Card>
    );

    expect(screen.getByRole("heading", { level: 2, name: "추천 음식" })).toBeTruthy();
    expect(screen.getByText("본문")).toBeTruthy();
    expect(screen.getByText("2개").className).toContain("badge--info");
  });
});

describe("Badge", () => {
  it("uses neutral tone by default and always shows a text label", () => {
    render(<Badge>균형 있음</Badge>);

    const badge = screen.getByText("균형 있음");
    expect(badge.className).toContain("badge--neutral");
  });
});
