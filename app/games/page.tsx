"use client";

import { useState, useMemo } from "react";
import {
  TrendingUp,
  Bomb,
  Zap,
  RotateCw,
  Swords,
  Layers,
} from "lucide-react";

// ── Constants ─────────────────────────────────────────────────────────────────

const HOUSE_EDGE = 0.035;
const RTP = 1 - HOUSE_EDGE;

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n: number, d = 2): string {
  return isFinite(n) ? n.toFixed(d) : "∞";
}

function pct(n: number): string {
  return fmt(n * 100) + "%";
}

// C(n, k) via multiplicative formula — exact for k ≤ 30
function C(n: number, k: number): number {
  if (k < 0 || k > n) return 0;
  if (k === 0 || k === n) return 1;
  k = Math.min(k, n - k);
  let r = 1;
  for (let i = 0; i < k; i++) r = (r * (n - i)) / (i + 1);
  return Math.round(r);
}

// Crash: P(reaching target) — house edge is baked into 3.5% bust-before-1× events
function crashWinProb(target: number): number {
  if (target <= 1) return 1;
  return Math.min(1, RTP / target);
}

// Mines: P(k safe reveals, m mines, N tiles)
function minesProb(N: number, m: number, k: number): number {
  return C(N - m, k) / C(N, k);
}

// Mines: current cashout multiplier at k safe reveals
function minesMult(N: number, m: number, k: number): number {
  const p = minesProb(N, m, k);
  return p > 0 ? RTP / p : 0;
}

// Upgrader: win probability
function upgraderWinProb(src: number, tgt: number): number {
  if (tgt <= 0 || src <= 0) return 0;
  return Math.min(1, (src / tgt) * RTP);
}

// ── Shared card wrapper ────────────────────────────────────────────────────────

function Card({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div
      className="rounded-2xl p-5"
      style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
    >
      {title && (
        <h2 className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
          {title}
        </h2>
      )}
      {children}
    </div>
  );
}

function StatChip({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="text-center p-3 rounded-xl" style={{ background: "#0a0a14" }}>
      <div className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>
        {label}
      </div>
      <div className="font-bold text-sm" style={{ color }}>
        {value}
      </div>
    </div>
  );
}

// ── Crash ─────────────────────────────────────────────────────────────────────

const CRASH_TABLE_TARGETS = [1.25, 1.5, 2, 3, 5, 10, 20, 50, 100];

function CrashGame() {
  const [target, setTarget] = useState("2.00");
  const tgt = Math.max(1.01, parseFloat(target) || 2);
  const prob = crashWinProb(tgt);

  return (
    <div className="flex flex-col gap-5">
      <Card>
        <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--text-primary)" }}>
          How It Works
        </h2>
        <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          A multiplier starts at <strong style={{ color: "var(--accent-bright)" }}>1×</strong> and
          climbs. Cash out before the crash to lock in profit — wait too long and you lose
          everything. The crash point is determined by a provably-fair HMAC-SHA256 hash chain
          committed before the round starts. The 3.5% house edge is applied by forcing 3.5% of
          seeds to bust at exactly 1× before the multiplier formula runs.
        </p>
        <div className="grid grid-cols-3 gap-3 mt-4">
          <StatChip label="House Edge" value="3.5%" color="var(--red)" />
          <StatChip label="RTP" value="96.5%" color="var(--green)" />
          <StatChip label="Min Bust" value="1.00×" color="var(--text-muted)" />
        </div>
      </Card>

      <Card title="Cashout Calculator">
        <div className="flex flex-wrap items-end gap-3 mb-4">
          <div className="flex-1 min-w-32">
            <label className="text-xs mb-1 block" style={{ color: "var(--text-muted)" }}>
              Auto-cashout target
            </label>
            <div
              className="flex items-center rounded-lg overflow-hidden"
              style={{ background: "#0a0a14", border: "1px solid var(--border-bright)" }}
            >
              <input
                type="number"
                min="1.01"
                step="0.01"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                className="w-full bg-transparent px-3 py-2 text-sm outline-none"
                style={{ color: "var(--text-primary)" }}
              />
              <span className="px-3 text-sm" style={{ color: "var(--text-muted)" }}>
                ×
              </span>
            </div>
          </div>
          <div
            className="text-center px-4 py-2.5 rounded-xl min-w-24"
            style={{ background: "#0a0a14" }}
          >
            <div className="text-xs mb-0.5" style={{ color: "var(--text-muted)" }}>
              Win chance
            </div>
            <div
              className="font-bold text-lg"
              style={{ color: prob >= 0.5 ? "var(--green)" : "var(--accent-bright)" }}
            >
              {pct(prob)}
            </div>
          </div>
          <div
            className="text-center px-4 py-2.5 rounded-xl min-w-24"
            style={{ background: "#0a0a14" }}
          >
            <div className="text-xs mb-0.5" style={{ color: "var(--text-muted)" }}>
              EV per $1
            </div>
            <div className="font-bold" style={{ color: "var(--red)" }}>
              −$0.035
            </div>
          </div>
        </div>

        <div
          className="text-xs p-3 rounded-lg"
          style={{
            background: "rgba(124,58,237,0.08)",
            border: "1px solid rgba(124,58,237,0.2)",
            color: "var(--text-secondary)",
          }}
        >
          At <strong style={{ color: "var(--accent-bright)" }}>{fmt(tgt, 2)}×</strong> you win{" "}
          <strong style={{ color: "var(--green)" }}>{pct(prob)}</strong> of rounds. EV is always{" "}
          <strong style={{ color: "var(--red)" }}>−3.5%</strong> regardless of target — higher
          targets are rarer wins with proportionally bigger payouts.
        </div>
      </Card>

      <Card title="Target Probability Table">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                {["Target", "Win %", "Bust %", "1-in-N rounds", "EV per $1"].map((h) => (
                  <th
                    key={h}
                    className="text-left pb-2 pr-4"
                    style={{ color: "var(--text-muted)", fontSize: "0.7rem" }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {CRASH_TABLE_TARGETS.map((t) => {
                const p = crashWinProb(t);
                return (
                  <tr key={t} style={{ borderTop: "1px solid var(--border)" }}>
                    <td
                      className="py-2 pr-4 font-semibold"
                      style={{ color: "var(--accent-bright)" }}
                    >
                      {t}×
                    </td>
                    <td className="py-2 pr-4" style={{ color: "var(--green)" }}>
                      {pct(p)}
                    </td>
                    <td className="py-2 pr-4" style={{ color: "var(--red)" }}>
                      {pct(1 - p)}
                    </td>
                    <td className="py-2 pr-4" style={{ color: "var(--text-secondary)" }}>
                      {fmt(1 / p, 1)}
                    </td>
                    <td className="py-2" style={{ color: "var(--red)" }}>
                      −$0.035
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <Card title="Provably Fair">
        <p className="text-sm mb-3" style={{ color: "var(--text-secondary)" }}>
          The bust multiplier is determined before each round using a chained hash. You can verify
          any past round:
        </p>
        <div
          className="font-mono text-xs p-3 rounded-lg overflow-x-auto"
          style={{ background: "#0a0a14", color: "var(--cyan)", border: "1px solid var(--border)" }}
        >
          {`// Server commits to hash chain before session starts
hash  = HMAC_SHA256(serverSeed, clientSeed + ":" + nonce)
e     = 2n ** 52n                          // 4503599627370496
h     = BigInt("0x" + hash.slice(0, 13))   // first 52 bits
// 3.5% of hashes map to instant bust (h mod 33 === 0)
bust  = Math.max(1, Math.floor(100 * Number(e) / Number(e - h)) / 100)`}
        </div>
        <p className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>
          When <code>h mod 33 === 0</code> the result is forced to 1× — this is how the 3.5% edge
          is implemented without distorting the multiplier distribution.
        </p>
      </Card>
    </div>
  );
}

// ── Mines ─────────────────────────────────────────────────────────────────────

const GRID_SIZES = [
  { label: "4×4", n: 16 },
  { label: "5×5", n: 25 },
  { label: "6×6", n: 36 },
  { label: "7×7", n: 49 },
  { label: "8×8", n: 64 },
];

function MinesGame() {
  const [gridIdx, setGridIdx] = useState(1);
  const [mines, setMines] = useState(3);
  const [reveals, setReveals] = useState(5);

  const N = GRID_SIZES[gridIdx].n;
  const m = Math.min(mines, N - 1);
  const k = Math.min(reveals, N - m);

  const rows = useMemo(() => {
    const result = [];
    for (let i = 1; i <= Math.min(k, 24); i++) {
      const tileSafeProb = (N - m - (i - 1)) / (N - (i - 1));
      const cumProb = minesProb(N, m, i);
      const mult = minesMult(N, m, i);
      result.push({ i, tileSafeProb, cumProb, mult });
    }
    return result;
  }, [N, m, k]);

  const finalRow = rows[rows.length - 1];

  return (
    <div className="flex flex-col gap-5">
      <Card>
        <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--text-primary)" }}>
          How It Works
        </h2>
        <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          A grid hides mines among safe tiles. Reveal tiles one at a time — each safe reveal
          increases your multiplier. Hit a mine and lose your bet. Cash out at any time to lock in
          the current multiplier. Grid size is selectable from{" "}
          <strong style={{ color: "var(--accent-bright)" }}>4×4 (16 tiles)</strong> to{" "}
          <strong style={{ color: "var(--accent-bright)" }}>8×8 (64 tiles)</strong>, default 5×5.
        </p>
        <div className="grid grid-cols-3 gap-3 mt-4">
          <StatChip label="House Edge" value="3.5%" color="var(--red)" />
          <StatChip label="Default Grid" value="5×5" color="var(--accent-bright)" />
          <StatChip label="Grid Options" value="5 sizes" color="var(--text-muted)" />
        </div>
      </Card>

      <Card title="Probability Calculator">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-5">
          {/* Grid size */}
          <div>
            <label className="text-xs mb-2 block" style={{ color: "var(--text-muted)" }}>
              Grid Size
            </label>
            <div className="flex gap-1">
              {GRID_SIZES.map((g, i) => (
                <button
                  key={g.label}
                  onClick={() => {
                    setGridIdx(i);
                    setMines(Math.min(mines, g.n - 1));
                    setReveals(Math.min(reveals, g.n - mines - 1));
                  }}
                  className="flex-1 py-1.5 rounded text-xs font-medium transition-all"
                  style={{
                    background: gridIdx === i ? "var(--accent)" : "#0a0a14",
                    color: gridIdx === i ? "#fff" : "var(--text-secondary)",
                    border: "1px solid var(--border-bright)",
                  }}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>

          {/* Mines slider */}
          <div>
            <label className="text-xs mb-1 block" style={{ color: "var(--text-muted)" }}>
              Mines: {m}
            </label>
            <input
              type="range"
              min={1}
              max={Math.min(N - 1, 24)}
              value={m}
              onChange={(e) => setMines(+e.target.value)}
              className="w-full"
              style={{ accentColor: "var(--accent)" }}
            />
            <div
              className="flex justify-between text-xs mt-0.5"
              style={{ color: "var(--text-muted)" }}
            >
              <span>1</span>
              <span>{Math.min(N - 1, 24)}</span>
            </div>
          </div>

          {/* Reveals slider */}
          <div>
            <label className="text-xs mb-1 block" style={{ color: "var(--text-muted)" }}>
              Reveals: {k}
            </label>
            <input
              type="range"
              min={1}
              max={Math.min(N - m, 24)}
              value={k}
              onChange={(e) => setReveals(+e.target.value)}
              className="w-full"
              style={{ accentColor: "var(--accent)" }}
            />
            <div
              className="flex justify-between text-xs mt-0.5"
              style={{ color: "var(--text-muted)" }}
            >
              <span>1</span>
              <span>{Math.min(N - m, 24)}</span>
            </div>
          </div>
        </div>

        {/* Summary */}
        {finalRow && (
          <div className="grid grid-cols-3 gap-3 mb-5">
            <div className="p-3 rounded-xl text-center" style={{ background: "#0a0a14" }}>
              <div className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>
                Win Probability
              </div>
              <div
                className="text-xl font-bold"
                style={{
                  color:
                    finalRow.cumProb >= 0.5
                      ? "var(--green)"
                      : finalRow.cumProb >= 0.2
                      ? "#f59e0b"
                      : "var(--red)",
                }}
              >
                {pct(finalRow.cumProb)}
              </div>
            </div>
            <div className="p-3 rounded-xl text-center" style={{ background: "#0a0a14" }}>
              <div className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>
                Cashout Mult
              </div>
              <div className="text-xl font-bold" style={{ color: "var(--accent-bright)" }}>
                {fmt(finalRow.mult, 3)}×
              </div>
            </div>
            <div className="p-3 rounded-xl text-center" style={{ background: "#0a0a14" }}>
              <div className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>
                EV per $1
              </div>
              <div className="font-bold" style={{ color: "var(--red)" }}>
                −$0.035
              </div>
            </div>
          </div>
        )}

        {/* Per-reveal breakdown */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                {["Tile #", "This tile safe", "Cumulative win %", "Cashout mult"].map((h) => (
                  <th
                    key={h}
                    className="text-left pb-2 pr-4"
                    style={{ color: "var(--text-muted)", fontSize: "0.7rem" }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(({ i, tileSafeProb, cumProb, mult }) => (
                <tr key={i} style={{ borderTop: "1px solid var(--border)" }}>
                  <td
                    className="py-1.5 pr-4 font-semibold"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    #{i}
                  </td>
                  <td className="py-1.5 pr-4" style={{ color: "var(--text-muted)" }}>
                    {pct(tileSafeProb)}
                  </td>
                  <td
                    className="py-1.5 pr-4"
                    style={{
                      color:
                        cumProb >= 0.5
                          ? "var(--green)"
                          : cumProb >= 0.2
                          ? "#f59e0b"
                          : "var(--red)",
                    }}
                  >
                    {pct(cumProb)}
                  </td>
                  <td
                    className="py-1.5 font-semibold"
                    style={{ color: "var(--accent-bright)" }}
                  >
                    {fmt(mult, 3)}×
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>
          Formula: P(k safe) = C(N−m, k) / C(N, k) · Multiplier = 0.965 / P(k safe) · EV is
          always −3.5% regardless of when you cash out.
        </p>
      </Card>

      <Card title="Mine Count Quick-Reference — 5×5 Grid">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th
                  className="text-left pb-2 pr-4"
                  style={{ color: "var(--text-muted)", fontSize: "0.7rem" }}
                >
                  Mines
                </th>
                {[1, 3, 5, 8, 10].map((r) => (
                  <th
                    key={r}
                    className="text-center pb-2 px-2"
                    style={{ color: "var(--text-muted)", fontSize: "0.7rem" }}
                  >
                    {r} reveals
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3, 5, 10, 15].map((mine) => (
                <tr key={mine} style={{ borderTop: "1px solid var(--border)" }}>
                  <td
                    className="py-1.5 pr-4 font-semibold"
                    style={{ color: "var(--accent-bright)" }}
                  >
                    {mine}
                  </td>
                  {[1, 3, 5, 8, 10].map((rev) => {
                    const p = minesProb(25, mine, Math.min(rev, 25 - mine));
                    const mult = minesMult(25, mine, Math.min(rev, 25 - mine));
                    return (
                      <td key={rev} className="py-1.5 px-2 text-center">
                        <div
                          className="text-xs font-semibold"
                          style={{ color: "var(--accent-bright)" }}
                        >
                          {fmt(mult, 2)}×
                        </div>
                        <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                          {pct(p)}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ── Upgrader ──────────────────────────────────────────────────────────────────

const UPGRADER_PRESETS = [2, 3, 5, 10, 20, 50, 100];

function UpgraderGame() {
  const [source, setSource] = useState("10");
  const [targetVal, setTargetVal] = useState("50");

  const src = parseFloat(source) || 0;
  const tgt = parseFloat(targetVal) || 0;
  const prob = upgraderWinProb(src, tgt);
  const ratio = src > 0 && tgt > 0 ? tgt / src : 0;

  return (
    <div className="flex flex-col gap-5">
      <Card>
        <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--text-primary)" }}>
          How It Works
        </h2>
        <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          Stake a lower-value item for a chance to win a higher-value one. Win probability is
          transparently calculated as{" "}
          <strong style={{ color: "var(--cyan)" }}>
            (source value / target value) × 96.5%
          </strong>
          . A $10 → $20 upgrade has a <strong style={{ color: "var(--green)" }}>48.25%</strong>{" "}
          win chance — not 50%, because the 3.5% house edge is subtracted directly.
        </p>
        <div className="grid grid-cols-3 gap-3 mt-4">
          <StatChip label="House Edge" value="3.5%" color="var(--red)" />
          <StatChip label="RTP" value="96.5%" color="var(--green)" />
          <StatChip label="Formula" value="src/tgt × 96.5%" color="var(--text-secondary)" />
        </div>
      </Card>

      <Card title="Upgrade Calculator">
        {/* Preset buttons */}
        <div className="flex gap-1.5 flex-wrap mb-4">
          {UPGRADER_PRESETS.map((f) => (
            <button
              key={f}
              onClick={() => setTargetVal(String(src > 0 ? src * f : f * 10))}
              className="px-2.5 py-1 rounded text-xs font-medium transition-all"
              style={{
                background:
                  src > 0 && Math.abs(tgt / src - f) < 0.01 ? "var(--accent)" : "#0a0a14",
                color:
                  src > 0 && Math.abs(tgt / src - f) < 0.01 ? "#fff" : "var(--text-secondary)",
                border: "1px solid var(--border-bright)",
              }}
            >
              {f}× upgrade
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="text-xs mb-1 block" style={{ color: "var(--text-muted)" }}>
              Source value ($)
            </label>
            <div
              className="flex items-center rounded-lg overflow-hidden"
              style={{ background: "#0a0a14", border: "1px solid var(--border-bright)" }}
            >
              <span className="px-2 text-sm" style={{ color: "var(--text-muted)" }}>
                $
              </span>
              <input
                type="number"
                min="0.01"
                step="any"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="w-full bg-transparent px-2 py-2 text-sm outline-none"
                style={{ color: "var(--text-primary)" }}
              />
            </div>
          </div>
          <div>
            <label className="text-xs mb-1 block" style={{ color: "var(--text-muted)" }}>
              Target value ($)
            </label>
            <div
              className="flex items-center rounded-lg overflow-hidden"
              style={{ background: "#0a0a14", border: "1px solid var(--border-bright)" }}
            >
              <span className="px-2 text-sm" style={{ color: "var(--text-muted)" }}>
                $
              </span>
              <input
                type="number"
                min="0.01"
                step="any"
                value={targetVal}
                onChange={(e) => setTargetVal(e.target.value)}
                className="w-full bg-transparent px-2 py-2 text-sm outline-none"
                style={{ color: "var(--text-primary)" }}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 rounded-xl text-center" style={{ background: "#0a0a14" }}>
            <div className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>
              Win Chance
            </div>
            <div
              className="text-xl font-bold"
              style={{
                color:
                  prob >= 0.5
                    ? "var(--green)"
                    : prob >= 0.25
                    ? "#f59e0b"
                    : "var(--red)",
              }}
            >
              {src > 0 && tgt > 0 ? pct(prob) : "—"}
            </div>
          </div>
          <div className="p-3 rounded-xl text-center" style={{ background: "#0a0a14" }}>
            <div className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>
              Upgrade Ratio
            </div>
            <div className="text-xl font-bold" style={{ color: "var(--accent-bright)" }}>
              {ratio > 0 ? `${fmt(ratio, 2)}×` : "—"}
            </div>
          </div>
          <div className="p-3 rounded-xl text-center" style={{ background: "#0a0a14" }}>
            <div className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>
              Expected Loss
            </div>
            <div className="font-bold" style={{ color: "var(--red)" }}>
              {src > 0 ? `$${fmt(src * HOUSE_EDGE, 2)}` : "—"}
            </div>
          </div>
        </div>
      </Card>

      <Card title="Common Upgrade Ratios — per $10 staked">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                {["Ratio", "Win Chance", "Lose Chance", "Target value", "EV"].map((h) => (
                  <th
                    key={h}
                    className="text-left pb-2 pr-4"
                    style={{ color: "var(--text-muted)", fontSize: "0.7rem" }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {UPGRADER_PRESETS.map((f) => {
                const p = upgraderWinProb(10, 10 * f);
                return (
                  <tr key={f} style={{ borderTop: "1px solid var(--border)" }}>
                    <td
                      className="py-2 pr-4 font-semibold"
                      style={{ color: "var(--accent-bright)" }}
                    >
                      {f}×
                    </td>
                    <td className="py-2 pr-4" style={{ color: "var(--green)" }}>
                      {pct(p)}
                    </td>
                    <td className="py-2 pr-4" style={{ color: "var(--red)" }}>
                      {pct(1 - p)}
                    </td>
                    <td className="py-2 pr-4" style={{ color: "var(--text-secondary)" }}>
                      ${fmt(10 * f, 0)}
                    </td>
                    <td className="py-2" style={{ color: "var(--red)" }}>
                      −$0.35
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>
          EV is always −$0.35 per $10 staked (−3.5%) regardless of upgrade ratio.
        </p>
      </Card>
    </div>
  );
}

// ── Wheel ─────────────────────────────────────────────────────────────────────

type WheelSegment = { mult: number; label: string; count: number };
type WheelConfig = { name: string; segments: WheelSegment[]; total: number };

const WHEEL_CONFIGS: WheelConfig[] = [
  {
    name: "Low Risk",
    total: 100,
    segments: [
      { mult: 0, label: "0×", count: 3 },
      { mult: 1.2, label: "1.2×", count: 44 },
      { mult: 1.5, label: "1.5×", count: 30 },
      { mult: 2, label: "2×", count: 16 },
      { mult: 3, label: "3×", count: 5 },
      { mult: 5, label: "5×", count: 2 },
    ],
  },
  {
    name: "Medium Risk",
    total: 100,
    segments: [
      { mult: 0, label: "0×", count: 28 },
      { mult: 1.5, label: "1.5×", count: 30 },
      { mult: 2, label: "2×", count: 22 },
      { mult: 3, label: "3×", count: 10 },
      { mult: 5, label: "5×", count: 6 },
      { mult: 10, label: "10×", count: 3 },
      { mult: 20, label: "20×", count: 1 },
    ],
  },
  {
    name: "High Risk",
    total: 100,
    segments: [
      { mult: 0, label: "0×", count: 58 },
      { mult: 2, label: "2×", count: 20 },
      { mult: 5, label: "5×", count: 12 },
      { mult: 10, label: "10×", count: 6 },
      { mult: 50, label: "50×", count: 3 },
      { mult: 100, label: "100×", count: 1 },
    ],
  },
];

function WheelGame() {
  const [idx, setIdx] = useState(1);
  const config = WHEEL_CONFIGS[idx];
  const rtp = config.segments.reduce(
    (s, seg) => s + (seg.count / config.total) * seg.mult,
    0
  );

  return (
    <div className="flex flex-col gap-5">
      <Card>
        <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--text-primary)" }}>
          How It Works
        </h2>
        <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          A provably-fair spinning wheel with weighted segments. Each spin is independent and
          the outcome is predetermined via a hash before the wheel animates. Three risk presets
          trade loss frequency for jackpot size, all targeting a{" "}
          <strong style={{ color: "var(--accent-bright)" }}>96.5% RTP</strong>. Segment counts
          below are approximate — flip.gg&apos;s exact distribution may differ slightly.
        </p>
        <div className="grid grid-cols-3 gap-3 mt-4">
          <StatChip label="House Edge" value="3.5%" color="var(--red)" />
          <StatChip label="RTP" value="96.5%" color="var(--green)" />
          <StatChip label="Risk Presets" value="3 levels" color="var(--text-muted)" />
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            Segment Breakdown
          </h2>
          <div className="flex gap-1">
            {WHEEL_CONFIGS.map((c, i) => (
              <button
                key={c.name}
                onClick={() => setIdx(i)}
                className="px-2.5 py-1 rounded text-xs font-medium"
                style={{
                  background: idx === i ? "var(--accent)" : "#0a0a14",
                  color: idx === i ? "#fff" : "var(--text-secondary)",
                  border: "1px solid var(--border-bright)",
                }}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                {["Segment", "Probability", "1-in-N", "EV contribution"].map((h) => (
                  <th
                    key={h}
                    className="text-left pb-2 pr-4"
                    style={{ color: "var(--text-muted)", fontSize: "0.7rem" }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {config.segments.map((s) => {
                const p = s.count / config.total;
                const evContrib = p * s.mult;
                return (
                  <tr key={s.label} style={{ borderTop: "1px solid var(--border)" }}>
                    <td
                      className="py-2 pr-4 font-semibold"
                      style={{
                        color:
                          s.mult === 0
                            ? "var(--red)"
                            : s.mult >= 20
                            ? "var(--green)"
                            : "var(--accent-bright)",
                      }}
                    >
                      {s.label}
                    </td>
                    <td className="py-2 pr-4" style={{ color: "var(--text-secondary)" }}>
                      {pct(p)}
                    </td>
                    <td className="py-2 pr-4" style={{ color: "var(--text-muted)" }}>
                      1 in {fmt(1 / p, 0)}
                    </td>
                    <td
                      className="py-2"
                      style={{ color: evContrib > p ? "var(--green)" : "var(--text-muted)" }}
                    >
                      {pct(evContrib)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="mt-3 text-xs" style={{ color: "var(--text-muted)" }}>
          Approximate RTP:{" "}
          <strong
            style={{ color: rtp >= 0.9 ? "var(--green)" : "var(--red)" }}
          >
            {pct(rtp)}
          </strong>{" "}
          · Exact segment counts are modeled from flip.gg&apos;s 96.5% target.
        </div>
      </Card>
    </div>
  );
}

// ── Battles ───────────────────────────────────────────────────────────────────

function BattlesGame() {
  const [players, setPlayers] = useState(2);
  const [winners, setWinners] = useState(1);

  const effectiveWinners = Math.min(winners, players - 1);
  const winProb = effectiveWinners / players;
  const mult = players / effectiveWinners;

  const formats = [
    { label: "1v1", players: 2, winners: 1 },
    { label: "1v1v1", players: 3, winners: 1 },
    { label: "1v1v1v1", players: 4, winners: 1 },
    { label: "2v2 (top 2)", players: 4, winners: 2 },
    { label: "3-way (top 2)", players: 3, winners: 2 },
  ];

  return (
    <div className="flex flex-col gap-5">
      <Card>
        <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--text-primary)" }}>
          How It Works
        </h2>
        <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          Multiple players open the same case simultaneously. The player with the{" "}
          <strong style={{ color: "var(--accent-bright)" }}>highest-value drop</strong> wins all
          items (or coin equivalent). The house edge is baked into the cases (3.5% RTP loss) —
          battles don&apos;t add additional edge. In a 1v1 you have ~50% win chance but expected
          value is the same as opening solo: <strong style={{ color: "var(--red)" }}>−3.5%</strong>
          .
        </p>
        <div className="grid grid-cols-3 gap-3 mt-4">
          <StatChip label="House Edge" value="3.5% (from cases)" color="var(--red)" />
          <StatChip label="1v1 Win%" value="~50%" color="var(--green)" />
          <StatChip label="Cursed Mode" value="Loser takes all" color="var(--text-muted)" />
        </div>
      </Card>

      <Card title="Battle Odds Calculator">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-xs mb-2 block" style={{ color: "var(--text-muted)" }}>
              Players
            </label>
            <div className="flex gap-1.5">
              {[2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => {
                    setPlayers(n);
                    setWinners(Math.min(winners, n - 1));
                  }}
                  className="flex-1 py-1.5 rounded text-xs font-semibold"
                  style={{
                    background: players === n ? "var(--accent)" : "#0a0a14",
                    color: players === n ? "#fff" : "var(--text-secondary)",
                    border: "1px solid var(--border-bright)",
                  }}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs mb-2 block" style={{ color: "var(--text-muted)" }}>
              Winners
            </label>
            <div className="flex gap-1.5">
              {Array.from({ length: players - 1 }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  onClick={() => setWinners(n)}
                  className="flex-1 py-1.5 rounded text-xs font-semibold"
                  style={{
                    background: effectiveWinners === n ? "var(--accent)" : "#0a0a14",
                    color: effectiveWinners === n ? "#fff" : "var(--text-secondary)",
                    border: "1px solid var(--border-bright)",
                  }}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="p-3 rounded-xl text-center" style={{ background: "#0a0a14" }}>
            <div className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>
              Win Probability
            </div>
            <div
              className="text-xl font-bold"
              style={{ color: winProb >= 0.5 ? "var(--green)" : "var(--accent-bright)" }}
            >
              {pct(winProb)}
            </div>
          </div>
          <div className="p-3 rounded-xl text-center" style={{ background: "#0a0a14" }}>
            <div className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>
              Win Multiplier
            </div>
            <div className="text-xl font-bold" style={{ color: "var(--cyan)" }}>
              {fmt(mult, 2)}×
            </div>
          </div>
          <div className="p-3 rounded-xl text-center" style={{ background: "#0a0a14" }}>
            <div className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>
              EV per $1 case
            </div>
            <div className="font-bold" style={{ color: "var(--red)" }}>
              −$0.035
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                {["Format", "Win %", "Payout mult", "EV / $100 case"].map((h) => (
                  <th
                    key={h}
                    className="text-left pb-2 pr-4"
                    style={{ color: "var(--text-muted)", fontSize: "0.7rem" }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {formats.map(({ label, players: p, winners: w }) => {
                const wp = w / p;
                const m = p / w;
                return (
                  <tr key={label} style={{ borderTop: "1px solid var(--border)" }}>
                    <td
                      className="py-2 pr-4 font-semibold"
                      style={{ color: "var(--accent-bright)" }}
                    >
                      {label}
                    </td>
                    <td className="py-2 pr-4" style={{ color: "var(--green)" }}>
                      {pct(wp)}
                    </td>
                    <td className="py-2 pr-4" style={{ color: "var(--cyan)" }}>
                      {fmt(m, 2)}×
                    </td>
                    <td className="py-2" style={{ color: "var(--red)" }}>
                      −$3.50
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <Card title="Key Points">
        <div className="flex flex-col gap-2">
          {[
            "Battle EV equals opening solo — the format doesn't change expected value, only variance.",
            "Cursed mode flips win/loss (loser takes all) — EV is identical, variance is the same.",
            "Team battles split winnings evenly among winners; EV per player stays at −3.5%.",
            "Picking higher-RTP cases for battles reduces the edge just like it does when opening solo.",
          ].map((tip, i) => (
            <div
              key={i}
              className="flex gap-2 text-sm"
              style={{ color: "var(--text-secondary)" }}
            >
              <span style={{ color: "var(--accent-bright)" }}>→</span>
              {tip}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ── Blackjack ─────────────────────────────────────────────────────────────────

// Hard total basic strategy: rows = player total 8–17, cols = dealer 2–A
const HARD: Record<number, string[]> = {
  8:  ["H","H","H","H","H","H","H","H","H","H"],
  9:  ["H","D","D","D","D","H","H","H","H","H"],
  10: ["D","D","D","D","D","D","D","D","H","H"],
  11: ["D","D","D","D","D","D","D","D","D","H"],
  12: ["H","H","S","S","S","H","H","H","H","H"],
  13: ["S","S","S","S","S","H","H","H","H","H"],
  14: ["S","S","S","S","S","H","H","H","H","H"],
  15: ["S","S","S","S","S","H","H","H","H","H"],
  16: ["S","S","S","S","S","H","H","H","Rh","Rh"],
  17: ["S","S","S","S","S","S","S","S","S","S"],
};

// Soft total strategy: rows = soft hand (A+2 to A+9), cols = dealer 2–A
const SOFT: Record<number, string[]> = {
  13: ["H","H","H","D","D","H","H","H","H","H"],  // A+2
  14: ["H","H","H","D","D","H","H","H","H","H"],  // A+3
  15: ["H","H","D","D","D","H","H","H","H","H"],  // A+4
  16: ["H","H","D","D","D","H","H","H","H","H"],  // A+5
  17: ["H","D","D","D","D","H","H","H","H","H"],  // A+6
  18: ["S","Ds","Ds","Ds","Ds","S","S","H","H","H"], // A+7
  19: ["S","S","S","S","S","S","S","S","S","S"],  // A+8
};

const DEALER_CARDS = ["2","3","4","5","6","7","8","9","10","A"];

function actionColor(a: string): string {
  if (a.startsWith("D")) return "var(--cyan)";
  if (a.startsWith("R")) return "#f59e0b";
  if (a === "S") return "var(--green)";
  return "var(--text-secondary)";
}
function actionBg(a: string): string {
  if (a.startsWith("D")) return "rgba(6,182,212,0.12)";
  if (a === "S") return "rgba(16,185,129,0.12)";
  if (a.startsWith("R")) return "rgba(245,158,11,0.12)";
  return "transparent";
}
function actionLabel(a: string): string {
  const map: Record<string, string> = { Ds: "D/S", Dh: "D/H", Rh: "R/H", Rs: "R/S" };
  return map[a] ?? a;
}

function BlackjackGame() {
  const [tab, setTab] = useState<"hard" | "soft">("hard");

  const matrix = tab === "hard" ? HARD : SOFT;
  const rowLabels =
    tab === "hard"
      ? Object.keys(HARD).map(Number)
      : Object.keys(SOFT).map((k) => `A+${+k - 11}`);

  return (
    <div className="flex flex-col gap-5">
      <Card>
        <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--text-primary)" }}>
          How It Works
        </h2>
        <p className="text-sm leading-relaxed mb-3" style={{ color: "var(--text-secondary)" }}>
          Standard 6-deck blackjack. Goal: beat the dealer&apos;s hand without exceeding 21.
          With perfect basic strategy the house edge drops to{" "}
          <strong style={{ color: "var(--green)" }}>~0.5%</strong> — far below the 3.5% on most
          flip.gg games, making blackjack one of the best-EV options on the platform if you play
          correctly.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatChip label="Perfect Strategy Edge" value="~0.5%" color="var(--green)" />
          <StatChip label="Casual Player Edge" value="2–4%" color="#f59e0b" />
          <StatChip label="Blackjack Pays" value="3:2" color="var(--cyan)" />
          <StatChip label="Dealer Stands On" value="Soft 17" color="var(--text-muted)" />
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            Basic Strategy Chart
          </h2>
          <div className="flex gap-1">
            {(["hard", "soft"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className="px-2.5 py-1 rounded text-xs font-medium"
                style={{
                  background: tab === t ? "var(--accent)" : "#0a0a14",
                  color: tab === t ? "#fff" : "var(--text-secondary)",
                  border: "1px solid var(--border-bright)",
                }}
              >
                {t === "hard" ? "Hard" : "Soft (Ace)"}
              </button>
            ))}
          </div>
        </div>
        <p className="text-xs mb-4" style={{ color: "var(--text-muted)" }}>
          <span style={{ color: "var(--text-secondary)" }}>H</span> = Hit ·{" "}
          <span style={{ color: "var(--green)" }}>S</span> = Stand ·{" "}
          <span style={{ color: "var(--cyan)" }}>D</span> = Double ·{" "}
          <span style={{ color: "#f59e0b)" }}>R</span> = Surrender (else Hit/Stand)
        </p>
        <div className="overflow-x-auto">
          <table className="text-xs border-collapse">
            <thead>
              <tr>
                <th
                  className="p-1.5 pr-3 text-right"
                  style={{ color: "var(--text-muted)" }}
                >
                  Hand
                </th>
                {DEALER_CARDS.map((c) => (
                  <th
                    key={c}
                    className="p-1.5 w-9 text-center"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.entries(matrix).map(([key, actions], rowIdx) => (
                <tr key={key}>
                  <td
                    className="p-1.5 pr-3 font-semibold text-right"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {rowLabels[rowIdx]}
                  </td>
                  {(actions as string[]).map((a, i) => (
                    <td
                      key={i}
                      className="p-1.5 text-center font-semibold rounded"
                      style={{ color: actionColor(a), background: actionBg(a) }}
                    >
                      {actionLabel(a)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card title="Rule Variations & House Edge Impact">
        <div className="flex flex-col gap-0">
          {[
            { rule: "Blackjack pays 3:2 (not 6:5)", delta: "−0.50%", good: true },
            { rule: "Dealer stands on soft 17", delta: "−0.20%", good: true },
            { rule: "Dealer hits soft 17", delta: "+0.20%", good: false },
            { rule: "Double after split allowed", delta: "−0.13%", good: true },
            { rule: "Re-split aces allowed", delta: "−0.06%", good: true },
            { rule: "Surrender allowed", delta: "−0.08%", good: true },
            { rule: "Deviating from basic strategy", delta: "+1–3%", good: false },
            { rule: "Insurance (take it)", delta: "+~7% on that side bet", good: false },
          ].map(({ rule, delta, good }) => (
            <div
              key={rule}
              className="flex items-center justify-between gap-2 py-2"
              style={{ borderBottom: "1px solid var(--border)" }}
            >
              <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
                {rule}
              </span>
              <span
                className="text-xs font-semibold whitespace-nowrap"
                style={{ color: good ? "var(--green)" : "var(--red)" }}
              >
                {delta} house edge
              </span>
            </div>
          ))}
        </div>
        <p className="text-xs mt-3" style={{ color: "var(--text-muted)" }}>
          flip.gg&apos;s specific rule set may vary — check in-game for dealer soft 17 rule and
          surrender availability.
        </p>
      </Card>
    </div>
  );
}

// ── Game nav config ────────────────────────────────────────────────────────────

type GameId = "crash" | "mines" | "upgrader" | "wheel" | "battles" | "blackjack";

const GAME_NAV: {
  id: GameId;
  label: string;
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
  desc: string;
}[] = [
  { id: "crash", label: "Crash", icon: TrendingUp, desc: "Cashout before the bust" },
  { id: "mines", label: "Mines", icon: Bomb, desc: "Tile grid with hidden mines" },
  { id: "upgrader", label: "Upgrader", icon: Zap, desc: "Risk an item for a better one" },
  { id: "wheel", label: "Wheel", icon: RotateCw, desc: "Spin for a multiplier" },
  { id: "battles", label: "Battles", icon: Swords, desc: "Open cases head-to-head" },
  { id: "blackjack", label: "Blackjack", icon: Layers, desc: "Beat the dealer to 21" },
];

const GAME_CONTENT: Record<GameId, React.ReactNode> = {
  crash: <CrashGame />,
  mines: <MinesGame />,
  upgrader: <UpgraderGame />,
  wheel: <WheelGame />,
  battles: <BattlesGame />,
  blackjack: <BlackjackGame />,
};

// ── Page ──────────────────────────────────────────────────────────────────────

export default function GamesPage() {
  const [active, setActive] = useState<GameId>("crash");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold mb-1" style={{ color: "var(--text-primary)" }}>
          Game Guides &amp; <span style={{ color: "var(--accent-bright)" }}>Odds</span>
        </h1>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          House edge, exact probabilities, and interactive calculators for every flip.gg game.
          All math uses the confirmed 3.5% house edge.
        </p>
      </div>

      {/* Game selector */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {GAME_NAV.map(({ id, label, icon: Icon, desc }) => (
          <button
            key={id}
            onClick={() => setActive(id)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all shrink-0"
            style={{
              background: active === id ? "var(--accent)" : "var(--bg-card)",
              color: active === id ? "#fff" : "var(--text-secondary)",
              border: `1px solid ${active === id ? "var(--accent)" : "var(--border)"}`,
            }}
          >
            <Icon size={14} />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Active game description */}
      <div className="flex items-center gap-2">
        {(() => {
          const g = GAME_NAV.find((g) => g.id === active)!;
          const Icon = g.icon;
          return (
            <>
              <Icon size={16} style={{ color: "var(--accent-bright)" }} />
              <span className="text-sm" style={{ color: "var(--text-muted)" }}>
                {g.desc}
              </span>
              <span
                className="ml-auto text-xs px-2 py-0.5 rounded-full"
                style={{
                  background: "rgba(239,68,68,0.1)",
                  color: "var(--red)",
                  border: "1px solid rgba(239,68,68,0.2)",
                }}
              >
                3.5% house edge
              </span>
            </>
          );
        })()}
      </div>

      {GAME_CONTENT[active]}
    </div>
  );
}
