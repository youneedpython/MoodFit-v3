import { useEffect, useRef, useState, type RefObject } from "react";
import { ACCOUNT_DELETED_FLAG } from "./accountDeletionNotice";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router";
import { request } from "../../services/api";

export function DeleteAccountDialog({ onClose, returnFocusRef }: { onClose: () => void; returnFocusRef: RefObject<HTMLButtonElement | null> }) {
  const cancel = useRef<HTMLButtonElement>(null);
  const dialog = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const navigate = useNavigate();
  useEffect(() => {
    cancel.current?.focus();
    const contain = (event: FocusEvent) => {
      if (!dialog.current?.contains(event.target as Node)) cancel.current?.focus();
    };
    const keyboard = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); onClose(); }
      if (event.key === "Tab") {
        const buttons = dialog.current?.querySelectorAll<HTMLButtonElement>("button:not(:disabled)");
        if (!buttons?.length) return;
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
    if (busy) return;
    setBusy(true); setError(false);
    try {
      await request<void>("/auth/account", { method: "DELETE" });
      // Clear authenticated UI immediately; bootstrap may be temporarily unavailable after deletion.
      // The auth guard redirects to /login once the state is cleared and may drop a query string,
      // so the completion notice is carried in sessionStorage instead of the URL.
      try { sessionStorage.setItem(ACCOUNT_DELETED_FLAG, "1"); } catch { /* storage unavailable */ }
      window.dispatchEvent(new Event("moodfit:unauthenticated"));
      navigate("/login", { replace: true });
    } catch { setError(true); setBusy(false); }
  }
  return createPortal(<div className="account-dialog-backdrop">
    <div className="account-dialog" ref={dialog} role="dialog" aria-modal="true" aria-labelledby="account-delete-title" aria-describedby="account-delete-description" aria-busy={busy}>
      <h2 id="account-delete-title">내 데이터 삭제</h2>
      <p id="account-delete-description">계정, 체크인과 추천, AI 코멘트, 주간 리포트, 생성 시도 기록을 모두 삭제하고 로그아웃합니다. 되돌릴 수 없습니다. 백업에는 삭제 전 데이터가 최대 14일 남을 수 있습니다.</p>
      {error && <p role="alert">삭제하지 못했습니다. 다시 시도해 주세요.</p>}
      {busy && <p role="status">삭제하고 있습니다.</p>}
      <div className="account-dialog-actions"><button ref={cancel} onClick={onClose}>취소</button><button disabled={busy} onClick={remove}>{busy ? "삭제 중…" : "삭제"}</button></div>
    </div>
  </div>, document.body);
}
