"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, TrendingUp, Package, Swords, Zap, RotateCw } from "lucide-react";

const FEATURED = ["flipkingx", "solanaghost", "neonvault", "purpledegen"];

const GAME_ICONS = [
  { icon: Package, label: "Lootbox" },
  { icon: Swords, label: "Battles" },
  { icon: TrendingUp, label: "Crash" },
  { icon: RotateCw, label: "Wheel" },
  { icon: Zap, label: "Upgrader" },
];

export default function HomePage() {
  const [query, setQuery] = useState("");
  const router = useRouter();

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (q) router.push(`/user/${encodeURIComponent(q)}`);
  }

  return (
    <div className="flex flex-col items-center gap-12 pt-12">
      {/* Hero */}
      <div className="text-center flex flex-col items-center gap-4 max-w-2xl">
        <div
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-2"
          style={{ background: "var(--accent-glow)", color: "var(--accent-bright)", border: "1px solid rgba(124,58,237,0.3)" }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse inline-block" />
          flip.gg Statistics Tracker
        </div>
        <h1 className="text-4xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
          Track your{" "}
          <span style={{ color: "var(--accent-bright)" }}>flip.gg</span>{" "}
          stats
        </h1>
        <p className="text-base" style={{ color: "var(--text-secondary)" }}>
          Look up any player's profit & loss, cases opened, game breakdown, and more.
          All in one place.
        </p>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="w-full max-w-xl flex gap-2">
        <div
          className="relative flex-1"
          style={{ border: "1px solid var(--border-bright)", borderRadius: "10px", background: "var(--bg-card)" }}
        >
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: "var(--text-muted)" }}
          />
          <input
            type="text"
            placeholder="Enter flip.gg username…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent pl-9 pr-4 py-3 text-sm outline-none"
            style={{ color: "var(--text-primary)" }}
          />
        </div>
        <button
          type="submit"
          className="px-5 py-3 rounded-xl text-sm font-semibold transition-opacity hover:opacity-90"
          style={{ background: "var(--accent)", color: "#fff" }}
        >
          Search
        </button>
      </form>

      {/* Featured players */}
      <div className="w-full max-w-xl">
        <p className="text-xs mb-3" style={{ color: "var(--text-muted)" }}>
          Featured players
        </p>
        <div className="flex flex-wrap gap-2">
          {FEATURED.map((u) => (
            <button
              key={u}
              onClick={() => router.push(`/user/${u}`)}
              className="px-3 py-1.5 rounded-lg text-sm transition-colors hover:border-purple-500"
              style={{
                border: "1px solid var(--border-bright)",
                background: "var(--bg-card)",
                color: "var(--text-secondary)",
              }}
            >
              {u}
            </button>
          ))}
        </div>
      </div>

      {/* Game pills */}
      <div className="flex flex-wrap justify-center gap-3 mt-4">
        {GAME_ICONS.map(({ icon: Icon, label }) => (
          <div
            key={label}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium"
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              color: "var(--text-secondary)",
            }}
          >
            <Icon size={15} style={{ color: "var(--accent-bright)" }} />
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}
