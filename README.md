# FinSight

**A personal finance tracker that shows where your month went: budgets that warn you early, a clear dashboard, and AI spending insights generated from your own totals.**

| | |
| --- | --- |
| Live app (Vercel) | `https://<your-vercel-project>.vercel.app` _(placeholder)_ |
| API (Render) | `https://finsight-api.onrender.com/health` _(placeholder)_ |
| Demo | Click **Try the live demo** on the landing page. It opens a seeded account with six months of sample data, so you don't need to sign up. |

> The API runs on Render's free tier. If nobody has used it for a while, the first request can take 30 to 60 seconds while the server wakes up, and the app shows a "waking up the server" banner during that wait.

## Features

- **Dashboard**: balance, monthly income, expenses and savings rate, each compared with last month. It also shows a six-month cash-flow chart, a spending-by-category donut, budget progress and recent transactions.
- **Transactions**: a searchable table with filters for type, category, date range and recurring-only. Filters stay in the URL. Totals are shown for the filtered set, and you get pagination, add, edit and delete.
- **Budgets**: one monthly limit, a savings goal, and per-category caps. Spend is computed live from transactions. You get an alert at 80% and another when you go over (deduplicated, so you see each one once per month).
- **AI spending insights** (Groq `openai/gpt-oss-120b`): 3 to 4 actionable insights per month. The model receives **only aggregated totals**: no notes, names or individual transactions.
- **Receipt scanning** (Groq vision `qwen/qwen3.8-27b`): upload a photo and the form fills itself in for you to review before saving. Images are processed in memory and never stored.
- **Recurring transactions**: daily, weekly or monthly templates that the scheduler copies forward without creating duplicates. You can pause, resume or stop them.
- **Notifications** for budget alerts, plus profile, currency and alert settings.
- Accessible, responsive UI (down to 375 px) with light and dark themes, skeleton/empty/error states and toasts.

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
  A -->|pg, search_path=finance_tracker| P[(Render PostgreSQL<br/>shared DB, own schema)]
  A -->|aggregates only| G[Groq API<br/>gpt-oss-120b / qwen vision]
  K[GitHub Actions<br/>keep-alive every 10 min] -->|GET /health| A
```

- The frontend is a static SPA. It never calls Groq directly; every AI call goes through the API.
- The API is stateless JWT auth (HS256, bcrypt-hashed passwords). Every query is scoped to the user in the token.
- Money is stored as integer **minor units** (`BIGINT` paise/cents) and travels through the API as `amountMinor` integers. Only the UI divides by 100, and only for display.

## Tech stack

| Layer | Tools |
| --- | --- |
| Frontend | React 19, Vite 7, Tailwind CSS 4, React Router 7, Recharts, lucide-react |
| Backend | Node 22, Express 5, pg, zod, helmet, express-rate-limit, multer, bcryptjs, jsonwebtoken |
| AI | groq-sdk (`openai/gpt-oss-120b` text, `qwen/qwen3.8-27b` vision) |
| Data | PostgreSQL 16 (SQL migrations, idempotent seed) |
| Quality | Vitest, Supertest, ESLint, Prettier, GitHub Actions CI |

## Local setup

Prerequisites: Node 20 or newer and a PostgreSQL database. Any local Postgres works; this project defaults to `postgresql://postgres:postgres@localhost:5433/portfolio`.

```bash
# API
cd server
cp .env.example .env          # then set JWT_SECRET, and GROQ_API_KEY to enable AI features
npm install
npm run migrate               # creates schema finance_tracker and its tables
npm run seed                  # demo account with 6 months of data (safe to re-run)
npm run dev                   # http://localhost:5122

# Web (second terminal)
cd client
cp .env.example .env          # VITE_API_URL=http://localhost:5122
npm install
npm run dev                   # http://localhost:5211
```

Tests and checks:

```bash
cd server && npm run lint && npm test     # uses a throwaway schema finance_tracker_test
cd client && npm run lint && npm test && npm run build
```

## Environment variables

### API (`server/.env`)

| Variable | Required | Description |
| --- | --- | --- |
| `DATABASE_URL` | yes | Postgres connection string. On Render, use the shared database's **internal** URL. |
| `DB_SCHEMA` | no (`finance_tracker`) | Schema holding this app's tables. Several apps share one database, each in its own schema. |
| `JWT_SECRET` | yes in production | Signing secret for access tokens. The Blueprint generates it. |
| `JWT_EXPIRES_IN` | no (`7d`) | Token lifetime. |
| `FRONTEND_URL` | yes in production | Comma-separated allowed CORS origins, e.g. `https://finsight.vercel.app`. |
| `GROQ_API_KEY` | for AI features | Groq key. Without it, insights and receipt scanning return a friendly 503. |
| `GROQ_TEXT_MODEL` / `GROQ_VISION_MODEL` | no | Override the default models. |
| `DEMO_ENABLED` | no (`true`) | Set to `false` to turn off one-click demo sign-in. |
| `PORT` | no (`5122`) | Render sets this automatically. |
| `DATABASE_SSL_NO_VERIFY` | no | Only if connecting through an external URL whose certificate can't be verified. |

### Web (`client/.env`)

| Variable | Description |
| --- | --- |
| `VITE_API_URL` | Base URL of the API, without a trailing slash. |

## Deployment

### 1. Database (once, shared)

Create one **Render PostgreSQL** instance by hand (the free plan allows one per account) and copy its **Internal Database URL**. Migrations create the `finance_tracker` schema themselves and never touch other schemas.

### 2. API on Render

1. In Render, go to **New > Blueprint** and select this repository. Render reads `render.yaml` and creates the `finsight-api` web service (`rootDir: server`, health check `/health`).
2. Fill in the prompted secrets: `DATABASE_URL` (the shared DB's internal URL), `FRONTEND_URL` (your Vercel URL) and `GROQ_API_KEY`. `JWT_SECRET` is generated for you.
3. Each start runs `migrate` and `seed`, which are both idempotent, before starting the server.

### 3. Web on Vercel

1. In Vercel, go to **Add New > Project**, import the repository, and set **Root Directory** to `client`. The Vite framework preset is detected automatically.
2. Add the environment variable `VITE_API_URL=https://<your-render-service>.onrender.com`.
3. Deploy. `vercel.json` handles SPA rewrites and adds security and caching headers.
4. Put the final Vercel URL back into the API's `FRONTEND_URL`.

### 4. Keep-alive

Under **GitHub > Settings > Secrets and variables > Actions > Variables**, add a repository variable `BACKEND_URL=https://<your-render-service>.onrender.com`. The `keep-alive` workflow pings `/health` every 10 minutes, which also runs `SELECT 1` against the database. If the variable is unset, the workflow skips with a notice.

## API overview

All routes except auth and health need `Authorization: Bearer <token>`. Errors always look like `{ "error": { "code", "message", "details?" } }`.

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/health` | `{"status":"ok","db":"ok"}`, or 503 if the DB is down |
| POST | `/api/auth/register`, `/api/auth/login`, `/api/auth/demo` | Returns `{ user, token }` (rate limited) |
| GET/PUT | `/api/user/me` | Profile, currency, alert setting, password change |
| GET/POST | `/api/transactions` | List with filters (`type, category, from, to, q, recurring, sort, page, pageSize`) / create |
| PUT/DELETE | `/api/transactions/:id` | Update / delete your own transaction |
| PATCH | `/api/transactions/:id/recurring` | `{ status: active, paused or cancelled }` |
| POST | `/api/transactions/scan-receipt` | multipart `receipt` image, returns a draft (AI, rate limited) |
| GET/PUT/DELETE | `/api/budgets/:year/:month` | Budget with live progress / upsert / remove |
| GET | `/api/reports/summary?year&month` | Totals, by-category, daily series, budget |
| GET | `/api/reports/trend?year&month&months` | Monthly income and expense series |
| GET | `/api/reports/insights?year&month` | Groq insights (cached 30 min, rate limited) |
| GET/PATCH/POST/DELETE | `/api/notifications...` | List, mark read, mark all read, clear |

## Project structure

```
.
├── client/                  React SPA (Vercel)
│   ├── public/              favicon, OG image, robots.txt
│   ├── src/
│   │   ├── components/      AppShell, ui primitives, charts, finance widgets, forms
│   │   ├── context/         auth + toast providers
│   │   ├── lib/             api client, money/date formatting, categories, useApi
│   │   └── pages/           Landing, Auth, Dashboard, Transactions, Budgets, Reports, Settings
│   └── vercel.json
├── server/                  Express API (Render)
│   ├── migrations/          SQL migrations (schema-scoped)
│   ├── src/
│   │   ├── routes/          auth, transactions, budgets, reports, notifications
│   │   ├── services/        ai (Groq), budgets + alerts, recurring scheduler
│   │   ├── app.js           middleware, routes, /health
│   │   ├── migrate.js       migration runner
│   │   └── seed.js          idempotent demo data
│   └── test/                vitest unit + supertest API tests
├── docs/screenshots/
├── render.yaml              Render Blueprint (API only; DB is shared)
└── .github/workflows/       ci.yml, keep-alive.yml
```

## Developer

Built by **Harsh Bathija** ([@HarshBathija-04](https://github.com/HarshBathija-04)).
