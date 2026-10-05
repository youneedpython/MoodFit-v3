import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { useAuth } from "./AuthProvider";
import { request } from "../../services/api";
import { ACCOUNT_DELETED_FLAG } from "./accountDeletionNotice";
import { Button } from "../../components/Button/Button";
import "./auth.css";

export function LoginPage() {
  const auth = useAuth();
  const [params] = useSearchParams();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  // The deletion flow marks completion in sessionStorage because the auth guard can replace the URL (and its query) on the way here.
  const [deleted] = useState(() => {
    try { return sessionStorage.getItem(ACCOUNT_DELETED_FLAG) === "1"; } catch { return false; }
  });
  useEffect(() => {
    try { sessionStorage.removeItem(ACCOUNT_DELETED_FLAG); } catch { /* storage unavailable */ }
  }, []);
  async function guest() {
    setBusy(true); setError(false);
    try { await request<void>("/auth/guest", { method: "POST" }); await auth?.refresh(); }
    catch { setError(true); }
    finally { setBusy(false); }
  }
  return <section className="login-card">
    <p className="login-eyebrow">YOUR DAILY WELLNESS</p>
    <h1>MoodFit에 로그인</h1>
    <p>오늘의 마음과 몸을 기록하고 나에게 맞는 추천을 만나 보세요.</p>
    {(deleted || params.has("deleted")) && <p role="status">계정과 기록을 삭제했습니다. 다시 로그인하면 새 계정으로 시작합니다.</p>}
    {(params.has("error") || error) && <p role="alert">로그인하지 못했습니다. 다시 시도해 주세요.</p>}
    <div className="login-actions">
      {auth?.state.providers.filter((provider) => provider === "google" || provider === "kakao").map((provider) =>
        <a className={`login-provider login-provider--${provider}`} href={`/api/auth/login/${provider}`} key={provider}>
          {provider === "google" ? <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.39-.18-2.05H12v3.88h5.38a4.6 4.6 0 0 1-2 3.02v2.51h3.24c1.9-1.75 2.98-4.33 2.98-7.36Z" />
            <path fill="#34A853" d="M12 22c2.7 0 4.96-.9 6.62-2.41l-3.24-2.51c-.9.6-2.05.96-3.38.96-2.6 0-4.8-1.76-5.59-4.12H3.07v2.59A10 10 0 0 0 12 22Z" />
            <path fill="#FBBC05" d="M6.41 13.92a6 6 0 0 1 0-3.84V7.49H3.07a10 10 0 0 0 0 9.02l3.34-2.59Z" />
            <path fill="#EA4335" d="M12 5.96c1.47 0 2.79.5 3.83 1.5l2.87-2.88A9.62 9.62 0 0 0 12 2a10 10 0 0 0-8.93 5.49l3.34 2.59C7.2 7.72 9.4 5.96 12 5.96Z" />
          </svg> : <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path fill="#000000" d="M12 3C6.48 3 2 6.53 2 10.89c0 2.8 1.85 5.26 4.63 6.66l-1.18 4.32c-.1.36.31.64.61.44l5.17-3.44c.25.02.51.03.77.03 5.52 0 10-3.53 10-8.01C22 6.53 17.52 3 12 3Z" />
          </svg>}
          <span>{provider === "google" ? "Google로 로그인" : "카카오 로그인"}</span>
        </a>)}
      {auth?.state.guestEnabled && <Button variant="secondary" disabled={busy} onClick={guest}>{busy ? "로그인 중…" : "로그인 없이 둘러보기"}</Button>}
    </div>
    <div className="login-notes">
    <p>제공자의 사용자 번호와 닉네임만 저장합니다. 이메일과 프로필 사진은 수집하지 않습니다.</p>
    {auth?.state.guestEnabled && <p>체험 계정의 기록은 모든 방문자가 함께 보고 사용할 수 있습니다. 개인적인 수치를 입력하지 마세요.</p>}
    <Link to="/privacy">개인정보 처리 안내</Link>
    </div>
  </section>;
}
