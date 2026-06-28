"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, TrendingUp, Package } from "lucide-react";
import type { LootboxSummary } from "@/lib/flipApi";

type SortKey = "price_asc" | "price_desc" | "risk_asc" | "risk_desc" | "popular" | "items";

export default function LootboxGrid({ boxes }: { boxes: LootboxSummary[] }) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("popular");
  const [maxPrice, setMaxPrice] = useState<number>(0);

  const maxPriceCap = Math.ceil(Math.max(...boxes.map((b) => b.price)));

  const filtered = useMemo(() => {
    let list = boxes.filter((b) =>
      b.name.toLowerCase().includes(query.toLowerCase())
    );
    if (maxPrice > 0) list = list.filter((b) => b.price <= maxPrice);
    switch (sort) {
      case "price_asc":  return [...list].sort((a, b) => a.price - b.price);
      case "price_desc": return [...list].sort((a, b) => b.price - a.price);
      case "risk_asc":   return [...list].sort((a, b) => a.riskPercentage - b.riskPercentage);
      case "risk_desc":  return [...list].sort((a, b) => b.riskPercentage - a.riskPercentage);
      case "popular":    return [...list].sort((a, b) => b.timesWageredTwoWeeks - a.timesWageredTwoWeeks);
      case "items":      return [...list].sort((a, b) => b.drops.length - a.drops.length);
      default:           return list;
    }
  }, [boxes, query, sort, maxPrice]);

  return (
    <div className="flex flex-col gap-5">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <div
          className="relative flex-1 min-w-[200px]"
          style={{ border: "1px solid var(--border-bright)", borderRadius: "8px", background: "var(--bg-card)" }}
        >
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
          <input
            type="text"
            placeholder="Search lootboxes…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent pl-8 pr-3 py-2 text-sm outline-none"
            style={{ color: "var(--text-primary)" }}
          />
        </div>

        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          className="px-3 py-2 rounded-lg text-sm outline-none"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border-bright)", color: "var(--text-secondary)" }}
        >
          <option value="popular">Most Popular</option>
          <option value="price_asc">Price: Low → High</option>
          <option value="price_desc">Price: High → Low</option>
          <option value="risk_asc">Risk: Low → High</option>
          <option value="risk_desc">Risk: High → Low</option>
          <option value="items">Most Items</option>
        </select>

        <div className="flex items-center gap-2 text-sm" style={{ color: "var(--text-secondary)" }}>
          <span>Max $</span>
          <input
            type="number"
            min={0}
            max={maxPriceCap}
            placeholder="any"
            value={maxPrice || ""}
            onChange={(e) => setMaxPrice(parseFloat(e.target.value) || 0)}
            className="w-20 px-2 py-2 rounded-lg text-sm outline-none"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border-bright)", color: "var(--text-primary)" }}
          />
        </div>

        <span className="text-xs" style={{ color: "var(--text-muted)" }}>
          {filtered.length} results
        </span>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {filtered.map((box) => (
          <Link
            key={box.id}
            href={`/lootboxes/${box.id}`}
            className="rounded-xl overflow-hidden flex flex-col transition-all hover:scale-[1.02]"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
          >
            {/* Image */}
            <div className="relative w-full aspect-square" style={{ background: "#0a0a14" }}>
              <Image
                src={box.image}
                alt={box.name}
                fill
                className="object-contain p-2"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
                unoptimized
              />
              {/* Risk badge */}
              <span
                className="absolute top-1.5 right-1.5 text-xs font-semibold px-1.5 py-0.5 rounded"
                style={{
                  background: box.riskPercentage > 60
                    ? "rgba(239,68,68,0.85)"
                    : box.riskPercentage > 35
                    ? "rgba(245,158,11,0.85)"
                    : "rgba(16,185,129,0.85)",
                  color: "#fff",
                  fontSize: 10,
                }}
              >
                {box.riskPercentage.toFixed(0)}% risk
              </span>
            </div>

            {/* Info */}
            <div className="p-2.5 flex flex-col gap-1">
              <div
                className="text-xs font-semibold truncate"
                style={{ color: "var(--text-primary)" }}
                title={box.name}
              >
                {box.name}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold" style={{ color: "var(--accent-bright)" }}>
                  ${box.price.toFixed(2)}
                </span>
                <span className="flex items-center gap-0.5 text-xs" style={{ color: "var(--text-muted)" }}>
                  <Package size={10} />
                  {box.drops.length}
                </span>
              </div>
              {box.timesWageredTwoWeeks > 0 && (
                <div className="flex items-center gap-0.5 text-xs" style={{ color: "var(--text-muted)" }}>
                  <TrendingUp size={10} />
                  {box.timesWageredTwoWeeks.toLocaleString()} opens / 2w
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-sm" style={{ color: "var(--text-muted)" }}>
          No lootboxes match your filters.
        </div>
      )}
    </div>
  );
}
