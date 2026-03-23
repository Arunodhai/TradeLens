import { useState, useEffect } from "react";
import { tradeService, Trade } from "@/src/db";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Card, CardContent } from "@/src/components/ui/card";
import { Badge } from "@/src/components/ui/badge";
import { format, parseISO } from "date-fns";
import { Plus, Search, Filter, ArrowRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

export function Journal() {
  const [search, setSearch] = useState("");
  const [sideFilter, setSideFilter] = useState<"ALL" | "LONG" | "SHORT">("ALL");
  const [trades, setTrades] = useState<Trade[] | null>(null);
  const navigate = useNavigate();
  
  useEffect(() => {
    const unsubscribe = tradeService.subscribeToTrades(
      (data) => setTrades(data),
      (error) => console.error(error)
    );
    return () => unsubscribe();
  }, []);

  if (!trades) return <div>Loading...</div>;

  const filteredTrades = trades.filter(t => {
    const matchesSearch = t.symbol.toLowerCase().includes(search.toLowerCase()) ||
      t.setups.some(s => s.toLowerCase().includes(search.toLowerCase())) ||
      t.mistakes.some(m => m.toLowerCase().includes(search.toLowerCase()));
    
    const matchesSide = sideFilter === "ALL" || t.side === sideFilter;

    return matchesSearch && matchesSide;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Trade Journal</h1>
          <p className="text-muted-foreground mt-2">Log and review your manual trades.</p>
        </div>
        <Button onClick={() => navigate("/trade/new")}>
          <Plus className="mr-2 h-4 w-4" /> Log Trade
        </Button>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search symbol, setup, mistake..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          value={sideFilter}
          onChange={(e) => setSideFilter(e.target.value as any)}
          className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <option value="ALL">All Sides</option>
          <option value="LONG">Long Only</option>
          <option value="SHORT">Short Only</option>
        </select>
      </div>

      <div className="grid gap-4">
        {filteredTrades?.map((trade) => (
          <Card key={trade.id} className="hover:bg-accent/50 transition-colors cursor-pointer" onClick={() => navigate(`/trade/${trade.id}`)}>
            <CardContent className="p-6 flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <div className="flex flex-col items-center justify-center w-16">
                  <span className={`text-lg font-bold ${trade.side === 'LONG' ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {trade.side}
                  </span>
                  <span className="text-xs text-muted-foreground font-mono">{trade.symbol}</span>
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-center space-x-2 text-sm">
                    <span className="text-muted-foreground">Entry:</span>
                    <span className="font-mono">${trade.entryPrice.toFixed(2)}</span>
                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                    <span className="text-muted-foreground">Exit:</span>
                    <span className="font-mono">{trade.exitPrice ? `$${trade.exitPrice.toFixed(2)}` : 'OPEN'}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                    <span>{format(parseISO(trade.entryDate), "MMM dd, yyyy HH:mm")}</span>
                    {trade.exitDate && (
                      <>
                        <span>-</span>
                        <span>{format(parseISO(trade.exitDate), "MMM dd, yyyy HH:mm")}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="hidden md:flex items-center space-x-2">
                  {trade.setups.slice(0, 2).map(setup => (
                    <Badge key={setup} variant="secondary" className="text-xs">{setup}</Badge>
                  ))}
                  {trade.mistakes.slice(0, 1).map(mistake => (
                    <Badge key={mistake} variant="destructive" className="text-xs">{mistake}</Badge>
                  ))}
                </div>
              </div>

              <div className="flex items-center space-x-4">
                {trade.status === 'CLOSED' ? (
                  <div className={`text-lg font-bold text-right ${trade.pnl! >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {trade.pnl! >= 0 ? '+' : ''}${trade.pnl?.toFixed(2)}
                  </div>
                ) : (
                  <Badge variant="outline" className="text-amber-500 border-amber-500/50">OPEN</Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        {filteredTrades?.length === 0 && (
          <div className="text-center py-12 text-muted-foreground border border-dashed rounded-lg">
            No trades found. Start logging!
          </div>
        )}
      </div>
    </div>
  );
}
