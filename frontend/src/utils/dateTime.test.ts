import { describe, expect, it } from "vitest";
import {
  MOODFIT_TIME_ZONE,
  formatDisplayDateTime,
  formatDisplayDateTimeWithWeekday,
  formatHeaderDate,
  formatTrendDate
} from "./dateTime";

describe("dateTime", () => {
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
