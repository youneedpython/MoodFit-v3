import { useEffect, useState } from "react";
import { Card } from "../../components/Card/Card";
import { Button } from "../../components/Button/Button";
import { ApiError, request } from "../../services/api";
import { useAuth } from "../auth/AuthProvider";
import "./InsightCard.css";

export interface InsightResponse {
  enabled: boolean;
  available: boolean;
  text: string | null;
  generatedAt: string | null;
}
export interface WeeklyReportResponse extends InsightResponse {
  periodStart: string | null;
  periodEnd: string | null;
  recordCount: number;
}
type Props = { checkinId?: number; autoGenerate?: boolean; weekly?: boolean };
const FAILURE = "지금은 AI 코멘트를 만들 수 없습니다";

export function InsightCard({ checkinId, autoGenerate = false, weekly = false }: Props) {
  const auth = useAuth();
  const userId = auth?.state.user?.id;
  const social = auth?.state.user?.provider === "google" || auth?.state.user?.provider === "kakao";
  // Reset all state when the owner, record or mode changes, including pending responses.
  const identity = `${userId}:${weekly ? "weekly" : checkinId}`;
  return userId ? <InsightContent key={identity} path={weekly ? "/reports/weekly" : `/check-ins/${checkinId}/insight`}
    weekly={weekly} automatic={autoGenerate && social} /> : null;
}

function InsightContent({ path, weekly, automatic }: { path: string; weekly: boolean; automatic: boolean }) {
  const [response, setResponse] = useState<InsightResponse | WeeklyReportResponse | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  function failure(cause: unknown) {
    if (cause instanceof ApiError && cause.status === 422) return "최근 7일 기록이 3건 이상 필요합니다.";
    if (cause instanceof ApiError && cause.status === 429) return "오늘의 AI 생성 한도를 모두 사용했습니다. 내일 다시 시도해 주세요.";
    return weekly ? "지금은 주간 리포트를 만들 수 없습니다" : FAILURE;
  }
  useEffect(() => {
    let active = true;
    async function load() {
      try {
        let value = await request<InsightResponse | WeeklyReportResponse>(path);
        if (!active) return;
        setResponse(value);
        if (automatic && value.enabled && value.available && !value.text) {
          setBusy(true);
          value = await request<InsightResponse>(path, { method: "POST" });
          if (!active) return;
          setResponse(value);
          if (!value.text) setError(FAILURE);
        }
      } catch (cause) { if (active) setError(failure(cause)); }
      finally { if (active) setBusy(false); }
    }
    void load();
    return () => { active = false; };
    // This keyed component owns a single record and mode.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, automatic]);
  async function generate() {
    setBusy(true); setError("");
    try {
      const value = await request<InsightResponse | WeeklyReportResponse>(path, { method: "POST" });
      if (value.text) setResponse(value);
      if (!value.text) setError(weekly ? "지금은 주간 리포트를 만들 수 없습니다" : FAILURE);
    } catch (cause) { setError(failure(cause)); }
    finally { setBusy(false); }
  }
  if (!response?.enabled) return null;
  return <Card title={weekly ? "주간 리포트" : "AI 코멘트"} className="insight-card">
    {!response.available ? <p>소셜 로그인 후 이용할 수 있습니다</p> : <>
      {weekly && "periodStart" in response && response.periodStart && <p className="insight-card__period">
        {response.periodStart} ~ {response.periodEnd} · {response.recordCount}건
      </p>}
      {response.text && <p className="insight-card__text">{response.text}</p>}
      {busy && <p role="status">{weekly ? "주간 리포트를 만드는 중입니다." : "AI 코멘트를 만드는 중입니다."}</p>}
      {error && <p role="alert">{error}</p>}
      {(weekly || !response.text) && <Button variant="secondary" disabled={busy} onClick={() => void generate()}>
        {weekly ? (response.text ? "주간 리포트 다시 만들기" : "주간 리포트 만들기") : "AI 코멘트 받기"}
      </Button>}
      <small>AI가 생성한 참고용 문장이며 의학적 조언이 아닙니다.</small>
    </>}
  </Card>;
}
