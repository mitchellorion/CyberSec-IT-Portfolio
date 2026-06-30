import type { NextRequest } from "next/server";
import { getKV, getAccountByToken, getAllPosts, createPost } from "@/lib/server/kv";
import { isCategory } from "@/lib/models";

function bearer(req: NextRequest): string {
  const h = req.headers.get("authorization") ?? "";
  return h.toLowerCase().startsWith("bearer ") ? h.slice(7).trim() : "";
}

// GET — all posts (client filters by category)
export async function GET() {
  const kv = await getKV();
  if (!kv) return Response.json({ error: "backend unavailable" }, { status: 503 });
  return Response.json({ posts: await getAllPosts(kv) });
}

// POST — create a thread (requires auth)
export async function POST(req: NextRequest) {
  const kv = await getKV();
  if (!kv) return Response.json({ error: "backend unavailable" }, { status: 503 });

  const acc = await getAccountByToken(kv, bearer(req));
  if (!acc) return Response.json({ error: "not authenticated" }, { status: 401 });

  let body: { category?: string; title?: string; body?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "invalid request" }, { status: 400 });
  }

  const category = body.category ?? "";
  const title = (body.title ?? "").trim();
  const text = (body.body ?? "").trim();
  if (!isCategory(category)) return Response.json({ error: "invalid category" }, { status: 400 });
  if (!title || !text) return Response.json({ error: "title and body are required" }, { status: 400 });

  const post = await createPost(kv, {
    category,
    authorId: acc.id,
    author: acc.username,
    title,
    body: text,
  });
  return Response.json({ post });
}
