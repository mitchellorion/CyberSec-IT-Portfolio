// flip.gg level / VIP system. Each tier unlocks at a cumulative wager amount,
// grants rakeback, and pays a one-time level-up bonus reward.
//
// Values transcribed from flip.gg's level tiers. Edit here to keep the /levels
// page and the Calculator's level widget in sync — they both read this data.

export interface Level {
  name: string;
  wager: number;     // cumulative wager required to reach this tier
  rakeback: number;  // rakeback %, applied to the house edge on your wagers
  bonus: number;     // one-time level-up bonus reward ($)
  color: string;
}

export const LEVELS: Level[] = [
  { name: "Bronze", wager: 5_000, rakeback: 15, bonus: 25, color: "#cd7f32" },
  { name: "Silver", wager: 23_000, rakeback: 15, bonus: 100, color: "#c0c0c0" },
  { name: "Gold", wager: 100_000, rakeback: 15, bonus: 300, color: "#ffd700" },
  { name: "Diamond", wager: 250_000, rakeback: 15, bonus: 800, color: "#7fdfff" },
  { name: "Ruby", wager: 500_000, rakeback: 15, bonus: 1_200, color: "#e0115f" },
  { name: "Emerald", wager: 1_000_000, rakeback: 15, bonus: 2_250, color: "#50c878" },
  { name: "Sapphire", wager: 2_000_000, rakeback: 15, bonus: 4_000, color: "#2f6fed" },
  { name: "Obsidian", wager: 5_000_000, rakeback: 15, bonus: 8_300, color: "#6b6b80" },
  { name: "Gem Wizard", wager: 25_000_000, rakeback: 15, bonus: 30_000, color: "#a855f7" },
  { name: "Gem Master", wager: 100_000_000, rakeback: 15, bonus: 100_000, color: "#f59e0b" },
  { name: "Elite Gem Master", wager: 550_000_000, rakeback: 15, bonus: 500_000, color: "#ff2d95" },
];

/** flip.gg's approximate sitewide house edge (used to estimate rakeback value). */
export const HOUSE_EDGE = 0.035;

/** Index of the highest tier reached for a given wager, or -1 if below Bronze. */
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

/** Sum of every level-up bonus the player has unlocked so far. */
export function totalBonusUnlocked(wager: number): number {
  const i = levelIndexForWager(wager);
  return LEVELS.slice(0, i + 1).reduce((sum, l) => sum + l.bonus, 0);
}

export interface LevelProgress {
  current: Level | null;
  next: Level | null;
  /** 0–100 progress from the current tier's threshold to the next tier's. */
  pct: number;
  /** Wager still needed to reach the next tier (0 if maxed). */
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

/** Rough rakeback value estimate: rakeback% applied to the house edge on wagers. */
export function estimatedRakeback(wager: number, rakebackPct: number): number {
  return wager * HOUSE_EDGE * (rakebackPct / 100);
}
