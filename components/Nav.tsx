"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3, Trophy, Package, Zap, Users, Layers,
  MessageSquare, User as UserIcon, ShieldCheck, Gem,
} from "lucide-react";
import { useAuth } from "@/lib/auth";

const links = [
  { href: "/", label: "Calculator", icon: BarChart3 },
  { href: "/lootboxes", label: "Lootboxes", icon: Package },
  { href: "/community", label: "Community", icon: Users },
  { href: "/games", label: "Games", icon: Layers },
  { href: "/levels", label: "Levels", icon: Gem },
  { href: "/forum", label: "Forum", icon: MessageSquare },
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
];

export default function Nav() {
  const pathname = usePathname();
  const { user, isVIP } = useAuth();

  return (
    <nav
      style={{
        background: "var(--bg-card)",
        borderBottom: "1px solid var(--border)",
      }}
      className="sticky top-0 z-50"
    >
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-2">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg shrink-0">
          <Zap size={20} style={{ color: "var(--accent-bright)" }} />
          <span style={{ color: "var(--text-primary)" }}>
            flip<span style={{ color: "var(--accent-bright)" }}>stats</span>
          </span>
        </Link>

        <div className="flex items-center gap-1 overflow-x-auto">
          {links.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
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

        <Link
          href="/account"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap shrink-0"
          style={{
            color: pathname === "/account" ? "var(--accent-bright)" : "var(--text-secondary)",
            background: pathname === "/account" ? "var(--accent-glow)" : "transparent",
            border: "1px solid var(--border-bright)",
          }}
        >
          {user ? (
            <>
              {isVIP ? (
                <ShieldCheck size={15} style={{ color: "var(--accent-bright)" }} />
              ) : (
                <UserIcon size={15} />
              )}
              <span className="max-w-[120px] truncate">{user.username}</span>
            </>
          ) : (
            <>
              <UserIcon size={15} />
              Sign in
            </>
          )}
        </Link>
      </div>
    </nav>
  );
}
