// Server-only: Cloudflare KV access + account/forum operations.
//
// This runs only inside the Cloudflare Worker (opennextjs-cloudflare). When the
// code runs anywhere without a Worker context (next dev, next build, GitHub
// Pages export) getKV() returns null and the API routes report "no backend",
// so the client falls back to localStorage.
//
// KV is eventually consistent and last-write-wins. For this small forum the
// single-key post list is fine; a high-traffic version would shard per-post.

import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { Account, PublicAccount, Post, Reply, CategoryId, ChatMessage } from "@/lib/models";
import { SEED_POSTS, CHAT_LIMIT } from "@/lib/models";

// Minimal structural type for the bits of KVNamespace we use — avoids pulling
// in @cloudflare/workers-types just for this.
export interface KVLike {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
  delete(key: string): Promise<void>;
}

const KEYS = {
  account: (username: string) => `account:${username.toLowerCase()}`,
  session: (token: string) => `session:${token}`,
  posts: "forum:posts",
  chat: "chat:messages",
};

export async function getKV(): Promise<KVLike | null> {
  try {
    const { env } = await getCloudflareContext({ async: true });
    const kv = (env as unknown as { FLIPSTATS_KV?: KVLike }).FLIPSTATS_KV;
    return kv ?? null;
  } catch {
    return null; // not running on Cloudflare
  }
}

// --- password hashing (SHA-256 + salt; Web Crypto is available in Workers) ---
const SALT = "flipstats:v1";
export async function hashPassword(pw: string): Promise<string> {
  const data = new TextEncoder().encode(`${SALT}:${pw}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function toPublic(acc: Account): PublicAccount {
  const { passwordHash: _omit, ...pub } = acc;
  void _omit;
  return pub;
}

// --- accounts ---------------------------------------------------------------
export async function getAccountByUsername(kv: KVLike, username: string): Promise<Account | null> {
  const raw = await kv.get(KEYS.account(username));
  return raw ? (JSON.parse(raw) as Account) : null;
}

export async function saveAccount(kv: KVLike, acc: Account): Promise<void> {
  await kv.put(KEYS.account(acc.username), JSON.stringify(acc));
}

export async function createSession(kv: KVLike, username: string): Promise<string> {
  const token = crypto.randomUUID();
  // 30-day sessions
  await kv.put(KEYS.session(token), username.toLowerCase(), { expirationTtl: 60 * 60 * 24 * 30 });
  return token;
}

export async function getAccountByToken(kv: KVLike, token: string): Promise<Account | null> {
  if (!token) return null;
  const username = await kv.get(KEYS.session(token));
  if (!username) return null;
  return getAccountByUsername(kv, username);
}

// --- forum ------------------------------------------------------------------
export async function getAllPosts(kv: KVLike): Promise<Post[]> {
  const raw = await kv.get(KEYS.posts);
  const stored = raw ? (JSON.parse(raw) as Post[]) : [];
  // merge seeds that haven't been persisted yet
  const merged = [...stored, ...SEED_POSTS.filter((s) => !stored.some((p) => p.id === s.id))];
  return merged.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

async function savePosts(kv: KVLike, posts: Post[]): Promise<void> {
  await kv.put(KEYS.posts, JSON.stringify(posts));
}

export async function createPost(
  kv: KVLike,
  input: { category: CategoryId; authorId: string; author: string; title: string; body: string }
): Promise<Post> {
  const post: Post = {
    id: crypto.randomUUID(),
    ...input,
    createdAt: new Date().toISOString(),
    replies: [],
  };
  await savePosts(kv, [post, ...(await getAllPosts(kv))]);
  return post;
}

export async function createReply(
  kv: KVLike,
  postId: string,
  input: { authorId: string; author: string; body: string }
): Promise<boolean> {
  const posts = await getAllPosts(kv);
  const idx = posts.findIndex((p) => p.id === postId);
  if (idx < 0) return false;
  const reply: Reply = { id: crypto.randomUUID(), ...input, createdAt: new Date().toISOString() };
  posts[idx] = { ...posts[idx], replies: [...posts[idx].replies, reply] };
  await savePosts(kv, posts);
  return true;
}

/** Delete a post — only if requested by its author. Returns false if not allowed/found. */
export async function deletePost(kv: KVLike, postId: string, authorId: string): Promise<boolean> {
  const posts = await getAllPosts(kv);
  const target = posts.find((p) => p.id === postId);
  if (!target || target.authorId !== authorId) return false;
  await savePosts(kv, posts.filter((p) => p.id !== postId));
  return true;
}

// --- chat -------------------------------------------------------------------
export async function getChat(kv: KVLike): Promise<ChatMessage[]> {
  const raw = await kv.get(KEYS.chat);
  return raw ? (JSON.parse(raw) as ChatMessage[]) : [];
}

export async function addChat(
  kv: KVLike,
  input: { authorId: string; author: string; body: string }
): Promise<ChatMessage> {
  const msg: ChatMessage = { id: crypto.randomUUID(), ...input, createdAt: new Date().toISOString() };
  const next = [...(await getChat(kv)), msg].slice(-CHAT_LIMIT);
  await kv.put(KEYS.chat, JSON.stringify(next));
  return msg;
}
