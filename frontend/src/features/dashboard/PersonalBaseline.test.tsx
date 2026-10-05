import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CHECKIN_CREATED } from "../../contracts/contracts";
import type { Baseline } from "../../types/api";
import { BaselineNotice, TensionBadge, baselineDelta } from "./PersonalBaseline";
import { BodyMetrics } from "./BodyMetrics";

const auth = vi.hoisted(() => ({ provider: "google" }));
vi.mock("../auth/AuthProvider", () => ({ useAuth: () => ({ state: { user: { provider: auth.provider } } }) }));
const baseline: Baseline = { available: true, sampleCount: 5, tension: "HIGH",
  averages: CHECKIN_CREATED.metrics, deltas: { heartRate: 16, respiratoryRate: 0, sleepScore: -2.5, stressLevel: 1, energyLevel: 3 } };
describe("personal baseline", () => {
  it("shows signed comparisons for all five metrics and a textual tension badge", () => {
    auth.provider = "google";
    render(<><BodyMetrics metrics={CHECKIN_CREATED.metrics} baseline={baseline} /><BaselineNotice baseline={baseline} /><TensionBadge tension="HIGH" /></>);
    expect(screen.getByText("평소 대비 +16")).toBeVisible();
    expect(screen.getByText("평소 대비 -2.5")).toBeVisible();
    expect(screen.getByText("평소와 같음")).toBeVisible();
    expect(screen.getAllByText(/평소 대비/)).toHaveLength(4);
    expect(screen.getByText("신체 긴장도 높음")).toBeVisible();
    expect(screen.getByText(/최근 14일 기록 5건/)).toHaveTextContent("의학적 기준이 아닌 참고 지표");
    expect(screen.queryByText(/모든 방문자/)).toBeNull();
  });
  it("explains insufficient records and the guest shared average without showing deltas", () => {
    auth.provider = "guest";
    render(<><BodyMetrics metrics={CHECKIN_CREATED.metrics} baseline={CHECKIN_CREATED.baseline} /><BaselineNotice baseline={CHECKIN_CREATED.baseline} /><TensionBadge tension={null} /></>);
    expect(screen.getByText(/기록이 5건 이상/)).toHaveTextContent("체험 계정은 모든 방문자의 기록 평균과 비교합니다");
    expect(screen.queryByText(/평소 대비/)).toBeNull();
    expect(screen.queryByText(/신체 긴장도/)).toBeNull();
  });
  it("labels stable and normal tension and formats zero without a sign", () => {
    render(<><TensionBadge tension="STABLE" /><TensionBadge tension="NORMAL" /></>);
    expect(screen.getByText("신체 긴장도 안정")).toBeVisible();
    expect(screen.getByText("신체 긴장도 보통")).toBeVisible();
    expect(baselineDelta(-0)).toBe("평소와 같음");
  });
});
