"use client";

// Auth context. Delegates all reads/writes to the unified data layer (lib/store),
// which uses the shared Cloudflare KV backend when available and falls back to
// localStorage otherwise. This component only holds the session token + the
// current user, and exposes async actions to the UI.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { PublicAccount } from "./models";
import { store } from "./store";

const SESSION_KEY = "flipstats_session";

interface AuthContextValue {
  user: PublicAccount | null;
  ready: boolean;
  /** Session token — pass to lib/store actions that require auth (e.g. forum posts). */
  token: string;
  /** A user is a "verified creator" (VIP) once they've claimed a box. */
  isVIP: boolean;
  signup: (username: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  login: (username: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
  updateProfile: (patch: { flipUID?: string; bio?: string }) => Promise<void>;
  claimBox: (boxId: string) => Promise<void>;
  unclaimBox: (boxId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function readToken(): string {
  try { return localStorage.getItem(SESSION_KEY) ?? ""; } catch { return ""; }
}
function writeToken(token: string): void {
  try { localStorage.setItem(SESSION_KEY, token); } catch {}
}
function clearToken(): void {
  try { localStorage.removeItem(SESSION_KEY); } catch {}
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<PublicAccount | null>(null);
  const [token, setToken] = useState("");
  const [ready, setReady] = useState(false);

  // hydrate the session on mount
  useEffect(() => {
    let alive = true;
    const t = readToken();
    if (!t) { setReady(true); return; }
    setToken(t);
    store.me(t)
      .then((u) => { if (alive) setUser(u); })
      .catch(() => {})
      .finally(() => { if (alive) setReady(true); });
    return () => { alive = false; };
  }, []);

  const signup = useCallback<AuthContextValue["signup"]>(async (username, password) => {
    const res = await store.signup(username, password);
    if (res.ok && res.token && res.user) {
      writeToken(res.token);
      setToken(res.token);
      setUser(res.user);
      return { ok: true };
    }
    return { ok: false, error: res.error };
  }, []);

  const login = useCallback<AuthContextValue["login"]>(async (username, password) => {
    const res = await store.login(username, password);
    if (res.ok && res.token && res.user) {
      writeToken(res.token);
      setToken(res.token);
      setUser(res.user);
      return { ok: true };
    }
    return { ok: false, error: res.error };
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setToken("");
    setUser(null);
  }, []);

  const updateProfile = useCallback<AuthContextValue["updateProfile"]>(async (patch) => {
    if (!token) return;
    const u = await store.updateProfile(token, patch);
    if (u) setUser(u);
  }, [token]);

  const claimBox = useCallback<AuthContextValue["claimBox"]>(async (boxId) => {
    if (!token) return;
    const u = await store.claim(token, boxId);
    if (u) setUser(u);
  }, [token]);

  const unclaimBox = useCallback<AuthContextValue["unclaimBox"]>(async (boxId) => {
    if (!token) return;
    const u = await store.unclaim(token, boxId);
    if (u) setUser(u);
  }, [token]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      ready,
      token,
      isVIP: !!user && user.claimedBoxes.length > 0,
      signup, login, logout, updateProfile, claimBox, unclaimBox,
    }),
    [user, ready, token, signup, login, logout, updateProfile, claimBox, unclaimBox]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
