import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { Navigate, useLocation } from "react-router";
import { request } from "../../services/api";

export interface AuthUser { id: number; displayName: string; provider: "google" | "kakao" | "guest" }
export interface AuthState { authenticated: boolean; user: AuthUser | null; providers: string[]; guestEnabled: boolean }
interface AuthContextValue { state: AuthState; refresh: () => Promise<void> }
const AuthContext = createContext<AuthContextValue | null>(null);
export function useAuth() { return useContext(AuthContext); }
export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState | null>(null);
  const [failed, setFailed] = useState(false);
  const location = useLocation();
  const refresh = useCallback(async () => {
    const result = await request<AuthState>("/auth/me");
    setState(result);
    setFailed(false);
  }, []);
  useEffect(() => { refresh().catch(() => setFailed(true)); }, [refresh]);
  useEffect(() => {
    const expire = () => setState((previous) => previous ? { ...previous, authenticated: false, user: null } : previous);
    window.addEventListener("moodfit:unauthenticated", expire);
    return () => window.removeEventListener("moodfit:unauthenticated", expire);
  }, []);
  if (location.pathname === "/privacy") return <AuthContext.Provider value={state ? { state, refresh } : null}>{children}</AuthContext.Provider>;
  if (failed) return <main role="alert">로그인 상태를 확인할 수 없습니다. <button onClick={() => refresh().catch(() => setFailed(true))}>다시 시도</button><a href="/privacy">개인정보 처리 안내</a></main>;
  if (!state) return <main role="status">로그인 상태를 확인하고 있습니다.</main>;
  if (!state.authenticated && location.pathname !== "/login") return <Navigate to="/login" replace />;
  if (state.authenticated && location.pathname === "/login") return <Navigate to="/" replace />;
  return <AuthContext.Provider value={{ state, refresh }}>{children}</AuthContext.Provider>;
}
