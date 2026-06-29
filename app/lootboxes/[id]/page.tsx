import { getLootbox, getAllLootboxes, calcEV, calcRTP } from "@/lib/flipApi";
import { notFound } from "next/navigation";

export async function generateStaticParams() {
  const boxes = await getAllLootboxes();
  return boxes.map((b) => ({ id: b.id }));
}
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, TrendingUp, TrendingDown, Package, AlertTriangle, Flame } from "lucide-react";
import { fmtUSD, fmt, fmtCompact } from "@/lib/calc";
import imageOverrides from "@/public/lootbox-image-overrides.json";

export const revalidate = 3600;

interface Props {
  params: Promise<{ id: string }>;
}

export default async function LootboxDetailPage({ params }: Props) {
  const { id } = await params;
  const box = await getLootbox(id);
  if (!box) notFound();

  const ev = calcEV(box.drops);
  const rtp = calcRTP(box.drops, box.price);
  const houseEdge = 100 - rtp;
  const isPositiveRTP = rtp >= 100;

  const riskColor =
    box.riskPercentage > 60
      ? "var(--red)"
      : box.riskPercentage > 35
      ? "#f59e0b"
      : "var(--green)";

  return (
    <div className="flex flex-col gap-6 max-w-3xl mx-auto">
      <Link
        href="/lootboxes"
        className="flex items-center gap-1.5 text-sm w-fit hover:opacity-80 transition-opacity"
        style={{ color: "var(--text-secondary)" }}
      >
        <ArrowLeft size={14} /> All Lootboxes
      </Link>

      {/* Header */}
      <div
        className="rounded-2xl p-5 flex flex-col sm:flex-row gap-5 items-start"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
      >
        <div className="relative w-28 h-28 shrink-0 rounded-xl overflow-hidden" style={{ background: "#0a0a14" }}>
          <Image src={(imageOverrides as Record<string, string>)[id] ?? box.image} alt={box.name} fill className="object-contain p-2" unoptimized />
        </div>
        <div className="flex flex-col gap-2 flex-1 min-w-0">
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
            {box.name}
          </h1>
          <div className="flex flex-wrap gap-3 text-sm">
            <span style={{ color: "var(--text-muted)" }}>
              Price:{" "}
              <span className="font-bold" style={{ color: "var(--accent-bright)" }}>
                {fmtUSD(box.price)}
              </span>
            </span>
            <span style={{ color: "var(--text-muted)" }}>
              Items:{" "}
              <span className="font-bold" style={{ color: "var(--text-primary)" }}>
                {box.drops.length}
              </span>
            </span>
            <span style={{ color: "var(--text-muted)" }}>
              Risk:{" "}
              <span className="font-bold" style={{ color: riskColor }}>
                {box.riskPercentage.toFixed(2)}%
              </span>
            </span>
            {box.timesWagered > 0 && (
              <span style={{ color: "var(--text-muted)" }}>
                All-time opens:{" "}
                <span className="font-bold" style={{ color: "var(--text-primary)" }}>
                  {box.timesWagered.toLocaleString()}
                </span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* EV cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Cost to Open", value: fmtUSD(box.price), icon: Package, color: "var(--cyan)" },
          { label: "Expected Value", value: fmtUSD(ev), icon: isPositiveRTP ? TrendingUp : TrendingDown, color: isPositiveRTP ? "var(--green)" : "var(--red)" },
          { label: "RTP", value: `${fmt(rtp)}%`, icon: TrendingUp, color: rtp >= 96.5 ? "var(--green)" : rtp >= 90 ? "#f59e0b" : "var(--red)" },
          { label: "House Edge", value: `${fmt(houseEdge)}%`, icon: AlertTriangle, color: "var(--text-secondary)" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div
            key={label}
            className="rounded-xl p-4 flex flex-col gap-2"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>{label}</span>
              <Icon size={13} style={{ color }} />
            </div>
            <div className="text-lg font-bold" style={{ color }}>{value}</div>
          </div>
        ))}
      </div>

      {/* RTP bar */}
      <div
        className="rounded-xl p-4"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
      >
        <div className="flex justify-between text-xs mb-2" style={{ color: "var(--text-muted)" }}>
          <span>Return to Player</span>
          <span>{fmt(rtp)}% RTP · {fmt(houseEdge)}% house edge</span>
        </div>
        <div className="h-2 rounded-full" style={{ background: "var(--border)" }}>
          <div
            className="h-full rounded-full"
            style={{
              width: `${Math.min(rtp, 100)}%`,
              background: rtp >= 96.5 ? "var(--green)" : rtp >= 90 ? "#f59e0b" : "var(--red)",
            }}
          />
        </div>
      </div>

      {/* Recent drops */}
      {box.recentDrops && box.recentDrops.length > 0 && (
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
        >
          <div className="px-5 py-3 flex items-center gap-2" style={{ borderBottom: "1px solid var(--border)" }}>
            <Flame size={13} style={{ color: "var(--red)" }} />
            <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              Recent Drops
            </h2>
          </div>
          <div className="flex gap-3 p-4 overflow-x-auto">
            {box.recentDrops.map((drop, i) => (
              <div key={i} className="shrink-0 flex flex-col items-center gap-1.5 w-20">
                <div className="relative w-16 h-16 rounded-lg overflow-hidden" style={{ background: "#0a0a14" }}>
                  <Image src={drop.image} alt={drop.name} fill className="object-contain p-1" unoptimized />
                </div>
                <span className="text-xs text-center leading-tight" style={{ color: "var(--text-muted)" }}>
                  {drop.name}
                </span>
                <span className="text-xs font-bold" style={{ color: "var(--green)" }}>
                  {fmtUSD(drop.price)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Odds table */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
      >
        <div className="px-5 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
          <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            Drop Odds
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                {["Item", "Value", "Odds", "Range", "EV Contribution"].map((h) => (
                  <th key={h} className="text-left px-5 py-2.5 text-xs font-medium" style={{ color: "var(--text-muted)" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {box.drops
                .slice()
                .sort((a, b) => b.price - a.price)
                .map((drop) => {
                  const contribution = drop.price * (drop.drop / 100);
                  const isRare = drop.drop < 1;
                  return (
                    <tr
                      key={drop.id}
                      style={{ borderBottom: "1px solid var(--border)" }}
                      className="transition-colors hover:bg-white/[0.02]"
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <div className="relative w-8 h-8 rounded shrink-0" style={{ background: "#0a0a14" }}>
                            <Image src={drop.image} alt={drop.name} fill className="object-contain p-0.5" unoptimized />
                          </div>
                          <span
                            className="text-xs font-medium"
                            style={{ color: isRare ? "#f59e0b" : "var(--text-primary)" }}
                          >
                            {drop.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3 font-semibold" style={{ color: "var(--green)" }}>
                        {fmtUSD(drop.price)}
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className="font-semibold"
                          style={{ color: isRare ? "#f59e0b" : "var(--text-primary)" }}
                        >
                          {fmt(drop.drop)}%
                        </span>
                      </td>
                      <td className="px-5 py-3 text-xs" style={{ color: "var(--text-muted)", fontFamily: "monospace" }}>
                        {drop.odds}
                      </td>
                      <td className="px-5 py-3 text-xs" style={{ color: "var(--text-muted)" }}>
                        {fmtUSD(contribution)}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
            <tfoot>
              <tr style={{ borderTop: "1px solid var(--border-bright)" }}>
                <td className="px-5 py-3 text-xs font-semibold" style={{ color: "var(--text-secondary)" }} colSpan={2}>
                  Expected Value
                </td>
                <td className="px-5 py-3" />
                <td className="px-5 py-3" />
                <td className="px-5 py-3 font-bold" style={{ color: isPositiveRTP ? "var(--green)" : "var(--red)" }}>
                  {fmtUSD(ev)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
