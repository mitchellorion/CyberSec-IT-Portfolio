// flip.gg VIP rank data, confirmed against live /api/vip and /api/vip/ranks
// responses. Each rank unlocks at both a wager threshold and a numeric level
// (0-140), and grants a one-time openable reward case worth roughly `bonus`.
// `mb` is the per-rank rakeback rate flip.gg uses internally (fraction of
// wager); the marketing-facing rakeback percentage is a flat 15% for every
// rank, so we keep that as a separate constant rather than per-row.

export interface Level {
  name: string;
  wager: number;
  lvl: number;
  mb: number;
  bonus: number;
  color: string;
}

export const RAKEBACK_PCT = 15;

export const LEVELS: Level[] = [
  { name: "Gambler",          wager: 0,           lvl: 0,   mb: 0.0035,    bonus: 0,     color: "#8b8b9a" },
  { name: "Bronze",           wager: 5_000,       lvl: 25,  mb: 0.0035,    bonus: 0.13,  color: "#cd7f32" },
  { name: "Silver",           wager: 23_000,      lvl: 61,  mb: 0.0035,    bonus: 0.36,  color: "#c0c0c0" },
  { name: "Gold",             wager: 100_000,     lvl: 81,  mb: 0.0035,    bonus: 1.25,  color: "#ffd700" },
  { name: "Diamond",          wager: 250_000,     lvl: 94,  mb: 0.0035,    bonus: 2.57,  color: "#7fdfff" },
  { name: "Ruby",             wager: 500_000,     lvl: 100, mb: 0.00357,   bonus: 4.14,  color: "#e0115f" },
  { name: "Emerald",          wager: 1_000_000,   lvl: 110, mb: 0.0036225, bonus: 8.22,  color: "#50c878" },
  { name: "Sapphire",         wager: 2_000_000,   lvl: 120, mb: 0.003675,  bonus: 12.34, color: "#2f6fed" },
  { name: "Obsidian",         wager: 5_000_000,   lvl: 130, mb: 0.00385,   bonus: 18.58, color: "#6b6b80" },
  { name: "Gem Wizard",       wager: 25_000_000,  lvl: 138, mb: 0.004025,  bonus: 28.94, color: "#a855f7" },
  { name: "Gem Master",       wager: 100_000_000, lvl: 139, mb: 0.004375,  bonus: 46.56, color: "#f59e0b" },
  { name: "Elite Gem Master", wager: 550_000_000, lvl: 140, mb: 0.00525,   bonus: 77.11, color: "#ff2d95" },
];

export function levelIndexForWager(wager: number): number {
  let idx = -1;
  for (let i = 0; i < LEVELS.length; i++) {
    if (wager >= LEVELS[i].wager) idx = i;
  }
  return idx;
}

export function currentLevel(wager: number): Level | null {
  const i = levelIndexForWager(wager);
  return i >= 0 ? LEVELS[i] : null;
}

export function nextLevel(wager: number): Level | null {
  const i = levelIndexForWager(wager);
  return i + 1 < LEVELS.length ? LEVELS[i + 1] : null;
}

export function totalBonusUnlocked(wager: number): number {
  const i = levelIndexForWager(wager);
  return LEVELS.slice(0, i + 1).reduce((sum, l) => sum + l.bonus, 0);
}

export interface LevelProgress {
  current: Level | null;
  next: Level | null;
  pct: number;
  remaining: number;
}

export function levelProgress(wager: number): LevelProgress {
  const current = currentLevel(wager);
  const next = nextLevel(wager);
  if (!next) return { current, next: null, pct: 100, remaining: 0 };
  const floor = current ? current.wager : 0;
  const span = next.wager - floor;
  const pct = span > 0 ? Math.min(100, Math.max(0, ((wager - floor) / span) * 100)) : 0;
  return { current, next, pct, remaining: Math.max(0, next.wager - wager) };
}

/** Estimated rakeback using the current rank's live per-rank rate. */
export function estimatedRakeback(wager: number): number {
  const current = currentLevel(wager) ?? LEVELS[0];
  return wager * current.mb;
}
