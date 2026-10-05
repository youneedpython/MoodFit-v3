import { describe, expect, it } from "vitest";
import {
  MOODFIT_TIME_ZONE,
  formatReportPeriod,
  formatDisplayDateTime,
  formatDisplayDateTimeWithWeekday,
  formatHeaderDate,
  formatTrendDate
} from "./dateTime";

describe("dateTime", () => {
  it.each([
    ["2026-09-28", "2026-10-04", "9월 28일", "10월 4일"],
    ["2025-09-28", "2025-10-04", "2025년 9월 28일", "2025년 10월 4일"],
    ["2025-12-29", "2026-01-04", "2025년 12월 29일", "2026년 1월 4일"],
    ["invalid", "2026-02-30", "invalid", "2026-02-30"],
    ["2026-1-01", "", "2026-1-01", ""],
  ])("formats report period %s to %s", (start, end, first, last) => {
    expect(formatReportPeriod(start, end, new Date("2026-10-05T00:00:00Z"))).toEqual({ start: first, end: last });
  });
  it("uses the Seoul current year at the year boundary", () => {
    expect(formatReportPeriod("2026-01-01", "2026-01-04", new Date("2025-12-31T15:00:00Z")))
      .toEqual({ start: "1월 1일", end: "1월 4일" });
  });
  it("uses the approved fixed display timezone", () => {
    expect(MOODFIT_TIME_ZONE).toBe("Asia/Seoul");
  });

  it("formats API instants by Asia/Seoul instead of the runtime timezone", () => {
    const utcAfternoonThatBecomesNextDayInSeoul = "2026-09-30T15:30:00Z";

    expect(formatDisplayDateTime(utcAfternoonThatBecomesNextDayInSeoul)).toBe("10월 1일 오전 12:30");
    expect(formatDisplayDateTimeWithWeekday(utcAfternoonThatBecomesNextDayInSeoul)).toBe(
      "10월 1일 (목) 오전 12:30"
    );
    expect(formatTrendDate(utcAfternoonThatBecomesNextDayInSeoul)).toBe("10. 1.");
  });

  it("formats the header date with the same fixed timezone", () => {
    expect(formatHeaderDate(new Date("2026-09-30T15:30:00Z"))).toBe("2026년 10월 1일 목요일");
  });
});
