import { useEffect, useState } from "react";
import { tradeService, Trade } from "@/src/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from "recharts";
import { format, parseISO, getDay } from "date-fns";

export function Analytics() {
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

  // 1. PnL by Day of Week
  const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const pnlByDay = daysOfWeek.map(day => ({ day, pnl: 0 }));
  
  closedTrades.forEach(t => {
    if (t.exitDate) {
      const dayIndex = getDay(parseISO(t.exitDate));
      pnlByDay[dayIndex].pnl += t.pnl || 0;
    }
  });
  
  // Filter out weekend if 0
  const activeDays = pnlByDay.filter(d => d.pnl !== 0 || (d.day !== "Sunday" && d.day !== "Saturday"));

  // 2. Win Rate by Setup
  const setupStats: Record<string, { wins: number; total: number }> = {};
  closedTrades.forEach(t => {
    t.setups.forEach(setup => {
      if (!setupStats[setup]) setupStats[setup] = { wins: 0, total: 0 };
      setupStats[setup].total += 1;
      if ((t.pnl || 0) > 0) setupStats[setup].wins += 1;
    });
  });

  const setupData = Object.keys(setupStats).map(setup => ({
    name: setup,
    winRate: (setupStats[setup].wins / setupStats[setup].total) * 100,
    total: setupStats[setup].total
  })).sort((a, b) => b.total - a.total);

  // 3. Long vs Short Performance
  const sideStats = {
    LONG: { pnl: 0, count: 0 },
    SHORT: { pnl: 0, count: 0 }
  };
  
  closedTrades.forEach(t => {
    sideStats[t.side].pnl += t.pnl || 0;
    sideStats[t.side].count += 1;
  });

  const sideData = [
    { name: 'LONG', value: sideStats.LONG.pnl, count: sideStats.LONG.count },
    { name: 'SHORT', value: sideStats.SHORT.pnl, count: sideStats.SHORT.count }
  ];

  const COLORS = ['#10b981', '#f43f5e'];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground mt-2">Deep dive into your trading performance.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>PnL by Day of Week</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            {activeDays.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={activeDays}>
                  <XAxis dataKey="day" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                  <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }} />
                  <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                    {activeDays.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? 'hsl(var(--primary))' : 'hsl(var(--destructive))'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">No data available</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Win Rate by Setup (%)</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            {setupData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={setupData} layout="vertical" margin={{ left: 20 }}>
                  <XAxis type="number" domain={[0, 100]} stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis dataKey="name" type="category" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }} />
                  <Bar dataKey="winRate" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">No data available</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Long vs Short PnL</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            {sideData.some(d => d.value !== 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sideData}>
                  <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                  <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {sideData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.value >= 0 ? 'hsl(var(--primary))' : 'hsl(var(--destructive))'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">No data available</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
