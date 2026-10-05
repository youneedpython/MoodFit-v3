import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { DeleteAccountDialog } from "./DeleteAccountDialog";
import { InstallAppButton } from "../install/InstallAppButton";
import { useAuth } from "./AuthProvider";
import { request } from "../../services/api";
import "./auth.css";

const colors = ["var(--color-accent-blue)", "var(--color-accent-purple)", "var(--color-positive)"];
export function UserMenu() {
  const auth = useAuth();
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const closeDialog = useCallback(() => { setDeleting(false); }, []);
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const firstMenuItem = useRef<HTMLAnchorElement>(null);
  useEffect(() => {
    if (!open) return;
    firstMenuItem.current?.focus();
    const outside = (event: PointerEvent) => { if (!(event.target as Element | null)?.closest('[role="dialog"], .account-dialog-backdrop') && !root.current?.contains(event.target as Node)) setOpen(false); };
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") { setOpen(false); button.current?.focus(); } };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("pointerdown", outside); document.removeEventListener("keydown", escape); };
  }, [open]);
  const user = auth?.state.user;
  if (!user) return null;
  async function logout() {
    setBusy(true); setError(false);
    try { await request<void>("/auth/logout", { method: "POST" }); setOpen(false); await auth?.refresh(); }
    catch { setError(true); }
    finally { setBusy(false); }
  }
  return <div className="user-menu" ref={root} onBlur={(event) => { if (!(event.relatedTarget as Element | null)?.closest('[role="dialog"]') && !event.currentTarget.contains(event.relatedTarget as Node)) setOpen(false); }}>
    <button className="user-avatar" ref={button} style={{ backgroundColor: colors[user.id % colors.length] }} aria-label={`${user.displayName} 사용자 메뉴`} aria-expanded={open} aria-haspopup="menu" aria-controls="user-menu-popup" onClick={() => setOpen(!open)}>{Array.from(user.displayName)[0]}</button>
    {open && <div className="user-menu__popup" id="user-menu-popup" role="menu" aria-label="사용자 메뉴">
      <p className="user-menu__name">{user.displayName}</p><p className="user-menu__provider">{user.provider === "guest" ? "체험 계정" : user.provider === "google" ? "Google" : "Kakao"}</p>
      <Link ref={firstMenuItem} role="menuitem" to="/privacy">개인정보 처리 안내</Link>
      <InstallAppButton menu onPrompt={() => { setOpen(false); button.current?.focus(); }} />
      <button role="menuitem" disabled={busy} onClick={logout}>로그아웃</button>
      {user.provider !== "guest" && <><hr role="separator" /><button className="user-menu__withdraw" role="menuitem" onClick={() => { setOpen(false); setDeleting(true); }}>회원 탈퇴</button></>}
      {error && <p role="alert">로그아웃하지 못했습니다. 다시 시도해 주세요.</p>}
    </div>}
    {deleting && <DeleteAccountDialog onClose={closeDialog} returnFocusRef={button} />}
  </div>;
}
