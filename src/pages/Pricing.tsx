import { Link } from 'react-router-dom';
import { Button } from '@/src/components/ui/button';
import { useAuth } from '@/src/AuthContext';
import { CheckCircle2, LineChart, ArrowRight } from 'lucide-react';

const PLANS = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'Perfect for getting started and testing your process.',
    cta: 'Get started free',
    href: '/login?mode=signup',
    highlight: false,
    features: [
      '50 trades per month',
      'Core trade journal',
      'Setup & mistake tagging',
      'Basic dashboard metrics',
      '7-day AI performance review',
      'Community support',
    ],
  },
  {
    name: 'Pro',
    price: '$19',
    period: 'per month',
    description: 'For serious traders who want the full picture.',
    cta: 'Start Pro',
    href: '/login?mode=signup',
    highlight: true,
    features: [
      'Unlimited trades',
      'Full analytics suite',
      'Discipline score & trend',
      'Weekly AI coaching review',
      'Screenshot upload',
      'Symbol & setup breakdown',
      'Mistake cost analysis',
      'Priority support',
    ],
  },
];

const FAQ = [
  {
    q: 'Is there a free trial for Pro?',
    a: 'Pro features are currently in development. Start with the Free plan — your data will carry over.',
  },
  {
    q: 'What markets are supported?',
    a: 'TradeLens supports any discretionary market: stocks, ETFs, crypto, forex, futures, and options.',
  },
  {
    q: 'Can I export my trade data?',
    a: 'CSV export is on the roadmap. Your data is yours — always.',
  },
  {
    q: 'Is my trading data private?',
    a: "Yes. Your trades are stored under your account and never shared. We don't sell data.",
  },
];

export function Pricing() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <header className="border-b border-border/50 sticky top-0 z-10 bg-background/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <LineChart className="h-5 w-5 text-primary" />
            <span className="font-bold text-lg tracking-tight">TradeLens</span>
          </Link>
          <div className="flex items-center space-x-4">
            {user ? (
              <Button size="sm" asChild>
                <Link to="/app">Go to App <ArrowRight className="ml-1 h-3 w-3" /></Link>
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
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-8 text-center">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
          Simple, honest pricing.
        </h1>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto">
          Start free. Upgrade when you're ready. No surprise fees.
        </p>
      </section>

      {/* Plans */}
      <section className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`bg-card rounded-xl p-8 flex flex-col ${
                plan.highlight
                  ? 'border-2 border-primary shadow-lg shadow-primary/10 relative'
                  : 'border border-border'
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-semibold px-4 py-1 rounded-full">
                  Most popular
                </div>
              )}
              <div className="mb-6">
                <p className="text-sm font-medium text-muted-foreground mb-2">{plan.name}</p>
                <div className="flex items-end space-x-1 mb-1">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground text-sm pb-1">/{plan.period}</span>
                </div>
                <p className="text-sm text-muted-foreground">{plan.description}</p>
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start space-x-2.5 text-sm">
                    <CheckCircle2
                      className={`h-4 w-4 mt-0.5 flex-shrink-0 ${
                        plan.highlight ? 'text-primary' : 'text-emerald-500'
                      }`}
                    />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <Button
                className="w-full"
                variant={plan.highlight ? 'default' : 'outline'}
                asChild
              >
                <Link to={user ? '/app' : plan.href}>{user ? 'Go to App' : plan.cta}</Link>
              </Button>
            </div>
          ))}
        </div>
      </section>

      {/* Subscription status note */}
      <section className="max-w-6xl mx-auto px-6 pb-8">
        <div className="max-w-3xl mx-auto bg-card/50 border border-border rounded-xl p-6 text-center">
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Note:</span> Pro billing is coming soon.
            All features are currently available to explore while we finalize the payment system.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-border/50 bg-card/30">
        <div className="max-w-3xl mx-auto px-6 py-20">
          <h2 className="text-2xl font-bold text-center mb-12">Frequently asked questions</h2>
          <div className="space-y-8">
            {FAQ.map((item) => (
              <div key={item.q}>
                <p className="font-medium mb-2">{item.q}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border/50 max-w-6xl mx-auto px-6 py-20 text-center">
        <h2 className="text-3xl font-bold mb-4">Ready to trade smarter?</h2>
        <p className="text-muted-foreground mb-8">Start for free. No credit card required.</p>
        <Button size="lg" asChild>
          <Link to={user ? '/app' : '/login?mode=signup'}>
            {user ? 'Go to Dashboard' : 'Create free account'}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </section>
    </div>
  );
}
