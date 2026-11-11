# FinSight

**A personal finance tracker that shows where your month went: budgets that warn you early, a clear dashboard, and AI insights built from your own totals.**

[![CI](https://github.com/HarshBathija-04/Finace-tracker/actions/workflows/ci.yml/badge.svg)](https://github.com/HarshBathija-04/Finace-tracker/actions/workflows/ci.yml)
![React 19](https://img.shields.io/badge/React-19-149eca)
![Express 5](https://img.shields.io/badge/Express-5-333)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791)

**Live demo:** `https://<your-vercel-project>.vercel.app` _(placeholder)_ · **API health:** `https://<your-render-service>.onrender.com/health` _(placeholder)_

Click **Try the live demo** on the landing page to open a seeded account with six months of sample data. You don't need to sign up.

> The API runs on Render's free tier. After a quiet spell, the first request can take 30 to 60 seconds while the server wakes up. The app shows a "Waking up the server" banner during that wait.

## Features

- **Dashboard**: balance, income, expenses and savings rate, each compared with last month. Below them sit a six-month cash-flow chart, a spending-by-category donut, budget progress and recent transactions.
- **Transactions**: search plus filters for type, category, date range and recurring-only. Filters are kept in the URL and totals cover the filtered set.
- **Budgets**: a monthly limit, a savings goal and per-category caps, all checked against live spend. You get one alert at 80% and another if you go over.
- **AI insights** (Groq `openai/gpt-oss-120b`): four short, specific insights per month. The model sees **aggregated totals only**. It never sees your notes, your name or individual transactions.
- **Receipt scanning** (Groq vision `qwen/qwen3.8-27b`): a photo fills in the form for you to check before saving. Images are processed in memory and never stored.
- **Recurring transactions**: daily, weekly or monthly. You can pause, resume or stop them.
- Responsive down to 375 px, light and dark themes, keyboard accessible, and loading, empty and error states on every screen.

## Screenshots

| Dashboard | Dark mode |
| --- | --- |
| ![Dashboard](docs/screenshots/dashboard.png) | ![Dashboard in dark mode](docs/screenshots/dashboard-dark.png) |
| **Transactions** | **Reports** |
| ![Transactions](docs/screenshots/transactions.png) | ![Reports](docs/screenshots/reports.png) |
| **Landing** | **Budgets (mobile)** |
| ![Landing page](docs/screenshots/landing.png) | ![Budgets on mobile](docs/screenshots/budgets-mobile.png) |

## Architecture

```mermaid
flowchart LR
  U[Browser] -->|HTTPS| V[Vercel<br/>React + Vite SPA]
  V -->|fetch + Bearer JWT| A[Render web service<br/>Express API]
  A -->|pg, search_path = DB_SCHEMA| P[(Shared PostgreSQL<br/>schema finance_tracker)]
  A -->|monthly aggregates only| G[Groq API<br/>text + vision models]
  K[GitHub Actions<br/>keep-alive, every 10 min] -->|GET /health| A
```

The SPA never calls Groq directly: every AI request goes through the API, which holds the key.

## Engineering highlights

- **Schema-per-app database.** Several portfolio apps share one Postgres instance. Each pool connection sets `search_path` to `DB_SCHEMA`, migrations create that schema themselves, and the name is checked against a strict identifier regex before it reaches any SQL.
- **Money as integers.** Amounts are `BIGINT` minor units (paise/cents) from the database to the API (`amountMinor`). Decimal input is parsed with string arithmetic, never float multiplication, and only the UI divides by 100.
- **Transaction-safe writes.** A budget upsert and its category limits are saved in one transaction, so a failure can't leave half a budget behind. Each migration is applied together with its bookkeeping row, and the demo reseed works the same way.
- **Idempotent background work.** Recurring copies rely on a partial unique index on `(recurring_parent_id, occurred_on)` with `ON CONFLICT DO NOTHING`, so the scheduler is safe to run again after a crash or restart. Budget alerts are deduplicated per month and threshold in the same way.
- **AI with guardrails.** The model receives only aggregated totals. Its JSON reply is validated with zod and cached for 30 minutes per user and month, and its requests have their own rate limit. Receipt output is normalised before the user reviews it.
- **Auth hardening.** bcrypt hashes, HS256 JWTs with a pinned algorithm, and the same response for a wrong password and an unknown email (both paths run a bcrypt compare). Auth and AI routes are rate limited, and the API sends helmet headers and only accepts origins on the CORS allowlist.
- **Built for a cold start.** If a request takes longer than 3.5 s, the client shows a wake-up banner. Requests time out after 90 s, and the keep-alive workflow pings `/health`, which also runs `SELECT 1` against the database.

## Tech stack

| Layer | Tools |
| --- | --- |
| Frontend | React 19, Vite 7, Tailwind CSS 4, React Router 7, Recharts, lucide-react |
| Backend | Node 22, Express 5, pg, zod, helmet, express-rate-limit, multer, bcryptjs, jsonwebtoken |
| AI | groq-sdk (`openai/gpt-oss-120b` for text, `qwen/qwen3.8-27b` for vision) |
| Data | PostgreSQL 16, plain SQL migrations, idempotent seed |
| Quality | Vitest, Supertest, ESLint, Prettier, GitHub Actions CI |

## Quick start

You need Node 20 or newer and a running PostgreSQL. The defaults expect `postgresql://postgres:postgres@localhost:5433/portfolio`.

```bash
# API: http://localhost:5122
cd server
cp .env.example .env     # set JWT_SECRET; add GROQ_API_KEY to enable AI features
npm install
npm run migrate          # creates schema finance_tracker and its tables
npm run seed             # demo account with six months of data (safe to re-run)
npm run dev

# Web, in a second terminal: http://localhost:5211
cd client
cp .env.example .env     # VITE_API_URL=http://localhost:5122
npm install
npm run dev
```

Checks (the same ones CI runs):

```bash
cd server && npm run lint && npm run format:check && npm test   # tests use a throwaway schema
cd client && npm run lint && npm run format:check && npm test && npm run build
```

## Environment variables

**API (`server/.env`)**

| Variable | Required | Default | Description |
| --- | --- | --- | --- |
| `DATABASE_URL` | yes | local URL above (dev only) | Postgres connection string. On Render, use the shared database's internal URL. |
| `DB_SCHEMA` | no | `finance_tracker` | Schema that holds this app's tables. Lowercase letters, digits and `_` only. |
| `JWT_SECRET` | in production | dev-only value | Signs access tokens. The Render Blueprint generates it. |
| `JWT_EXPIRES_IN` | no | `7d` | Token lifetime. |
| `FRONTEND_URL` | in production | `http://localhost:5211` | Allowed CORS origins, comma-separated. |
| `GROQ_API_KEY` | for AI | none | Without it, insights and receipt scanning return a friendly 503. |
| `GROQ_TEXT_MODEL`, `GROQ_VISION_MODEL` | no | see Tech stack | Override the models. |
| `DEMO_ENABLED` | no | `true` | Set to `false` to turn off one-click demo sign-in. |
| `PORT` | no | `5122` | Render sets this for you. |
| `DATABASE_SSL_NO_VERIFY` | no | `false` | Only needed for an external URL whose certificate can't be verified. |

**Web (`client/.env`)**

| Variable | Description |
| --- | --- |
| `VITE_API_URL` | API base URL, without a trailing slash. |

## Deploy

1. **Database (one-time setup, shared).** Use the shared Render PostgreSQL instance and copy its **Internal Database URL**. The migrations create this app's schema and never touch any other schema.
2. **API on Render.** Go to **New > Blueprint** and pick this repository. `render.yaml` creates `finsight-api` (`rootDir: server`, health check `/health`, `DB_SCHEMA=finance_tracker`). Fill in `DATABASE_URL` (the shared DB's internal URL), `FRONTEND_URL` and `GROQ_API_KEY`. `JWT_SECRET` is generated for you. Each start runs `migrate` and `seed`, both idempotent, before the server starts.
3. **Web on Vercel.** Go to **Add New > Project**, import the repo, set **Root Directory** to `client`, and add `VITE_API_URL=https://<your-render-service>.onrender.com`. `vercel.json` handles SPA rewrites and adds security and cache headers. Then put the final Vercel URL into the API's `FRONTEND_URL`.
4. **Keep-alive.** Under **Settings > Secrets and variables > Actions > Variables**, add the repository variable `BACKEND_URL=https://<your-render-service>.onrender.com`. `.github/workflows/keep-alive.yml` pings `/health` every 10 minutes. If the variable isn't set, the workflow skips with a notice.

## API at a glance

Every route except auth and health needs `Authorization: Bearer <token>`. Errors are always returned as `{ "error": { "code", "message", "details?" } }`.

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/health` | `{"status":"ok","db":"ok"}`, or 503 when the DB is down |
| POST | `/api/auth/register`, `/login`, `/demo` | Returns `{ user, token }` (rate limited) |
| GET, PUT | `/api/user/me` | Profile, currency, alert setting, password change |
| GET, POST | `/api/transactions` | List (`type, category, from, to, q, recurring, sort, page, pageSize`) or create |
| PUT, DELETE | `/api/transactions/:id` | Update or delete your own transaction |
| PATCH | `/api/transactions/:id/recurring` | `{ status: "active" \| "paused" \| "cancelled" }` |
| POST | `/api/transactions/scan-receipt` | Multipart `receipt` image in, draft transaction out (AI) |
| GET, PUT, DELETE | `/api/budgets/:year/:month` | Budget with live progress, upsert, remove |
| GET | `/api/reports/summary`, `/trend`, `/insights` | Monthly totals, multi-month trend, AI insights |
| GET, PATCH, POST, DELETE | `/api/notifications…` | List, mark read, mark all read, clear |

## Project structure

```
.
├── client/                 React SPA (Vercel)
│   ├── src/components/     AppShell, UI primitives, charts, finance widgets, transaction form
│   ├── src/context/        auth and toast providers
│   ├── src/lib/            API client, money and date formatting, categories, useApi
│   ├── src/pages/          Landing, Auth, Dashboard, Transactions, Budgets, Reports, Settings
│   └── vercel.json
├── server/                 Express API (Render)
│   ├── migrations/         SQL migrations
│   ├── src/routes/         auth, transactions, budgets, reports, notifications
│   ├── src/services/       Groq AI, budget progress and alerts, recurring scheduler
│   ├── src/{app,db,config,middleware,migrate,seed,server}.js
│   └── test/               unit and Supertest API tests
├── docs/screenshots/
├── render.yaml             Render Blueprint (API only; the database is shared)
└── .github/workflows/      ci.yml, keep-alive.yml
```

## Author

Built by **Harsh Bathija** ([@HarshBathija-04](https://github.com/HarshBathija-04)).
