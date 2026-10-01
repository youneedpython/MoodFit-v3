import { ButtonLink } from "../../components/Button/Button";
import { Card } from "../../components/Card/Card";
import { PageHeader } from "../../components/PageHeader/PageHeader";
import { EmptyState, ErrorState, LoadingState } from "../../components/StateView/StateView";
import { BodyMetrics } from "./BodyMetrics";
import { RecommendationCards } from "./RecommendationCards";
import { useLatestCheckin } from "./useLatestCheckin";
import { WellnessHero } from "./WellnessHero";
import "./DashboardPage.css";

/** DASH-001 Dashboard. 최신 Check-in 결과와 추천을 표시한다. */
export function DashboardPage() {
  const { state, reload } = useLatestCheckin();

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
          <WellnessHero checkin={state.checkin} />
          <BodyMetrics metrics={state.checkin.metrics} />
          <RecommendationCards foods={state.checkin.foods} music={state.checkin.music} />
        </div>
      )}
    </>
  );
}
