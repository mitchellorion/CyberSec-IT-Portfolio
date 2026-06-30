"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  MessageSquare, Plus, Lock, ShieldCheck, ArrowLeft,
  Trash2, CornerDownRight, Send, Loader2,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { store } from "@/lib/store";
import { CATEGORIES, type CategoryId, type Post } from "@/lib/models";

function timeAgo(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return d < 30 ? `${d}d ago` : new Date(iso).toLocaleDateString();
}

export default function ForumPage() {
  const { isVIP } = useAuth();
  const [category, setCategory] = useState<CategoryId>("general");
  const [openPostId, setOpenPostId] = useState<string | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    const all = await store.listPosts();
    setPosts(all);
  }, []);

  useEffect(() => {
    let alive = true;
    store.listPosts()
      .then((all) => { if (alive) setPosts(all); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  const activeCat = CATEGORIES.find((c) => c.id === category)!;
  const locked = activeCat.vipOnly && !isVIP;
  const categoryPosts = useMemo(
    () => posts.filter((p) => p.category === category),
    [posts, category]
  );
  const openPost = useMemo(
    () => posts.find((p) => p.id === openPostId),
    [posts, openPostId]
  );

  const selectCategory = (id: CategoryId) => {
    setCategory(id);
    setOpenPostId(null);
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
          <MessageSquare size={22} style={{ color: "var(--accent-bright)" }} />
          Forum
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
          Community discussion · General, Vent, Big Wins, and VIP
        </p>
      </div>

      {/* category tabs */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((c) => {
          const active = category === c.id;
          return (
            <button
              key={c.id}
              onClick={() => selectCategory(c.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
              style={{
                background: active ? "var(--accent)" : "var(--bg-card)",
                color: active ? "#fff" : "var(--text-secondary)",
                border: `1px solid ${active ? "var(--accent)" : "var(--border)"}`,
              }}
            >
              {c.vipOnly && <ShieldCheck size={13} />}
              {c.label}
            </button>
          );
        })}
      </div>

      {openPost ? (
        <ThreadView post={openPost} onBack={() => setOpenPostId(null)} onChange={reload} />
      ) : (
        <>
          <p className="text-sm -mt-2" style={{ color: "var(--text-muted)" }}>{activeCat.desc}</p>

          {locked ? (
            <div
              className="rounded-2xl p-10 flex flex-col items-center gap-3 text-center"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
            >
              <Lock size={28} style={{ color: "var(--text-muted)" }} />
              <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                VIP is for Verified Creators
              </p>
              <p className="text-sm max-w-sm" style={{ color: "var(--text-muted)" }}>
                Claim a community box you created to verify your account and unlock this category.
              </p>
              <Link
                href="/community"
                className="px-4 py-2 rounded-lg text-sm font-semibold mt-1"
                style={{ background: "var(--accent)", color: "#fff" }}
              >
                Go to Community
              </Link>
            </div>
          ) : (
            <>
              <Composer category={category} onPosted={reload} />

              {loading ? (
                <div className="flex justify-center py-12">
                  <Loader2 size={26} className="animate-spin" style={{ color: "var(--text-muted)" }} />
                </div>
              ) : categoryPosts.length === 0 ? (
                <p className="text-center py-12 text-sm" style={{ color: "var(--text-muted)" }}>
                  No threads here yet. Be the first to post.
                </p>
              ) : (
                <div className="flex flex-col gap-3">
                  {categoryPosts.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setOpenPostId(p.id)}
                      className="text-left rounded-xl p-4 transition-colors hover:border-purple-700"
                      style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-semibold text-sm truncate" style={{ color: "var(--text-primary)" }}>
                          {p.title}
                        </h3>
                        <span className="text-xs shrink-0" style={{ color: "var(--text-muted)" }}>
                          {timeAgo(p.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm mt-1 line-clamp-2" style={{ color: "var(--text-secondary)" }}>
                        {p.body}
                      </p>
                      <div className="flex items-center gap-3 mt-2 text-xs" style={{ color: "var(--text-muted)" }}>
                        <span>by {p.author}</span>
                        <span className="flex items-center gap-1">
                          <MessageSquare size={11} /> {p.replies.length}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
function Composer({ category, onPosted }: { category: CategoryId; onPosted: () => void }) {
  const { user, token } = useAuth();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);

  if (!user) {
    return (
      <div
        className="rounded-xl p-4 text-sm flex items-center justify-between gap-3"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
      >
        <span style={{ color: "var(--text-muted)" }}>Sign in to start a thread.</span>
        <Link
          href="/account"
          className="px-3 py-1.5 rounded-lg text-sm font-semibold shrink-0"
          style={{ background: "var(--accent)", color: "#fff" }}
        >
          Sign in
        </Link>
      </div>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim() || busy) return;
    setBusy(true);
    const post = await store.addPost(token, { category, title: title.trim(), body: body.trim() });
    setBusy(false);
    if (post) {
      setTitle(""); setBody(""); setOpen(false);
      onPosted();
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="self-start flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold"
        style={{ background: "var(--accent)", color: "#fff" }}
      >
        <Plus size={15} /> New thread
      </button>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-2xl p-4 flex flex-col gap-3"
      style={{ background: "var(--bg-card)", border: "1px solid var(--border-bright)" }}
    >
      <input
        type="text" value={title} onChange={(e) => setTitle(e.target.value)}
        placeholder="Thread title"
        className="w-full px-3 py-2 rounded-lg text-sm outline-none font-medium"
        style={{ background: "#0a0a14", border: "1px solid var(--border-bright)", color: "var(--text-primary)" }}
      />
      <textarea
        value={body} rows={3} onChange={(e) => setBody(e.target.value)}
        placeholder="What's on your mind?"
        className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-none"
        style={{ background: "#0a0a14", border: "1px solid var(--border-bright)", color: "var(--text-primary)" }}
      />
      <div className="flex items-center gap-2">
        <button
          type="submit" disabled={!title.trim() || !body.trim() || busy}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-opacity disabled:opacity-40"
          style={{ background: "var(--accent)", color: "#fff" }}
        >
          <Send size={14} /> {busy ? "Posting…" : "Post"}
        </button>
        <button
          type="button" onClick={() => setOpen(false)}
          className="px-4 py-2 rounded-lg text-sm font-medium"
          style={{ background: "transparent", color: "var(--text-muted)" }}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------
function ThreadView({
  post, onBack, onChange,
}: { post: Post; onBack: () => void; onChange: () => void }) {
  const { user, token } = useAuth();
  const [reply, setReply] = useState("");
  const [busy, setBusy] = useState(false);

  const submitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reply.trim() || busy) return;
    setBusy(true);
    const ok = await store.addReply(token, post.id, reply.trim());
    setBusy(false);
    if (ok) { setReply(""); onChange(); }
  };

  const remove = async () => {
    const ok = await store.deletePost(token, post.id);
    if (ok) { onBack(); onChange(); }
  };

  return (
    <div className="flex flex-col gap-4">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm w-fit hover:opacity-80"
        style={{ color: "var(--text-secondary)" }}
      >
        <ArrowLeft size={14} /> Back to threads
      </button>

      <div
        className="rounded-2xl p-5 flex flex-col gap-2"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
      >
        <div className="flex items-start justify-between gap-2">
          <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>{post.title}</h2>
          {user && user.id === post.authorId && (
            <button
              onClick={remove}
              className="flex items-center gap-1 text-xs shrink-0 hover:opacity-80"
              style={{ color: "var(--red)" }}
            >
              <Trash2 size={12} /> Delete
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs" style={{ color: "var(--text-muted)" }}>
          <span>by {post.author}</span>·<span>{timeAgo(post.createdAt)}</span>
        </div>
        <p className="text-sm mt-2 whitespace-pre-wrap" style={{ color: "var(--text-secondary)" }}>{post.body}</p>
      </div>

      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
          <MessageSquare size={14} style={{ color: "var(--accent-bright)" }} />
          {post.replies.length} {post.replies.length === 1 ? "reply" : "replies"}
        </h3>

        {post.replies.map((r) => (
          <div
            key={r.id}
            className="rounded-xl p-3 ml-4 flex flex-col gap-1"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
          >
            <div className="flex items-center gap-2 text-xs" style={{ color: "var(--text-muted)" }}>
              <CornerDownRight size={11} />
              <span style={{ color: "var(--text-secondary)" }}>{r.author}</span>·<span>{timeAgo(r.createdAt)}</span>
            </div>
            <p className="text-sm whitespace-pre-wrap" style={{ color: "var(--text-secondary)" }}>{r.body}</p>
          </div>
        ))}

        {user ? (
          <form onSubmit={submitReply} className="flex flex-col gap-2 ml-4">
            <textarea
              value={reply} rows={2} onChange={(e) => setReply(e.target.value)}
              placeholder="Write a reply…"
              className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-none"
              style={{ background: "#0a0a14", border: "1px solid var(--border-bright)", color: "var(--text-primary)" }}
            />
            <button
              type="submit" disabled={!reply.trim() || busy}
              className="self-start flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-opacity disabled:opacity-40"
              style={{ background: "var(--accent)", color: "#fff" }}
            >
              <Send size={14} /> {busy ? "Replying…" : "Reply"}
            </button>
          </form>
        ) : (
          <p className="text-sm ml-4" style={{ color: "var(--text-muted)" }}>
            <Link href="/account" className="underline" style={{ color: "var(--accent-bright)" }}>Sign in</Link> to reply.
          </p>
        )}
      </div>
    </div>
  );
}
