import { ButtonLink } from "../../components/Button/Button";
import { InsightCard } from "../insight/InsightCard";
import { Card } from "../../components/Card/Card";
import { PageHeader } from "../../components/PageHeader/PageHeader";
import { EmptyState, ErrorState, LoadingState } from "../../components/StateView/StateView";
import { HistoryRecordList } from "./HistoryRecordList";
import { useHistory } from "./useHistory";
import { WellnessTrend } from "./WellnessTrend";
import "./HistoryPage.css";

/** UX Spec 5절: 최근 7일 기준 */
const HISTORY_DAYS = 7;

/** HIST-001 History */
export function HistoryPage() {
  const { state, reload } = useHistory(HISTORY_DAYS);

  return (
    <>
      <PageHeader title="History" description="최근 7일 웰니스 상태 변화를 확인합니다." />
      <InsightCard weekly />

      {state.status === "loading" && (
        <Card>
          <LoadingState message="최근 기록을 불러오는 중입니다." />
        </Card>
      )}

      {state.status === "error" && (
        <Card>
          <ErrorState title="History를 불러오지 못했습니다." message={state.message} onRetry={() => void reload()} />
        </Card>
      )}

      {state.status === "empty" && (
        <Card>
          <EmptyState
            title="아직 충분한 기록이 없습니다."
            message="오늘의 상태를 입력해 보세요."
            action={<ButtonLink to="/check-in">오늘 상태 입력</ButtonLink>}
          />
        </Card>
      )}

      {state.status === "ready" && (
        <div className="history">
          <Card title="최근 7일 Wellness Score">
            <WellnessTrend items={state.items} />
          </Card>
          <HistoryRecordList items={state.items} />
        </div>
      )}
    </>
  );
}
