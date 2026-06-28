import { fmtCompact } from "@/lib/calc";
import Link from "next/link";
import { Trophy, TrendingUp, TrendingDown, Package, Medal } from "lucide-react";

interface LeaderboardEntry {
  rank: number;
  username: string;
  avatar: string;
  totalWagered: number;
  profit: number;
  casesOpened: number;
  level: number;
}

// Placeholder — replace with real data source when available
const ENTRIES: LeaderboardEntry[] = [
  { rank: 1, username: "solanaghost", avatar: "SG", totalWagered: 512840, profit: -24720, casesOpened: 3214, level: 62 },
  { rank: 2, username: "flipkingx", avatar: "FK", totalWagered: 284930, profit: 16289, casesOpened: 1842, level: 47 },
  { rank: 3, username: "neonvault", avatar: "NV", totalWagered: 241200, profit: 8100, casesOpened: 1540, level: 41 },
  { rank: 4, username: "cratemaster", avatar: "CM", totalWagered: 198500, profit: -5400, casesOpened: 1290, level: 38 },
  { rank: 5, username: "purpledegen", avatar: "PD", totalWagered: 175300, profit: 22100, casesOpened: 1100, level: 35 },
  { rank: 6, username: "solshift", avatar: "SS", totalWagered: 162800, profit: -3200, casesOpened: 990, level: 33 },
  { rank: 7, username: "boxrunner7", avatar: "BR", totalWagered: 148100, profit: 4800, casesOpened: 920, level: 31 },
  { rank: 8, username: "flipmonk", avatar: "FM", totalWagered: 131600, profit: 9300, casesOpened: 855, level: 29 },
  { rank: 9, username: "chainflip99", avatar: "CF", totalWagered: 118200, profit: -1100, casesOpened: 780, level: 27 },
  { rank: 10, username: "luckycase", avatar: "LC", totalWagered: 102400, profit: 6700, casesOpened: 710, level: 25 },
];

const RANK_COLORS: Record<number, string> = {
  1: "#f59e0b",
  2: "#9ca3af",
  3: "#b45309",
};

export default function LeaderboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Trophy size={22} style={{ color: "#f59e0b" }} />
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
            Leaderboard
          </h1>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Top players by total wagered
          </p>
        </div>
      </div>

      {/* Top 3 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {ENTRIES.slice(0, 3).map((e) => (
          <div
            key={e.rank}
            className="rounded-2xl p-5 flex flex-col gap-2"
            style={{
              background: "var(--bg-card)",
              border: `1px solid ${RANK_COLORS[e.rank]}44`,
            }}
          >
            <div className="flex items-center justify-between">
              <Medal size={18} style={{ color: RANK_COLORS[e.rank] }} />
              <span
                className="px-2 py-0.5 rounded text-xs font-bold"
                style={{ background: `${RANK_COLORS[e.rank]}22`, color: RANK_COLORS[e.rank] }}
              >
                #{e.rank}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold"
                style={{ background: "var(--accent-glow)", color: "var(--accent-bright)" }}
              >
                {e.avatar}
              </div>
              <div>
                <div className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
                  {e.username}
                </div>
                <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                  Lvl {e.level}
                </div>
              </div>
            </div>
            <div className="mt-2 pt-2" style={{ borderTop: "1px solid var(--border)" }}>
              <div className="text-xs mb-0.5" style={{ color: "var(--text-muted)" }}>Total wagered</div>
              <div className="font-bold" style={{ color: "var(--text-primary)" }}>
                {fmtCompact(e.totalWagered)}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Full table */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                {["Rank", "Player", "Level", "Wagered", "Profit / Loss", "Cases"].map((h) => (
                  <th
                    key={h}
                    className="text-left px-5 py-3 text-xs font-medium"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ENTRIES.map((e) => {
                const pos = e.profit >= 0;
                return (
                  <tr
                    key={e.rank}
                    style={{ borderBottom: "1px solid var(--border)" }}
                    className="transition-colors hover:bg-white/[0.02]"
                  >
                    <td className="px-5 py-3 font-bold w-12" style={{ color: RANK_COLORS[e.rank] ?? "var(--text-muted)" }}>
                      #{e.rank}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
                          style={{ background: "var(--accent-glow)", color: "var(--accent-bright)" }}
                        >
                          {e.avatar}
                        </div>
                        <span className="font-medium" style={{ color: "var(--text-primary)" }}>
                          {e.username}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3" style={{ color: "var(--text-secondary)" }}>
                      {e.level}
                    </td>
                    <td className="px-5 py-3 font-semibold" style={{ color: "var(--cyan)" }}>
                      <span className="flex items-center gap-1">
                        <TrendingUp size={12} />
                        {fmtCompact(e.totalWagered)}
                      </span>
                    </td>
                    <td className="px-5 py-3 font-semibold" style={{ color: pos ? "var(--green)" : "var(--red)" }}>
                      <span className="flex items-center gap-1">
                        {pos ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                        {pos ? "+" : ""}{fmtCompact(Math.abs(e.profit))}
                      </span>
                    </td>
                    <td className="px-5 py-3" style={{ color: "var(--text-secondary)" }}>
                      <span className="flex items-center gap-1">
                        <Package size={12} />
                        {e.casesOpened.toLocaleString()}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="text-center">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
          style={{ background: "var(--accent)", color: "#fff" }}
        >
          Calculate your stats →
        </Link>
      </div>
    </div>
  );
}
