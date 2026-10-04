import { useState } from "react";
import { useSearchParams } from "react-router";
import { useAuth } from "./AuthProvider";
import { request } from "../../services/api";
import "./auth.css";

export function LoginPage() {
  const auth = useAuth();
  const [params] = useSearchParams();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
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
    {(params.has("error") || error) && <p role="alert">로그인하지 못했습니다. 다시 시도해 주세요.</p>}
    <div className="login-actions">
      {auth?.state.providers.filter((provider) => provider === "google" || provider === "kakao").map((provider) =>
        <a className="login-provider" href={`/api/auth/login/${provider}`} key={provider}>{provider === "google" ? "Google" : "Kakao"}로 로그인</a>)}
      {auth?.state.guestEnabled && <button disabled={busy} onClick={guest}>{busy ? "로그인 중…" : "로그인 없이 둘러보기"}</button>}
    </div>
    <p>제공자의 사용자 번호와 닉네임만 저장합니다. 이메일과 프로필 사진은 수집하지 않습니다.</p>
    {auth?.state.guestEnabled && <p>체험 계정의 기록은 모든 방문자가 함께 보고 사용할 수 있습니다.</p>}
  </section>;
}
