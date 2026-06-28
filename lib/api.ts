// ─── Data Types ───────────────────────────────────────────────────────────────

export interface UserStats {
  username: string;
  avatar: string;
  joinedAt: string;
  level: number;
  totalWagered: number;
  totalWon: number;
  profit: number;
  casesOpened: number;
  battlesPlayed: number;
  battlesWon: number;
  crashGames: number;
  bestItem: { name: string; value: number; image: string };
  gameBreakdown: GameBreakdown[];
  recentActivity: RecentActivity[];
  wageredHistory: WagerPoint[];
}

export interface GameBreakdown {
  game: string;
  wagered: number;
  won: number;
  profit: number;
  plays: number;
}

export interface RecentActivity {
  id: string;
  game: string;
  type: string;
  wagered: number;
  won: number;
  timestamp: string;
}

export interface WagerPoint {
  date: string;
  wagered: number;
}

export interface LeaderboardEntry {
  rank: number;
  username: string;
  avatar: string;
  totalWagered: number;
  profit: number;
  casesOpened: number;
  level: number;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_USERS: Record<string, UserStats> = {
  flipkingx: {
    username: "flipkingx",
    avatar: "FK",
    joinedAt: "2024-01-15",
    level: 47,
    totalWagered: 284930.5,
    totalWon: 301220.0,
    profit: 16289.5,
    casesOpened: 1842,
    battlesPlayed: 209,
    battlesWon: 118,
    crashGames: 504,
    bestItem: { name: "Dragon Lore AWP", value: 4200.0, image: "🐉" },
    gameBreakdown: [
      { game: "Lootbox", wagered: 142000, won: 155000, profit: 13000, plays: 1842 },
      { game: "Battles", wagered: 68000, won: 71500, profit: 3500, plays: 209 },
      { game: "Crash", wagered: 41930, won: 41220, profit: -710, plays: 504 },
      { game: "Wheel", wagered: 33000, won: 33500, profit: 500, plays: 312 },
    ],
    recentActivity: [
      { id: "1", game: "Lootbox", type: "Classic Case", wagered: 50, won: 320, timestamp: "2025-06-28T14:22:00Z" },
      { id: "2", game: "Crash", type: "1.4x", wagered: 200, won: 280, timestamp: "2025-06-28T13:55:00Z" },
      { id: "3", game: "Battles", type: "2v2", wagered: 500, won: 0, timestamp: "2025-06-28T13:10:00Z" },
      { id: "4", game: "Lootbox", type: "Premium Case", wagered: 250, won: 180, timestamp: "2025-06-28T12:40:00Z" },
      { id: "5", game: "Wheel", type: "x10", wagered: 100, won: 0, timestamp: "2025-06-28T11:20:00Z" },
    ],
    wageredHistory: [
      { date: "Jun 22", wagered: 8200 },
      { date: "Jun 23", wagered: 12400 },
      { date: "Jun 24", wagered: 9100 },
      { date: "Jun 25", wagered: 15600 },
      { date: "Jun 26", wagered: 11200 },
      { date: "Jun 27", wagered: 18900 },
      { date: "Jun 28", wagered: 14300 },
    ],
  },
  solanaghost: {
    username: "solanaghost",
    avatar: "SG",
    joinedAt: "2023-11-03",
    level: 62,
    totalWagered: 512840.0,
    totalWon: 488120.0,
    profit: -24720.0,
    casesOpened: 3214,
    battlesPlayed: 388,
    battlesWon: 178,
    crashGames: 921,
    bestItem: { name: "Karambit Fade", value: 8900.0, image: "🔪" },
    gameBreakdown: [
      { game: "Lootbox", wagered: 220000, won: 208000, profit: -12000, plays: 3214 },
      { game: "Battles", wagered: 145000, won: 138000, profit: -7000, plays: 388 },
      { game: "Crash", wagered: 98000, won: 95500, profit: -2500, plays: 921 },
      { game: "Wheel", wagered: 49840, won: 46620, profit: -3220, plays: 541 },
    ],
    recentActivity: [
      { id: "1", game: "Lootbox", type: "Knife Case", wagered: 500, won: 8900, timestamp: "2025-06-28T15:01:00Z" },
      { id: "2", game: "Crash", type: "2.0x", wagered: 1000, won: 2000, timestamp: "2025-06-28T14:30:00Z" },
      { id: "3", game: "Battles", type: "4-way", wagered: 2000, won: 0, timestamp: "2025-06-28T13:45:00Z" },
      { id: "4", game: "Wheel", type: "x2", wagered: 200, won: 400, timestamp: "2025-06-28T12:15:00Z" },
      { id: "5", game: "Crash", type: "Bust", wagered: 500, won: 0, timestamp: "2025-06-28T11:55:00Z" },
    ],
    wageredHistory: [
      { date: "Jun 22", wagered: 18500 },
      { date: "Jun 23", wagered: 22100 },
      { date: "Jun 24", wagered: 16800 },
      { date: "Jun 25", wagered: 28400 },
      { date: "Jun 26", wagered: 19200 },
      { date: "Jun 27", wagered: 31000 },
      { date: "Jun 28", wagered: 24600 },
    ],
  },
};

const MOCK_LEADERBOARD: LeaderboardEntry[] = [
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

// ─── API Functions ────────────────────────────────────────────────────────────
// Replace these with real flip.gg API calls when available.

export async function fetchUserStats(username: string): Promise<UserStats | null> {
  await new Promise((r) => setTimeout(r, 600));
  const key = username.toLowerCase();
  return MOCK_USERS[key] ?? null;
}

export async function fetchLeaderboard(): Promise<LeaderboardEntry[]> {
  await new Promise((r) => setTimeout(r, 400));
  return MOCK_LEADERBOARD;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function formatUSD(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

export function formatCompact(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(2)}`;
}

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}
