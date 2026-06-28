import { fetchUserStats, formatUSD, formatCompact, timeAgo } from "@/lib/api";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Package,
  Swords,
  Star,
  Calendar,
  Award,
} from "lucide-react";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ username: string }>;
}

export default async function UserPage({ params }: Props) {
  const { username } = await params;
  const user = await fetchUserStats(username);
  if (!user) notFound();

  const isProfit = user.profit >= 0;
  const winRate = ((user.battlesWon / Math.max(user.battlesPlayed, 1)) * 100).toFixed(1);

  const maxWager = Math.max(...user.wageredHistory.map((p) => p.wagered));

  return (
    <div className="flex flex-col gap-6">
      {/* Back */}
      <Link
        href="/"
        className="flex items-center gap-1.5 text-sm w-fit transition-colors hover:opacity-80"
        style={{ color: "var(--text-secondary)" }}
      >
        <ArrowLeft size={14} /> Back to search
      </Link>

      {/* Profile header */}
      <div
        className="rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
      >
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold shrink-0"
          style={{ background: "var(--accent-glow)", color: "var(--accent-bright)", border: "1px solid rgba(124,58,237,0.3)" }}
        >
          {user.avatar}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
              {user.username}
            </h1>
            <span
              className="px-2 py-0.5 rounded text-xs font-semibold"
              style={{ background: "var(--accent-glow)", color: "var(--accent-bright)" }}
            >
              Lvl {user.level}
            </span>
          </div>
          <div className="flex items-center gap-4 mt-1 text-sm flex-wrap" style={{ color: "var(--text-muted)" }}>
            <span className="flex items-center gap-1">
              <Calendar size={12} />
              Joined {new Date(user.joinedAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
            </span>
            <span className="flex items-center gap-1">
              <Package size={12} />
              {user.casesOpened.toLocaleString()} cases opened
            </span>
          </div>
        </div>

        {/* Best item */}
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-xl shrink-0"
          style={{ background: "#0d0d1a", border: "1px solid var(--border-bright)" }}
        >
          <span className="text-2xl">{user.bestItem.image}</span>
          <div>
            <div className="text-xs" style={{ color: "var(--text-muted)" }}>Best item</div>
            <div className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              {user.bestItem.name}
            </div>
            <div className="text-sm font-bold" style={{ color: "var(--green)" }}>
              {formatUSD(user.bestItem.value)}
            </div>
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Wagered", value: formatCompact(user.totalWagered), sub: null, icon: TrendingUp, color: "var(--cyan)" },
          {
            label: "Profit / Loss",
            value: (isProfit ? "+" : "") + formatCompact(Math.abs(user.profit)),
            sub: null,
            icon: isProfit ? TrendingUp : TrendingDown,
            color: isProfit ? "var(--green)" : "var(--red)",
          },
          { label: "Cases Opened", value: user.casesOpened.toLocaleString(), sub: null, icon: Package, color: "var(--accent-bright)" },
          { label: "Battle Win Rate", value: `${winRate}%`, sub: `${user.battlesWon}W / ${user.battlesPlayed - user.battlesWon}L`, icon: Swords, color: "var(--cyan)" },
        ].map(({ label, value, sub, icon: Icon, color }) => (
          <div
            key={label}
            className="rounded-xl p-4 flex flex-col gap-2"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                {label}
              </span>
              <Icon size={14} style={{ color }} />
            </div>
            <div className="text-xl font-bold" style={{ color }}>
              {value}
            </div>
            {sub && <div className="text-xs" style={{ color: "var(--text-muted)" }}>{sub}</div>}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Wager history chart */}
        <div
          className="rounded-2xl p-5"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
        >
          <h2 className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
            7-Day Wager History
          </h2>
          <div className="flex items-end gap-2 h-28">
            {user.wageredHistory.map((pt) => {
              const pct = (pt.wagered / maxWager) * 100;
              return (
                <div key={pt.date} className="flex flex-col items-center gap-1 flex-1">
                  <div className="w-full rounded-t-sm" style={{ height: `${pct}%`, background: "var(--accent)", opacity: 0.8, minHeight: 4 }} />
                  <span className="text-xs" style={{ color: "var(--text-muted)", fontSize: 10 }}>
                    {pt.date.replace("Jun ", "")}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Game breakdown */}
        <div
          className="rounded-2xl p-5"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
        >
          <h2 className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
            Game Breakdown
          </h2>
          <div className="flex flex-col gap-3">
            {user.gameBreakdown.map((g) => {
              const pos = g.profit >= 0;
              return (
                <div key={g.game} className="flex items-center gap-3">
                  <span className="text-xs w-16 shrink-0" style={{ color: "var(--text-secondary)" }}>
                    {g.game}
                  </span>
                  <div className="flex-1 h-1.5 rounded-full" style={{ background: "var(--border)" }}>
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.min((g.wagered / user.totalWagered) * 100, 100)}%`,
                        background: "var(--accent)",
                      }}
                    />
                  </div>
                  <span className="text-xs w-20 text-right shrink-0 font-semibold" style={{ color: pos ? "var(--green)" : "var(--red)" }}>
                    {pos ? "+" : ""}{formatCompact(Math.abs(g.profit))}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent activity */}
      <div
        className="rounded-2xl p-5"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
      >
        <h2 className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
          Recent Activity
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                {["Game", "Type", "Wagered", "Won", "P/L", "When"].map((h) => (
                  <th key={h} className="text-left pb-2 pr-4 text-xs font-medium" style={{ color: "var(--text-muted)" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {user.recentActivity.map((a) => {
                const pl = a.won - a.wagered;
                const pos = pl >= 0;
                return (
                  <tr key={a.id} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td className="py-2.5 pr-4 font-medium" style={{ color: "var(--text-primary)" }}>{a.game}</td>
                    <td className="py-2.5 pr-4" style={{ color: "var(--text-secondary)" }}>{a.type}</td>
                    <td className="py-2.5 pr-4" style={{ color: "var(--text-secondary)" }}>{formatUSD(a.wagered)}</td>
                    <td className="py-2.5 pr-4" style={{ color: "var(--text-secondary)" }}>{formatUSD(a.won)}</td>
                    <td className="py-2.5 pr-4 font-semibold" style={{ color: pos ? "var(--green)" : "var(--red)" }}>
                      {pos ? "+" : ""}{formatUSD(pl)}
                    </td>
                    <td className="py-2.5" style={{ color: "var(--text-muted)" }}>{timeAgo(a.timestamp)}</td>
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
