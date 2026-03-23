import { useEffect, useState } from "react";
import { tradeService, Trade } from "@/src/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { format, parseISO } from "date-fns";
import { Activity, TrendingUp, TrendingDown, Target, AlertCircle } from "lucide-react";

export function Dashboard() {
  const [trades, setTrades] = useState<Trade[] | null>(null);

  useEffect(() => {
    const unsubscribe = tradeService.subscribeToTrades(
      (data) => setTrades(data),
      (error) => console.error(error)
    );
    return () => unsubscribe();
  }, []);

  if (!trades) return <div>Loading...</div>;

  const closedTrades = trades.filter((t) => t.status === "CLOSED" && t.pnl !== undefined && t.exitDate);
  
  const totalPnl = closedTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
  const winningTrades = closedTrades.filter((t) => (t.pnl || 0) > 0);
  const losingTrades = closedTrades.filter((t) => (t.pnl || 0) <= 0);
  
  const winRate = closedTrades.length > 0 ? (winningTrades.length / closedTrades.length) * 100 : 0;
  
  const grossProfit = winningTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
  const grossLoss = Math.abs(losingTrades.reduce((sum, t) => sum + (t.pnl || 0), 0));
  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0;

  const avgWin = winningTrades.length > 0 ? grossProfit / winningTrades.length : 0;
  const avgLoss = losingTrades.length > 0 ? grossLoss / losingTrades.length : 0;
  const expectancy = winRate > 0 ? (winRate / 100 * avgWin) - ((1 - winRate / 100) * avgLoss) : 0;

  const bestTrade = closedTrades.length > 0 ? Math.max(...closedTrades.map(t => t.pnl || 0)) : 0;
  const worstTrade = closedTrades.length > 0 ? Math.min(...closedTrades.map(t => t.pnl || 0)) : 0;

  // Cumulative PnL for chart
  let cumulative = 0;
  const pnlData = closedTrades
    .sort((a, b) => new Date(a.exitDate!).getTime() - new Date(b.exitDate!).getTime())
    .map((t) => {
      cumulative += t.pnl || 0;
      return {
        date: format(parseISO(t.exitDate!), "MMM dd"),
        pnl: cumulative,
        tradePnl: t.pnl || 0,
      };
    });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-2">Performance intelligence overview.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net P&L</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totalPnl >= 0 ? 'text-emerald-500' : 'text-destructive'}`}>
              ${totalPnl.toFixed(2)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{winRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {winningTrades.length}W / {losingTrades.length}L
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profit Factor</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{profitFactor === Infinity ? '∞' : profitFactor.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expectancy</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${expectancy >= 0 ? 'text-emerald-500' : 'text-destructive'}`}>
              ${expectancy.toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Win</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-500">${avgWin.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Loss</CardTitle>
            <TrendingDown className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">-${avgLoss.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Best Trade</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-500">${bestTrade.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Worst Trade</CardTitle>
            <TrendingDown className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">${worstTrade.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Cumulative P&L</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            {pnlData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={pnlData}>
                  <XAxis dataKey="date" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `$${value}`}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
                    itemStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  <Line type="monotone" dataKey="pnl" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                No closed trades yet.
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Recent Trades</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {closedTrades.slice(-5).reverse().map((trade) => (
                <div key={trade.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`w-2 h-2 rounded-full ${trade.side === 'LONG' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                    <div>
                      <p className="text-sm font-medium leading-none">{trade.symbol}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(parseISO(trade.exitDate!), "MMM dd, yyyy")}
                      </p>
                    </div>
                  </div>
                  <div className={`font-medium ${trade.pnl! >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {trade.pnl! >= 0 ? '+' : ''}${trade.pnl?.toFixed(2)}
                  </div>
                </div>
              ))}
              {closedTrades.length === 0 && (
                <div className="text-sm text-muted-foreground text-center py-4">No recent trades.</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
