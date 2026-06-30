export interface Level {
  name: string;
  wager: number;
  rakeback: number;
  bonus: number;
  color: string;
}

export const LEVELS: Level[] = [
  { name: "Bronze",          wager: 5_000_000,    rakeback: 15, bonus: 25,      color: "#cd7f32" },
  { name: "Silver",          wager: 23_000_000,   rakeback: 15, bonus: 100,     color: "#c0c0c0" },
  { name: "Gold",            wager: 100_000_000,  rakeback: 15, bonus: 300,     color: "#ffd700" },
  { name: "Diamond",         wager: 250_000_000,  rakeback: 15, bonus: 800,     color: "#7fdfff" },
  { name: "Ruby",            wager: 500_000_000,  rakeback: 15, bonus: 1_200,   color: "#e0115f" },
  { name: "Emerald",         wager: 1_000_000_000, rakeback: 15, bonus: 2_250,  color: "#50c878" },
  { name: "Sapphire",        wager: 2_000_000_000, rakeback: 15, bonus: 4_000,  color: "#2f6fed" },
  { name: "Obsidian",        wager: 5_000_000_000, rakeback: 15, bonus: 8_300,  color: "#6b6b80" },
  { name: "Gem Wizard",      wager: 25_000_000_000, rakeback: 15, bonus: 30_000, color: "#a855f7" },
  { name: "Gem Master",      wager: 100_000_000_000, rakeback: 15, bonus: 100_000, color: "#f59e0b" },
  { name: "Elite Gem Master", wager: 550_000_000_000, rakeback: 15, bonus: 500_000, color: "#ff2d95" },
];

export const HOUSE_EDGE = 0.035;

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

export function estimatedRakeback(wager: number, rakebackPct: number): number {
  return wager * HOUSE_EDGE * (rakebackPct / 100);
}
