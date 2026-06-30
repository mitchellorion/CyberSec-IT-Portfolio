"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3, Trophy, Package, Zap, Users, Layers,
  MessageSquare, User as UserIcon, ShieldCheck, Gem,
  ChevronDown,
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
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);
  useEffect(() => { setOpen(false); }, [pathname]);

  const current = links.find((l) => l.href === pathname);

  return (
    <nav
      style={{ background: "var(--bg-card)", borderBottom: "1px solid var(--border)" }}
      className="sticky top-0 z-40"
    >
      <div className="px-4 h-14 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg shrink-0">
            <Zap size={20} style={{ color: "var(--accent-bright)" }} />
            <span style={{ color: "var(--text-primary)" }}>
              flip<span style={{ color: "var(--accent-bright)" }}>stats</span>
            </span>
          </Link>

          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setOpen((o) => !o)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
              style={{
                background: open ? "var(--accent-glow)" : "var(--bg-card-hover)",
                color: "var(--text-secondary)",
                border: "1px solid var(--border-bright)",
              }}
            >
              {current ? (
                <>
                  <current.icon size={15} style={{ color: "var(--accent-bright)" }} />
                  <span style={{ color: "var(--text-primary)" }}>{current.label}</span>
                </>
              ) : (
                <span>Browse</span>
              )}
              <ChevronDown size={14} style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform .15s" }} />
            </button>

            {open && (
              <div
                className="absolute left-0 mt-2 w-52 rounded-xl overflow-hidden shadow-xl z-50"
                style={{ background: "var(--bg-card)", border: "1px solid var(--border-bright)" }}
              >
                {links.map(({ href, label, icon: Icon }) => {
                  const active = pathname === href;
                  return (
                    <Link
                      key={href}
                      href={href}
                      className="flex items-center gap-2.5 px-3.5 py-2.5 text-sm font-medium transition-colors"
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
            )}
          </div>
        </div>

        <Link
          href="/account"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold whitespace-nowrap shrink-0 transition-opacity hover:opacity-90"
          style={
            user
              ? {
                  color: pathname === "/account" ? "var(--accent-bright)" : "var(--text-secondary)",
                  background: "var(--bg-card-hover)",
                  border: "1px solid var(--border-bright)",
                }
              : { color: "#fff", background: "var(--accent)" }
          }
        >
          {user ? (
            <>
              {isVIP ? (
                <ShieldCheck size={15} style={{ color: "var(--accent-bright)" }} />
              ) : (
                <UserIcon size={15} />
              )}
              <span className="max-w-[120px] truncate">{user.username}</span>
              <span className="hidden sm:inline" style={{ color: "var(--text-muted)" }}>· My Stats</span>
            </>
          ) : (
            <>
              <UserIcon size={15} />
              Sync Account
            </>
          )}
        </Link>
      </div>
    </nav>
  );
}
