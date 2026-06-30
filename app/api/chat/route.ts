import type { NextRequest } from "next/server";
import { getKV, getAccountByToken, getChat, addChat } from "@/lib/server/kv";

function bearer(req: NextRequest): string {
  const h = req.headers.get("authorization") ?? "";
  return h.toLowerCase().startsWith("bearer ") ? h.slice(7).trim() : "";
}

export async function GET() {
  const kv = await getKV();
  if (!kv) return Response.json({ error: "backend unavailable" }, { status: 503 });
  return Response.json({ messages: await getChat(kv) });
}

export async function POST(req: NextRequest) {
  const kv = await getKV();
  if (!kv) return Response.json({ error: "backend unavailable" }, { status: 503 });

  const acc = await getAccountByToken(kv, bearer(req));
  if (!acc) return Response.json({ error: "not authenticated" }, { status: 401 });

  let body: { body?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "invalid request" }, { status: 400 });
  }

  const text = (body.body ?? "").trim().slice(0, 300);
  if (!text) return Response.json({ error: "message is required" }, { status: 400 });

  const message = await addChat(kv, { authorId: acc.id, author: acc.username, body: text });
  return Response.json({ message });
}
