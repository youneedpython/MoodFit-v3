import { ButtonLink } from "../components/Button/Button";
import { Card } from "../components/Card/Card";
import { EmptyState } from "../components/StateView/StateView";

export function NotFoundPage() {
  return (
    <Card>
      <EmptyState
        title="페이지를 찾을 수 없습니다."
        message="주소를 확인하거나 Dashboard로 이동해 주세요."
        action={<ButtonLink to="/">Dashboard로 이동</ButtonLink>}
      />
    </Card>
  );
}
