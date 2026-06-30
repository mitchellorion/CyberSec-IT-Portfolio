// Unified client data layer. Probes /api/health once: if a KV-backed Cloudflare
// backend answers, all reads/writes go through the shared API; otherwise it
// transparently falls back to a per-device localStorage store (GitHub Pages
// static export, or local dev without a KV binding). Same async interface
// either way, so UI code never branches on the mode.

import type { PublicAccount, Post, CategoryId, ChatMessage } from "./models";
import { SEED_POSTS, CHAT_LIMIT } from "./models";

export interface AuthResult {
  ok: boolean;
  token?: string;
  user?: PublicAccount;
  error?: string;
}

// --- mode detection ---------------------------------------------------------
let backendProbe: Promise<boolean> | null = null;

export function backendAvailable(): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  if (!backendProbe) {
    backendProbe = fetch("/api/health")
      .then((r) => (r.ok ? r.json() : null))
      .then((j: { kv?: boolean } | null) => !!j?.kv)
      .catch(() => false);
  }
  return backendProbe;
}

// ===========================================================================
// localStorage implementation
// ===========================================================================
const ACCOUNTS_KEY = "flipstats_accounts";
const POSTS_KEY = "flipstats_forum_posts";
const CHAT_KEY = "flipstats_chat";

interface LocalAccount extends PublicAccount {
  passwordHash: string;
}

// tiny non-cryptographic hash — local fallback obfuscation only
function localHash(pw: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < pw.length; i++) {
    h ^= pw.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16) + ":" + pw.length.toString(16);
}

function readAccounts(): LocalAccount[] {
  try {
    return JSON.parse(localStorage.getItem(ACCOUNTS_KEY) ?? "[]") as LocalAccount[];
  } catch {
    return [];
  }
}
function writeAccounts(accounts: LocalAccount[]): void {
  try { localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts)); } catch {}
}
function toPublic(a: LocalAccount): PublicAccount {
  const { passwordHash: _omit, ...pub } = a;
  void _omit;
  return pub;
}
function persistLocal(acc: LocalAccount): PublicAccount {
  const accounts = readAccounts();
  const idx = accounts.findIndex((a) => a.id === acc.id);
  if (idx >= 0) accounts[idx] = acc; else accounts.push(acc);
  writeAccounts(accounts);
  return toPublic(acc);
}

function readPosts(): Post[] {
  let stored: Post[] = [];
  try { stored = JSON.parse(localStorage.getItem(POSTS_KEY) ?? "[]") as Post[]; } catch {}
  const merged = [...stored, ...SEED_POSTS.filter((s) => !stored.some((p) => p.id === s.id))];
  return merged.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}
function writePosts(posts: Post[]): void {
  try { localStorage.setItem(POSTS_KEY, JSON.stringify(posts)); } catch {}
}

function readChat(): ChatMessage[] {
  try { return JSON.parse(localStorage.getItem(CHAT_KEY) ?? "[]") as ChatMessage[]; } catch { return []; }
}
function writeChat(msgs: ChatMessage[]): void {
  try { localStorage.setItem(CHAT_KEY, JSON.stringify(msgs.slice(-CHAT_LIMIT))); } catch {}
}

// ===========================================================================
// API implementation helpers
// ===========================================================================
async function apiJson(
  path: string,
  opts: { method?: string; token?: string; body?: unknown } = {}
): Promise<{ status: number; data: Record<string, unknown> }> {
  const headers: Record<string, string> = {};
  if (opts.body !== undefined) headers["Content-Type"] = "application/json";
  if (opts.token) headers["Authorization"] = `Bearer ${opts.token}`;
  const res = await fetch(path, {
    method: opts.method ?? "GET",
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });
  let data: Record<string, unknown> = {};
  try { data = await res.json(); } catch {}
  return { status: res.status, data };
}

// ===========================================================================
// public store API
// ===========================================================================
export const store = {
  async signup(username: string, password: string): Promise<AuthResult> {
    if (await backendAvailable()) {
      const { status, data } = await apiJson("/api/account", {
        method: "POST", body: { action: "signup", username, password },
      });
      if (status >= 200 && status < 300) {
        return { ok: true, token: data.token as string, user: data.user as PublicAccount };
      }
      return { ok: false, error: (data.error as string) ?? "Could not sign up." };
    }
    // local
    const name = username.trim();
    if (name.length < 3) return { ok: false, error: "Username must be at least 3 characters." };
    if (password.length < 6) return { ok: false, error: "Password must be at least 6 characters." };
    const accounts = readAccounts();
    if (accounts.some((a) => a.username.toLowerCase() === name.toLowerCase())) {
      return { ok: false, error: "That username is already taken." };
    }
    const acc: LocalAccount = {
      id: crypto.randomUUID(),
      username: name,
      passwordHash: localHash(password),
      flipUID: "",
      claimedBoxes: [],
      bio: "",
      createdAt: new Date().toISOString(),
    };
    const user = persistLocal(acc);
    return { ok: true, token: acc.id, user };
  },

  async login(username: string, password: string): Promise<AuthResult> {
    if (await backendAvailable()) {
      const { status, data } = await apiJson("/api/account", {
        method: "POST", body: { action: "login", username, password },
      });
      if (status >= 200 && status < 300) {
        return { ok: true, token: data.token as string, user: data.user as PublicAccount };
      }
      return { ok: false, error: (data.error as string) ?? "Could not log in." };
    }
    const acc = readAccounts().find(
      (a) => a.username.toLowerCase() === username.trim().toLowerCase()
    );
    if (!acc) return { ok: false, error: "No account with that username." };
    if (acc.passwordHash !== localHash(password)) return { ok: false, error: "Incorrect password." };
    return { ok: true, token: acc.id, user: toPublic(acc) };
  },

  async me(token: string): Promise<PublicAccount | null> {
    if (!token) return null;
    if (await backendAvailable()) {
      const { status, data } = await apiJson("/api/account", { token });
      return status === 200 ? ((data.user as PublicAccount) ?? null) : null;
    }
    const acc = readAccounts().find((a) => a.id === token);
    return acc ? toPublic(acc) : null;
  },

  async updateProfile(token: string, patch: { flipUID?: string; bio?: string }): Promise<PublicAccount | null> {
    if (await backendAvailable()) {
      const { status, data } = await apiJson("/api/account", { method: "PATCH", token, body: patch });
      return status === 200 ? (data.user as PublicAccount) : null;
    }
    const acc = readAccounts().find((a) => a.id === token);
    if (!acc) return null;
    if (typeof patch.flipUID === "string") acc.flipUID = patch.flipUID.trim();
    if (typeof patch.bio === "string") acc.bio = patch.bio.trim();
    return persistLocal(acc);
  },

  async claim(token: string, boxId: string): Promise<PublicAccount | null> {
    if (await backendAvailable()) {
      const { status, data } = await apiJson("/api/account", { method: "PATCH", token, body: { claim: boxId } });
      return status === 200 ? (data.user as PublicAccount) : null;
    }
    const acc = readAccounts().find((a) => a.id === token);
    if (!acc) return null;
    if (!acc.claimedBoxes.includes(boxId)) acc.claimedBoxes = [...acc.claimedBoxes, boxId];
    return persistLocal(acc);
  },

  async unclaim(token: string, boxId: string): Promise<PublicAccount | null> {
    if (await backendAvailable()) {
      const { status, data } = await apiJson("/api/account", { method: "PATCH", token, body: { unclaim: boxId } });
      return status === 200 ? (data.user as PublicAccount) : null;
    }
    const acc = readAccounts().find((a) => a.id === token);
    if (!acc) return null;
    acc.claimedBoxes = acc.claimedBoxes.filter((id) => id !== boxId);
    return persistLocal(acc);
  },

  async listPosts(): Promise<Post[]> {
    if (await backendAvailable()) {
      const { status, data } = await apiJson("/api/forum");
      return status === 200 ? ((data.posts as Post[]) ?? []) : [];
    }
    return readPosts();
  },

  async addPost(
    token: string,
    input: { category: CategoryId; title: string; body: string }
  ): Promise<Post | null> {
    if (await backendAvailable()) {
      const { status, data } = await apiJson("/api/forum", { method: "POST", token, body: input });
      return status === 200 ? (data.post as Post) : null;
    }
    const acc = readAccounts().find((a) => a.id === token);
    if (!acc) return null;
    const post: Post = {
      id: crypto.randomUUID(),
      category: input.category,
      authorId: acc.id,
      author: acc.username,
      title: input.title,
      body: input.body,
      createdAt: new Date().toISOString(),
      replies: [],
    };
    writePosts([post, ...readPosts()]);
    return post;
  },

  async addReply(token: string, postId: string, body: string): Promise<boolean> {
    if (await backendAvailable()) {
      const { status } = await apiJson(`/api/forum/${postId}`, { method: "POST", token, body: { body } });
      return status === 200;
    }
    const acc = readAccounts().find((a) => a.id === token);
    if (!acc) return false;
    const posts = readPosts();
    const idx = posts.findIndex((p) => p.id === postId);
    if (idx < 0) return false;
    posts[idx] = {
      ...posts[idx],
      replies: [
        ...posts[idx].replies,
        { id: crypto.randomUUID(), authorId: acc.id, author: acc.username, body, createdAt: new Date().toISOString() },
      ],
    };
    writePosts(posts);
    return true;
  },

  async deletePost(token: string, postId: string): Promise<boolean> {
    if (await backendAvailable()) {
      const { status } = await apiJson(`/api/forum/${postId}`, { method: "DELETE", token });
      return status === 200;
    }
    const acc = readAccounts().find((a) => a.id === token);
    if (!acc) return false;
    const posts = readPosts();
    const target = posts.find((p) => p.id === postId);
    if (!target || target.authorId !== acc.id) return false;
    writePosts(posts.filter((p) => p.id !== postId));
    return true;
  },

  async listChat(): Promise<ChatMessage[]> {
    if (await backendAvailable()) {
      const { status, data } = await apiJson("/api/chat");
      return status === 200 ? ((data.messages as ChatMessage[]) ?? []) : [];
    }
    return readChat();
  },

  async sendChat(token: string, body: string): Promise<ChatMessage | null> {
    if (await backendAvailable()) {
      const { status, data } = await apiJson("/api/chat", { method: "POST", token, body: { body } });
      return status === 200 ? (data.message as ChatMessage) : null;
    }
    const acc = readAccounts().find((a) => a.id === token);
    if (!acc) return null;
    const msg: ChatMessage = {
      id: crypto.randomUUID(),
      authorId: acc.id,
      author: acc.username,
      body: body.slice(0, 300),
      createdAt: new Date().toISOString(),
    };
    writeChat([...readChat(), msg]);
    return msg;
  },
};
