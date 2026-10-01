import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError, checkinApi } from "../../services/api";
import type { HistoryItem } from "../../types/api";

export type HistoryState =
  | { status: "loading" }
  | { status: "empty" }
  | { status: "error"; message: string }
  | { status: "ready"; items: HistoryItem[] };

function errorMessageFor(error: unknown) {
  if (error instanceof ApiError && error.code === "NETWORK_ERROR") {
    return error.message;
  }
  return "기록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.";
}

/** 최근 `days`일 History를 조회한다. 응답은 recordedAt 오름차순이다. (API Spec 6절) */
export function useHistory(days: number) {
  const [state, setState] = useState<HistoryState>({ status: "loading" });
  const requestIdRef = useRef(0);

  const load = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setState({ status: "loading" });
    try {
      const history = await checkinApi.getHistory(days);
      if (requestId === requestIdRef.current) {
        setState(history.items.length > 0 ? { status: "ready", items: history.items } : { status: "empty" });
      }
    } catch (error) {
      if (requestId === requestIdRef.current) {
        setState({ status: "error", message: errorMessageFor(error) });
      }
    }
  }, [days]);

  useEffect(() => {
    void load();
    return () => {
      requestIdRef.current++;
    };
  }, [load]);

  return { state, reload: load };
}
