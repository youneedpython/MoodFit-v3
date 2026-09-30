import { Card } from "../../components/Card/Card";
import { PageHeader } from "../../components/PageHeader/PageHeader";
import { EmptyState } from "../../components/StateView/StateView";

/** DASH-001 Dashboard. 최신 Check-in 결과 연결은 TASK-009에서 구현한다. */
export function DashboardPage() {
  return (
    <>
      <PageHeader title="Dashboard" description="오늘의 웰니스 상태와 추천을 한눈에 확인합니다." />
      <Card>
        <EmptyState
          title="준비 중인 화면입니다."
          message="최신 Check-in 결과와 음식 · 음악 추천은 다음 단계에서 실제 데이터와 연결됩니다."
        />
      </Card>
    </>
  );
}
