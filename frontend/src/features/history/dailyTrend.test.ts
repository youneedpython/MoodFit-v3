import { describe, expect, it } from "vitest";
import { CHECKIN_HISTORY } from "../../contracts/contracts";
import { dailyTrend } from "./dailyTrend";

describe("dailyTrend", () => {
  it("groups by Seoul date, sorts days, and rounds arithmetic means", () => {
    const item = (recordedAt: string, wellnessScore: number) => ({ ...CHECKIN_HISTORY.items[0]!, recordedAt, wellnessScore });
    const result = dailyTrend([
      item("2026-10-01T15:01:00Z", 81),
      item("2026-10-01T14:59:00Z", 40),
      item("2026-10-01T15:02:00Z", 82)
    ]);
    expect(result).toEqual([
      { key: "2026-10-01", label: "10. 1.", average: 40, count: 1 },
      { key: "2026-10-02", label: "10. 2.", average: 82, count: 2 }
    ]);
    expect(dailyTrend([])).toEqual([]);
  });
});
