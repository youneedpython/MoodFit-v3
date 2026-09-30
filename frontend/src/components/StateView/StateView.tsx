import type { ReactNode } from "react";
import { Button } from "../Button/Button";
import "./StateView.css";

type LoadingStateProps = {
  message?: string;
};

export function LoadingState({ message = "불러오는 중입니다." }: LoadingStateProps) {
  return (
    <div className="state-view" role="status" aria-live="polite">
      <span className="state-view__spinner" aria-hidden="true" />
      <p className="state-view__message">{message}</p>
    </div>
  );
}

type ErrorStateProps = {
  title?: string;
  message: string;
  /** 재시도가 가능한 경우에만 전달한다. */
  onRetry?: () => void;
};

export function ErrorState({ title = "문제가 발생했습니다.", message, onRetry }: ErrorStateProps) {
  return (
    <div className="state-view state-view--error" role="alert">
      <p className="state-view__title">{title}</p>
      <p className="state-view__message">{message}</p>
      {onRetry && (
        <Button variant="secondary" onClick={onRetry}>
          다시 시도
        </Button>
      )}
    </div>
  );
}

type EmptyStateProps = {
  title: string;
  message?: string;
  /** 다음 행동 안내 (예: Check-in CTA) */
  action?: ReactNode;
};

export function EmptyState({ title, message, action }: EmptyStateProps) {
  return (
    <div className="state-view">
      <p className="state-view__title">{title}</p>
      {message && <p className="state-view__message">{message}</p>}
      {action}
    </div>
  );
}
