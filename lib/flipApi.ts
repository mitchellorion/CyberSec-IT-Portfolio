const API = "https://api.flip.gg/api";

export interface LootboxSummary {
  _id: string;
  id: string;
  name: string;
  price: number;
  image: string;
  drops: string[];
  riskPercentage: number;
  timesWageredTwoWeeks: number;
}

export interface Drop {
  id: string;
  name: string;
  drop: number;   // probability %
  price: number;
  image: string;
  odds: string;   // range string e.g. "0 - 99"
}

export interface RecentDrop {
  name: string;
  price: number;
  image: string;
}

export interface LootboxDetail {
  _id: string;
  id: string;
  name: string;
  price: number;
  image: string;
  drops: Drop[];
  riskPercentage: number;
  timesWagered: number;
  recentDrops: RecentDrop[];
  type?: string;
}

export async function getAllLootboxes(): Promise<LootboxSummary[]> {
  const res = await fetch(`${API}/lootbox/`, { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error("Failed to fetch lootboxes");
  return res.json();
}

export async function getLootbox(id: string): Promise<LootboxDetail | null> {
  const res = await fetch(`${API}/lootbox/${id}`, { next: { revalidate: 3600 } });
  if (!res.ok) return null;
  return res.json();
}

export function calcEV(drops: Drop[]): number {
  return drops.reduce((sum, d) => sum + d.price * (d.drop / 100), 0);
}

export function calcRTP(drops: Drop[], price: number): number {
  if (price === 0) return 0;
  return (calcEV(drops) / price) * 100;
}
