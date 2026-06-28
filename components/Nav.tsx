"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Trophy, Search, Zap } from "lucide-react";

const links = [
  { href: "/", label: "Search", icon: Search },
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
];

export default function Nav() {
  const pathname = usePathname();

  return (
    <nav
      style={{
        background: "var(--bg-card)",
        borderBottom: "1px solid var(--border)",
      }}
      className="sticky top-0 z-50 backdrop-blur-sm"
    >
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg">
          <Zap size={20} style={{ color: "var(--accent-bright)" }} />
          <span style={{ color: "var(--text-primary)" }}>
            flip<span style={{ color: "var(--accent-bright)" }}>stats</span>
          </span>
        </Link>

        <div className="flex items-center gap-1">
          {links.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                style={{
                  color: active ? "var(--accent-bright)" : "var(--text-secondary)",
                  background: active ? "var(--accent-glow)" : "transparent",
                }}
              >
                <Icon size={15} />
                {label}
              </Link>
            );
          })}
        </div>

        <div
          className="flex items-center gap-1.5 text-xs px-2 py-1 rounded"
          style={{ background: "rgba(16,185,129,0.1)", color: "var(--green)" }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse inline-block" />
          LIVE
        </div>
      </div>
    </nav>
  );
}
