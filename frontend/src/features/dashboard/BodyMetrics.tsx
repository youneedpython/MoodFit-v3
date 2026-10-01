import { Card } from "../../components/Card/Card";
import { MetricCard } from "../../components/MetricCard/MetricCard";
import type { Metrics } from "../../types/api";

const METRICS: { key: keyof Metrics; label: string; unit: string }[] = [
  { key: "heartRate", label: "심박수", unit: "bpm" },
  { key: "respiratoryRate", label: "호흡수", unit: "회/분" },
  { key: "sleepScore", label: "수면 점수", unit: "/ 100" },
  { key: "stressLevel", label: "스트레스 수준", unit: "/ 100" },
  { key: "energyLevel", label: "에너지 수준", unit: "/ 100" }
];

type BodyMetricsProps = {
  metrics: Metrics;
};

export function BodyMetrics({ metrics }: BodyMetricsProps) {
  return (
    <Card title="Body Metrics">
      <div className="grid grid--metrics">
        {METRICS.map((metric) => (
          <MetricCard key={metric.key} label={metric.label} value={metrics[metric.key]} unit={metric.unit} />
        ))}
      </div>
    </Card>
  );
}
