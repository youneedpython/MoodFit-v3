import { Badge } from "../../components/Badge/Badge";
import "./PersonalBaseline.css";
import type { Baseline, Tension } from "../../types/api";
import { useAuth } from "../auth/AuthProvider";

const LABELS = { HIGH: "높음", NORMAL: "보통", STABLE: "안정" };
export function TensionBadge({ tension }: { tension: Tension | null }) {
  return tension ? <Badge tone={tension === "HIGH" ? "warning" : tension === "STABLE" ? "positive" : "neutral"}>
    신체 긴장도 {LABELS[tension]}
  </Badge> : null;
}
export function BaselineNotice({ baseline }: { baseline: Baseline }) {
  const guest = useAuth()?.state.user?.provider === "guest";
  return <p className="baseline-notice">
    {baseline.available
      ? `최근 14일 기록 ${baseline.sampleCount}건의 평균과 비교했습니다. 의학적 기준이 아닌 참고 지표입니다.`
      : "기록이 5건 이상 쌓이면 평소 값과 비교해 드립니다"}
    {guest && " 체험 계정은 모든 방문자의 기록 평균과 비교합니다. 내 기록만으로 비교하려면 소셜 로그인을 이용하세요."}
  </p>;
}
export function baselineDelta(value: number) {
  return value === 0 ? "평소와 같음" : `평소 대비 ${value > 0 ? "+" : ""}${value}`;
}
