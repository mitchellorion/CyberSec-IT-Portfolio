"use client";

import { useState } from "react";
import Link from "next/link";
import {
  User as UserIcon, ShieldCheck, LogOut, Package,
  Fingerprint, Save, Check, AlertCircle,
} from "lucide-react";
import { useAuth } from "@/lib/auth";

export default function AccountPage() {
  const { user } = useAuth();
  return (
    <div className="max-w-xl mx-auto flex flex-col gap-6">
      {user ? <Profile /> : <AuthForms />}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Logged-out: sign up / log in
// ---------------------------------------------------------------------------
function AuthForms() {
  const { signup, login } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("signup");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const res = mode === "signup" ? signup(username, password) : login(username, password);
    if (!res.ok) setError(res.error ?? "Something went wrong.");
  };

  return (
    <>
      <div className="text-center flex flex-col items-center gap-2">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center"
          style={{ background: "var(--accent-glow)", border: "1px solid rgba(124,58,237,0.3)" }}
        >
          <UserIcon size={26} style={{ color: "var(--accent-bright)" }} />
        </div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
          {mode === "signup" ? "Create your account" : "Welcome back"}
        </h1>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          {mode === "signup"
            ? "Join the forum, claim your community boxes, and unlock VIP."
            : "Log in to your flipstats account."}
        </p>
      </div>

      <div
        className="flex p-1 rounded-xl gap-1"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
      >
        {(["signup", "login"] as const).map((m) => (
          <button
            key={m}
            onClick={() => { setMode(m); setError(null); }}
            className="flex-1 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{
              background: mode === m ? "var(--accent)" : "transparent",
              color: mode === m ? "#fff" : "var(--text-secondary)",
            }}
          >
            {m === "signup" ? "Sign up" : "Log in"}
          </button>
        ))}
      </div>

      <form
        onSubmit={submit}
        className="flex flex-col gap-4 rounded-2xl p-6"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
      >
        <div className="flex flex-col gap-1">
          <label className="text-xs" style={{ color: "var(--text-muted)" }}>Username</label>
          <input
            type="text" value={username} autoComplete="username"
            onChange={(e) => setUsername(e.target.value)}
            placeholder="pick a username"
            className="w-full px-3 py-2 rounded-lg text-sm outline-none"
            style={{ background: "#0a0a14", border: "1px solid var(--border-bright)", color: "var(--text-primary)" }}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs" style={{ color: "var(--text-muted)" }}>Password</label>
          <input
            type="password" value={password}
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full px-3 py-2 rounded-lg text-sm outline-none"
            style={{ background: "#0a0a14", border: "1px solid var(--border-bright)", color: "var(--text-primary)" }}
          />
        </div>

        {error && (
          <div className="flex items-center gap-2 text-xs" style={{ color: "var(--red)" }}>
            <AlertCircle size={14} /> {error}
          </div>
        )}

        <button
          type="submit"
          className="w-full py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-90"
          style={{ background: "var(--accent)", color: "#fff" }}
        >
          {mode === "signup" ? "Create account" : "Log in"}
        </button>

        <p className="text-xs text-center" style={{ color: "var(--text-muted)" }}>
          Accounts are stored locally in your browser — no email, no server.
        </p>
      </form>
    </>
  );
}

// ---------------------------------------------------------------------------
// Logged-in: profile
// ---------------------------------------------------------------------------
function Profile() {
  const { user, isVIP, logout, updateProfile, unclaimBox } = useAuth();
  const [flipUID, setFlipUID] = useState(user!.flipUID);
  const [bio, setBio] = useState(user!.bio);
  const [saved, setSaved] = useState(false);

  const save = () => {
    updateProfile({ flipUID: flipUID.trim(), bio: bio.trim() });
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  };

  const dirty = flipUID.trim() !== user!.flipUID || bio.trim() !== user!.bio;
  const joined = new Date(user!.createdAt).toLocaleDateString(undefined, {
    year: "numeric", month: "short", day: "numeric",
  });

  return (
    <>
      {/* identity card */}
      <div
        className="rounded-2xl p-6 flex items-center gap-4"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
      >
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0"
          style={{ background: "var(--accent-glow)", border: "1px solid rgba(124,58,237,0.3)" }}
        >
          {isVIP
            ? <ShieldCheck size={30} style={{ color: "var(--accent-bright)" }} />
            : <UserIcon size={30} style={{ color: "var(--accent-bright)" }} />}
        </div>
        <div className="flex flex-col gap-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold truncate" style={{ color: "var(--text-primary)" }}>
              {user!.username}
            </h1>
            {isVIP && (
              <span
                className="text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1"
                style={{ background: "var(--accent-glow)", color: "var(--accent-bright)", border: "1px solid rgba(124,58,237,0.3)" }}
              >
                <ShieldCheck size={11} /> Verified Creator
              </span>
            )}
          </div>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>Member since {joined}</p>
          {user!.bio && <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>{user!.bio}</p>}
        </div>
      </div>

      {/* editable profile */}
      <div
        className="rounded-2xl p-6 flex flex-col gap-4"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
      >
        <h2 className="text-sm font-semibold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
          <Fingerprint size={15} style={{ color: "var(--accent-bright)" }} /> Profile
        </h2>

        <div className="flex flex-col gap-1">
          <label className="text-xs" style={{ color: "var(--text-muted)" }}>flip.gg UID</label>
          <input
            type="text" value={flipUID}
            onChange={(e) => setFlipUID(e.target.value)}
            placeholder="e.g. 65c6053db4162409b64c55eb"
            className="w-full px-3 py-2 rounded-lg text-sm outline-none font-mono"
            style={{ background: "#0a0a14", border: "1px solid var(--border-bright)", color: "var(--text-primary)" }}
          />
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Set your UID to find and claim the community boxes you created on the{" "}
            <Link href="/community" className="underline" style={{ color: "var(--accent-bright)" }}>Community</Link> page.
          </p>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs" style={{ color: "var(--text-muted)" }}>Bio</label>
          <textarea
            value={bio} rows={2}
            onChange={(e) => setBio(e.target.value)}
            placeholder="A line about you (optional)"
            className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-none"
            style={{ background: "#0a0a14", border: "1px solid var(--border-bright)", color: "var(--text-primary)" }}
          />
        </div>

        <button
          onClick={save} disabled={!dirty}
          className="self-start flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-opacity disabled:opacity-40"
          style={{ background: "var(--accent)", color: "#fff" }}
        >
          {saved ? <><Check size={14} /> Saved</> : <><Save size={14} /> Save changes</>}
        </button>
      </div>

      {/* claimed boxes */}
      <div
        className="rounded-2xl p-6 flex flex-col gap-3"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
      >
        <h2 className="text-sm font-semibold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
          <Package size={15} style={{ color: "var(--accent-bright)" }} /> Claimed boxes
          <span className="text-xs font-normal" style={{ color: "var(--text-muted)" }}>
            ({user!.claimedBoxes.length})
          </span>
        </h2>
        {user!.claimedBoxes.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            You haven&apos;t claimed any boxes yet. Set your UID above, then claim your creations on the{" "}
            <Link href="/community" className="underline" style={{ color: "var(--accent-bright)" }}>Community</Link> page
            to become a Verified Creator.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {user!.claimedBoxes.map((id) => (
              <div
                key={id}
                className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg"
                style={{ background: "#0a0a14", border: "1px solid var(--border)" }}
              >
                <Link
                  href={`/lootboxes/${id}`}
                  className="text-sm truncate hover:underline"
                  style={{ color: "var(--text-primary)" }}
                >
                  {id.replace(/^community-/, "")}
                </Link>
                <button
                  onClick={() => unclaimBox(id)}
                  className="text-xs shrink-0 hover:opacity-80"
                  style={{ color: "var(--text-muted)" }}
                >
                  Unclaim
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <button
        onClick={logout}
        className="self-start flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}
      >
        <LogOut size={14} /> Log out
      </button>
    </>
  );
}
