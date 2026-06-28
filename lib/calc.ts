export interface StatsInput {
  username: string;
  totalWagered: number;
  totalWon: number;
  casesOpened: number;
  battlesPlayed: number;
  battlesWon: number;
  crashGames: number;
  crashWins: number;
  wheelSpins: number;
  wheelWins: number;
  upgraderPlays: number;
  upgraderWins: number;
  savedAt: string;
}

export interface Calculated {
  profit: number;
  profitPct: number;
  rtp: number;
  houseEdge: number;        // actual experienced house edge %
  flipHouseEdge: number;    // flip.gg stated house edge (approx 3%)
  edgeDiff: number;         // how much worse/better than expected
  battleWinRate: number;
  crashWinRate: number;
  wheelWinRate: number;
  upgraderWinRate: number;
  netPerCase: number;
  netPerBattle: number;
}

// flip.gg approximate stated house edge per game mode
const STATED_EDGE: Record<string, number> = {
  lootbox: 3,
  battles: 3,
  crash: 3,
  wheel: 5,
  upgrader: 3,
};

export function calculate(input: StatsInput): Calculated {
  const profit = input.totalWon - input.totalWagered;
  const profitPct = input.totalWagered > 0 ? (profit / input.totalWagered) * 100 : 0;
  const rtp = input.totalWagered > 0 ? (input.totalWon / input.totalWagered) * 100 : 0;
  const houseEdge = 100 - rtp;
  const flipHouseEdge = STATED_EDGE.lootbox;
  const edgeDiff = houseEdge - flipHouseEdge;

  const battleWinRate =
    input.battlesPlayed > 0 ? (input.battlesWon / input.battlesPlayed) * 100 : 0;
  const crashWinRate =
    input.crashGames > 0 ? (input.crashWins / input.crashGames) * 100 : 0;
  const wheelWinRate =
    input.wheelSpins > 0 ? (input.wheelWins / input.wheelSpins) * 100 : 0;
  const upgraderWinRate =
    input.upgraderPlays > 0 ? (input.upgraderWins / input.upgraderPlays) * 100 : 0;

  const netPerCase =
    input.casesOpened > 0 ? profit / input.casesOpened : 0;
  const netPerBattle =
    input.battlesPlayed > 0 ? profit / input.battlesPlayed : 0;

  return {
    profit,
    profitPct,
    rtp,
    houseEdge,
    flipHouseEdge,
    edgeDiff,
    battleWinRate,
    crashWinRate,
    wheelWinRate,
    upgraderWinRate,
    netPerCase,
    netPerBattle,
  };
}

export function fmt(n: number, decimals = 2): string {
  return n.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function fmtUSD(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

export function fmtCompact(n: number): string {
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `${sign}$${(abs / 1_000).toFixed(1)}K`;
  return `${sign}$${abs.toFixed(2)}`;
}
