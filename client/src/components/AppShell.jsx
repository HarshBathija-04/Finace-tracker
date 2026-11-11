import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  ArrowLeftRight,
  PiggyBank,
  ChartPie,
  Settings,
  Plus,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from "lucide-react";
import { useAuth } from "../context/auth";
import { currentPeriod, periodLabel, shiftPeriod } from "../lib/format";
import { Button, IconButton, Logo } from "./ui";
import Notifications from "./Notifications";
import TransactionForm from "./TransactionForm";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/transactions", label: "Transactions", icon: ArrowLeftRight },
  { to: "/budgets", label: "Budgets", icon: PiggyBank },
  { to: "/reports", label: "Reports", icon: ChartPie },
  { to: "/settings", label: "Settings", icon: Settings },
];

function MonthSwitcher({ period, setPeriod }) {
  const now = currentPeriod();
  const atNow = period.year === now.year && period.month === now.month;
  return (
    <div className="flex items-center rounded-xl border border-line bg-surface" role="group" aria-label="Month">
      <IconButton label="Previous month" onClick={() => setPeriod(shiftPeriod(period, -1))} className="size-9">
        <ChevronLeft className="size-4" aria-hidden="true" />
      </IconButton>
      <span className="num min-w-[7.5rem] text-center text-sm font-medium" aria-live="polite">
        {periodLabel(period, "short")}
      </span>
      <IconButton
        label="Next month"
        onClick={() => setPeriod(shiftPeriod(period, 1))}
        disabled={atNow}
        className="size-9 disabled:opacity-35"
      >
        <ChevronRight className="size-4" aria-hidden="true" />
      </IconButton>
    </div>
  );
}

export default function AppShell({ fallback }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [period, setPeriod] = useState(currentPeriod);
  const [editing, setEditing] = useState(null); // null = closed, {} = new, txn = edit
  const [version, setVersion] = useState(0);
  const mainRef = useRef(null);
  const firstRender = useRef(true);

  const bump = useCallback(() => setVersion((v) => v + 1), []);
  const openTransaction = useCallback((txn = {}) => setEditing(txn), []);
  const current = NAV.find((n) => pathname.startsWith(n.to));
  const showMonth = pathname !== "/settings" && pathname !== "/transactions";

  useEffect(() => {
    document.title = `${current?.label ?? "FinSight"} · FinSight`;
    // Move focus to the new page on client-side navigation, but not on first load (keeps the skip link first).
    if (firstRender.current) firstRender.current = false;
    else mainRef.current?.focus({ preventScroll: true });
  }, [current]);

  const signOut = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="min-h-dvh lg:pl-64">
      <a
        href="#main"
        className="sr-only z-50 rounded-lg bg-brand px-3 py-2 text-on-brand focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Skip to content
      </a>

      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-line bg-surface px-4 py-5 lg:flex">
        <Logo className="px-2" />
        <nav aria-label="Main" className="mt-8 flex flex-1 flex-col gap-1">
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex h-10 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors duration-150 ${
                  isActive ? "bg-brand-soft text-brand" : "text-muted hover:bg-surface-2 hover:text-ink"
                }`
              }
            >
              <Icon className="size-[18px]" aria-hidden="true" />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="flex items-center gap-3 border-t border-line px-2 pt-4">
          <div className="grid size-9 shrink-0 place-items-center rounded-full bg-brand-soft text-sm font-semibold text-brand">
            {user.name.slice(0, 1).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{user.name}</p>
            <p className="truncate text-xs text-muted">{user.email}</p>
          </div>
          <IconButton label="Sign out" onClick={signOut}>
            <LogOut className="size-4" aria-hidden="true" />
          </IconButton>
        </div>
      </aside>

      <header className="sticky top-0 z-30 border-b border-line bg-canvas/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6">
          <Logo className="lg:hidden" />
          <h1 className="hidden text-lg font-semibold sm:block">{current?.label}</h1>
          <div className="ml-auto flex items-center gap-2">
            {showMonth && (
              <div className="hidden sm:block">
                <MonthSwitcher period={period} setPeriod={setPeriod} />
              </div>
            )}
            <Notifications version={version} />
            <div className="hidden sm:block">
              <Button onClick={() => openTransaction()}>
                <Plus className="size-4" aria-hidden="true" /> Add transaction
              </Button>
            </div>
            <IconButton label="Sign out" onClick={signOut} className="lg:hidden">
              <LogOut className="size-4" aria-hidden="true" />
            </IconButton>
          </div>
        </div>
        {showMonth && (
          <div className="flex items-center justify-between gap-3 px-4 pb-3 sm:hidden">
            <h1 className="text-lg font-semibold">{current?.label}</h1>
            <MonthSwitcher period={period} setPeriod={setPeriod} />
          </div>
        )}
      </header>

      <main
        id="main"
        ref={mainRef}
        tabIndex={-1}
        className="mx-auto max-w-7xl px-4 pt-5 pb-28 outline-none sm:px-6 lg:pt-8 lg:pb-12"
      >
        {!showMonth && <h1 className="mb-4 text-lg font-semibold sm:hidden">{current?.label}</h1>}
        <Suspense fallback={fallback}>
          <Outlet context={{ period, setPeriod, openTransaction, version, bump }} />
        </Suspense>
      </main>

      {pathname !== "/settings" && (
        <button
          type="button"
          onClick={() => openTransaction()}
          aria-label="Add transaction"
          className="fixed right-4 bottom-20 z-30 grid size-14 place-items-center rounded-2xl bg-brand text-on-brand shadow-pop transition-transform duration-150 active:scale-95 sm:hidden"
        >
          <Plus className="size-6" aria-hidden="true" />
        </button>
      )}

      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden"
      >
        {NAV.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors duration-150 ${
                isActive ? "text-brand" : "text-muted hover:text-ink"
              }`
            }
          >
            <Icon className="size-5" aria-hidden="true" />
            {label}
          </NavLink>
        ))}
      </nav>

      <TransactionForm
        transaction={editing}
        onClose={() => setEditing(null)}
        onSaved={() => {
          setEditing(null);
          bump();
        }}
      />
    </div>
  );
}
