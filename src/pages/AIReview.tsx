import { useState, useEffect } from "react";
import { tradeService, Trade } from "@/src/db";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Sparkles, Loader2 } from "lucide-react";
import { GoogleGenAI } from "@google/genai";

export function AIReview() {
  const [review, setReview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [trades, setTrades] = useState<Trade[] | null>(null);

  useEffect(() => {
    const unsubscribe = tradeService.subscribeToTrades(
      (data) => setTrades(data),
      (error) => console.error(error)
    );
    return () => unsubscribe();
  }, []);

  const generateReview = async () => {
    if (!trades || trades.length === 0) return;
    setLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const closedTrades = trades.filter(t => t.status === 'CLOSED');
      const recentTrades = closedTrades.slice(-20); // Analyze last 20 trades
      
      const prompt = `
        You are an expert trading psychologist and performance coach.
        Analyze the following recent trades for a retail discretionary trader.
        Focus on performance intelligence, identifying strengths, repeated errors (mistakes), and suggest practical improvement steps.
        DO NOT give financial advice or recommend specific assets.
        
        Recent Trades Data:
        ${JSON.stringify(recentTrades.map(t => ({
          symbol: t.symbol,
          side: t.side,
          pnl: t.pnl,
          setups: t.setups,
          mistakes: t.mistakes,
          emotions: t.emotions,
          notes: t.notes
        })), null, 2)}
        
        Format your response in Markdown with clear headings:
        - Performance Summary
        - Strengths
        - Areas for Improvement (Mistakes)
        - Actionable Steps for Next Week
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: prompt,
      });

      setReview(response.text || "No review generated.");
    } catch (error) {
      console.error("Failed to generate review", error);
      setReview("Failed to generate review. Please check your API key or try again later.");
    } finally {
      setLoading(false);
    }
  };

  if (!trades) return <div>Loading...</div>;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI Performance Review</h1>
          <p className="text-muted-foreground mt-2">Weekly insights powered by Gemini.</p>
        </div>
        <Button onClick={generateReview} disabled={loading || !trades?.length}>
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
          Generate Review
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Weekly Insights</CardTitle>
        </CardHeader>
        <CardContent>
          {review ? (
            <div className="prose prose-invert max-w-none">
              {review.split('\n').map((line, i) => (
                <p key={i} className="mb-2">{line}</p>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              {trades?.length === 0 
                ? "Log some trades first to get an AI review." 
                : "Click 'Generate Review' to analyze your recent trading performance."}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
