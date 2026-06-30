"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Star, Crown, Fingerprint, ArrowRight } from "lucide-react";
import { getCommunityLootboxes, type CommunityBoxSummary } from "@/lib/flipApi";
import { fmtUSD } from "@/lib/calc";
import coversJson from "@/public/community-covers.json";

const covers = coversJson as string[];

function coverFor(id: string, fallback: string): string {
  if (!covers.length) return fallback;
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (Math.imul(31, h) + id.charCodeAt(i)) | 0;
  return covers[Math.abs(h) % covers.length];
}

function shortUID(uid: string): string {
  return uid.length > 10 ? `${uid.slice(0, 6)}…${uid.slice(-4)}` : uid;
}

export default function FeaturedHome() {
  const [boxes, setBoxes] = useState<CommunityBoxSummary[]>([]);

  useEffect(() => {
    let alive = true;
    getCommunityLootboxes(1, 12, "", [0, 100], "popular")
      .then((d) => { if (alive) setBoxes(d.lootboxes.filter((b) => !b.deleted)); })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  if (boxes.length === 0) return null;

  const counts = new Map<string, CommunityBoxSummary[]>();
  for (const b of boxes) {
    if (!b.user) continue;
    counts.set(b.user, [...(counts.get(b.user) ?? []), b]);
  }
  let topCreator: string | null = null;
  let topBoxes: CommunityBoxSummary[] = [];
  for (const [uid, list] of counts) {
    if (list.length > topBoxes.length) { topCreator = uid; topBoxes = list; }
  }
  const featured = boxes.slice(0, 8);

  return (
    <div className="w-full flex flex-col gap-8">
      {topCreator && (
        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
            <Crown size={15} style={{ color: "#fbbf24" }} /> Featured Creator
          </h2>
          <Link href="/community"
            className="rounded-2xl p-5 flex items-center gap-4 transition-colors hover:border-purple-700"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
              style={{ background: "var(--accent-glow)", border: "1px solid rgba(124,58,237,0.3)" }}>
              <Crown size={26} style={{ color: "#fbbf24" }} />
            </div>
            <div className="flex flex-col gap-0.5 min-w-0">
              <span className="flex items-center gap-1.5 text-sm font-mono" style={{ color: "var(--accent-bright)" }}>
                <Fingerprint size={12} /> {shortUID(topCreator)}
              </span>
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                {topBoxes.length} featured {topBoxes.length === 1 ? "box" : "boxes"} ·{" "}
                {topBoxes.reduce((s, b) => s + b.timesWagered, 0).toLocaleString()} opens
              </span>
            </div>
            <ArrowRight size={16} className="ml-auto shrink-0" style={{ color: "var(--text-muted)" }} />
          </Link>
        </div>
      )}

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
            <Star size={15} style={{ color: "#fbbf24" }} fill="#fbbf24" /> Featured Boxes
          </h2>
          <Link href="/community" className="flex items-center gap-1 text-xs" style={{ color: "var(--text-muted)" }}>
            See all <ArrowRight size={11} />
          </Link>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-1">
          {featured.map((box) => {
            const cover = coverFor(box._id, box.image);
            return (
              <Link key={box._id} href={`/lootboxes/${box.id}`}
                className="relative shrink-0 w-44 h-32 rounded-xl overflow-hidden flex flex-col justify-end transition-transform hover:scale-[1.02]"
                style={{ border: "1px solid var(--border-bright)" }}>
                <Image src={cover} alt={box.name} fill className="object-cover opacity-70" unoptimized />
                <div className="absolute inset-0" style={{ background: "linear-gradient(to top, #0a0a14 10%, transparent 70%)" }} />
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
          })}
        </div>
      </div>
    </div>
  );
}
