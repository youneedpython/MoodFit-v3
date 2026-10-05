export const MOODFIT_TIME_ZONE = "Asia/Seoul";

/** Calendar-day distance in Seoul, independent of elapsed hours. */
export function seoulDayDifference(recordedAt: string, now: Date = new Date()) {
  const day = (date: Date) => {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: MOODFIT_TIME_ZONE, year: "numeric", month: "numeric", day: "numeric"
    }).formatToParts(date);
    const value = (type: string) => Number(parts.find((part) => part.type === type)!.value);
    return Date.UTC(value("year"), value("month") - 1, value("day"));
  };
  return Math.max(0, Math.round((day(now) - day(new Date(recordedAt))) / 86400000));
}

/** Date-only API strings are formatted without interpreting them as UTC instants. */
export function formatReportPeriod(start: string, end: string, now: Date = new Date()) {
  const parse = (value: string) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
    const [year, month, day] = value.split("-").map(Number) as [number, number, number];
    const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
    const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    if (month < 1 || month > 12 || day < 1 || day > days[month - 1]!) return null;
    return { year, month, day };
  };
  const first = parse(start);
  const last = parse(end);
  const currentYear = Number(now.toLocaleDateString("en-US", { timeZone: MOODFIT_TIME_ZONE, year: "numeric" }));
  const showYear = !first || !last || first.year !== last.year || first.year !== currentYear;
  const format = (value: string, parts: ReturnType<typeof parse>) => parts
    ? `${showYear ? `${parts.year}년 ` : ""}${parts.month}월 ${parts.day}일` : value;
  return { start: format(start, first), end: format(end, last) };
}

export function formatDisplayDateTime(recordedAt: string) {
  return new Date(recordedAt).toLocaleString("ko-KR", {
    timeZone: MOODFIT_TIME_ZONE,
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

export function formatDisplayDateTimeWithWeekday(recordedAt: string) {
  return new Date(recordedAt).toLocaleString("ko-KR", {
    timeZone: MOODFIT_TIME_ZONE,
    month: "long",
    day: "numeric",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit"
  });
}

export function formatTrendDate(recordedAt: string) {
  return new Date(recordedAt).toLocaleDateString("ko-KR", {
    timeZone: MOODFIT_TIME_ZONE,
    month: "numeric",
    day: "numeric"
  });
}

export function formatDisplayDate(recordedAt: string) {
  return new Date(recordedAt).toLocaleDateString("ko-KR", {
    timeZone: MOODFIT_TIME_ZONE,
    month: "long",
    day: "numeric"
  });
}

export function formatHeaderDate(date: Date) {
  return date.toLocaleDateString("ko-KR", {
    timeZone: MOODFIT_TIME_ZONE,
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long"
  });
}
