import { useEffect, useRef, useState } from "react";
import { request } from "../../services/api";

import type { FeedbackResponse, FeedbackKind, FeedbackRating, FeedbackItem } from "../../types/api";
export type { FeedbackResponse, FeedbackKind, FeedbackRating, FeedbackItem } from "../../types/api";

export function useRecommendationFeedback() {
  const [data, setData] = useState<FeedbackResponse | null>(null);
  const [error, setError] = useState("");
  const [pending, setPending] = useState<string[]>([]);
  const busy = useRef(new Set<string>());
  useEffect(() => {
    let active = true;
    void request<FeedbackResponse>("/recommendations/feedback").then(value => {
      if (active) setData({ ...value, shared: value.shared ?? false });
    }).catch(() => { if (active) setError("추천 평가를 불러오지 못했습니다."); });
    return () => { active = false; };
  }, []);
  async function toggle(kind: FeedbackKind, item: string, rating: FeedbackRating) {
    const id = `${kind}:${item}`;
    if (!data?.enabled || busy.current.has(id)) return;
    const previous = data.items.find(value => value.kind === kind && value.item === item);
    const next = previous?.rating === rating ? null : rating;
    const replace = (items: FeedbackItem[], value: FeedbackRating | null) => [
      ...items.filter(entry => entry.kind !== kind || entry.item !== item),
      ...(value ? [{ kind, item, rating: value }] : [])
    ];
    busy.current.add(id);
    setPending(Array.from(busy.current));
    setError("");
    setData(current => current && { ...current, items: replace(current.items, next) });
    try {
      await request<void>("/recommendations/feedback", { method: "PUT", body: JSON.stringify({ kind, item, rating: next }) });
    } catch {
      setData(current => current && { ...current, items: replace(current.items, previous?.rating ?? null) });
      setError("추천 평가를 저장하지 못했습니다. 다시 시도해 주세요.");
    } finally {
      busy.current.delete(id);
      setPending(Array.from(busy.current));
    }
  }
  return { data, error, pending, toggle };
}
export type FeedbackControls = ReturnType<typeof useRecommendationFeedback>;
