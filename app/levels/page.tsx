"use client";

import { useEffect, useMemo, useState } from "react";
import { Gem, Percent, Gift, TrendingUp, ArrowRight } from "lucide-react";
import {
  LEVELS, RAKEBACK_PCT, levelIndexForWager, levelProgress,
  totalBonusUnlocked, estimatedRakeback,
} from "@/lib/levels";
import { fmtUSD } from "@/lib/calc";
import { loadStats } from "@/lib/storage";

function shortNum(n: number): string {
  if (n >= 1_000_000_000) return `${+(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `${+(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${+(n / 1_000).toFixed(0)}K`;
  return `${n}`;
}

export default function LevelsPage() {
  const [wager, setWager] = useState(0);

  useEffect(() => {
    const saved = loadStats();
    if (saved?.totalWagered) setWager(saved.totalWagered);
  }, []);

  const reachedIdx = useMemo(() => levelIndexForWager(wager), [wager]);
  const prog = useMemo(() => levelProgress(wager), [wager]);
  const unlocked = useMemo(() => totalBonusUnlocked(wager), [wager]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
          <Gem size={22} style={{ color: "var(--accent-bright)" }} />
          Levels &amp; Rewards
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
          Wager to climb tiers. Each level grants rakeback and pays a one-time level-up bonus.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { icon: TrendingUp, title: "Wager requirement", desc: "Your cumulative lifetime wager unlocks each tier — it only ever goes up." },
          { icon: Percent, title: "15% rakeback", desc: "A slice of the house edge on your wagers is returned to you as rakeback at every tier." },
          { icon: Gift, title: "Level-up bonus", desc: "Each new tier unlocks a one-time openable reward case, growing in value at the top end." },
        ].map(({ icon: Icon, title, desc }) => (
          <div key={title} className="rounded-xl p-4 flex flex-col gap-1.5"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center gap-2">
              <Icon size={15} style={{ color: "var(--accent-bright)" }} />
              <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{title}</span>
            </div>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>{desc}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl p-5 flex flex-col gap-4"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
        <div className="flex flex-col gap-1">
          <label className="text-xs" style={{ color: "var(--text-muted)" }}>Your total wagered ($)</label>
          <div className="flex items-center rounded-lg overflow-hidden max-w-xs"
            style={{ background: "#0a0a14", border: "1px solid var(--border-bright)" }}>
            <span className="px-2 text-sm" style={{ color: "var(--text-muted)" }}>$</span>
            <input
              type="number" min="0" step="any" value={wager === 0 ? "" : wager} placeholder="0"
              onChange={(e) => setWager(parseFloat(e.target.value) || 0)}
              className="w-full bg-transparent px-3 py-2 text-sm outline-none"
              style={{ color: "var(--text-primary)" }} />
          </div>
        </div>

        {wager > 0 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-xl p-4" style={{ background: "#0a0a14", border: "1px solid var(--border)" }}>
                <div className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>Current tier</div>
                <div className="text-lg font-bold" style={{ color: prog.current?.color ?? "var(--text-muted)" }}>
                  {prog.current?.name ?? "Unranked"}
                </div>
              </div>
              <div className="rounded-xl p-4" style={{ background: "#0a0a14", border: "1px solid var(--border)" }}>
                <div className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>Bonuses unlocked</div>
                <div className="text-lg font-bold" style={{ color: "var(--green)" }}>{fmtUSD(unlocked)}</div>
              </div>
              <div className="rounded-xl p-4" style={{ background: "#0a0a14", border: "1px solid var(--border)" }}>
                <div className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>Est. rakeback so far</div>
                <div className="text-lg font-bold" style={{ color: "var(--cyan)" }}>
                  {fmtUSD(estimatedRakeback(wager))}
                </div>
              </div>
            </div>

            {prog.next ? (
              <div>
                <div className="flex justify-between text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>
                  <span>{prog.current?.name ?? "Unranked"}</span>
                  <span className="flex items-center gap-1">
                    {shortNum(prog.remaining)} to <span style={{ color: prog.next.color }}>{prog.next.name}</span>
                    <ArrowRight size={11} />
                  </span>
                </div>
                <div className="h-2.5 rounded-full" style={{ background: "var(--border)" }}>
                  <div className="h-full rounded-full transition-all"
                    style={{ width: `${prog.pct}%`, background: prog.next.color }} />
                </div>
              </div>
            ) : (
              <p className="text-sm font-semibold" style={{ color: "var(--accent-bright)" }}>
                Max tier reached — Elite Gem Master. 👑
              </p>
            )}
          </>
        )}
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
        <div className="px-5 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
          <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>All tiers</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                {["Tier", "Wager required", "Rakeback", "Level-up bonus"].map((h) => (
                  <th key={h} className="text-left px-5 py-2.5 text-xs font-medium" style={{ color: "var(--text-muted)" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {LEVELS.map((lvl, i) => {
                const reached = i <= reachedIdx;
                return (
                  <tr key={lvl.name}
                    style={{
                      borderBottom: "1px solid var(--border)",
                      background: reached ? "rgba(124,58,237,0.06)" : "transparent",
                    }}>
                    <td className="px-5 py-3">
                      <span className="flex items-center gap-2 font-semibold" style={{ color: lvl.color }}>
                        <Gem size={13} style={{ color: lvl.color }} />
                        {lvl.name}
                        {reached && (
                          <span className="text-xs px-1.5 py-0.5 rounded"
                            style={{ background: "var(--accent-glow)", color: "var(--accent-bright)" }}>
                            reached
                          </span>
                        )}
                      </span>
                    </td>
                    <td className="px-5 py-3 font-mono" style={{ color: "var(--text-secondary)" }}>
                      ${shortNum(lvl.wager)}
                    </td>
                    <td className="px-5 py-3" style={{ color: "var(--text-secondary)" }}>{RAKEBACK_PCT}%</td>
                    <td className="px-5 py-3 font-semibold" style={{ color: "var(--green)" }}>{fmtUSD(lvl.bonus)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs" style={{ color: "var(--text-muted)" }}>
        Rakeback is an estimate based on flip.gg&apos;s per-tier rate. Tier and reward-case values are
        sourced from flip.gg&apos;s level system; actual rewards are set by flip.gg.
      </p>
    </div>
  );
}
