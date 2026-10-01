import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError, checkinApi } from "../../services/api";
import type { CheckinResponse } from "../../types/api";

export type LatestCheckinState =
  | { status: "loading" }
  | { status: "empty" }
  | { status: "error"; message: string }
  | { status: "ready"; checkin: CheckinResponse };

function errorMessageFor(error: unknown) {
  if (error instanceof ApiError && error.code === "NETWORK_ERROR") {
    return error.message;
  }
  return "최신 기록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.";
}

/**
 * 최신 Check-in을 조회한다.
 * 기록이 없으면(API 404 CHECKIN_NOT_FOUND) 오류가 아니라 empty 상태가 된다. (API Spec 5절, DEC-003)
 */
export function useLatestCheckin() {
  const [state, setState] = useState<LatestCheckinState>({ status: "loading" });
  const requestIdRef = useRef(0);

  const load = useCallback(async () => {
    // 재시도 중 이전 요청의 늦은 응답이 최신 상태를 덮어쓰지 않도록 요청 번호로 구분한다.
    const requestId = ++requestIdRef.current;
    setState({ status: "loading" });
    try {
      const checkin = await checkinApi.getLatest();
      if (requestId === requestIdRef.current) {
        setState(checkin ? { status: "ready", checkin } : { status: "empty" });
      }
    } catch (error) {
      if (requestId === requestIdRef.current) {
        setState({ status: "error", message: errorMessageFor(error) });
      }
    }
  }, []);

  useEffect(() => {
    void load();
    return () => {
      // 화면을 떠난 뒤 도착한 응답은 반영하지 않는다.
      requestIdRef.current++;
    };
  }, [load]);

  return { state, reload: load };
}
