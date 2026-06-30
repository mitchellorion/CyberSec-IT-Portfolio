import type { NextRequest } from "next/server";
import {
  getKV, hashPassword, toPublic,
  getAccountByUsername, saveAccount, createSession, getAccountByToken,
} from "@/lib/server/kv";
import type { Account } from "@/lib/models";

function bearer(req: NextRequest): string {
  const h = req.headers.get("authorization") ?? "";
  return h.toLowerCase().startsWith("bearer ") ? h.slice(7).trim() : "";
}

async function noBackend() {
  return Response.json({ error: "backend unavailable" }, { status: 503 });
}

// POST — signup / login
export async function POST(req: NextRequest) {
  const kv = await getKV();
  if (!kv) return noBackend();

  let body: { action?: string; username?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "invalid request" }, { status: 400 });
  }

  const action = body.action;
  const username = (body.username ?? "").trim();
  const password = body.password ?? "";

  if (action === "signup") {
    if (username.length < 3) return Response.json({ error: "Username must be at least 3 characters." }, { status: 400 });
    if (password.length < 6) return Response.json({ error: "Password must be at least 6 characters." }, { status: 400 });
    if (await getAccountByUsername(kv, username)) {
      return Response.json({ error: "That username is already taken." }, { status: 409 });
    }
    const acc: Account = {
      id: crypto.randomUUID(),
      username,
      passwordHash: await hashPassword(password),
      flipUID: "",
      claimedBoxes: [],
      bio: "",
      createdAt: new Date().toISOString(),
    };
    await saveAccount(kv, acc);
    const token = await createSession(kv, username);
    return Response.json({ token, user: toPublic(acc) });
  }

  if (action === "login") {
    const acc = await getAccountByUsername(kv, username);
    if (!acc) return Response.json({ error: "No account with that username." }, { status: 404 });
    if (acc.passwordHash !== (await hashPassword(password))) {
      return Response.json({ error: "Incorrect password." }, { status: 401 });
    }
    const token = await createSession(kv, username);
    return Response.json({ token, user: toPublic(acc) });
  }

  return Response.json({ error: "unknown action" }, { status: 400 });
}

// GET — current user (me)
export async function GET(req: NextRequest) {
  const kv = await getKV();
  if (!kv) return noBackend();
  const acc = await getAccountByToken(kv, bearer(req));
  if (!acc) return Response.json({ user: null }, { status: 401 });
  return Response.json({ user: toPublic(acc) });
}

// PATCH — update profile / claim / unclaim
export async function PATCH(req: NextRequest) {
  const kv = await getKV();
  if (!kv) return noBackend();
  const acc = await getAccountByToken(kv, bearer(req));
  if (!acc) return Response.json({ error: "not authenticated" }, { status: 401 });

  let body: { flipUID?: string; bio?: string; claim?: string; unclaim?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "invalid request" }, { status: 400 });
  }

  const next: Account = { ...acc };
  if (typeof body.flipUID === "string") next.flipUID = body.flipUID.trim();
  if (typeof body.bio === "string") next.bio = body.bio.trim();
  if (body.claim && !next.claimedBoxes.includes(body.claim)) {
    next.claimedBoxes = [...next.claimedBoxes, body.claim];
  }
  if (body.unclaim) {
    next.claimedBoxes = next.claimedBoxes.filter((id) => id !== body.unclaim);
  }

  await saveAccount(kv, next);
  return Response.json({ user: toPublic(next) });
}
