"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  calculate,
  fmtUSD,
  fmtCompact,
  fmt,
  type StatsInput,
} from "@/lib/calc";
import { saveStats, loadStats, clearStats } from "@/lib/storage";
import { levelProgress, totalBonusUnlocked, estimatedRakeback } from "@/lib/levels";
import FeaturedHome from "@/components/FeaturedHome";
import {
  TrendingUp,
  TrendingDown,
  Package,
  Swords,
  Zap,
  RotateCw,
  ChevronDown,
  ChevronUp,
  Trash2,
  BarChart3,
  Percent,
  Edit3,
  Gem,
  ArrowRight,
} from "lucide-react";

const EMPTY: StatsInput = {
  username: "",
  totalWagered: 0,
  totalWon: 0,
  casesOpened: 0,
  battlesPlayed: 0,
  battlesWon: 0,
  crashGames: 0,
  crashWins: 0,
  wheelSpins: 0,
  wheelWins: 0,
  upgraderPlays: 0,
  upgraderWins: 0,
  savedAt: "",
};

function NumInput({
  label,
  field,
  value,
  onChange,
  prefix,
}: {
  label: string;
  field: keyof StatsInput;
  value: number;
  onChange: (field: keyof StatsInput, val: number) => void;
  prefix?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs" style={{ color: "var(--text-muted)" }}>
        {label}
      </label>
      <div
        className="flex items-center rounded-lg overflow-hidden"
        style={{ background: "#0a0a14", border: "1px solid var(--border-bright)" }}
      >
        {prefix && (
          <span className="px-2 text-sm" style={{ color: "var(--text-muted)" }}>
            {prefix}
          </span>
        )}
        <input
          type="number"
          min="0"
          step="any"
          value={value === 0 ? "" : value}
          placeholder="0"
          onChange={(e) => onChange(field, parseFloat(e.target.value) || 0)}
          className="w-full bg-transparent px-3 py-2 text-sm outline-none"
          style={{ color: "var(--text-primary)" }}
        />
      </div>
    </div>
  );
}

export default function HomePage() {
  const [form, setForm] = useState<StatsInput>(EMPTY);
  const [submitted, setSubmitted] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    const saved = loadStats();
    if (saved) {
      setForm(saved);
      setSubmitted(true);
    }
  }, []);

  function set(field: keyof StatsInput, val: number | string) {
    setForm((f) => ({ ...f, [field]: val }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const data: StatsInput = { ...form, savedAt: new Date().toISOString() };
    saveStats(data);
    setForm(data);
    setSubmitted(true);
    setEditing(false);
  }

  function handleClear() {
    clearStats();
    setForm(EMPTY);
    setSubmitted(false);
    setEditing(false);
  }

  const calc = submitted ? calculate(form) : null;
  const isProfit = calc && calc.profit >= 0;
  const lvl = levelProgress(form.totalWagered);
  const lvlBonus = totalBonusUnlocked(form.totalWagered);

  if (submitted && !editing && calc) {
    return (
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
              {form.username ? (
                <>
                  <span style={{ color: "var(--accent-bright)" }}>{form.username}</span>
                  &apos;s Stats
                </>
              ) : (
                "Your Stats"
              )}
            </h1>
            {form.savedAt && (
              <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                Last updated{" "}
                {new Date(form.savedAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-opacity hover:opacity-80"
              style={{ border: "1px solid var(--border-bright)", color: "var(--text-secondary)" }}
            >
              <Edit3 size={13} /> Edit
            </button>
            <button
              onClick={handleClear}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-opacity hover:opacity-80"
              style={{ border: "1px solid rgba(239,68,68,0.3)", color: "var(--red)" }}
            >
              <Trash2 size={13} /> Clear
            </button>
          </div>
        </div>

        {/* Core stat cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            {
              label: "Total Wagered",
              value: fmtCompact(form.totalWagered),
              icon: TrendingUp,
              color: "var(--cyan)",
            },
            {
              label: "Total Won",
              value: fmtCompact(form.totalWon),
              icon: TrendingUp,
              color: "var(--green)",
            },
            {
              label: "Profit / Loss",
              value: (isProfit ? "+" : "") + fmtCompact(Math.abs(calc.profit)),
              icon: isProfit ? TrendingUp : TrendingDown,
              color: isProfit ? "var(--green)" : "var(--red)",
            },
            {
              label: "ROI",
              value: `${isProfit ? "+" : ""}${fmt(calc.profitPct)}%`,
              icon: Percent,
              color: isProfit ? "var(--green)" : "var(--red)",
            },
          ].map(({ label, value, icon: Icon, color }) => (
            <div
              key={label}
              className="rounded-xl p-4 flex flex-col gap-2"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>{label}</span>
                <Icon size={14} style={{ color }} />
              </div>
              <div className="text-xl font-bold" style={{ color }}>{value}</div>
            </div>
          ))}
        </div>

        {/* Level & rewards */}
        <Link
          href="/levels"
          className="rounded-2xl p-5 flex flex-col gap-4 transition-colors hover:border-purple-700"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Gem size={15} style={{ color: lvl.current?.color ?? "var(--accent-bright)" }} />
              <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                flip.gg Level
              </h2>
            </div>
            <span className="flex items-center gap-1 text-xs" style={{ color: "var(--text-muted)" }}>
              View all tiers <ArrowRight size={11} />
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <div className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>Current tier</div>
              <div className="text-lg font-bold" style={{ color: lvl.current?.color ?? "var(--text-muted)" }}>
                {lvl.current?.name ?? "Unranked"}
              </div>
            </div>
            <div>
              <div className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>Bonuses unlocked</div>
              <div className="text-lg font-bold" style={{ color: "var(--green)" }}>{fmtCompact(lvlBonus)}</div>
            </div>
            <div>
              <div className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>Est. rakeback</div>
              <div className="text-lg font-bold" style={{ color: "var(--cyan)" }}>
                {fmtCompact(estimatedRakeback(form.totalWagered))}
              </div>
            </div>
          </div>

          {lvl.next ? (
            <div>
              <div className="flex justify-between text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>
                <span>{lvl.current?.name ?? "Unranked"}</span>
                <span>
                  {fmtCompact(lvl.remaining)} to{" "}
                  <span style={{ color: lvl.next.color }}>{lvl.next.name}</span>
                </span>
              </div>
              <div className="h-2 rounded-full" style={{ background: "var(--border)" }}>
                <div className="h-full rounded-full transition-all"
                  style={{ width: `${lvl.pct}%`, background: lvl.next.color }} />
              </div>
            </div>
          ) : (
            <p className="text-sm font-semibold" style={{ color: "var(--accent-bright)" }}>
              Max tier reached — Elite Gem Master. 👑
            </p>
          )}
        </Link>

        {/* RTP & House Edge */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div
            className="rounded-2xl p-5"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
          >
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 size={15} style={{ color: "var(--accent-bright)" }} />
              <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                RTP & House Edge
              </h2>
            </div>
            <div className="flex flex-col gap-3">
              {[
                { label: "Your RTP", value: `${fmt(calc.rtp)}%`, color: calc.rtp >= 96.5 ? "var(--green)" : "var(--text-primary)" },
                { label: "Your House Edge", value: `${fmt(calc.houseEdge)}%`, color: "var(--text-primary)" },
                { label: "flip.gg Expected Edge", value: `~${calc.flipHouseEdge}%`, color: "var(--text-muted)" },
                {
                  label: "Edge Deviation",
                  value: `${calc.edgeDiff >= 0 ? "+" : ""}${fmt(calc.edgeDiff)}%`,
                  color: calc.edgeDiff <= 0 ? "var(--green)" : "var(--red)",
                  note: calc.edgeDiff <= 0 ? "beating the house" : "below expected",
                },
              ].map(({ label, value, color, note }) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-sm" style={{ color: "var(--text-secondary)" }}>{label}</span>
                  <div className="text-right">
                    <span className="text-sm font-semibold" style={{ color }}>{value}</span>
                    {note && <div className="text-xs" style={{ color: "var(--text-muted)" }}>{note}</div>}
                  </div>
                </div>
              ))}
            </div>

            {/* RTP bar */}
            <div className="mt-4">
              <div className="h-2 rounded-full" style={{ background: "var(--border)" }}>
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${Math.min(calc.rtp, 100)}%`,
                    background: calc.rtp >= 100 ? "var(--green)" : calc.rtp >= 95 ? "var(--accent)" : "var(--red)",
                  }}
                />
              </div>
              <div className="flex justify-between text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                <span>0%</span>
                <span>RTP {fmt(calc.rtp)}%</span>
                <span>100%</span>
              </div>
            </div>
          </div>

          {/* Per-game win rates */}
          <div
            className="rounded-2xl p-5"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Zap size={15} style={{ color: "var(--accent-bright)" }} />
              <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                Game Win Rates
              </h2>
            </div>
            <div className="flex flex-col gap-3">
              {[
                { game: "Cases", icon: Package, rate: calc.rtp, plays: form.casesOpened, suffix: "% RTP" },
                { game: "Battles", icon: Swords, rate: calc.battleWinRate, plays: form.battlesPlayed, suffix: "% win rate" },
                { game: "Crash", icon: TrendingUp, rate: calc.crashWinRate, plays: form.crashGames, suffix: "% win rate" },
                { game: "Wheel", icon: RotateCw, rate: calc.wheelWinRate, plays: form.wheelSpins, suffix: "% win rate" },
                { game: "Upgrader", icon: Zap, rate: calc.upgraderWinRate, plays: form.upgraderPlays, suffix: "% win rate" },
              ]
                .filter((g) => g.plays > 0)
                .map(({ game, icon: Icon, rate, plays, suffix }) => (
                  <div key={game} className="flex items-center gap-3">
                    <Icon size={13} style={{ color: "var(--accent-bright)" }} />
                    <span className="text-xs w-16 shrink-0" style={{ color: "var(--text-secondary)" }}>
                      {game}
                    </span>
                    <div className="flex-1 h-1.5 rounded-full" style={{ background: "var(--border)" }}>
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.min(rate, 100)}%`,
                          background: rate >= 50 ? "var(--green)" : "var(--accent)",
                        }}
                      />
                    </div>
                    <span className="text-xs w-24 text-right shrink-0" style={{ color: "var(--text-muted)" }}>
                      {fmt(rate)}{suffix} · {plays.toLocaleString()} plays
                    </span>
                  </div>
                ))}
              {[form.battlesPlayed, form.crashGames, form.wheelSpins, form.upgraderPlays].every((v) => v === 0) && (
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  Add per-game data in the advanced section to see win rates.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Quick metrics */}
        {(form.casesOpened > 0 || form.battlesPlayed > 0) && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {form.casesOpened > 0 && (
              <div
                className="rounded-xl p-4"
                style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
              >
                <div className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>Avg per case</div>
                <div
                  className="text-lg font-bold"
                  style={{ color: calc.netPerCase >= 0 ? "var(--green)" : "var(--red)" }}
                >
                  {calc.netPerCase >= 0 ? "+" : ""}{fmtUSD(calc.netPerCase)}
                </div>
                <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                  {form.casesOpened.toLocaleString()} cases opened
                </div>
              </div>
            )}
            {form.battlesPlayed > 0 && (
              <div
                className="rounded-xl p-4"
                style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
              >
                <div className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>Avg per battle</div>
                <div
                  className="text-lg font-bold"
                  style={{ color: calc.netPerBattle >= 0 ? "var(--green)" : "var(--red)" }}
                >
                  {calc.netPerBattle >= 0 ? "+" : ""}{fmtUSD(calc.netPerBattle)}
                </div>
                <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                  {form.battlesPlayed.toLocaleString()} battles played
                </div>
              </div>
            )}
            <div
              className="rounded-xl p-4"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
            >
              <div className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>Break-even target</div>
              <div className="text-lg font-bold" style={{ color: "var(--cyan)" }}>
                {fmtCompact(form.totalWagered)}
              </div>
              <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                need {fmtCompact(form.totalWagered - form.totalWon)} more in wins
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Input Form ──────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col items-center gap-10 pt-8">
      <div className="text-center flex flex-col items-center gap-3 max-w-xl">
        <div
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold"
          style={{
            background: "var(--accent-glow)",
            color: "var(--accent-bright)",
            border: "1px solid rgba(124,58,237,0.3)",
          }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse inline-block" />
          flip.gg Stats Calculator
        </div>
        <h1 className="text-3xl font-bold" style={{ color: "var(--text-primary)" }}>
          Enter your <span style={{ color: "var(--accent-bright)" }}>flip.gg</span> stats
        </h1>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          Pull your numbers from your flip.gg profile and paste them below.
          We&apos;ll calculate your P/L, RTP, house edge, and more.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="w-full max-w-xl flex flex-col gap-5"
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: "1.25rem",
          padding: "1.5rem",
        }}
      >
        {/* Username */}
        <div className="flex flex-col gap-1">
          <label className="text-xs" style={{ color: "var(--text-muted)" }}>
            Username <span style={{ color: "var(--text-muted)", fontStyle: "italic" }}>(optional)</span>
          </label>
          <input
            type="text"
            placeholder="your flip.gg username"
            value={form.username}
            onChange={(e) => set("username", e.target.value)}
            className="w-full bg-transparent px-3 py-2 rounded-lg text-sm outline-none"
            style={{
              border: "1px solid var(--border-bright)",
              background: "#0a0a14",
              color: "var(--text-primary)",
            }}
          />
        </div>

        {/* Core fields */}
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Total Wagered ($)" field="totalWagered" value={form.totalWagered} onChange={set} prefix="$" />
          <NumInput label="Total Won ($)" field="totalWon" value={form.totalWon} onChange={set} prefix="$" />
        </div>

        <NumInput label="Cases Opened" field="casesOpened" value={form.casesOpened} onChange={set} />

        {/* Advanced toggle */}
        <button
          type="button"
          onClick={() => setShowAdvanced((v) => !v)}
          className="flex items-center gap-1.5 text-xs font-medium self-start"
          style={{ color: "var(--text-secondary)" }}
        >
          {showAdvanced ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          {showAdvanced ? "Hide" : "Show"} per-game breakdown (optional)
        </button>

        {showAdvanced && (
          <div className="flex flex-col gap-4 pt-1" style={{ borderTop: "1px solid var(--border)" }}>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              Enter plays and wins per game for detailed win rate stats.
            </p>

            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Swords size={12} style={{ color: "var(--accent-bright)" }} />
                <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>Battles</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <NumInput label="Battles Played" field="battlesPlayed" value={form.battlesPlayed} onChange={set} />
                <NumInput label="Battles Won" field="battlesWon" value={form.battlesWon} onChange={set} />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <TrendingUp size={12} style={{ color: "var(--accent-bright)" }} />
                <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>Crash</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <NumInput label="Crash Games" field="crashGames" value={form.crashGames} onChange={set} />
                <NumInput label="Crash Wins (cashed out)" field="crashWins" value={form.crashWins} onChange={set} />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <RotateCw size={12} style={{ color: "var(--accent-bright)" }} />
                <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>Wheel</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <NumInput label="Wheel Spins" field="wheelSpins" value={form.wheelSpins} onChange={set} />
                <NumInput label="Wheel Wins" field="wheelWins" value={form.wheelWins} onChange={set} />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Zap size={12} style={{ color: "var(--accent-bright)" }} />
                <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>Upgrader</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <NumInput label="Upgrader Plays" field="upgraderPlays" value={form.upgraderPlays} onChange={set} />
                <NumInput label="Upgrader Wins" field="upgraderWins" value={form.upgraderWins} onChange={set} />
              </div>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={form.totalWagered === 0}
          className="w-full py-3 rounded-xl text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed mt-1"
          style={{ background: "var(--accent)", color: "#fff" }}
        >
          Calculate Stats
        </button>
      </form>

      <FeaturedHome />
    </div>
  );
}
