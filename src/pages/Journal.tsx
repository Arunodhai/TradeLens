import { useState, useEffect } from 'react';
import { tradeService, Trade } from '@/src/db';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Card, CardContent } from '@/src/components/ui/card';
import { Badge } from '@/src/components/ui/badge';
import { format, parseISO, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { Plus, Search, ArrowRight, ArrowUp, ArrowDown, ChevronsUpDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type SortKey = 'entryDate' | 'symbol' | 'pnl' | 'side';
type SortDir = 'asc' | 'desc';

function SortButton({
  label, sortKey, current, dir, onClick,
}: {
  label: string;
  sortKey: SortKey;
  current: SortKey;
  dir: SortDir;
  onClick: (k: SortKey) => void;
}) {
  const active = current === sortKey;
  return (
    <button
      onClick={() => onClick(sortKey)}
      className="flex items-center space-x-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
    >
      <span>{label}</span>
      {active ? (
        dir === 'desc' ? <ArrowDown className="h-3 w-3" /> : <ArrowUp className="h-3 w-3" />
      ) : (
        <ChevronsUpDown className="h-3 w-3 opacity-40" />
      )}
    </button>
  );
}

export function Journal() {
  const [trades, setTrades] = useState<Trade[] | null>(null);
  const [search, setSearch] = useState('');
  const [sideFilter, setSideFilter] = useState<'ALL' | 'LONG' | 'SHORT'>('ALL');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('entryDate');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const navigate = useNavigate();

  useEffect(() => {
    const unsub = tradeService.subscribeToTrades(setTrades, console.error);
    return unsub;
  }, []);

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('desc'); }
  }

  if (!trades) {
    return <div className="flex items-center justify-center h-64 text-muted-foreground">Loading…</div>;
  }

  const filtered = trades
    .filter((t) => {
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        t.symbol.toLowerCase().includes(q) ||
        t.setups.some((s) => s.toLowerCase().includes(q)) ||
        t.mistakes.some((m) => m.toLowerCase().includes(q)) ||
        (t.market ?? '').toLowerCase().includes(q);
      const matchSide = sideFilter === 'ALL' || t.side === sideFilter;
      let matchDate = true;
      if (dateFrom || dateTo) {
        const tradeDate = parseISO(t.entryDate);
        const from = dateFrom ? startOfDay(parseISO(dateFrom)) : new Date(0);
        const to = dateTo ? endOfDay(parseISO(dateTo)) : new Date(8640000000000000);
        matchDate = isWithinInterval(tradeDate, { start: from, end: to });
      }
      return matchSearch && matchSide && matchDate;
    })
    .sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'entryDate') {
        cmp = new Date(a.entryDate).getTime() - new Date(b.entryDate).getTime();
      } else if (sortKey === 'symbol') {
        cmp = a.symbol.localeCompare(b.symbol);
      } else if (sortKey === 'pnl') {
        cmp = (a.pnl ?? 0) - (b.pnl ?? 0);
      } else if (sortKey === 'side') {
        cmp = a.side.localeCompare(b.side);
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Trade Journal</h1>
          <p className="text-muted-foreground mt-1">
            {filtered.length} trade{filtered.length !== 1 ? 's' : ''}
            {filtered.length !== trades.length && ` (filtered from ${trades.length})`}
          </p>
        </div>
        <Button onClick={() => navigate('/app/trade/new')}>
          <Plus className="mr-2 h-4 w-4" /> Log Trade
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[180px] max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search symbol, setup, mistake…"
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          value={sideFilter}
          onChange={(e) => setSideFilter(e.target.value as any)}
          className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="ALL">All Sides</option>
          <option value="LONG">Long</option>
          <option value="SHORT">Short</option>
        </select>
        <div className="flex items-center space-x-2">
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-36 text-sm"
            placeholder="From"
          />
          <span className="text-muted-foreground text-sm">—</span>
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-36 text-sm"
            placeholder="To"
          />
        </div>
        {(search || sideFilter !== 'ALL' || dateFrom || dateTo) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { setSearch(''); setSideFilter('ALL'); setDateFrom(''); setDateTo(''); }}
          >
            Clear filters
          </Button>
        )}
      </div>

      {/* Sort bar */}
      <div className="hidden md:flex items-center space-x-6 px-4 py-2 text-xs text-muted-foreground border-b border-border">
        <SortButton label="Date" sortKey="entryDate" current={sortKey} dir={sortDir} onClick={handleSort} />
        <SortButton label="Symbol" sortKey="symbol" current={sortKey} dir={sortDir} onClick={handleSort} />
        <SortButton label="Side" sortKey="side" current={sortKey} dir={sortDir} onClick={handleSort} />
        <div className="flex-1" />
        <SortButton label="P&L" sortKey="pnl" current={sortKey} dir={sortDir} onClick={handleSort} />
      </div>

      {/* Trade list */}
      <div className="space-y-2">
        {filtered.map((trade) => (
          <Card
            key={trade.id}
            className="hover:bg-accent/40 transition-colors cursor-pointer"
            onClick={() => navigate(`/app/trade/${trade.id}`)}
          >
            <CardContent className="p-5 flex items-center justify-between">
              <div className="flex items-center space-x-5">
                {/* Side + symbol */}
                <div className="flex flex-col items-center w-14">
                  <span className={`text-sm font-bold ${trade.side === 'LONG' ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {trade.side}
                  </span>
                  <span className="text-xs font-mono text-muted-foreground">{trade.symbol}</span>
                  {trade.market && (
                    <span className="text-[10px] text-muted-foreground/60">{trade.market}</span>
                  )}
                </div>

                {/* Prices + dates */}
                <div className="space-y-1">
                  <div className="flex items-center space-x-2 text-sm">
                    <span className="text-muted-foreground">Entry</span>
                    <span className="font-mono">${trade.entryPrice.toFixed(2)}</span>
                    {trade.exitPrice && (
                      <>
                        <ArrowRight className="h-3 w-3 text-muted-foreground" />
                        <span className="text-muted-foreground">Exit</span>
                        <span className="font-mono">${trade.exitPrice.toFixed(2)}</span>
                      </>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {format(parseISO(trade.entryDate), 'MMM dd, yyyy HH:mm')}
                    {trade.exitDate && ` → ${format(parseISO(trade.exitDate), 'MMM dd HH:mm')}`}
                  </p>
                </div>

                {/* Tags */}
                <div className="hidden md:flex items-center flex-wrap gap-1.5">
                  {trade.setups.slice(0, 2).map((s) => (
                    <Badge key={s} variant="secondary" className="text-[10px] bg-blue-500/10 text-blue-400 border-blue-500/20">
                      {s}
                    </Badge>
                  ))}
                  {trade.mistakes.slice(0, 1).map((m) => (
                    <Badge key={m} variant="destructive" className="text-[10px]">
                      {m}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* P&L */}
              <div className="text-right">
                {trade.status === 'CLOSED' ? (
                  <span className={`text-base font-bold ${(trade.pnl ?? 0) >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {(trade.pnl ?? 0) >= 0 ? '+' : ''}${trade.pnl?.toFixed(2)}
                  </span>
                ) : (
                  <Badge variant="outline" className="text-amber-500 border-amber-500/40">
                    OPEN
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-16 border border-dashed border-border rounded-xl text-muted-foreground">
            {trades.length === 0 ? (
              <div className="space-y-2">
                <p className="font-medium">No trades yet</p>
                <p className="text-sm">Start logging to build your journal.</p>
                <button onClick={() => navigate('/app/trade/new')} className="text-sm text-primary hover:underline mt-2">
                  Log your first trade →
                </button>
              </div>
            ) : (
              <p>No trades match your filters.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
