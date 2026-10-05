import { describe, expect, it } from "vitest";
import { seoulDayDifference } from "./dateTime";

describe("Seoul calendar day distance", () => {
  it.each([
    ["2026-10-04T23:00:00Z", "2026-10-05T01:00:00Z", 0],
    ["2026-10-04T14:59:59Z", "2026-10-04T15:00:00Z", 1],
    ["2026-10-04T15:00:00Z", "2026-10-05T14:59:59Z", 0],
    ["2026-10-01T15:00:00Z", "2026-10-04T15:00:00Z", 3],
    ["2026-10-05T15:00:00Z", "2026-10-04T15:00:00Z", 0]
  ])("%s to %s = %s", (recorded, now, days) => {
    expect(seoulDayDifference(recorded, new Date(now))).toBe(days);
  });
});
