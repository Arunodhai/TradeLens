import { useState, useEffect } from 'react';
import { tradeService, reviewService, Trade, WeeklyReview } from '@/src/db';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Sparkles, Loader2, ChevronDown, CheckCircle2, AlertCircle, Lightbulb, TrendingUp } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { format, subDays, parseISO, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { calcWinRate, calcProfitFactor, calcDisciplineScore, calcSetupStats, calcMistakeStats } from '@/src/lib/calculations';

function ReviewCard({ review }: { review: WeeklyReview }) {
  const [open, setOpen] = useState(false);
  const pnlColor = review.totalPnl >= 0 ? 'text-emerald-500' : 'text-rose-500';

  return (
    <Card className="overflow-hidden">
      <button
        className="w-full text-left"
        onClick={() => setOpen((o) => !o)}
      >
        <CardHeader className="flex flex-row items-center justify-between py-4">
          <div>
            <CardTitle className="text-sm font-medium">
              {format(parseISO(review.periodStart), 'MMM dd')} –{' '}
              {format(parseISO(review.periodEnd), 'MMM dd, yyyy')}
            </CardTitle>
            <div className="flex items-center space-x-3 mt-1">
              <span className={`text-xs font-medium ${pnlColor}`}>
                {review.totalPnl >= 0 ? '+' : ''}${review.totalPnl.toFixed(2)}
              </span>
              <span className="text-xs text-muted-foreground">{review.totalTrades} trades</span>
              <span className="text-xs text-muted-foreground">{review.winRate.toFixed(0)}% WR</span>
            </div>
          </div>
          <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
        </CardHeader>
      </button>

      {open && (
        <CardContent className="pt-0 space-y-5 border-t border-border">
          <div>
            <p className="text-sm text-muted-foreground leading-relaxed mt-4">{review.summary}</p>
          </div>

          {review.strengths.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-emerald-500 uppercase tracking-wider mb-2 flex items-center space-x-1">
                <TrendingUp className="h-3 w-3" /><span>Strengths</span>
              </p>
              <ul className="space-y-1.5">
                {review.strengths.map((s, i) => (
                  <li key={i} className="flex items-start space-x-2 text-sm">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {review.weaknesses.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-rose-500 uppercase tracking-wider mb-2 flex items-center space-x-1">
                <AlertCircle className="h-3 w-3" /><span>Areas to Improve</span>
              </p>
              <ul className="space-y-1.5">
                {review.weaknesses.map((w, i) => (
                  <li key={i} className="flex items-start space-x-2 text-sm">
                    <AlertCircle className="h-3.5 w-3.5 text-rose-500 mt-0.5 flex-shrink-0" />
                    <span>{w}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {review.actionItems.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-amber-500 uppercase tracking-wider mb-2 flex items-center space-x-1">
                <Lightbulb className="h-3 w-3" /><span>Action Steps</span>
              </p>
              <ol className="space-y-1.5">
                {review.actionItems.map((a, i) => (
                  <li key={i} className="flex items-start space-x-2 text-sm">
                    <span className="text-amber-500 font-bold text-xs mt-0.5 w-4 flex-shrink-0">{i + 1}.</span>
                    <span>{a}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

export function AIReview() {
  const [trades, setTrades] = useState<Trade[] | null>(null);
  const [reviews, setReviews] = useState<WeeklyReview[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const today = new Date().toISOString().slice(0, 10);
  const weekAgo = subDays(new Date(), 7).toISOString().slice(0, 10);
  const [dateFrom, setDateFrom] = useState(weekAgo);
  const [dateTo, setDateTo] = useState(today);

  useEffect(() => {
    const u1 = tradeService.subscribeToTrades(setTrades, console.error);
    const u2 = reviewService.subscribeToReviews(setReviews, console.error);
    return () => { u1(); u2(); };
  }, []);

  const periodTrades = (trades ?? []).filter((t) => {
    if (t.status !== 'CLOSED' || !t.exitDate) return false;
    return isWithinInterval(parseISO(t.exitDate), {
      start: startOfDay(parseISO(dateFrom)),
      end: endOfDay(parseISO(dateTo)),
    });
  });

  async function generateReview() {
    if (!periodTrades.length) return;
    setLoading(true);
    setError('');

    try {
      const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

      const stats = {
        totalTrades: periodTrades.length,
        totalPnl: periodTrades.reduce((s, t) => s + (t.pnl ?? 0), 0),
        winRate: calcWinRate(periodTrades),
        profitFactor: calcProfitFactor(periodTrades),
        disciplineScore: calcDisciplineScore(periodTrades),
        topSetups: calcSetupStats(periodTrades).slice(0, 3),
        topMistakes: calcMistakeStats(periodTrades).slice(0, 3),
      };

      const sampleNotes = periodTrades
        .filter((t) => t.notes?.trim())
        .slice(0, 5)
        .map((t) => `[${t.symbol} ${t.side}]: ${t.notes}`);

      const prompt = `You are an expert trading performance coach. Analyze this trader's recent performance data and provide structured, actionable feedback.

IMPORTANT RULES:
- Do NOT give financial advice or recommend specific assets to trade
- Do NOT predict future market movements
- Focus ONLY on behavioral patterns and historical performance
- Use a coaching tone: direct, constructive, and practical
- Be concise — each point should be 1-2 sentences max

PERFORMANCE DATA (${dateFrom} to ${dateTo}):
${JSON.stringify(stats, null, 2)}

${sampleNotes.length ? `SAMPLE TRADE NOTES:\n${sampleNotes.join('\n')}` : ''}

Respond ONLY with valid JSON in this exact format (no markdown, no code blocks):
{
  "summary": "2-3 sentence overview of the week's performance",
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "weaknesses": ["weakness 1", "weakness 2", "weakness 3"],
  "actionItems": ["specific action step 1", "specific action step 2", "specific action step 3"]
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-1.5-flash',
        contents: prompt,
      });

      const text = response.text ?? '';
      // Strip markdown code blocks if present
      const jsonText = text.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(jsonText);

      const review: Omit<WeeklyReview, 'id'> = {
        periodStart: new Date(dateFrom).toISOString(),
        periodEnd: new Date(dateTo).toISOString(),
        summary: parsed.summary ?? '',
        strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
        weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses : [],
        actionItems: Array.isArray(parsed.actionItems) ? parsed.actionItems : [],
        totalTrades: stats.totalTrades,
        winRate: stats.winRate,
        totalPnl: stats.totalPnl,
      };

      await reviewService.saveReview(review);
    } catch (err: any) {
      console.error(err);
      setError('Failed to generate review. Check your Gemini API key or try again.');
    } finally {
      setLoading(false);
    }
  }

  if (!trades) {
    return <div className="flex items-center justify-center h-64 text-muted-foreground">Loading…</div>;
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">AI Performance Review</h1>
        <p className="text-muted-foreground mt-1">
          AI-powered coaching based on your trade history.
        </p>
      </div>

      {/* Generate panel */}
      <Card>
        <CardHeader><CardTitle>Generate New Review</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-3">
            <div className="space-y-1 flex-1">
              <label className="text-xs text-muted-foreground">From</label>
              <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            </div>
            <div className="space-y-1 flex-1">
              <label className="text-xs text-muted-foreground">To</label>
              <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {periodTrades.length} closed trade{periodTrades.length !== 1 ? 's' : ''} in this period
            </p>
            <Button onClick={generateReview} disabled={loading || periodTrades.length === 0}>
              {loading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Generating…</>
              ) : (
                <><Sparkles className="mr-2 h-4 w-4" />Generate Review</>
              )}
            </Button>
          </div>

          {error && (
            <div className="text-sm text-rose-500 bg-rose-500/10 p-3 rounded-md">{error}</div>
          )}
          {periodTrades.length === 0 && trades.length > 0 && (
            <p className="text-xs text-muted-foreground">
              No closed trades in this date range. Adjust the dates or log more trades.
            </p>
          )}
          {trades.length === 0 && (
            <p className="text-xs text-muted-foreground">
              Log some trades first to generate a review.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Previous reviews */}
      {reviews.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Previous Reviews</h2>
          {reviews.map((r) => (
            <ReviewCard key={r.id} review={r} />
          ))}
        </div>
      )}

      {reviews.length === 0 && !loading && (
        <div className="text-center py-12 border border-dashed border-border rounded-xl text-muted-foreground">
          <Sparkles className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No reviews yet</p>
          <p className="text-sm mt-1">Generate your first weekly review above.</p>
        </div>
      )}
    </div>
  );
}
