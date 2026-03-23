import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/src/AuthContext';
import { Button } from '@/src/components/ui/button';
import {
  LineChart,
  BarChart2,
  Tag,
  Sparkles,
  TrendingUp,
  BookOpen,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';

const FEATURES = [
  {
    icon: BookOpen,
    title: 'Trade Journal',
    desc: 'Log every trade with full context — entry, exit, setups, mistakes, and emotions. Never trade blind again.',
  },
  {
    icon: Tag,
    title: 'Smart Tagging',
    desc: 'Tag trades with setups, mistakes, and emotional states. Discover what patterns actually drive your results.',
  },
  {
    icon: BarChart2,
    title: 'Performance Analytics',
    desc: 'Win rate by setup, P&L by weekday, symbol performance, discipline scores — data that moves the needle.',
  },
  {
    icon: Sparkles,
    title: 'AI Weekly Review',
    desc: 'Get an AI coaching summary each week: your strengths, biggest mistake patterns, and 3 concrete action steps.',
  },
];

const FREE_FEATURES = ['50 trades / month', 'Core analytics', 'Basic tagging', '7-day AI review'];
const PRO_FEATURES = [
  'Unlimited trades',
  'Full analytics suite',
  'Discipline score tracking',
  'Weekly AI coaching review',
  'Screenshot upload',
  'Priority support',
];

export function Landing() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <header className="border-b border-border/50 sticky top-0 z-10 bg-background/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <LineChart className="h-5 w-5 text-primary" />
            <span className="font-bold text-lg tracking-tight">TradeLens</span>
          </div>
          <nav className="flex items-center space-x-4">
            <Link to="/pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Pricing
            </Link>
            {user ? (
              <Button size="sm" onClick={() => navigate('/app')}>
                Go to App <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/login">Log in</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link to="/login?mode=signup">Get started free</Link>
                </Button>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-24 pb-20 text-center">
        <div className="inline-flex items-center space-x-2 bg-primary/10 text-primary text-xs font-medium px-3 py-1 rounded-full mb-8">
          <Sparkles className="h-3 w-3" />
          <span>AI-powered weekly coaching reviews</span>
        </div>
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-tight">
          Your edge,
          <br />
          <span className="text-primary">quantified.</span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
          TradeLens helps discretionary traders log trades, identify costly patterns, analyze setups,
          and improve performance with data and AI-powered weekly reviews.
        </p>
        <div className="flex items-center justify-center space-x-4">
          <Button size="lg" asChild>
            <Link to={user ? '/app' : '/login?mode=signup'}>
              {user ? 'Go to Dashboard' : 'Start for free'}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link to="/pricing">See pricing</Link>
          </Button>
        </div>
      </section>

      {/* Problem */}
      <section className="border-t border-border/50 bg-card/30">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-4">
              The problem
            </p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-6">
              Most traders lose because they don't review systematically.
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Gut feel, memory, and rough spreadsheets can't tell you which setups actually print or
              which emotional states are costing you real money. TradeLens turns your raw trade history
              into honest performance intelligence.
            </p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest text-center mb-4">
          Features
        </p>
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-center mb-14">
          Everything you need to improve.
        </h2>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="bg-card border border-border rounded-xl p-6 hover:border-primary/50 transition-colors"
            >
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <f.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Analytics preview */}
      <section className="border-t border-border/50 bg-card/30">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-4">
                Analytics
              </p>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-6">
                Know exactly what's working.
              </h2>
              <ul className="space-y-3 text-muted-foreground">
                {[
                  'Win rate by setup and symbol',
                  'P&L performance by day of week',
                  'Long vs short performance split',
                  'Mistake frequency and total cost',
                  'Discipline score trend over time',
                  'Average hold time by outcome',
                ].map((item) => (
                  <li key={item} className="flex items-center space-x-3">
                    <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                    <span className="text-sm">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-card border border-border rounded-xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Win Rate by Setup</span>
                <TrendingUp className="h-4 w-4 text-primary" />
              </div>
              {[
                { label: 'Breakout', pct: 72 },
                { label: 'Pullback', pct: 61 },
                { label: 'Trend Continuation', pct: 58 },
                { label: 'Reversal', pct: 41 },
              ].map((row) => (
                <div key={row.label}>
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>{row.label}</span>
                    <span>{row.pct}%</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full">
                    <div
                      className="h-1.5 bg-primary rounded-full"
                      style={{ width: `${row.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing preview */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest text-center mb-4">
          Pricing
        </p>
        <h2 className="text-3xl font-bold tracking-tight text-center mb-14">
          Simple, honest pricing.
        </h2>
        <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
          {/* Free */}
          <div className="bg-card border border-border rounded-xl p-8">
            <p className="text-sm font-medium text-muted-foreground mb-2">Free</p>
            <p className="text-4xl font-bold mb-1">$0</p>
            <p className="text-xs text-muted-foreground mb-6">Forever free</p>
            <ul className="space-y-2 mb-8">
              {FREE_FEATURES.map((f) => (
                <li key={f} className="flex items-center space-x-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <Button variant="outline" className="w-full" asChild>
              <Link to="/login?mode=signup">Get started</Link>
            </Button>
          </div>
          {/* Pro */}
          <div className="bg-card border-2 border-primary rounded-xl p-8 relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
              Most popular
            </div>
            <p className="text-sm font-medium text-muted-foreground mb-2">Pro</p>
            <p className="text-4xl font-bold mb-1">$19</p>
            <p className="text-xs text-muted-foreground mb-6">per month</p>
            <ul className="space-y-2 mb-8">
              {PRO_FEATURES.map((f) => (
                <li key={f} className="flex items-center space-x-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <Button className="w-full" asChild>
              <Link to="/pricing">View Pro</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* CTA footer */}
      <section className="border-t border-border/50 bg-card/30">
        <div className="max-w-6xl mx-auto px-6 py-20 text-center">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            Start journaling today.
          </h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Review better. Trade better. Your first 50 trades are free — no credit card required.
          </p>
          <Button size="lg" asChild>
            <Link to={user ? '/app' : '/login?mode=signup'}>
              Create free account <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      <footer className="border-t border-border/50 py-8">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center space-x-2">
            <LineChart className="h-4 w-4" />
            <span>TradeLens</span>
          </div>
          <div className="flex items-center space-x-4">
            <Link to="/pricing" className="hover:text-foreground transition-colors">Pricing</Link>
            <Link to="/login" className="hover:text-foreground transition-colors">Login</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
