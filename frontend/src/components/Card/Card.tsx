import type { ReactNode } from "react";
import "./Card.css";

type CardProps = {
  title?: string;
  /** Card 제목 옆에 표시할 보조 영역 (Badge, Action 등) */
  aside?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function Card({ title, aside, children, className }: CardProps) {
  return (
    <section className={["card", className].filter(Boolean).join(" ")}>
      {(title || aside) && (
        <header className="card__header">
          {title && <h2 className="card__title">{title}</h2>}
          {aside}
        </header>
      )}
      {children}
    </section>
  );
}
