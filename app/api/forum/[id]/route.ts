import type { NextRequest } from "next/server";
import { getKV, getAccountByToken, createReply, deletePost } from "@/lib/server/kv";

function bearer(req: NextRequest): string {
  const h = req.headers.get("authorization") ?? "";
  return h.toLowerCase().startsWith("bearer ") ? h.slice(7).trim() : "";
}

// POST — add a reply to a thread (requires auth)
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const kv = await getKV();
  if (!kv) return Response.json({ error: "backend unavailable" }, { status: 503 });

  const acc = await getAccountByToken(kv, bearer(req));
  if (!acc) return Response.json({ error: "not authenticated" }, { status: 401 });

  const { id } = await params;
  let body: { body?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "invalid request" }, { status: 400 });
  }

  const text = (body.body ?? "").trim();
  if (!text) return Response.json({ error: "reply body is required" }, { status: 400 });

  const ok = await createReply(kv, id, { authorId: acc.id, author: acc.username, body: text });
  if (!ok) return Response.json({ error: "thread not found" }, { status: 404 });
  return Response.json({ ok: true });
}

// DELETE — remove a thread (author only)
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const kv = await getKV();
  if (!kv) return Response.json({ error: "backend unavailable" }, { status: 503 });

  const acc = await getAccountByToken(kv, bearer(req));
  if (!acc) return Response.json({ error: "not authenticated" }, { status: 401 });

  const { id } = await params;
  const ok = await deletePost(kv, id, acc.id);
  if (!ok) return Response.json({ error: "not allowed" }, { status: 403 });
  return Response.json({ ok: true });
}
