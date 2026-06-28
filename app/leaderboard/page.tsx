import { fetchLeaderboard, formatCompact } from "@/lib/api";
import Link from "next/link";
import { Trophy, TrendingUp, TrendingDown, Package, Medal } from "lucide-react";

export const dynamic = "force-dynamic";

const RANK_COLORS: Record<number, string> = {
  1: "#f59e0b",
  2: "#9ca3af",
  3: "#b45309",
};

export default async function LeaderboardPage() {
  const entries = await fetchLeaderboard();

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Trophy size={22} style={{ color: "#f59e0b" }} />
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
            Leaderboard
          </h1>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Top players by total wagered · updated live
          </p>
        </div>
      </div>

      {/* Top 3 podium cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {entries.slice(0, 3).map((e) => (
          <Link
            key={e.rank}
            href={`/user/${e.username}`}
            className="rounded-2xl p-5 flex flex-col gap-2 transition-opacity hover:opacity-90"
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
                {formatCompact(e.totalWagered)}
              </div>
            </div>
          </Link>
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
                {["Rank", "Player", "Level", "Wagered", "Profit/Loss", "Cases"].map((h) => (
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
              {entries.map((e) => {
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
                      <Link
                        href={`/user/${e.username}`}
                        className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                      >
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
                          style={{ background: "var(--accent-glow)", color: "var(--accent-bright)" }}
                        >
                          {e.avatar}
                        </div>
                        <span className="font-medium" style={{ color: "var(--text-primary)" }}>
                          {e.username}
                        </span>
                      </Link>
                    </td>
                    <td className="px-5 py-3" style={{ color: "var(--text-secondary)" }}>
                      {e.level}
                    </td>
                    <td className="px-5 py-3 font-semibold flex items-center gap-1" style={{ color: "var(--cyan)" }}>
                      <TrendingUp size={12} />
                      {formatCompact(e.totalWagered)}
                    </td>
                    <td className="px-5 py-3 font-semibold" style={{ color: pos ? "var(--green)" : "var(--red)" }}>
                      <span className="flex items-center gap-1">
                        {pos ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                        {pos ? "+" : ""}{formatCompact(Math.abs(e.profit))}
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
    </div>
  );
}
