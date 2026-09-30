import { Card } from "../../components/Card/Card";
import { PageHeader } from "../../components/PageHeader/PageHeader";
import { EmptyState } from "../../components/StateView/StateView";

/** CHECK-001 Daily Check-in. 입력 Form과 제출 흐름은 TASK-008에서 구현한다. */
export function CheckinPage() {
  return (
    <>
      <PageHeader title="Daily Check-in" description="오늘의 신체 리듬과 날씨를 입력합니다." />
      <Card>
        <EmptyState title="준비 중인 화면입니다." message="Check-in 입력 기능은 다음 단계에서 제공됩니다." />
      </Card>
    </>
  );
}
