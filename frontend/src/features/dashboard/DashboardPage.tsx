import { useEffect, useState } from "react";
import { formatDisplayDateTime, formatDisplayDate, seoulDayDifference } from "../../utils/dateTime";
import { ButtonLink } from "../../components/Button/Button";
import { InsightCard } from "../insight/InsightCard";
import { Card } from "../../components/Card/Card";
import { PageHeader } from "../../components/PageHeader/PageHeader";
import { EmptyState, ErrorState, LoadingState } from "../../components/StateView/StateView";
import { BodyMetrics } from "./BodyMetrics";
import { RecommendationCards } from "./RecommendationCards";
import { useLatestCheckin } from "./useLatestCheckin";
import { WellnessHero } from "./WellnessHero";
import "./DashboardPage.css";
import { useRecommendationFeedback } from "./useRecommendationFeedback";

/** DASH-001 Dashboard. 최신 Check-in 결과와 추천을 표시한다. */
export function DashboardPage() {
  const { state, reload } = useLatestCheckin();
  const feedback = useRecommendationFeedback();
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const update = () => setNow(new Date());
    const visible = () => { if (document.visibilityState === "visible") update(); };
    const interval = window.setInterval(update, 60000);
    document.addEventListener("visibilitychange", visible);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", visible);
    };
  }, []);
  const days = state.status === "ready" ? seoulDayDifference(state.checkin.recordedAt, now) : 0;
  const content = state.status === "ready" ? <>
    <WellnessHero checkin={state.checkin} past={days > 0} />
    <InsightCard checkinId={state.checkin.id} autoGenerate={days === 0} />
    <BodyMetrics metrics={state.checkin.metrics} baseline={state.checkin.baseline} />
    <RecommendationCards foods={state.checkin.foods} music={state.checkin.music} feedback={feedback} />
  </> : null;

  return (
    <>
      <PageHeader title="Dashboard" description="오늘의 웰니스 상태와 추천을 한눈에 확인합니다." />

      {state.status === "loading" && (
        <Card>
          <LoadingState message="최신 기록을 불러오는 중입니다." />
        </Card>
      )}

      {state.status === "error" && (
        <Card>
          <ErrorState title="Dashboard를 불러오지 못했습니다." message={state.message} onRetry={() => void reload()} />
        </Card>
      )}

      {state.status === "empty" && (
        <Card>
          <EmptyState
            title="아직 Check-in 기록이 없습니다."
            message="오늘의 상태를 입력하면 분석 결과와 음식 · 음악 추천을 확인할 수 있습니다."
            action={<ButtonLink to="/check-in">오늘 상태 입력</ButtonLink>}
          />
        </Card>
      )}

      {state.status === "ready" && (
        <div className="dashboard">
          {days === 0 ? content : <>
            <Card title="오늘 상태를 아직 입력하지 않았어요" className="dashboard-today-notice">
              <p>마지막 기록은 {days === 1 ? "어제" : `${days}일 전`}({formatDisplayDate(state.checkin.recordedAt)})입니다. 오늘 상태를 입력하면 오늘에 맞는 분석과 추천을 볼 수 있습니다.</p>
              <ButtonLink to="/check-in">오늘 상태 입력</ButtonLink>
            </Card>
            {state.checkin.baseline.available && state.checkin.baseline.averages && <Card title="최근 14일 평균">
              <dl className="dashboard-baseline">
                {([
                  ["수면", state.checkin.baseline.averages.sleepScore, "/ 100"],
                  ["스트레스", state.checkin.baseline.averages.stressLevel, "/ 100"],
                  ["에너지", state.checkin.baseline.averages.energyLevel, "/ 100"],
                  ["심박수", state.checkin.baseline.averages.heartRate, "bpm"],
                  ["호흡수", state.checkin.baseline.averages.respiratoryRate, "회/분"]
                ] as const).map(([label, value, unit]) => <div key={label}><dt>{label}</dt><dd>{value} {unit}</dd></div>)}
              </dl>
              <p>기록 {state.checkin.baseline.sampleCount}건의 평균입니다. 오늘 상태를 추정한 값이 아닙니다.</p>
            </Card>}
            <section className="dashboard dashboard-last-record" aria-labelledby="last-record-title">
              <h2 id="last-record-title">마지막 기록 · {days === 1 ? "어제" : `${days}일 전`} ({formatDisplayDateTime(state.checkin.recordedAt)})</h2>
              {content}
            </section>
          </>}
        </div>
      )}
    </>
  );
}
