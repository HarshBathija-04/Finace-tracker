import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  PiggyBank,
  Sparkles,
  ScanLine,
  Repeat,
  ShieldCheck,
  ArrowRight,
  PlayCircle,
} from "lucide-react";
import { useAuth } from "../context/auth";
import { useToast } from "../context/toast";
import { Button, buttonClass, Logo } from "../components/ui";

const FEATURES = [
  {
    icon: LayoutDashboard,
    title: "Your month at a glance",
    body: "Balance, income, expenses and savings rate up top, with a six-month cash-flow view underneath.",
  },
  {
    icon: PiggyBank,
    title: "Budgets that warn you",
    body: "Set an overall limit and per-category caps. Alerts arrive at 80% and again if you go over.",
  },
  {
    icon: Sparkles,
    title: "AI spending insights",
    body: "A Groq-hosted model reads your monthly totals, never your notes, and tells you what changed.",
  },
  {
    icon: ScanLine,
    title: "Scan a receipt",
    body: "Snap a bill and the vision model fills in amount, date and category for you to confirm.",
  },
  {
    icon: Repeat,
    title: "Recurring, handled",
    body: "Rent, salary and subscriptions repeat on schedule. Pause or stop them any time.",
  },
  {
    icon: ShieldCheck,
    title: "Private by design",
    body: "Hashed passwords, per-user data isolation and money stored as exact integers, never floats.",
  },
];

const PREVIEW_BARS = [
  [62, 41],
  [70, 48],
  [66, 44],
  [72, 52],
  [69, 47],
  [64, 33],
];

function ProductPreview() {
  return (
    <div className="relative" aria-hidden="true">
      <div className="absolute -inset-6 -z-10 rounded-[2rem] bg-brand-soft/70 blur-2xl" />
      <div className="rounded-3xl border border-line bg-surface p-4 shadow-pop sm:p-5">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-brand p-4 text-on-brand">
            <p className="text-xs opacity-80">Balance</p>
            <p className="num mt-1 font-display text-2xl sm:text-3xl">₹1,94,822</p>
          </div>
          <div className="rounded-2xl border border-line p-4">
            <p className="text-xs text-muted">Savings rate</p>
            <p className="num mt-1 font-display text-2xl text-income sm:text-3xl">51.8%</p>
          </div>
        </div>
        <div className="mt-4 rounded-2xl border border-line p-4">
          <div className="flex items-center justify-between text-xs text-muted">
            <span className="font-medium text-ink">Cash flow</span>
            <span>Jun to Nov</span>
          </div>
          <div className="mt-4 flex h-28 items-end justify-between gap-2">
            {PREVIEW_BARS.map(([inc, exp], i) => (
              <div key={i} className="flex h-full flex-1 items-end justify-center gap-1">
                <span className="w-2.5 rounded-t bg-income sm:w-3" style={{ height: `${inc + 30}%` }} />
                <span className="w-2.5 rounded-t bg-expense sm:w-3" style={{ height: `${exp + 20}%` }} />
              </div>
            ))}
          </div>
        </div>
        <div className="mt-4 flex gap-3 rounded-2xl border border-line p-4">
          <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand">
            <Sparkles className="size-4" />
          </span>
          <div>
            <p className="text-sm font-medium">Expenses fell 30% from last month</p>
            <p className="mt-0.5 text-xs text-muted">
              Shopping and food drove most of the drop. Your savings goal is already met.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Landing() {
  const { demo, status } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    document.title = "FinSight · Personal finance tracker with AI insights";
  }, []);

  const tryDemo = async () => {
    setBusy(true);
    try {
      await demo();
      navigate("/dashboard");
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setBusy(false);
    }
  };

  const signedIn = status === "authenticated";

  return (
    <div className="overflow-x-clip">
      <header className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Logo />
        <nav aria-label="Account" className="flex items-center gap-2">
          {signedIn ? (
            <Link to="/dashboard" className={buttonClass("primary", "sm")}>
              Open dashboard
            </Link>
          ) : (
            <>
              <Link to="/login" className={buttonClass("ghost", "sm")}>
                Sign in
              </Link>
              <Link to="/register" className={buttonClass("primary", "sm")}>
                Get started
              </Link>
            </>
          )}
        </nav>
      </header>

      <main>
        <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 pt-10 pb-20 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:pt-20">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-xs font-medium text-muted">
              <Sparkles className="size-3.5 text-brand" aria-hidden="true" /> AI insights powered by Groq
            </p>
            <h1 className="mt-5 font-display text-5xl leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl">
              Know where every rupee <em className="text-brand">actually</em> goes.
            </h1>
            <p className="mt-5 max-w-lg text-lg text-muted">
              FinSight turns everyday income and spending into a clear monthly picture, with budgets that warn you early
              and insights you can act on.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button size="lg" loading={busy} onClick={tryDemo}>
                {!busy && <PlayCircle className="size-5" aria-hidden="true" />}
                Try the live demo
              </Button>
              <Link to="/register" className={buttonClass("secondary", "lg")}>
                Create a free account <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </div>
            <p className="mt-4 text-sm text-muted">
              The demo opens a sample account with six months of data. No sign-up needed.
            </p>
          </div>
          <ProductPreview />
        </section>

        <section aria-labelledby="features-title" className="border-t border-line bg-surface">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
            <h2 id="features-title" className="max-w-xl font-display text-4xl tracking-tight">
              Everything a monthly money check-in needs. Nothing it doesn't.
            </h2>
            <ul className="mt-12 grid gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map(({ icon: Icon, title, body }) => (
                <li key={title}>
                  <span className="grid size-10 place-items-center rounded-xl bg-brand-soft text-brand">
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <h3 className="mt-4 font-semibold">{title}</h3>
                  <p className="mt-1.5 text-muted">{body}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-20 text-center sm:px-6">
          <h2 className="font-display text-4xl tracking-tight">See your own month in two minutes.</h2>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link to="/register" className={buttonClass("primary", "lg")}>
              Create a free account
            </Link>
            <Button size="lg" variant="secondary" loading={busy} onClick={tryDemo}>
              Explore the demo
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-8 text-sm text-muted sm:flex-row sm:px-6">
          <Logo />
          <p>
            Built by{" "}
            <a
              href="https://github.com/HarshBathija-04"
              className="font-medium text-ink hover:underline"
              rel="noopener noreferrer"
              target="_blank"
            >
              Harsh Bathija
            </a>{" "}
            · React, Express, PostgreSQL and Groq
          </p>
        </div>
      </footer>
    </div>
  );
}
