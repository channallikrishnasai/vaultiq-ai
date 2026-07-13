# VaultIQ AI — Architecture Documentation

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | Next.js (App Router) | 16.2.9 |
| Language | TypeScript (strict) | 5.x |
| UI | React 19 + shadcn/ui + Tailwind CSS 4 | 19.2.4 |
| Animations | Framer Motion 12 + Three.js 0.185 | framer-motion 12.40 |
| State (Client) | TanStack React Query 5 + Zustand | react-query 5.101.2 |
| State (Server) | Prisma ORM (direct queries) | 7.8.0 |
| Database | SQLite (dev) via better-sqlite3 | 12.10.0 |
| Auth | NextAuth v5 (JWT + Credentials + Google) | 5.0.0-beta.31 |
| Email | Resend | 6.17.1 |
| AI | Groq (primary), OpenAI, Gemini (factory pattern) | groq-sdk 1.3.0 |
| Chat Storage | Supabase PostgreSQL (separate from SQLite) | @supabase/supabase-js 2.110.0 |
| Forms | React Hook Form + Zod v4 | react-hook-form 7.78.0 |
| Testing | Jest 30 + ts-jest | jest 30.4.2 |

## Folder Structure

```
vaultiq-ai/
├── prisma/                     # Database schema, migrations, seed
├── src/
│   ├── app/                    # Next.js App Router pages & API routes
│   │   ├── api/                # 20+ API route groups (44 total endpoints)
│   │   ├── dashboard/          # Dashboard pages (16 sub-routes)
│   │   ├── sign-in/            # Authentication pages
│   │   └── onboarding/         # Multi-step onboarding wizard
│   ├── components/             # React components
│   │   ├── ui/                 # shadcn/ui primitives
│   │   ├── providers/          # Context providers (Session, Query, Theme, Toast)
│   │   ├── dashboard/          # Dashboard-specific components (43 files)
│   │   │   └── cards/          # Extracted card primitives (AnimatedNumber, Card)
│   │   ├── landing/            # Marketing page components
│   │   ├── orbit/              # 3D orbital card system
│   │   └── [feature]/          # Feature-specific components (expenses, goals, etc.)
│   ├── contexts/               # React contexts (Dashboard, Language, Orb, Scene)
│   ├── hooks/                  # Custom hooks (useDashboardData, useDashboardMutations)
│   ├── lib/                    # Core utilities (23 files)
│   │   ├── auth.ts             # NextAuth v5 config + requireAuth()
│   │   ├── env.ts              # Centralized Zod-validated environment
│   │   ├── logger.ts           # Centralized structured logger
│   │   ├── errors.ts           # Custom error classes
│   │   ├── api-handler.ts      # Centralized API error handler
│   │   ├── api-response.ts     # Standardized API responses
│   │   ├── rate-limit.ts       # In-memory rate limiting
│   │   ├── finance-utils.ts    # Net worth, savings rate calculations
│   │   ├── financial-health.ts # 6-factor health score algorithm
│   │   └── twin-utils.ts       # Financial projections & scenarios
│   ├── repositories/           # Data access layer (13 files)
│   ├── services/               # Business logic layer
│   │   ├── ai/                 # AI service (Mock/Groq/OpenAI factory)
│   │   │   └── analysis/       # 11 analysis sub-services
│   │   ├── dashboard/          # Dashboard aggregation service
│   │   ├── finance/            # Health score & analytics services
│   │   └── [feature]/          # Feature services (fraud, trading, etc.)
│   ├── types/                  # TypeScript type definitions
│   ├── validations/            # Zod schemas (16 files)
│   └── utils/                  # Formatting utilities
├── __tests__/                  # Jest unit tests
├── archive/                    # Archived/deprecated code
└── public/                     # Static assets
```

## Architecture Patterns

### Layered Architecture
```
API Routes → Services → Repositories → Prisma/Supabase
```

### Authentication Flow
1. NextAuth v5 middleware (`authorized` callback) gates all non-public routes
2. `requireAuth()` helper validates session in API routes (throws `UnauthorizedError`)
3. JWT strategy with 30-day session lifetime
4. Email verification required before login
5. Password reset with bcrypt-hashed tokens (1-hour expiry)

### API Standardization
- Every route uses `handleApiError()` for centralized error handling
- Responses use `successResponse()` / `errorResponse()` builders
- Input validation via Zod schemas on every endpoint
- Rate limiting on sensitive endpoints (chat, analysis, fraud, auth)

### Environment Validation
- Single typed env loader at `src/lib/env.ts`
- All env vars validated via Zod at startup
- Fail-fast on missing required variables
- No direct `process.env` access in application code

### Error Handling
- Custom error classes: `AppError`, `ValidationError`, `UnauthorizedError`, `NotFoundError`
- Centralized API error handler (`handleApiError`)
- Structured logging via `src/lib/logger.ts`
- No production console.log — all logging through logger utility

### Financial Calculations
- **Net Worth**: `savings + investments - debt` (finance-utils.ts)
- **Savings Rate**: `((income - expenses) / income) * 100` (finance-utils.ts)
- **Health Score**: 6-factor weighted average (financial-health.ts)
  - Savings Rate, Debt Management, Investments, Emergency Fund, Spending Control, Goal Planning
- **Projections**: Compound growth by risk appetite (twin-utils.ts)
- **Scenario Simulation**: Future value with extra monthly savings (twin-utils.ts)
- All calculations have single source of truth, no duplication

### Performance
- Heavy components (Three.js, recharts) loaded via `next/dynamic` with `ssr: false`
- Dashboard floating cards use `useMemo` for orbit/converge keyframes
- Card primitives extracted to shared components for reuse
- API routes have `Cache-Control: no-store` headers

### Database
- Prisma ORM with SQLite (dev) via better-sqlite3 adapter
- Comprehensive indexes on userId, composite keys (userId+date, userId+category)
- Transaction support for multi-table operations (onboarding)
- User-scoped queries prevent cross-user data access

## Security Headers
- Content-Security-Policy (frame-ancestors 'none', base-uri 'self', form-action 'self')
- Strict-Transport-Security (2-year max-age, includeSubDomains, preload)
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Referrer-Policy: strict-origin-when-cross-origin
- Permissions-Policy: denies camera, microphone, geolocation, interest-cohort
- Cross-Origin-Opener-Policy: same-origin
- Cross-Origin-Resource-Policy: same-origin
- X-XSS-Protection: 1; mode=block
- poweredByHeader: false (hides Next.js version)

## API Routes (44 endpoints)

### Authentication (7)
- POST /api/register — User registration
- GET/POST /api/auth/[...nextauth] — NextAuth handler
- POST /api/auth/forgot-password — Password reset initiation
- POST /api/auth/reset-password — Password reset completion
- GET/POST /api/auth/verify-email — Email verification
- POST /api/auth/resend-verification — Resend verification email
- POST /api/auth/email-status — Check email verification status

### Financial CRUD (10)
- GET/POST /api/expenses, GET/PATCH/DELETE /api/expenses/[id]
- GET/POST /api/incomes, GET/PATCH/DELETE /api/incomes/[id]
- GET/POST /api/budgets, GET/PATCH/DELETE /api/budgets/[id]
- GET/POST /api/bills, GET/PATCH/DELETE /api/bills/[id]
- GET/POST /api/goals, GET/PATCH/DELETE /api/goals/[id]

### Dashboard & Analytics (4)
- GET /api/dashboard/stats — Aggregated dashboard data
- GET /api/dashboard/intelligence — AI-powered insights
- GET /api/finance/health-score — Health score calculation
- GET /api/finance/analytics — Financial analytics

### AI Features (6)
- POST /api/chat — AI chat (SSE streaming)
- GET /api/reports — Financial reports
- GET/POST /api/financial-twin — Financial twin generation
- POST /api/finance/analysis — Full analysis / monthly report / simulation
- POST /api/roadmap/generate — AI roadmap generation
- POST /api/emergency/generate — AI emergency planning

### Trading (3)
- GET/POST /api/trading/portfolio
- POST /api/trading/trade
- GET/POST/DELETE /api/trading/watchlist

### Fraud (3)
- POST /api/fraud/analyze — Fraud pattern analysis
- POST /api/fraud/ocr — OCR text extraction
- GET /api/fraud/reports — Fraud report listing

### Other (7)
- GET/PATCH /api/user/profile
- DELETE /api/user/delete
- GET/POST /api/onboarding/status, POST /api/onboarding/complete
- GET /api/learning/courses, POST /api/learning/progress, POST /api/learning/quiz
- POST /api/platforms/compare
