"use client";

// ---------------------------------------------------------------------------
// Client-side account system (localStorage-backed).
//
// This site ships as a static export (GitHub Pages) + a Cloudflare Worker that
// only proxies the flip.gg API — there is no application database. So accounts
// live in the visitor's browser. This is a demo auth layer, NOT real security:
// passwords are lightly hashed for obfuscation only. To make accounts shared
// across devices, swap the read/write helpers here for calls to a backend
// (e.g. Cloudflare D1 / KV behind the Worker) and keep the same context API.
// ---------------------------------------------------------------------------

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const ACCOUNTS_KEY = "flipstats_accounts";
const SESSION_KEY = "flipstats_session";

export interface Account {
  id: string;
  username: string;
  passwordHash: string;
  flipUID: string;        // user's flip.gg UID, used to match/claim community boxes
  claimedBoxes: string[]; // community box ids the user has claimed
  bio: string;
  createdAt: string;
}

/** Public view of an account (never expose the password hash to UI code). */
export type PublicAccount = Omit<Account, "passwordHash">;

interface AuthContextValue {
  user: PublicAccount | null;
  /** A user is a "verified creator" (VIP) once they've claimed a box. */
  isVIP: boolean;
  signup: (username: string, password: string) => { ok: boolean; error?: string };
  login: (username: string, password: string) => { ok: boolean; error?: string };
  logout: () => void;
  updateProfile: (patch: Partial<Pick<Account, "flipUID" | "bio">>) => void;
  claimBox: (boxId: string) => void;
  unclaimBox: (boxId: string) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// --- tiny, non-cryptographic hash (demo obfuscation only) -------------------
function hashPassword(pw: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < pw.length; i++) {
    h ^= pw.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  // mix in length so trivially-short collisions are less likely
  return (h >>> 0).toString(16) + ":" + pw.length.toString(16);
}

function readAccounts(): Account[] {
  try {
    const raw = localStorage.getItem(ACCOUNTS_KEY);
    return raw ? (JSON.parse(raw) as Account[]) : [];
  } catch {
    return [];
  }
}

function writeAccounts(accounts: Account[]): void {
  try {
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
  } catch {}
}

function strip(a: Account): PublicAccount {
  const { passwordHash: _ignored, ...rest } = a;
  void _ignored;
  return rest;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<PublicAccount | null>(null);
  const [ready, setReady] = useState(false);

  // hydrate the session on mount
  useEffect(() => {
    try {
      const sid = localStorage.getItem(SESSION_KEY);
      if (sid) {
        const acc = readAccounts().find((a) => a.id === sid);
        if (acc) setUser(strip(acc));
      }
    } catch {}
    setReady(true);
  }, []);

  const persistUser = useCallback((acc: Account) => {
    const accounts = readAccounts();
    const idx = accounts.findIndex((a) => a.id === acc.id);
    if (idx >= 0) accounts[idx] = acc;
    else accounts.push(acc);
    writeAccounts(accounts);
    setUser(strip(acc));
  }, []);

  const signup = useCallback<AuthContextValue["signup"]>((username, password) => {
    const name = username.trim();
    if (name.length < 3) return { ok: false, error: "Username must be at least 3 characters." };
    if (password.length < 6) return { ok: false, error: "Password must be at least 6 characters." };
    const accounts = readAccounts();
    if (accounts.some((a) => a.username.toLowerCase() === name.toLowerCase())) {
      return { ok: false, error: "That username is already taken." };
    }
    const acc: Account = {
      id: crypto.randomUUID(),
      username: name,
      passwordHash: hashPassword(password),
      flipUID: "",
      claimedBoxes: [],
      bio: "",
      createdAt: new Date().toISOString(),
    };
    accounts.push(acc);
    writeAccounts(accounts);
    try {
      localStorage.setItem(SESSION_KEY, acc.id);
    } catch {}
    setUser(strip(acc));
    return { ok: true };
  }, []);

  const login = useCallback<AuthContextValue["login"]>((username, password) => {
    const acc = readAccounts().find(
      (a) => a.username.toLowerCase() === username.trim().toLowerCase()
    );
    if (!acc) return { ok: false, error: "No account with that username." };
    if (acc.passwordHash !== hashPassword(password)) {
      return { ok: false, error: "Incorrect password." };
    }
    try {
      localStorage.setItem(SESSION_KEY, acc.id);
    } catch {}
    setUser(strip(acc));
    return { ok: true };
  }, []);

  const logout = useCallback(() => {
    try {
      localStorage.removeItem(SESSION_KEY);
    } catch {}
    setUser(null);
  }, []);

  const updateProfile = useCallback<AuthContextValue["updateProfile"]>(
    (patch) => {
      if (!user) return;
      const acc = readAccounts().find((a) => a.id === user.id);
      if (!acc) return;
      persistUser({ ...acc, ...patch });
    },
    [user, persistUser]
  );

  const claimBox = useCallback<AuthContextValue["claimBox"]>(
    (boxId) => {
      if (!user) return;
      const acc = readAccounts().find((a) => a.id === user.id);
      if (!acc) return;
      if (acc.claimedBoxes.includes(boxId)) return;
      persistUser({ ...acc, claimedBoxes: [...acc.claimedBoxes, boxId] });
    },
    [user, persistUser]
  );

  const unclaimBox = useCallback<AuthContextValue["unclaimBox"]>(
    (boxId) => {
      if (!user) return;
      const acc = readAccounts().find((a) => a.id === user.id);
      if (!acc) return;
      persistUser({
        ...acc,
        claimedBoxes: acc.claimedBoxes.filter((id) => id !== boxId),
      });
    },
    [user, persistUser]
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isVIP: !!user && user.claimedBoxes.length > 0,
      signup,
      login,
      logout,
      updateProfile,
      claimBox,
      unclaimBox,
    }),
    [user, signup, login, logout, updateProfile, claimBox, unclaimBox]
  );

  // avoid a flash of logged-out UI before hydration completes
  if (!ready) {
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
