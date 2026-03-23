# CLAUDE.md

## Project
TradeLens

## One-line summary
TradeLens is a trader journal and performance analytics SaaS for retail discretionary traders. It helps users log trades, analyze setups and mistakes, review discipline, and get AI-powered weekly insights.

---

## Product vision
This is **not** a stock tracker, brokerage, or live trading terminal.

TradeLens is a **performance intelligence platform for traders**.

The goal is to help a trader answer:
- What setups actually work for me?
- Which mistakes are costing me the most money?
- When do I perform best and worst?
- Am I trading with discipline?
- What should I improve next week?

The UX should feel like a serious fintech SaaS:
- clean
- data-dense
- modern
- dark-first
- professional
- minimal visual noise

Think:
- modern fintech dashboard
- polished analytics product
- fast, responsive, high-signal UI

---

## Target user
Primary target:
- retail discretionary traders
- day traders
- swing traders
- prop-firm aspirants
- serious beginners who already track or review trades manually

Do not optimize for:
- institutional users
- brokers
- social trading
- copy trading
- automated algorithmic systems

---

## MVP goal
Build a working SaaS MVP where a user can:
1. create an account
2. log trades manually
3. tag each trade with setups, mistakes, and emotions
4. upload a screenshot for a trade
5. view journal history
6. view analytics and performance metrics
7. receive an AI-generated weekly review
8. manage their own data securely

---

## In scope for MVP
### Auth
- email/password or magic link auth
- protected app routes
- each user can only access their own data

### Core trade logging
Users can create/edit/delete trades with:
- symbol
- market
- side (long/short)
- entry price
- exit price
- quantity
- stop loss
- take profit
- fees
- entry datetime
- exit datetime
- notes
- screenshot
- tags

### Tagging
Users can assign tags to a trade in 3 categories:
- setup
- mistake
- emotion

Examples:
- setup: breakout, pullback, reversal, trend continuation
- mistake: revenge trade, entered early, exited early, ignored stop
- emotion: confident, fearful, impulsive, patient

### Journal
- paginated or infinite-scroll trade list
- filters by symbol, side, setup, mistake, date range
- sortable columns
- clickable trade detail page
- edit and delete actions

### Dashboard
Show high-level metrics:
- total P&L
- total trades
- win rate
- average winner
- average loser
- profit factor
- average risk/reward
- best day
- worst day
- current streak
- setup performance summary
- mistake cost summary

### Analytics page
Visual analytics for:
- P&L over time
- win rate by setup
- performance by weekday
- long vs short
- symbol performance
- average hold time
- mistake frequency
- discipline score trend

### Weekly AI review
For a selected week or rolling last 7 days:
- summarize performance
- highlight best-performing setup
- identify biggest mistake pattern
- provide 3 concrete improvement suggestions

### Settings
- profile
- timezone
- preferred currency
- weekly review preferences
- tag management

### Billing placeholder
- pricing page
- subscription status field in DB
- UI can show Free/Pro states
- actual Stripe integration can be scaffolded but not required for MVP unless time permits

---

## Explicitly out of scope for MVP
Do NOT build these unless explicitly asked later:
- live stock market streaming data
- broker API imports
- social/community features
- public profiles
- trade copying
- backtesting engine
- options Greeks engine
- portfolio aggregation across brokers
- mobile native app
- notifications infrastructure
- advanced tax reporting
- AI chat assistant
- team / org multi-user collaboration

---

## Tech stack
Use exactly this stack unless there is a strong reason not to.

### Frontend / app
- Next.js (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui

### Backend
- Next.js server actions and route handlers where appropriate

### Database
- PostgreSQL
- Prisma ORM

### Validation
- Zod

### Auth
- Clerk or Auth.js
Prefer Auth.js if simpler to keep project self-contained.

### File uploads
- UploadThing or S3-compatible storage abstraction
If upload integration becomes a blocker, stub file upload with a clean interface.

### Charts
- Recharts

### AI
- OpenAI API
Used only for weekly review generation.

### State/data patterns
- prefer server components where possible
- use client components only where needed for interactivity
- avoid Redux unless absolutely necessary
- use URL search params for filter state where practical

### Tooling
- pnpm
- ESLint
- Prettier

### Testing
- Vitest for calculation/unit tests
- Playwright for critical end-to-end flows if feasible

---

## Design direction
### Visual style
- dark-first
- professional fintech SaaS
- sharp typography
- subtle borders
- muted surfaces
- restrained color palette
- use color intentionally for gains/losses and states

### Mood
- serious
- trustworthy
- high-signal
- not playful
- not crypto-casino
- not overly glossy

### UI references
Take inspiration from:
- modern analytics dashboards
- trading journals
- financial admin panels
- Bloomberg-lite density, but much more modern and approachable

### Layout principles
- dashboard should feel immediately useful
- prioritize clarity over decoration
- tables should be excellent
- analytics cards should be scannable
- forms should be simple and efficient
- mobile should work, but desktop is primary

### UX principles
- quick trade entry
- fast filtering
- obvious performance insights
- concise copy
- empty states should teach the user what to do next

---

## App information architecture
Build these pages/routes:

### Public
- `/`
  - landing page
  - hero
  - features
  - pricing
  - CTA
- `/pricing`
- `/login`
- `/signup`

### Authenticated app
- `/app`
  - dashboard
- `/app/trades`
  - journal list
- `/app/trades/new`
  - create trade form
- `/app/trades/[id]`
  - trade detail
- `/app/trades/[id]/edit`
- `/app/analytics`
- `/app/reviews`
- `/app/settings`

---

## User flows

### Flow 1: New user onboarding
1. user signs up
2. user is redirected into app
3. empty state explains how TradeLens works
4. CTA to add first trade
5. optional starter tags seeded automatically

### Flow 2: Add trade
1. user opens new trade page
2. fills core fields
3. assigns setup/mistake/emotion tags
4. uploads screenshot
5. submits form
6. trade is saved
7. dashboard and analytics reflect it

### Flow 3: Review trade history
1. user opens journal
2. filters by date/setup/symbol
3. clicks a trade row
4. sees full trade details, notes, screenshot, metrics

### Flow 4: Weekly review
1. user opens reviews page
2. selects or defaults to last 7 days
3. app computes metrics
4. app sends structured summary request to AI
5. result shows:
   - summary
   - strengths
   - mistakes
   - action steps

---

## Data model
Implement a clean Prisma schema based on the following entities.

### User
Fields:
- id
- name
- email
- password hash or auth provider identifiers
- timezone
- currency
- subscriptionTier
- createdAt
- updatedAt

### Trade
Fields:
- id
- userId
- symbol
- market
- side
- entryPrice
- exitPrice
- quantity
- stopLoss
- takeProfit
- fees
- entryTime
- exitTime
- notes
- screenshotUrl
- createdAt
- updatedAt

Derived/calculated values should NOT all be stored permanently unless useful for indexing/caching:
- pnl
- pnlPercent
- holdDuration
- riskReward
- outcome

### Tag
Fields:
- id
- userId
- name
- type
- createdAt

Where type is enum:
- SETUP
- MISTAKE
- EMOTION

### TradeTag
Join table:
- id
- tradeId
- tagId

### WeeklyReview
Fields:
- id
- userId
- periodStart
- periodEnd
- summary
- strengths
- weaknesses
- actionItems
- createdAt

### Optional: UserRule
Fields:
- id
- userId
- text
- createdAt

Not required for MVP unless helpful for later extensibility.

---

## Business rules
These rules matter and should be implemented correctly.

### Trade ownership
- users can only read/write/delete their own trades, tags, and reviews

### Times
- store all timestamps in UTC
- convert to user timezone in UI

### Money/calculation precision
- do not use unsafe floating-point patterns for important finance calculations
- use careful numeric handling
- be consistent in rounding for display only
- store numeric fields appropriately in DB

### P&L
For MVP assume a simple formula:
- for LONG: `(exitPrice - entryPrice) * quantity - fees`
- for SHORT: `(entryPrice - exitPrice) * quantity - fees`

### P&L percent
Use a clear formula and keep it consistent.
Suggested:
- `pnl / (entryPrice * quantity) * 100`
If a better denominator is used, document it clearly.

### Outcome
- WIN if pnl > 0
- LOSS if pnl < 0
- BREAKEVEN if pnl == 0

### Hold duration
- exitTime - entryTime
- display human-readable values

### Risk/reward
Compute only if stop loss is provided and valid.
If unavailable, show `N/A`.

### Tag ownership
- users can only use their own tags
- seed default tags per new user if useful

### Delete behavior
Use hard delete for MVP unless soft delete is clearly needed.

---

## Default seeded tags
Seed these tags for each new user or on first app load.

### Setup tags
- Breakout
- Pullback
- Reversal
- Trend Continuation
- Support/Resistance
- News Trade

### Mistake tags
- Entered Early
- Exited Early
- Revenge Trade
- Oversized Position
- Ignored Stop Loss
- Broke Plan

### Emotion tags
- Confident
- Fearful
- Impulsive
- Patient
- Hesitant
- Disciplined

---

## Metrics to implement
These should power the dashboard and analytics.

### Core metrics
- total trades
- total P&L
- win rate
- average winner
- average loser
- best trade
- worst trade
- best day
- worst day
- current streak
- longest win streak
- longest loss streak

### Advanced but still MVP-friendly
- profit factor
- expectancy
- average hold time
- performance by symbol
- performance by setup
- performance by weekday
- long vs short performance
- mistake frequency
- cost of mistakes by tag

### Discipline score
Implement a simple initial version.
Suggested:
- start at 100 for a trade
- subtract penalty points for each mistake tag
- aggregate average across a period

This does not need to be perfect. Keep it explainable.

---

## AI weekly review requirements
The AI feature must be useful, structured, and constrained.

### Input
Generate weekly review from:
- weekly summary stats
- top setups
- worst setups
- frequent mistakes
- notable trade notes if available

### Output format
Store structured output, not just a blob.

Need:
- summary
- strengths (array)
- weaknesses (array)
- actionItems (array of 3)

### Prompting behavior
- do not provide financial advice
- do not predict markets
- focus only on behavioral and historical performance patterns
- use a coaching tone
- be concise and practical

### Example voice
Good:
- “Your pullback setups outperformed other strategies this week.”
- “Most losses were associated with early entries and oversized positions.”
- “Consider reducing size during the first 30 minutes of market open.”

Bad:
- “Buy stronger momentum names next week.”
- “You should trade options instead.”
- “This setup will probably win again.”

### Safety
The AI must not present investment advice or guarantees.
Frame everything as reflective performance coaching based on the user’s historical records.

---

## Landing page messaging
Build a polished landing page.

### Positioning headline ideas
Use one strong variant like:
- “Review better. Trade better.”
- “Your edge, quantified.”
- “Turn trade history into performance insight.”

### Supporting copy
TradeLens helps traders log trades, identify costly mistakes, analyze setups, and improve performance with data and AI-powered weekly reviews.

### Sections
- hero
- problem
- feature highlights
- analytics preview
- weekly review preview
- pricing
- CTA footer

---

## Component requirements
Create reusable components where appropriate.

### Likely components
- app shell / sidebar
- top nav
- metric cards
- analytics charts
- trades table
- trade form
- tag selector
- screenshot uploader
- review card
- empty states
- filter bar

### Tables
Trades table should be a strong UX surface.
Needs:
- sorting
- filtering
- responsive behavior
- good typography
- clear P&L display
- clickable rows

---

## Engineering rules
### Code quality
- favor readability over cleverness
- strongly type everything
- keep functions small and composable
- avoid premature abstraction
- document non-obvious business logic

### Form handling
- use Zod schemas
- server-side validation required
- client-side validation for UX is a plus

### Error handling
- include empty, loading, and error states
- do not leave broken or ambiguous states

### Security
- enforce auth on all protected routes
- validate ownership for all mutations and queries
- never trust client-sent user IDs

### Performance
- dashboard and journal should feel fast
- prefer server-side data loading
- paginate where necessary

---

## Testing requirements
At minimum, add tests for:
- P&L calculation
- outcome classification
- hold duration calculation
- risk/reward calculation
- streak calculations
- profit factor / expectancy helpers if implemented

If possible, add end-to-end coverage for:
- signup/login
- add trade
- edit trade
- delete trade
- generate weekly review

Do not mark implementation complete if core calculation logic is untested.

---

## Definition of done
The MVP is complete when:

### Auth
- users can sign up and log in
- protected routes work
- user data is isolated

### Trade management
- user can create, edit, delete, and view trades
- validation works
- screenshot upload path works or is cleanly stubbed
- tags work correctly

### Journal
- user can browse trades
- filters and sorting work
- detail page works

### Dashboard + analytics
- dashboard metrics display correctly
- analytics charts render real data
- empty states are clean

### AI review
- weekly review can be generated from user data
- output is structured and stored
- UI presents the review clearly

### Quality
- app is responsive
- dark mode looks polished
- lint passes
- core tests pass
- no obvious placeholder junk in production UI

---

## Implementation order
Build in this order unless there is a better dependency-aware path.

### Phase 1: foundation
1. initialize Next.js app
2. set up Tailwind + shadcn/ui
3. set up Prisma + PostgreSQL
4. set up auth
5. create app shell and route structure

### Phase 2: trade system
6. implement Prisma models and migrations
7. seed default tags
8. build create trade flow
9. build journal list
10. build trade detail and edit flow
11. add delete action

### Phase 3: metrics and analytics
12. implement calculation utilities
13. build dashboard cards
14. build analytics charts and breakdowns

### Phase 4: AI review
15. build weekly aggregation pipeline
16. integrate OpenAI review generation
17. store structured reviews
18. build reviews UI

### Phase 5: polish
19. improve empty states
20. improve responsive layout
21. add settings page
22. refine landing page
23. add tests
24. final polish

---

## Things to avoid
- do not overbuild architecture
- do not introduce microservices
- do not add websocket/live market complexity
- do not build a huge design system from scratch
- do not overcomplicate permissions beyond per-user isolation
- do not add fake complexity just to look advanced

---

## Suggested example seed trades
If demo data is useful, create realistic sample trades for a demo/dev account with:
- both wins and losses
- multiple symbols
- both long and short
- different setups
- different mistake tags
- varied hold durations

This helps make analytics pages look real during development.

---

## Expected output from you
Please implement the MVP incrementally with production-quality code.

When working:
- keep changes focused
- explain major decisions briefly
- create clean commits if operating in commit-oriented mode
- call out blockers early
- do not silently change scope

If something is ambiguous, prefer the simplest solution that matches the product vision.

The most important priorities are:
1. correctness of trading calculations
2. clean, serious UX
3. maintainable code
4. a believable SaaS product feel

End goal:
A polished, portfolio-worthy MVP of TradeLens that looks and feels like a real fintech SaaS product.