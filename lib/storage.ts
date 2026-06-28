import type { StatsInput } from "./calc";

const KEY = "flipstats_data";

export function saveStats(data: StatsInput): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {}
}

export function loadStats(): StatsInput | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as StatsInput) : null;
  } catch {
    return null;
  }
}

export function clearStats(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {}
}
