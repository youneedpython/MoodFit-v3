import { useEffect, useRef, useState, type RefObject } from "react";
import { ACCOUNT_DELETED_FLAG } from "./accountDeletionNotice";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router";
import { request } from "../../services/api";
import { Button } from "../../components/Button/Button";
import "./auth.css";

export function DeleteAccountDialog({ onClose, returnFocusRef }: { onClose: () => void; returnFocusRef: RefObject<HTMLButtonElement | null> }) {
  const cancel = useRef<HTMLButtonElement>(null);
  const dialog = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [error, setError] = useState(false);
  const navigate = useNavigate();
  useEffect(() => {
    if (error && !busy) cancel.current?.focus();
  }, [error, busy]);
  useEffect(() => {
    cancel.current?.focus();
    const contain = (event: FocusEvent) => {
      if (!dialog.current?.contains(event.target as Node)) {
        if (busyRef.current) dialog.current?.focus();
        else cancel.current?.focus();
      }
    };
    const keyboard = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); if (!busyRef.current) onClose(); }
      if (event.key === "Tab") {
        const buttons = dialog.current?.querySelectorAll<HTMLButtonElement>("button:not(:disabled)");
        if (!buttons?.length) { event.preventDefault(); dialog.current?.focus(); return; }
        const first = buttons[0], last = buttons[buttons.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener("focusin", contain);
    document.addEventListener("keydown", keyboard);
    return () => {
      document.removeEventListener("focusin", contain);
      document.removeEventListener("keydown", keyboard);
      returnFocusRef.current?.focus();
    };
  }, [onClose, returnFocusRef]);
  async function remove() {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true); setError(false);
    dialog.current?.focus();
    try {
      await request<void>("/auth/account", { method: "DELETE" });
      // Clear authenticated UI immediately; bootstrap may be temporarily unavailable after deletion.
      // The auth guard redirects to /login once the state is cleared and may drop a query string,
      // so the completion notice is carried in sessionStorage instead of the URL.
      try { sessionStorage.setItem(ACCOUNT_DELETED_FLAG, "1"); } catch { /* storage unavailable */ }
      window.dispatchEvent(new Event("moodfit:unauthenticated"));
      navigate("/login", { replace: true });
    } catch { busyRef.current = false; setError(true); setBusy(false); }
  }
  return createPortal(<div className="account-dialog-backdrop">
    <div className="account-dialog" ref={dialog} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="account-delete-title" aria-describedby="account-delete-description" aria-busy={busy}>
      <h2 id="account-delete-title">회원 탈퇴</h2>
      <p id="account-delete-description">탈퇴하면 계정, 체크인과 추천, 추천 평가(좋아요 / 별로예요), AI 코멘트, 주간 리포트, 생성 시도 기록을 모두 삭제하고 로그아웃합니다. 되돌릴 수 없습니다. 백업에는 삭제 전 데이터가 최대 14일 남을 수 있습니다.</p>
      {error && <p role="alert">탈퇴하지 못했습니다. 다시 시도해 주세요.</p>}
      {busy && <p role="status">탈퇴 처리하고 있습니다.</p>}
      <div className="account-dialog-actions"><Button ref={cancel} variant="secondary" disabled={busy} onClick={onClose}>취소</Button><Button disabled={busy} onClick={remove}>{busy ? "탈퇴 처리 중…" : "탈퇴하기"}</Button></div>
    </div>
  </div>, document.body);
}
