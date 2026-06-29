"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import {
  Search, ChevronLeft, ChevronRight,
  Users, AlertTriangle, ChevronDown, ChevronUp, Loader2,
} from "lucide-react";
import {
  getCommunityLootboxes, getLootbox,
  type CommunityBoxSummary, type LootboxDetail,
  calcEV, calcRTP,
} from "@/lib/flipApi";
import { fmtUSD, fmt } from "@/lib/calc";
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

function DropDetail({ id }: { id: string }) {
  const [box, setBox] = useState<LootboxDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getLootbox(id).then((b) => { setBox(b); setLoading(false); });
  }, [id]);

  if (loading) return (
    <div className="flex justify-center py-6">
      <Loader2 size={18} className="animate-spin" style={{ color: "var(--text-muted)" }} />
    </div>
  );
  if (!box) return (
    <p className="text-xs py-4 text-center" style={{ color: "var(--text-muted)" }}>
      Could not load drop data.
    </p>
  );

  const ev = calcEV(box.drops);
  const rtp = calcRTP(box.drops, box.price);

  return (
    <div className="px-4 pb-4 flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {[
          { label: "Expected Value", value: fmtUSD(ev), color: ev >= box.price ? "var(--green)" : "var(--red)" },
          { label: "RTP", value: `${fmt(rtp)}%`, color: rtp >= 96.5 ? "var(--green)" : rtp >= 90 ? "#f59e0b" : "var(--red)" },
          { label: "House Edge", value: `${fmt(100 - rtp)}%`, color: "var(--text-secondary)" },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-lg px-3 py-2 text-xs flex flex-col gap-0.5"
            style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
            <span style={{ color: "var(--text-muted)" }}>{label}</span>
            <span className="font-bold text-sm" style={{ color }}>{value}</span>
          </div>
        ))}
      </div>
      <div className="rounded-lg overflow-x-auto" style={{ border: "1px solid var(--border)" }}>
        <table className="w-full text-xs">
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)", background: "var(--bg)" }}>
              {["Item", "Value", "Odds", "EV Contrib"].map((h) => (
                <th key={h} className="text-left px-3 py-2 font-medium" style={{ color: "var(--text-muted)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {box.drops.slice().sort((a, b) => b.price - a.price).map((drop) => (
              <tr key={drop.id} style={{ borderBottom: "1px solid var(--border)" }}>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    <div className="relative w-6 h-6 rounded shrink-0" style={{ background: "#0a0a14" }}>
                      <Image src={drop.image} alt={drop.name} fill className="object-contain p-0.5" unoptimized />
                    </div>
                    <span style={{ color: drop.drop < 1 ? "#f59e0b" : "var(--text-primary)" }}>{drop.name}</span>
                  </div>
                </td>
                <td className="px-3 py-2 font-semibold" style={{ color: "var(--green)" }}>{fmtUSD(drop.price)}</td>
                <td className="px-3 py-2" style={{ color: "var(--text-secondary)" }}>{fmt(drop.drop)}%</td>
                <td className="px-3 py-2" style={{ color: "var(--text-muted)" }}>{fmtUSD(drop.price * (drop.drop / 100))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function BoxCard({ box }: { box: CommunityBoxSummary }) {
  const [expanded, setExpanded] = useState(false);
  const cover = coverFor(box._id, box.image);

  return (
    <div className="rounded-xl overflow-hidden flex flex-col"
      style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
      <div className="relative w-full h-28 cursor-pointer" style={{ background: "#0a0a14" }}
        onClick={() => setExpanded((v) => !v)}>
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

      <div className="px-2.5 py-2 flex items-center justify-between gap-1 text-xs cursor-pointer"
        onClick={() => setExpanded((v) => !v)}>
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
        <span style={{ color: "var(--text-muted)", flexShrink: 0 }}>
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </span>
      </div>

      {expanded && <DropDetail id={box.id} />}
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
  const [boxes, setBoxes] = useState<CommunityBoxSummary[]>([]);
  const [page, setPage] = useState(1);
  const [maxPages, setMaxPages] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("newest");
  const [riskMin, setRiskMin] = useState(0);
  const [riskMax, setRiskMax] = useState(100);
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
      </div>

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
            {boxes.map((box) => <BoxCard key={box._id} box={box} />)}
          </div>
          {boxes.length === 0 && (
            <p className="text-center py-16 text-sm" style={{ color: "var(--text-muted)" }}>
              No community boxes match your filters.
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
