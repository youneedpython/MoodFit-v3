import type { HistoryItem } from "../../types/api";
import { formatTrendDate, MOODFIT_TIME_ZONE } from "../../utils/dateTime";

export function dailyTrend(items: HistoryItem[]) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: MOODFIT_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit"
  });
  const days = new Map<string, { key: string; label: string; total: number; count: number }>();
  for (const item of items) {
    const parts = formatter.formatToParts(new Date(item.recordedAt));
    const part = (name: string) => parts.find((value) => value.type === name)!.value;
    const key = `${part("year")}-${part("month")}-${part("day")}`;
    const day = days.get(key) ?? { key, label: formatTrendDate(item.recordedAt), total: 0, count: 0 };
    day.total += item.wellnessScore;
    day.count += 1;
    days.set(key, day);
  }
  return [...days.values()].sort((a, b) => a.key.localeCompare(b.key))
    .map(({ key, label, total, count }) => ({ key, label, average: Math.round(total / count), count }));
}
