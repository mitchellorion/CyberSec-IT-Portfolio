import Link from "next/link";
import { Search } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 pt-20 text-center">
      <div className="text-5xl">🔍</div>
      <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
        Player not found
      </h2>
      <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
        That username doesn&apos;t exist or has no recorded data yet.
      </p>
      <Link
        href="/"
        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium mt-2"
        style={{ background: "var(--accent)", color: "#fff" }}
      >
        <Search size={14} /> Try another username
      </Link>
    </div>
  );
}
