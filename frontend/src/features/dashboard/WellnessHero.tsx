import { Badge } from "../../components/Badge/Badge";
import { TensionBadge } from "./PersonalBaseline";
import { ButtonLink } from "../../components/Button/Button";
import { WellnessTiles } from "./WellnessTiles";
import type { CheckinResponse } from "../../types/api";
import { formatDisplayDateTime } from "../../utils/dateTime";

type WellnessHeroProps = {
  checkin: CheckinResponse;
};

export function WellnessHero({ checkin }: WellnessHeroProps) {
  const { mood, wellnessScore, summary, weather, recordedAt } = checkin;

  return (
    <section className="wellness-hero" aria-labelledby="wellness-hero-title">
      <div className="wellness-hero__main">
        <div className="wellness-hero__meta">
          <Badge tone="accent">{mood.label}</Badge>
          <TensionBadge tension={checkin.baseline.tension} />
          <span className="wellness-hero__time">{formatDisplayDateTime(recordedAt)} 기록</span>
        </div>
        <h2 id="wellness-hero-title" className="wellness-hero__title">
          지금 컨디션은 <strong>{mood.label}</strong>
        </h2>
        <p className="wellness-hero__summary">{summary}</p>
        <ButtonLink to="/check-in">오늘 상태 입력</ButtonLink>
      </div>

      <WellnessTiles wellnessScore={wellnessScore} weather={weather} />
    </section>
  );
}
