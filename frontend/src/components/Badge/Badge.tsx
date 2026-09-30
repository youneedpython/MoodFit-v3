import type { ReactNode } from "react";
import "./Badge.css";

export type BadgeTone = "neutral" | "info" | "accent" | "positive" | "warning";

type BadgeProps = {
  tone?: BadgeTone;
  children: ReactNode;
};

/** 색상만으로 의미를 전달하지 않도록 항상 Text Label과 함께 사용한다. */
export function Badge({ tone = "neutral", children }: BadgeProps) {
  return <span className={`badge badge--${tone}`}>{children}</span>;
}
