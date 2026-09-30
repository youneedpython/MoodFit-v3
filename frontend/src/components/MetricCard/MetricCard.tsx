import "./MetricCard.css";

type MetricCardProps = {
  label: string;
  /** 값이 없으면 null. 임의의 기본값을 표시하지 않는다. */
  value: number | null;
  unit?: string;
  hint?: string;
};

export function MetricCard({ label, value, unit, hint }: MetricCardProps) {
  return (
    <article className="metric-card">
      <h3 className="metric-card__label">{label}</h3>
      <p className="metric-card__value">
        {value === null ? (
          <>
            <span aria-hidden="true">—</span>
            <span className="visually-hidden">값 없음</span>
          </>
        ) : (
          <>
            {value}
            {unit && <span className="metric-card__unit">{unit}</span>}
          </>
        )}
      </p>
      {hint && <p className="metric-card__hint">{hint}</p>}
    </article>
  );
}
