import { useEffect, useState } from 'react';
import { tradeService, Trade } from '@/src/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  LineChart, Line, PieChart, Pie, Legend,
} from 'recharts';
import { format, parseISO, getDay } from 'date-fns';
import {
  calcSymbolStats, calcMistakeStats, calcDisciplineScoreTrend, calcAvgHoldDuration,
} from '@/src/lib/calculations';

const GREEN = 'hsl(var(--primary))';
const RED = 'hsl(var(--destructive))';
const TOOLTIP_STYLE = {
  contentStyle: { backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' },
  itemStyle: { color: 'hsl(var(--foreground))' },
  cursor: { fill: 'transparent' },
};

function EmptyState() {
  return (
    <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
      Not enough data yet
    </div>
  );
}

export function Analytics() {
  const [trades, setTrades] = useState<Trade[] | null>(null);

  useEffect(() => {
    const unsub = tradeService.subscribeToTrades(setTrades, console.error);
    return unsub;
  }, []);

  if (!trades) {
    return <div className="flex items-center justify-center h-64 text-muted-foreground">Loading…</div>;
  }

  const closed = trades.filter((t) => t.status === 'CLOSED' && t.pnl !== undefined && t.exitDate);

  // ── 1. Cumulative P&L over time ─────────────────────────────────────────────
  let cum = 0;
  const pnlOverTime = [...closed]
    .sort((a, b) => new Date(a.exitDate!).getTime() - new Date(b.exitDate!).getTime())
    .map((t) => {
      cum += t.pnl ?? 0;
      return { date: format(parseISO(t.exitDate!), 'MMM dd'), pnl: cum, tradePnl: t.pnl ?? 0 };
    });

  // ── 2. P&L by day of week ──────────────────────────────────────────────────
  const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dowMap: Record<number, number> = {};
  closed.forEach((t) => {
    const d = getDay(parseISO(t.exitDate!));
    dowMap[d] = (dowMap[d] ?? 0) + (t.pnl ?? 0);
  });
  const pnlByDay = [1, 2, 3, 4, 5].map((i) => ({ day: DOW[i], pnl: dowMap[i] ?? 0 }));

  // ── 3. Win rate by setup ───────────────────────────────────────────────────
  const setupStats: Record<string, { wins: number; total: number }> = {};
  closed.forEach((t) => {
    t.setups.forEach((s) => {
      setupStats[s] ??= { wins: 0, total: 0 };
      setupStats[s].total++;
      if ((t.pnl ?? 0) > 0) setupStats[s].wins++;
    });
  });
  const setupData = Object.entries(setupStats)
    .map(([name, v]) => ({ name, winRate: (v.wins / v.total) * 100, total: v.total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 8);

  // ── 4. Long vs Short ──────────────────────────────────────────────────────
  const sideData = (['LONG', 'SHORT'] as const).map((side) => {
    const ts = closed.filter((t) => t.side === side);
    return {
      name: side,
      pnl: ts.reduce((s, t) => s + (t.pnl ?? 0), 0),
      count: ts.length,
      winRate: ts.length ? (ts.filter((t) => (t.pnl ?? 0) > 0).length / ts.length) * 100 : 0,
    };
  });

  // ── 5. Symbol performance ─────────────────────────────────────────────────
  const symbolData = calcSymbolStats(trades).slice(0, 8);

  // ── 6. Mistake frequency ──────────────────────────────────────────────────
  const mistakeData = calcMistakeStats(trades).slice(0, 8);

  // ── 7. Discipline score trend ─────────────────────────────────────────────
  const disciplineTrend = calcDisciplineScoreTrend(trades);

  // ── 8. Hold time ──────────────────────────────────────────────────────────
  const avgHold = calcAvgHoldDuration(trades);
  const holdByOutcome = [
    {
      name: 'Winners',
      minutes: avgMinutes(closed.filter((t) => (t.pnl ?? 0) > 0)),
    },
    {
      name: 'Losers',
      minutes: avgMinutes(closed.filter((t) => (t.pnl ?? 0) < 0)),
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground mt-1">
          Deep dive into your performance. Avg hold time: <strong>{avgHold}</strong>.
        </p>
      </div>

      {/* Row 1: Cumulative P&L + DoW */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Cumulative P&L</CardTitle></CardHeader>
          <CardContent className="h-[280px]">
            {pnlOverTime.length > 1 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={pnlOverTime}>
                  <XAxis dataKey="date" stroke="#888" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                  <Tooltip {...TOOLTIP_STYLE} formatter={(v: number) => [`$${v.toFixed(2)}`, 'Cum. P&L']} />
                  <Line type="monotone" dataKey="pnl" stroke={GREEN} strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : <EmptyState />}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>P&L by Day of Week</CardTitle></CardHeader>
          <CardContent className="h-[280px]">
            {pnlByDay.some((d) => d.pnl !== 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={pnlByDay}>
                  <XAxis dataKey="day" stroke="#888" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                  <Tooltip {...TOOLTIP_STYLE} formatter={(v: number) => [`$${v.toFixed(2)}`, 'P&L']} />
                  <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                    {pnlByDay.map((d, i) => (
                      <Cell key={i} fill={d.pnl >= 0 ? GREEN : RED} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : <EmptyState />}
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Win rate by setup + Long vs Short */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Win Rate by Setup (%)</CardTitle></CardHeader>
          <CardContent className="h-[280px]">
            {setupData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={setupData} layout="vertical" margin={{ left: 10 }}>
                  <XAxis type="number" domain={[0, 100]} stroke="#888" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis dataKey="name" type="category" stroke="#888" fontSize={11} tickLine={false} axisLine={false} width={110} />
                  <Tooltip {...TOOLTIP_STYLE} formatter={(v: number) => [`${v.toFixed(0)}%`, 'Win Rate']} />
                  <Bar dataKey="winRate" fill={GREEN} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <EmptyState />}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Long vs Short P&L</CardTitle></CardHeader>
          <CardContent className="h-[280px]">
            {sideData.some((d) => d.count > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sideData}>
                  <XAxis dataKey="name" stroke="#888" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                  <Tooltip
                    {...TOOLTIP_STYLE}
                    formatter={(v: number, name: string) =>
                      name === 'pnl' ? [`$${v.toFixed(2)}`, 'P&L'] : [`${(v as number).toFixed(0)}%`, 'Win Rate']
                    }
                  />
                  <Bar dataKey="pnl" radius={[4, 4, 0, 0]} name="pnl">
                    {sideData.map((d, i) => (
                      <Cell key={i} fill={d.pnl >= 0 ? GREEN : RED} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : <EmptyState />}
          </CardContent>
        </Card>
      </div>

      {/* Row 3: Symbol performance + Mistake frequency */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Symbol Performance</CardTitle></CardHeader>
          <CardContent className="h-[280px]">
            {symbolData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={symbolData} layout="vertical" margin={{ left: 10 }}>
                  <XAxis type="number" stroke="#888" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                  <YAxis dataKey="symbol" type="category" stroke="#888" fontSize={11} tickLine={false} axisLine={false} width={50} />
                  <Tooltip {...TOOLTIP_STYLE} formatter={(v: number) => [`$${v.toFixed(2)}`, 'P&L']} />
                  <Bar dataKey="pnl" radius={[0, 4, 4, 0]}>
                    {symbolData.map((d, i) => (
                      <Cell key={i} fill={d.pnl >= 0 ? GREEN : RED} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : <EmptyState />}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Mistake Frequency</CardTitle></CardHeader>
          <CardContent className="h-[280px]">
            {mistakeData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mistakeData} layout="vertical" margin={{ left: 10 }}>
                  <XAxis type="number" stroke="#888" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis dataKey="name" type="category" stroke="#888" fontSize={11} tickLine={false} axisLine={false} width={120} />
                  <Tooltip
                    {...TOOLTIP_STYLE}
                    formatter={(v: number, name: string) =>
                      name === 'count' ? [v, 'Occurrences'] : [`$${(v as number).toFixed(2)}`, 'Total Cost']
                    }
                  />
                  <Bar dataKey="count" fill={RED} radius={[0, 4, 4, 0]} name="count" />
                </BarChart>
              </ResponsiveContainer>
            ) : <EmptyState />}
          </CardContent>
        </Card>
      </div>

      {/* Row 4: Discipline score trend + Hold time */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Discipline Score Trend</CardTitle></CardHeader>
          <CardContent className="h-[280px]">
            {disciplineTrend.length > 1 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={disciplineTrend}>
                  <XAxis dataKey="week" stroke="#888" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis domain={[0, 100]} stroke="#888" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip {...TOOLTIP_STYLE} formatter={(v: number) => [`${v.toFixed(0)}/100`, 'Discipline']} />
                  <Line type="monotone" dataKey="score" stroke={GREEN} strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : <EmptyState />}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Avg Hold Time by Outcome</CardTitle></CardHeader>
          <CardContent className="h-[280px]">
            {holdByOutcome.some((d) => d.minutes > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={holdByOutcome}>
                  <XAxis dataKey="name" stroke="#888" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${Math.round(v)}m`} />
                  <Tooltip
                    {...TOOLTIP_STYLE}
                    formatter={(v: number) => [`${Math.round(v)} min`, 'Avg Hold']}
                  />
                  <Bar dataKey="minutes" radius={[4, 4, 0, 0]}>
                    {holdByOutcome.map((d, i) => (
                      <Cell key={i} fill={i === 0 ? GREEN : RED} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : <EmptyState />}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function avgMinutes(ts: Trade[]): number {
  if (!ts.length) return 0;
  return (
    ts.reduce(
      (s, t) =>
        t.exitDate
          ? s + (new Date(t.exitDate).getTime() - new Date(t.entryDate).getTime()) / 60_000
          : s,
      0
    ) / ts.length
  );
}
