export const MOODFIT_TIME_ZONE = "Asia/Seoul";

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

export function formatHeaderDate(date: Date) {
  return date.toLocaleDateString("ko-KR", {
    timeZone: MOODFIT_TIME_ZONE,
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long"
  });
}
