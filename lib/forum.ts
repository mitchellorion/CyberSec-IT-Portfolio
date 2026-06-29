// ---------------------------------------------------------------------------
// Client-side forum (localStorage-backed).
//
// Like the auth layer, posts live in the visitor's browser — this is a
// single-device demo. To make it a real shared forum, replace the read/write
// helpers with calls to a backend (Cloudflare D1 / KV behind the Worker) and
// keep the same exported API.
// ---------------------------------------------------------------------------

const POSTS_KEY = "flipstats_forum_posts";

export const CATEGORIES = [
  { id: "general", label: "General", desc: "Anything flip.gg — strategy, questions, chat.", vipOnly: false },
  { id: "vent", label: "Vent", desc: "Bad beats and tilt. Let it out.", vipOnly: false },
  { id: "big-wins", label: "Big Wins", desc: "Post your fattest hits and proudest pulls.", vipOnly: false },
  { id: "vip", label: "VIP", desc: "Verified creators only.", vipOnly: true },
] as const;

export type CategoryId = (typeof CATEGORIES)[number]["id"];

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

// A few seed threads so categories aren't empty on first visit. These are
// merged in only when the user has no posts of their own yet.
const SEED: Post[] = [
  {
    id: "seed-1",
    category: "general",
    authorId: "system",
    author: "flipstats",
    title: "Welcome to the flipstats forum 👋",
    body: "Talk strategy, share odds, ask questions. Be decent to each other. Posts are stored locally in your browser for now.",
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

function readStored(): Post[] {
  try {
    const raw = localStorage.getItem(POSTS_KEY);
    return raw ? (JSON.parse(raw) as Post[]) : [];
  } catch {
    return [];
  }
}

function writeStored(posts: Post[]): void {
  try {
    localStorage.setItem(POSTS_KEY, JSON.stringify(posts));
  } catch {}
}

/** All posts (seeds + stored), newest first. */
export function getPosts(): Post[] {
  const stored = readStored();
  const merged = [...stored, ...SEED.filter((s) => !stored.some((p) => p.id === s.id))];
  return merged.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function getPostsByCategory(category: CategoryId): Post[] {
  return getPosts().filter((p) => p.category === category);
}

export function getPost(id: string): Post | undefined {
  return getPosts().find((p) => p.id === id);
}

export function addPost(input: {
  category: CategoryId;
  authorId: string;
  author: string;
  title: string;
  body: string;
}): Post {
  const post: Post = {
    id: crypto.randomUUID(),
    ...input,
    createdAt: new Date().toISOString(),
    replies: [],
  };
  // persist seeds alongside user posts so seed threads can also accrue replies
  writeStored([post, ...getPosts()]);
  return post;
}

export function addReply(
  postId: string,
  input: { authorId: string; author: string; body: string }
): void {
  const posts = getPosts();
  const idx = posts.findIndex((p) => p.id === postId);
  if (idx < 0) return;
  posts[idx] = {
    ...posts[idx],
    replies: [
      ...posts[idx].replies,
      {
        id: crypto.randomUUID(),
        ...input,
        createdAt: new Date().toISOString(),
      },
    ],
  };
  writeStored(posts);
}

/** Delete a post — only allowed for its author (enforced by caller). */
export function deletePost(postId: string): void {
  writeStored(getPosts().filter((p) => p.id !== postId));
}
