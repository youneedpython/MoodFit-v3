import { Card } from "../../components/Card/Card";
import { PageHeader } from "../../components/PageHeader/PageHeader";
import { EmptyState } from "../../components/StateView/StateView";

/** HIST-001 History. 최근 기록과 Trend는 TASK-010에서 구현한다. */
export function HistoryPage() {
  return (
    <>
      <PageHeader title="History" description="최근 웰니스 상태 변화를 확인합니다." />
      <Card>
        <EmptyState title="준비 중인 화면입니다." message="최근 기록과 Wellness Score 변화는 다음 단계에서 제공됩니다." />
      </Card>
    </>
  );
}
