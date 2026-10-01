import { useId, type ReactNode } from "react";
import "./Card.css";

type CardProps = {
  title?: string;
  /** Card 제목 옆에 표시할 보조 영역 (Badge, Action 등) */
  aside?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function Card({ title, aside, children, className }: CardProps) {
  const titleId = useId();

  return (
    // 제목이 있으면 제목을 영역 이름으로 연결해 Screen Reader의 Landmark(region)로 인식되게 한다.
    <section className={["card", className].filter(Boolean).join(" ")} aria-labelledby={title ? titleId : undefined}>
      {(title || aside) && (
        <header className="card__header">
          {title && (
            <h2 id={titleId} className="card__title">
              {title}
            </h2>
          )}
          {aside}
        </header>
      )}
      {children}
    </section>
  );
}
