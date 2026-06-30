// Shared, import-safe types and constants used by both the client (localStorage
// fallback) and the server (Cloudflare KV API routes). No "use client", no
// storage access, no side effects — safe to import anywhere.

export interface PublicAccount {
  id: string;
  username: string;
  flipUID: string;        // user's flip.gg UID, used to match/claim community boxes
  claimedBoxes: string[]; // community box ids the user has claimed
  bio: string;
  createdAt: string;
}

/** Server-side account record (adds the password hash). */
export interface Account extends PublicAccount {
  passwordHash: string;
}

export const CATEGORIES = [
  { id: "general", label: "General", desc: "Anything flip.gg — strategy, questions, chat.", vipOnly: false },
  { id: "vent", label: "Vent", desc: "Bad beats and tilt. Let it out.", vipOnly: false },
  { id: "big-wins", label: "Big Wins", desc: "Post your fattest hits and proudest pulls.", vipOnly: false },
  { id: "vip", label: "VIP", desc: "Verified creators only.", vipOnly: true },
] as const;

export type CategoryId = (typeof CATEGORIES)[number]["id"];

export const CATEGORY_IDS: CategoryId[] = CATEGORIES.map((c) => c.id);

export interface Reply {
  id: string;
  authorId: string;
  author: string;
  body: string;
  createdAt: string;
}

export interface Post {
  id: string;
  category: CategoryId;
  authorId: string;
  author: string;
  title: string;
  body: string;
  createdAt: string;
  replies: Reply[];
}

// Seed threads so categories aren't empty on a brand-new store.
export const SEED_POSTS: Post[] = [
  {
    id: "seed-1",
    category: "general",
    authorId: "system",
    author: "flipstats",
    title: "Welcome to the flipstats forum 👋",
    body: "Talk strategy, share odds, ask questions. Be decent to each other.",
    createdAt: "2026-06-20T12:00:00.000Z",
    replies: [],
  },
  {
    id: "seed-2",
    category: "big-wins",
    authorId: "system",
    author: "flipstats",
    title: "Post your best community-box hit",
    body: "Pulled something huge out of a community box? Drop the box name and the item here.",
    createdAt: "2026-06-21T15:30:00.000Z",
    replies: [],
  },
  {
    id: "seed-3",
    category: "vent",
    authorId: "system",
    author: "flipstats",
    title: "RNG hates me today",
    body: "10 boxes, nothing above EV. Misery loves company — how's your luck?",
    createdAt: "2026-06-22T09:10:00.000Z",
    replies: [],
  },
];

export function isCategory(value: string): value is CategoryId {
  return (CATEGORY_IDS as string[]).includes(value);
}

export interface ChatMessage {
  id: string;
  authorId: string;
  author: string;
  body: string;
  createdAt: string;
}

export const CHAT_LIMIT = 100;
