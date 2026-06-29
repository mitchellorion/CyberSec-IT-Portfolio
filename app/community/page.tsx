"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Search, ChevronLeft, ChevronRight,
  Users, AlertTriangle, Loader2, Star,
  Fingerprint, Check, BadgeCheck,
} from "lucide-react";
import {
  getCommunityLootboxes,
  type CommunityBoxSummary,
} from "@/lib/flipApi";
import { fmtUSD } from "@/lib/calc";
import { useAuth } from "@/lib/auth";
import coversJson from "@/public/community-covers.json";

const covers = coversJson as string[];

type SortKey =
  | "newest" | "oldest" | "popular"
  | "price_asc" | "price_desc"
  | "commission_asc" | "risk_asc" | "risk_desc";

function coverFor(id: string, fallback: string): string {
  if (!covers.length) return fallback;
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (Math.imul(31, h) + id.charCodeAt(i)) | 0;
  return covers[Math.abs(h) % covers.length];
}

function timeAgo(iso: string): string {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (d === 0) return "today";
  if (d < 30) return `${d}d ago`;
  const m = Math.floor(d / 30);
  if (m < 12) return `${m}mo ago`;
  return `${Math.floor(m / 12)}y ago`;
}

function riskColor(r: number) {
  return r > 60 ? "var(--red)" : r > 35 ? "#f59e0b" : "var(--green)";
}

function shortUID(uid: string): string {
  return uid.length > 10 ? `${uid.slice(0, 6)}…${uid.slice(-4)}` : uid;
}

// --- claim control (shared by card) -----------------------------------------
function ClaimControl({ box }: { box: CommunityBoxSummary }) {
  const { user, claimBox } = useAuth();
  if (!user) return null;

  const claimed = user.claimedBoxes.includes(box.id);
  const isMine = !!user.flipUID && user.flipUID === box.user;

  if (claimed) {
    return (
      <span
        className="flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-md"
        style={{ background: "var(--accent-glow)", color: "var(--accent-bright)", border: "1px solid rgba(124,58,237,0.3)" }}
      >
        <BadgeCheck size={12} /> Claimed
      </span>
    );
  }

  if (!isMine) return null; // only the creator (matching UID) sees a claim button

  return (
    <button
      onClick={(e) => { e.preventDefault(); claimBox(box.id); }}
      className="flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-md transition-opacity hover:opacity-90"
      style={{ background: "var(--accent)", color: "#fff" }}
    >
      <Check size={12} /> Claim
    </button>
  );
}

function CreatorLine({ box }: { box: CommunityBoxSummary }) {
  const { user } = useAuth();
  const isMine = !!user?.flipUID && user.flipUID === box.user;
  return (
    <span
      className="flex items-center gap-1 text-xs font-mono truncate"
      style={{ color: isMine ? "var(--accent-bright)" : "var(--text-muted)" }}
      title={`Creator UID: ${box.user}`}
    >
      <Fingerprint size={10} className="shrink-0" />
      {isMine ? "you" : shortUID(box.user)}
    </span>
  );
}

function BoxCard({ box }: { box: CommunityBoxSummary }) {
  const cover = coverFor(box._id, box.image);

  return (
    <Link href={`/lootboxes/${box.id}`}
      className="rounded-xl overflow-hidden flex flex-col transition-colors hover:border-purple-700"
      style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
      <div className="relative w-full h-28" style={{ background: "#0a0a14" }}>
        <Image src={cover} alt={box.name} fill className="object-cover opacity-70" unoptimized />
        <div className="absolute inset-0"
          style={{ background: "linear-gradient(to top, #0a0a14 0%, transparent 60%)" }} />
        <span className="absolute top-1.5 left-1.5 font-semibold px-1.5 py-0.5 rounded"
          style={{
            background: "rgba(0,0,0,0.75)", color: riskColor(box.riskPercentage),
            border: `1px solid ${riskColor(box.riskPercentage)}40`, fontSize: 10,
          }}>
          {box.riskPercentage.toFixed(0)}% risk
        </span>
        {box.commission > 0 && (
          <span className="absolute top-1.5 right-1.5 font-semibold px-1.5 py-0.5 rounded"
            style={{ background: "rgba(0,0,0,0.75)", color: "#a855f7", border: "1px solid #a855f740", fontSize: 10 }}>
            {(box.commission * 100).toFixed(0)}% cut
          </span>
        )}
        <div className="absolute bottom-0 left-0 right-0 px-2.5 pb-1.5">
          <p className="text-xs font-semibold truncate" style={{ color: "var(--text-primary)" }}>{box.name}</p>
        </div>
      </div>

      <div className="px-2.5 py-2 flex items-center justify-between gap-1 text-xs">
        <div className="flex flex-col gap-0.5">
          <span className="font-bold text-sm" style={{ color: "var(--accent-bright)" }}>{fmtUSD(box.price)}</span>
          <span style={{ color: "var(--text-muted)" }}>{box.drops.length} items</span>
        </div>
        <div className="flex flex-col items-end gap-0.5">
          {box.timesWagered > 0 && (
            <span style={{ color: "var(--text-muted)" }}>{box.timesWagered.toLocaleString()} opens</span>
          )}
          <span style={{ color: "var(--text-muted)" }}>{timeAgo(box.created)}</span>
        </div>
      </div>

      <div
        className="px-2.5 py-1.5 flex items-center justify-between gap-2"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        <CreatorLine box={box} />
        <ClaimControl box={box} />
      </div>
    </Link>
  );
}

// --- featured strip ---------------------------------------------------------
function FeaturedBox({ box }: { box: CommunityBoxSummary }) {
  const cover = coverFor(box._id, box.image);
  return (
    <Link
      href={`/lootboxes/${box.id}`}
      className="relative shrink-0 w-44 h-32 rounded-xl overflow-hidden flex flex-col justify-end transition-transform hover:scale-[1.02]"
      style={{ border: "1px solid var(--border-bright)" }}
    >
      <Image src={cover} alt={box.name} fill className="object-cover opacity-70" unoptimized />
      <div className="absolute inset-0" style={{ background: "linear-gradient(to top, #0a0a14 10%, transparent 70%)" }} />
      <span
        className="absolute top-2 left-2 flex items-center gap-1 text-xs font-semibold px-1.5 py-0.5 rounded"
        style={{ background: "rgba(0,0,0,0.7)", color: "#fbbf24" }}
      >
        <Star size={10} fill="#fbbf24" /> Featured
      </span>
      <div className="relative px-3 pb-2.5">
        <p className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>{box.name}</p>
        <div className="flex items-center justify-between text-xs mt-0.5">
          <span className="font-bold" style={{ color: "var(--accent-bright)" }}>{fmtUSD(box.price)}</span>
          {box.timesWagered > 0 && (
            <span style={{ color: "var(--text-secondary)" }}>{box.timesWagered.toLocaleString()} opens</span>
          )}
        </div>
      </div>
    </Link>
  );
}

function FeaturedSection() {
  const [featured, setFeatured] = useState<CommunityBoxSummary[]>([]);

  useEffect(() => {
    let alive = true;
    getCommunityLootboxes(1, 12, "", [0, 100], "popular")
      .then((data) => {
        if (!alive) return;
        setFeatured(data.lootboxes.filter((b) => !b.deleted).slice(0, 8));
      })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  if (featured.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
        <Star size={15} style={{ color: "#fbbf24" }} fill="#fbbf24" />
        Featured Community Boxes
        <span className="text-xs font-normal" style={{ color: "var(--text-muted)" }}>· most opened</span>
      </h2>
      <div className="flex gap-3 overflow-x-auto pb-1">
        {featured.map((b) => <FeaturedBox key={b._id} box={b} />)}
      </div>
    </div>
  );
}

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "popular", label: "Most Opened" },
  { value: "price_asc", label: "Price: Low → High" },
  { value: "price_desc", label: "Price: High → Low" },
  { value: "commission_asc", label: "Lowest Commission" },
  { value: "risk_asc", label: "Risk: Low → High" },
  { value: "risk_desc", label: "Risk: High → Low" },
];

export default function CommunityPage() {
  const { user } = useAuth();
  const [boxes, setBoxes] = useState<CommunityBoxSummary[]>([]);
  const [page, setPage] = useState(1);
  const [maxPages, setMaxPages] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("newest");
  const [riskMin, setRiskMin] = useState(0);
  const [riskMax, setRiskMax] = useState(100);
  const [mineOnly, setMineOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => { setPage(1); }, [debouncedSearch, sort, riskMin, riskMax]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await getCommunityLootboxes(page, 20, debouncedSearch, [riskMin, riskMax], sort);
      setBoxes(data.lootboxes.filter((b) => !b.deleted));
      setMaxPages(data.maxPages);
    } catch {
      setError(true);
    }
    setLoading(false);
  }, [page, debouncedSearch, sort, riskMin, riskMax]);

  useEffect(() => { load(); }, [load]);

  const canFilterMine = !!user?.flipUID;
  const visibleBoxes = mineOnly && canFilterMine
    ? boxes.filter((b) => b.user === user!.flipUID)
    : boxes;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
          <Users size={22} style={{ color: "var(--accent-bright)" }} />
          Community Lootboxes
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
          User-created boxes from flip.gg · click any card for drop odds &amp; EV
        </p>
      </div>

      <FeaturedSection />

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[180px]"
          style={{ border: "1px solid var(--border-bright)", borderRadius: "8px", background: "var(--bg-card)" }}>
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
          <input
            type="text" placeholder="Search community boxes…" value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent pl-8 pr-3 py-2 text-sm outline-none"
            style={{ color: "var(--text-primary)" }} />
        </div>
        <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)}
          className="px-3 py-2 rounded-lg text-sm outline-none"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border-bright)", color: "var(--text-secondary)" }}>
          {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <div className="flex items-center gap-2 text-xs" style={{ color: "var(--text-secondary)" }}>
          <AlertTriangle size={12} />
          <span>Risk</span>
          <input type="number" min={0} max={100} value={riskMin}
            onChange={(e) => setRiskMin(+e.target.value)}
            className="w-14 px-2 py-1.5 rounded text-sm outline-none"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border-bright)", color: "var(--text-primary)" }} />
          <span>–</span>
          <input type="number" min={0} max={100} value={riskMax}
            onChange={(e) => setRiskMax(+e.target.value)}
            className="w-14 px-2 py-1.5 rounded text-sm outline-none"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border-bright)", color: "var(--text-primary)" }} />
        </div>
        {canFilterMine && (
          <button
            onClick={() => setMineOnly((v) => !v)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{
              background: mineOnly ? "var(--accent)" : "var(--bg-card)",
              color: mineOnly ? "#fff" : "var(--text-secondary)",
              border: `1px solid ${mineOnly ? "var(--accent)" : "var(--border-bright)"}`,
            }}
          >
            <Fingerprint size={13} /> My boxes
          </button>
        )}
      </div>

      {!user && (
        <div
          className="rounded-xl px-4 py-3 text-sm"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
        >
          <span style={{ color: "var(--text-muted)" }}>
            Created boxes on flip.gg?{" "}
            <Link href="/account" className="underline" style={{ color: "var(--accent-bright)" }}>
              Sign in
            </Link>{" "}
            and add your UID to claim them.
          </span>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 size={28} className="animate-spin" style={{ color: "var(--text-muted)" }} />
        </div>
      ) : error ? (
        <p className="text-center py-20 text-sm" style={{ color: "var(--text-muted)" }}>
          Could not load community boxes. Try again later.
        </p>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {visibleBoxes.map((box) => <BoxCard key={box._id} box={box} />)}
          </div>
          {visibleBoxes.length === 0 && (
            <p className="text-center py-16 text-sm" style={{ color: "var(--text-muted)" }}>
              {mineOnly ? "No boxes on this page match your UID." : "No community boxes match your filters."}
            </p>
          )}
          <div className="flex items-center justify-center gap-4 py-2">
            <button onClick={() => setPage((p) => Math.max(p - 1, 1))} disabled={page === 1}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm disabled:opacity-30"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}>
              <ChevronLeft size={14} /> Prev
            </button>
            <span className="text-sm" style={{ color: "var(--text-muted)" }}>Page {page} of {maxPages}</span>
            <button onClick={() => setPage((p) => Math.min(p + 1, maxPages))} disabled={page === maxPages}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm disabled:opacity-30"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}>
              Next <ChevronRight size={14} />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
