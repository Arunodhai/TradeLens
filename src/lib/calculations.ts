import type { Trade } from '@/src/db';

export type TradeOutcome = 'WIN' | 'LOSS' | 'BREAKEVEN';

// ─── Core calculations ────────────────────────────────────────────────────────

/**
 * P&L formula per CLAUDE.md:
 *   LONG:  (exitPrice - entryPrice) * quantity - fees
 *   SHORT: (entryPrice - exitPrice) * quantity - fees
 */
export function calcPnl(
  side: 'LONG' | 'SHORT',
  entryPrice: number,
  exitPrice: number,
  quantity: number,
  fees = 0
): number {
  const gross = (exitPrice - entryPrice) * quantity;
  return side === 'LONG' ? gross - fees : -gross - fees;
}

export function calcOutcome(pnl: number): TradeOutcome {
  if (pnl > 0) return 'WIN';
  if (pnl < 0) return 'LOSS';
  return 'BREAKEVEN';
}

/**
 * Risk/Reward ratio. Returns null when stop loss or take profit is missing.
 */
export function calcRiskReward(
  side: 'LONG' | 'SHORT',
  entryPrice: number,
  stopLoss: number | undefined,
  takeProfit: number | undefined
): number | null {
  if (!stopLoss || !takeProfit) return null;
  const risk = Math.abs(entryPrice - stopLoss);
  if (risk === 0) return null;
  const reward = Math.abs(takeProfit - entryPrice);
  return reward / risk;
}

// ─── Duration helpers ─────────────────────────────────────────────────────────

export function formatDuration(minutes: number): string {
  if (minutes < 1) return '< 1m';
  if (minutes < 60) return `${Math.round(minutes)}m`;
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  if (hours < 24) return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  const days = Math.floor(hours / 24);
  const remHours = hours % 24;
  return remHours > 0 ? `${days}d ${remHours}h` : `${days}d`;
}

export function calcHoldDuration(entryDate: string, exitDate: string): string {
  const minutes = (new Date(exitDate).getTime() - new Date(entryDate).getTime()) / 60_000;
  return formatDuration(minutes);
}

export function calcAvgHoldDuration(trades: Trade[]): string {
  const closed = trades.filter((t) => t.status === 'CLOSED' && t.exitDate);
  if (!closed.length) return 'N/A';
  const totalMinutes =
    closed.reduce(
      (sum, t) =>
        sum + (new Date(t.exitDate!).getTime() - new Date(t.entryDate).getTime()) / 60_000,
      0
    ) / closed.length;
  return formatDuration(totalMinutes);
}

// ─── Aggregate metrics ────────────────────────────────────────────────────────

function closedPnl(trades: Trade[]) {
  return trades.filter((t) => t.status === 'CLOSED' && t.pnl !== undefined);
}

export function calcWinRate(trades: Trade[]): number {
  const closed = closedPnl(trades);
  if (!closed.length) return 0;
  return (closed.filter((t) => (t.pnl ?? 0) > 0).length / closed.length) * 100;
}

export function calcProfitFactor(trades: Trade[]): number {
  const closed = closedPnl(trades);
  const profit = closed.filter((t) => (t.pnl ?? 0) > 0).reduce((s, t) => s + t.pnl!, 0);
  const loss = Math.abs(
    closed.filter((t) => (t.pnl ?? 0) < 0).reduce((s, t) => s + t.pnl!, 0)
  );
  if (loss === 0) return profit > 0 ? Infinity : 0;
  return profit / loss;
}

export function calcExpectancy(trades: Trade[]): number {
  const closed = closedPnl(trades);
  if (!closed.length) return 0;
  const wins = closed.filter((t) => (t.pnl ?? 0) > 0);
  const losses = closed.filter((t) => (t.pnl ?? 0) <= 0);
  const winRate = wins.length / closed.length;
  const avgWin = wins.length ? wins.reduce((s, t) => s + t.pnl!, 0) / wins.length : 0;
  const avgLoss = losses.length
    ? Math.abs(losses.reduce((s, t) => s + t.pnl!, 0)) / losses.length
    : 0;
  return winRate * avgWin - (1 - winRate) * avgLoss;
}

export function calcAvgRiskReward(trades: Trade[]): number {
  const rrs = trades
    .map((t) => calcRiskReward(t.side, t.entryPrice, t.stopLoss, t.takeProfit))
    .filter((rr): rr is number => rr !== null);
  return rrs.length ? rrs.reduce((s, r) => s + r, 0) / rrs.length : 0;
}

// ─── Streaks ──────────────────────────────────────────────────────────────────

export function calcCurrentStreak(
  trades: Trade[]
): { count: number; type: 'WIN' | 'LOSS' | 'NONE' } {
  const sorted = closedPnl(trades)
    .filter((t) => t.exitDate)
    .sort((a, b) => new Date(b.exitDate!).getTime() - new Date(a.exitDate!).getTime());
  if (!sorted.length) return { count: 0, type: 'NONE' };
  const firstType = (sorted[0].pnl ?? 0) > 0 ? 'WIN' : 'LOSS';
  let count = 0;
  for (const t of sorted) {
    if (((t.pnl ?? 0) > 0 ? 'WIN' : 'LOSS') === firstType) count++;
    else break;
  }
  return { count, type: firstType };
}

export function calcLongestStreak(trades: Trade[], type: 'WIN' | 'LOSS'): number {
  const sorted = closedPnl(trades)
    .filter((t) => t.exitDate)
    .sort((a, b) => new Date(a.exitDate!).getTime() - new Date(b.exitDate!).getTime());
  let longest = 0;
  let current = 0;
  for (const t of sorted) {
    const outcome = (t.pnl ?? 0) > 0 ? 'WIN' : 'LOSS';
    if (outcome === type) { current++; longest = Math.max(longest, current); }
    else current = 0;
  }
  return longest;
}

// ─── Best / Worst day ─────────────────────────────────────────────────────────

function dayPnlMap(trades: Trade[]): Record<string, number> {
  const map: Record<string, number> = {};
  closedPnl(trades)
    .filter((t) => t.exitDate)
    .forEach((t) => {
      const day = t.exitDate!.slice(0, 10); // yyyy-MM-dd
      map[day] = (map[day] ?? 0) + (t.pnl ?? 0);
    });
  return map;
}

export function calcBestDay(trades: Trade[]): { date: string; pnl: number } | null {
  const entries = Object.entries(dayPnlMap(trades));
  if (!entries.length) return null;
  return entries.reduce(
    (best, [date, pnl]) => (pnl > best.pnl ? { date, pnl } : best),
    { date: entries[0][0], pnl: entries[0][1] }
  );
}

export function calcWorstDay(trades: Trade[]): { date: string; pnl: number } | null {
  const entries = Object.entries(dayPnlMap(trades));
  if (!entries.length) return null;
  return entries.reduce(
    (worst, [date, pnl]) => (pnl < worst.pnl ? { date, pnl } : worst),
    { date: entries[0][0], pnl: entries[0][1] }
  );
}

// ─── Discipline score ─────────────────────────────────────────────────────────

/** 100 points per trade, –10 per mistake tag, floored at 0. Average across trades. */
export function calcDisciplineScore(trades: Trade[]): number {
  const closed = trades.filter((t) => t.status === 'CLOSED');
  if (!closed.length) return 100;
  const scores = closed.map((t) => Math.max(0, 100 - t.mistakes.length * 10));
  return scores.reduce((s, v) => s + v, 0) / scores.length;
}

// ─── Setup / Mistake / Symbol stats ──────────────────────────────────────────

export function calcSetupStats(
  trades: Trade[]
): { name: string; wins: number; total: number; pnl: number; winRate: number }[] {
  const stats: Record<string, { wins: number; total: number; pnl: number }> = {};
  closedPnl(trades).forEach((t) => {
    t.setups.forEach((s) => {
      stats[s] ??= { wins: 0, total: 0, pnl: 0 };
      stats[s].total++;
      stats[s].pnl += t.pnl ?? 0;
      if ((t.pnl ?? 0) > 0) stats[s].wins++;
    });
  });
  return Object.entries(stats)
    .map(([name, v]) => ({ name, ...v, winRate: (v.wins / v.total) * 100 }))
    .sort((a, b) => b.total - a.total);
}

export function calcMistakeStats(
  trades: Trade[]
): { name: string; count: number; totalCost: number }[] {
  const stats: Record<string, { count: number; totalCost: number }> = {};
  closedPnl(trades).forEach((t) => {
    t.mistakes.forEach((m) => {
      stats[m] ??= { count: 0, totalCost: 0 };
      stats[m].count++;
      if ((t.pnl ?? 0) < 0) stats[m].totalCost += Math.abs(t.pnl ?? 0);
    });
  });
  return Object.entries(stats)
    .map(([name, v]) => ({ name, ...v }))
    .sort((a, b) => b.count - a.count);
}

export function calcSymbolStats(
  trades: Trade[]
): { symbol: string; pnl: number; trades: number; winRate: number }[] {
  const stats: Record<string, { pnl: number; total: number; wins: number }> = {};
  closedPnl(trades).forEach((t) => {
    stats[t.symbol] ??= { pnl: 0, total: 0, wins: 0 };
    stats[t.symbol].pnl += t.pnl ?? 0;
    stats[t.symbol].total++;
    if ((t.pnl ?? 0) > 0) stats[t.symbol].wins++;
  });
  return Object.entries(stats)
    .map(([symbol, v]) => ({
      symbol,
      pnl: v.pnl,
      trades: v.total,
      winRate: (v.wins / v.total) * 100,
    }))
    .sort((a, b) => b.pnl - a.pnl);
}

/** Weekly discipline scores for trend chart */
export function calcDisciplineScoreTrend(
  trades: Trade[]
): { week: string; score: number }[] {
  const byWeek: Record<string, Trade[]> = {};
  trades
    .filter((t) => t.status === 'CLOSED' && t.exitDate)
    .forEach((t) => {
      const d = new Date(t.exitDate!);
      const monday = new Date(d);
      monday.setDate(d.getDate() - ((d.getDay() + 6) % 7));
      const key = monday.toISOString().slice(0, 10);
      byWeek[key] ??= [];
      byWeek[key].push(t);
    });
  return Object.entries(byWeek)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([week, ts]) => ({ week, score: calcDisciplineScore(ts) }));
}
