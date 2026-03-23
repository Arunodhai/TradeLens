import { describe, it, expect } from 'vitest';
import {
  calcPnl,
  calcOutcome,
  calcRiskReward,
  calcHoldDuration,
  formatDuration,
  calcCurrentStreak,
  calcLongestStreak,
  calcDisciplineScore,
  calcProfitFactor,
  calcExpectancy,
  calcBestDay,
  calcWorstDay,
  calcSetupStats,
  calcMistakeStats,
} from './calculations';
import type { Trade } from '@/src/db';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeTrade(overrides: Partial<Trade> = {}): Trade {
  return {
    symbol: 'AAPL',
    side: 'LONG',
    entryDate: '2024-01-01T09:30:00Z',
    entryPrice: 100,
    quantity: 10,
    setups: [],
    mistakes: [],
    emotions: [],
    status: 'CLOSED',
    pnl: 0,
    ...overrides,
  };
}

// ─── calcPnl ──────────────────────────────────────────────────────────────────

describe('calcPnl', () => {
  it('LONG win: (exit - entry) * qty - fees', () => {
    expect(calcPnl('LONG', 100, 110, 10, 5)).toBe(95);
  });

  it('LONG loss', () => {
    expect(calcPnl('LONG', 100, 90, 10, 0)).toBe(-100);
  });

  it('SHORT win: (entry - exit) * qty - fees', () => {
    expect(calcPnl('SHORT', 110, 100, 10, 5)).toBe(95);
  });

  it('SHORT loss', () => {
    expect(calcPnl('SHORT', 100, 110, 10, 0)).toBe(-100);
  });

  it('defaults fees to 0', () => {
    expect(calcPnl('LONG', 100, 110, 10)).toBe(100);
  });
});

// ─── calcOutcome ──────────────────────────────────────────────────────────────

describe('calcOutcome', () => {
  it('positive pnl → WIN', () => expect(calcOutcome(100)).toBe('WIN'));
  it('negative pnl → LOSS', () => expect(calcOutcome(-1)).toBe('LOSS'));
  it('zero pnl → BREAKEVEN', () => expect(calcOutcome(0)).toBe('BREAKEVEN'));
});

// ─── calcRiskReward ───────────────────────────────────────────────────────────

describe('calcRiskReward', () => {
  it('LONG 2:1 R/R', () => {
    // risk=5, reward=10
    expect(calcRiskReward('LONG', 100, 95, 110)).toBe(2);
  });

  it('SHORT 1:1 R/R', () => {
    // entry 110, stop 115 (risk=5), tp 105 (reward=5)
    expect(calcRiskReward('SHORT', 110, 115, 105)).toBe(1);
  });

  it('returns null when stop loss is missing', () => {
    expect(calcRiskReward('LONG', 100, undefined, 110)).toBeNull();
  });

  it('returns null when take profit is missing', () => {
    expect(calcRiskReward('LONG', 100, 95, undefined)).toBeNull();
  });

  it('returns null when risk is zero', () => {
    expect(calcRiskReward('LONG', 100, 100, 110)).toBeNull();
  });
});

// ─── calcHoldDuration ─────────────────────────────────────────────────────────

describe('formatDuration', () => {
  it('< 1 minute', () => expect(formatDuration(0.5)).toBe('< 1m'));
  it('minutes', () => expect(formatDuration(45)).toBe('45m'));
  it('hours + minutes', () => expect(formatDuration(90)).toBe('1h 30m'));
  it('hours only', () => expect(formatDuration(120)).toBe('2h'));
  it('days', () => expect(formatDuration(1440)).toBe('1d'));
  it('days + hours', () => expect(formatDuration(1500)).toBe('1d 1h'));
});

describe('calcHoldDuration', () => {
  it('1 hour hold', () => {
    expect(calcHoldDuration('2024-01-01T09:00:00Z', '2024-01-01T10:00:00Z')).toBe('1h');
  });

  it('30 minute hold', () => {
    expect(calcHoldDuration('2024-01-01T09:00:00Z', '2024-01-01T09:30:00Z')).toBe('30m');
  });
});

// ─── Streak calculations ──────────────────────────────────────────────────────

describe('calcCurrentStreak', () => {
  it('returns NONE for empty trades', () => {
    expect(calcCurrentStreak([])).toEqual({ count: 0, type: 'NONE' });
  });

  it('detects current win streak', () => {
    const trades = [
      makeTrade({ pnl: 100, exitDate: '2024-01-03T10:00:00Z' }),
      makeTrade({ pnl: 50, exitDate: '2024-01-02T10:00:00Z' }),
      makeTrade({ pnl: -30, exitDate: '2024-01-01T10:00:00Z' }),
    ];
    expect(calcCurrentStreak(trades)).toEqual({ count: 2, type: 'WIN' });
  });

  it('detects current loss streak', () => {
    const trades = [
      makeTrade({ pnl: -100, exitDate: '2024-01-02T10:00:00Z' }),
      makeTrade({ pnl: 50, exitDate: '2024-01-01T10:00:00Z' }),
    ];
    expect(calcCurrentStreak(trades)).toEqual({ count: 1, type: 'LOSS' });
  });
});

describe('calcLongestStreak', () => {
  it('longest win streak', () => {
    const trades = [
      makeTrade({ pnl: 10, exitDate: '2024-01-01T10:00:00Z' }),
      makeTrade({ pnl: 10, exitDate: '2024-01-02T10:00:00Z' }),
      makeTrade({ pnl: 10, exitDate: '2024-01-03T10:00:00Z' }),
      makeTrade({ pnl: -10, exitDate: '2024-01-04T10:00:00Z' }),
      makeTrade({ pnl: 10, exitDate: '2024-01-05T10:00:00Z' }),
    ];
    expect(calcLongestStreak(trades, 'WIN')).toBe(3);
  });
});

// ─── Discipline score ─────────────────────────────────────────────────────────

describe('calcDisciplineScore', () => {
  it('100 for trade with no mistakes', () => {
    expect(calcDisciplineScore([makeTrade({ mistakes: [] })])).toBe(100);
  });

  it('80 for trade with 2 mistakes', () => {
    expect(calcDisciplineScore([makeTrade({ mistakes: ['A', 'B'] })])).toBe(80);
  });

  it('floors at 0 for many mistakes', () => {
    expect(
      calcDisciplineScore([makeTrade({ mistakes: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K'] })])
    ).toBe(0);
  });

  it('averages across trades', () => {
    const trades = [
      makeTrade({ mistakes: [] }),       // score 100
      makeTrade({ mistakes: ['A', 'B'] }), // score 80
    ];
    expect(calcDisciplineScore(trades)).toBe(90);
  });

  it('returns 100 with no closed trades', () => {
    expect(calcDisciplineScore([])).toBe(100);
  });
});

// ─── Profit factor ────────────────────────────────────────────────────────────

describe('calcProfitFactor', () => {
  it('calculates correctly', () => {
    const trades = [
      makeTrade({ pnl: 200 }),
      makeTrade({ pnl: -100 }),
    ];
    expect(calcProfitFactor(trades)).toBe(2);
  });

  it('returns 0 when no winners and no losers', () => {
    expect(calcProfitFactor([])).toBe(0);
  });
});

// ─── Expectancy ───────────────────────────────────────────────────────────────

describe('calcExpectancy', () => {
  it('positive expectancy', () => {
    const trades = [
      makeTrade({ pnl: 200 }),
      makeTrade({ pnl: 200 }),
      makeTrade({ pnl: -100 }),
    ];
    // winRate=2/3, avgWin=200, avgLoss=100
    // = 2/3*200 - 1/3*100 = 133.33 - 33.33 = 100
    expect(calcExpectancy(trades)).toBeCloseTo(100, 1);
  });
});

// ─── Best / Worst day ─────────────────────────────────────────────────────────

describe('calcBestDay / calcWorstDay', () => {
  const trades = [
    makeTrade({ pnl: 100, exitDate: '2024-01-01T10:00:00Z' }),
    makeTrade({ pnl: 50, exitDate: '2024-01-01T14:00:00Z' }),  // same day → 150
    makeTrade({ pnl: -200, exitDate: '2024-01-02T10:00:00Z' }),
  ];

  it('best day', () => {
    expect(calcBestDay(trades)).toEqual({ date: '2024-01-01', pnl: 150 });
  });

  it('worst day', () => {
    expect(calcWorstDay(trades)).toEqual({ date: '2024-01-02', pnl: -200 });
  });

  it('returns null for empty trades', () => {
    expect(calcBestDay([])).toBeNull();
    expect(calcWorstDay([])).toBeNull();
  });
});

// ─── Setup / Mistake stats ────────────────────────────────────────────────────

describe('calcSetupStats', () => {
  it('aggregates correctly', () => {
    const trades = [
      makeTrade({ setups: ['Breakout'], pnl: 100 }),
      makeTrade({ setups: ['Breakout'], pnl: -50 }),
      makeTrade({ setups: ['Pullback'], pnl: 200 }),
    ];
    const stats = calcSetupStats(trades);
    const breakout = stats.find((s) => s.name === 'Breakout')!;
    expect(breakout.total).toBe(2);
    expect(breakout.wins).toBe(1);
    expect(breakout.pnl).toBe(50);
    expect(breakout.winRate).toBe(50);
  });
});

describe('calcMistakeStats', () => {
  it('counts frequency and cost', () => {
    const trades = [
      makeTrade({ mistakes: ['Entered Early'], pnl: -100 }),
      makeTrade({ mistakes: ['Entered Early', 'FOMO'], pnl: -50 }),
    ];
    const stats = calcMistakeStats(trades);
    const early = stats.find((s) => s.name === 'Entered Early')!;
    expect(early.count).toBe(2);
    expect(early.totalCost).toBe(150);
  });
});
