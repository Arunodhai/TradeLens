import { useEffect, useState } from 'react';
import { tradeService, Trade } from '@/src/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { format, parseISO } from 'date-fns';
import {
  Activity, TrendingUp, TrendingDown, Target, Zap, Calendar,
  Award, AlertCircle, Flame, BarChart2,
} from 'lucide-react';
import {
  calcWinRate, calcProfitFactor, calcExpectancy, calcCurrentStreak,
  calcLongestStreak, calcBestDay, calcWorstDay, calcAvgRiskReward,
  calcDisciplineScore, calcSetupStats, calcMistakeStats,
} from '@/src/lib/calculations';
import { useNavigate } from 'react-router-dom';

function MetricCard({
  title, value, sub, icon: Icon, colorClass,
}: {
  title: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
  colorClass?: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${colorClass ?? ''}`}>{value}</div>
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </CardContent>
    </Card>
  );
}

export function Dashboard() {
  const [trades, setTrades] = useState<Trade[] | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const unsub = tradeService.subscribeToTrades(setTrades, console.error);
    return unsub;
  }, []);

  if (!trades) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        Loading…
      </div>
    );
  }

  const closed = trades.filter((t) => t.status === 'CLOSED' && t.pnl !== undefined);
  const totalPnl = closed.reduce((s, t) => s + (t.pnl ?? 0), 0);
  const winRate = calcWinRate(trades);
  const profitFactor = calcProfitFactor(trades);
  const expectancy = calcExpectancy(trades);
  const avgRR = calcAvgRiskReward(trades);
  const disciplineScore = calcDisciplineScore(trades);
  const streak = calcCurrentStreak(trades);
  const longestWin = calcLongestStreak(trades, 'WIN');
  const bestDay = calcBestDay(trades);
  const worstDay = calcWorstDay(trades);
  const setupStats = calcSetupStats(trades).slice(0, 5);
  const mistakeStats = calcMistakeStats(trades).slice(0, 5);

  const wins = closed.filter((t) => (t.pnl ?? 0) > 0);
  const losses = closed.filter((t) => (t.pnl ?? 0) <= 0);
  const avgWin = wins.length ? wins.reduce((s, t) => s + t.pnl!, 0) / wins.length : 0;
  const avgLoss = losses.length ? Math.abs(losses.reduce((s, t) => s + t.pnl!, 0)) / losses.length : 0;
  const bestTrade = closed.length ? Math.max(...closed.map((t) => t.pnl ?? 0)) : 0;
  const worstTrade = closed.length ? Math.min(...closed.map((t) => t.pnl ?? 0)) : 0;

  // Cumulative P&L chart
  let cum = 0;
  const pnlData = [...closed]
    .sort((a, b) => new Date(a.exitDate!).getTime() - new Date(b.exitDate!).getTime())
    .map((t) => {
      cum += t.pnl ?? 0;
      return { date: format(parseISO(t.exitDate!), 'MMM dd'), pnl: cum };
    });

  const fmt$ = (n: number) =>
    (n >= 0 ? '+$' : '-$') + Math.abs(n).toFixed(2);
  const pnlColor = (n: number) => (n >= 0 ? 'text-emerald-500' : 'text-rose-500');

  if (trades.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-2">Performance intelligence overview.</p>
        </div>
        <div className="flex flex-col items-center justify-center border border-dashed border-border rounded-xl py-20 text-center space-y-4">
          <Activity className="h-12 w-12 text-muted-foreground/40" />
          <div>
            <p className="font-medium">No trades yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Log your first trade to see your performance dashboard.
            </p>
          </div>
          <button
            onClick={() => navigate('/app/trade/new')}
            className="text-sm text-primary hover:underline"
          >
            Log a trade →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-2">Performance intelligence overview.</p>
      </div>

      {/* Row 1: P&L summary */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Net P&L"
          value={fmt$(totalPnl)}
          sub={`${closed.length} closed trades`}
          icon={Activity}
          colorClass={pnlColor(totalPnl)}
        />
        <MetricCard
          title="Win Rate"
          value={`${winRate.toFixed(1)}%`}
          sub={`${wins.length}W / ${losses.length}L`}
          icon={Target}
        />
        <MetricCard
          title="Profit Factor"
          value={profitFactor === Infinity ? '∞' : profitFactor.toFixed(2)}
          icon={TrendingUp}
        />
        <MetricCard
          title="Expectancy"
          value={fmt$(expectancy)}
          sub="per trade"
          icon={BarChart2}
          colorClass={pnlColor(expectancy)}
        />
      </div>

      {/* Row 2 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Avg Winner"
          value={`$${avgWin.toFixed(2)}`}
          icon={TrendingUp}
          colorClass="text-emerald-500"
        />
        <MetricCard
          title="Avg Loser"
          value={`-$${avgLoss.toFixed(2)}`}
          icon={TrendingDown}
          colorClass="text-rose-500"
        />
        <MetricCard
          title="Avg Risk/Reward"
          value={avgRR > 0 ? `${avgRR.toFixed(2)}:1` : 'N/A'}
          icon={Zap}
        />
        <MetricCard
          title="Discipline Score"
          value={`${disciplineScore.toFixed(0)}/100`}
          icon={Award}
          colorClass={disciplineScore >= 80 ? 'text-emerald-500' : disciplineScore >= 60 ? 'text-amber-500' : 'text-rose-500'}
        />
      </div>

      {/* Row 3 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Best Trade"
          value={`+$${bestTrade.toFixed(2)}`}
          icon={TrendingUp}
          colorClass="text-emerald-500"
        />
        <MetricCard
          title="Worst Trade"
          value={`-$${Math.abs(worstTrade).toFixed(2)}`}
          icon={TrendingDown}
          colorClass="text-rose-500"
        />
        <MetricCard
          title="Best Day"
          value={bestDay ? fmt$(bestDay.pnl) : 'N/A'}
          sub={bestDay?.date}
          icon={Calendar}
          colorClass={bestDay ? pnlColor(bestDay.pnl) : ''}
        />
        <MetricCard
          title="Worst Day"
          value={worstDay ? fmt$(worstDay.pnl) : 'N/A'}
          sub={worstDay?.date}
          icon={Calendar}
          colorClass={worstDay ? pnlColor(worstDay.pnl) : ''}
        />
      </div>

      {/* Row 4: Streaks */}
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          title="Current Streak"
          value={streak.type === 'NONE' ? '—' : `${streak.count} ${streak.type === 'WIN' ? 'wins' : 'losses'}`}
          icon={Flame}
          colorClass={streak.type === 'WIN' ? 'text-emerald-500' : streak.type === 'LOSS' ? 'text-rose-500' : ''}
        />
        <MetricCard
          title="Longest Win Streak"
          value={`${longestWin} trades`}
          icon={Flame}
          colorClass="text-emerald-500"
        />
        <MetricCard
          title="Total Trades"
          value={String(trades.length)}
          sub={`${closed.length} closed · ${trades.length - closed.length} open`}
          icon={Activity}
        />
      </div>

      {/* Chart + recent trades */}
      <div className="grid gap-4 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Cumulative P&L</CardTitle>
          </CardHeader>
          <CardContent className="h-[280px]">
            {pnlData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={pnlData}>
                  <XAxis dataKey="date" stroke="#888" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis
                    stroke="#888"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `$${v}`}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
                    formatter={(v: number) => [`$${v.toFixed(2)}`, 'Cum. P&L']}
                  />
                  <Line type="monotone" dataKey="pnl" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                No closed trades yet.
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Recent Trades</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {closed.slice(0, 6).map((trade) => (
                <div key={trade.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-2 h-2 rounded-full ${trade.side === 'LONG' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                    <div>
                      <p className="text-sm font-medium">{trade.symbol}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(parseISO(trade.exitDate!), 'MMM dd')}
                      </p>
                    </div>
                  </div>
                  <span className={`text-sm font-medium ${pnlColor(trade.pnl ?? 0)}`}>
                    {fmt$(trade.pnl ?? 0)}
                  </span>
                </div>
              ))}
              {closed.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No closed trades.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Setup + Mistake summaries */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Setup Performance</CardTitle>
          </CardHeader>
          <CardContent>
            {setupStats.length > 0 ? (
              <div className="space-y-3">
                {setupStats.map((s) => (
                  <div key={s.name} className="flex items-center justify-between text-sm">
                    <div>
                      <span className="font-medium">{s.name}</span>
                      <span className="text-muted-foreground ml-2 text-xs">({s.total} trades)</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className={pnlColor(s.pnl)}>${Math.abs(s.pnl).toFixed(0)}</span>
                      <span className="text-muted-foreground text-xs">{s.winRate.toFixed(0)}% WR</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No setup data yet. Tag your trades.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 text-rose-500" />
              <span>Mistake Cost</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {mistakeStats.length > 0 ? (
              <div className="space-y-3">
                {mistakeStats.map((m) => (
                  <div key={m.name} className="flex items-center justify-between text-sm">
                    <div>
                      <span className="font-medium">{m.name}</span>
                      <span className="text-muted-foreground ml-2 text-xs">({m.count}×)</span>
                    </div>
                    <span className="text-rose-500">-${m.totalCost.toFixed(0)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No mistakes logged. Keep it up.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
