import {
  ArrowDownRight,
  ArrowUpRight,
  Repeat,
  Sparkles,
  RotateCw,
  Lightbulb,
  TriangleAlert,
  ThumbsUp,
} from "lucide-react";
import { useApi } from "../lib/useApi";
import { categoryMeta } from "../lib/categories";
import { formatDate, formatMoney } from "../lib/format";
import { Badge, Card, CardHeader, ErrorState, IconButton, ProgressBar, Skeleton } from "./ui";

/** Change vs last period; `goodWhenUp` flips colour for expenses where up is bad. */
export function Delta({ value, goodWhenUp = true }) {
  if (value == null) return <span className="text-xs text-muted">No data last month</span>;
  const up = value >= 0;
  const good = up === goodWhenUp;
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return (
    <span
      className={`num inline-flex items-center gap-0.5 text-xs font-medium ${good ? "text-income" : "text-expense"}`}
    >
      <Icon className="size-3.5" aria-hidden="true" />
      {Math.abs(value)}%<span className="ml-1 font-normal text-muted">vs last month</span>
    </span>
  );
}

export function StatCard({ label, value, footer, tone, featured = false }) {
  const color = tone === "income" ? "text-income" : tone === "expense" ? "text-expense" : "";
  return (
    <div
      className={`rounded-card border p-5 shadow-card ${
        featured
          ? "border-transparent bg-brand text-on-brand [--muted:color-mix(in_srgb,var(--on-brand)_78%,transparent)]"
          : "border-line bg-surface"
      }`}
    >
      <p className="text-sm text-muted">{label}</p>
      <p className={`num mt-2 truncate font-display text-[2rem] leading-none tracking-tight ${featured ? "" : color}`}>
        {value}
      </p>
      <div className="mt-3 min-h-5">{footer}</div>
    </div>
  );
}

export function StatSkeleton() {
  return (
    <Card as="div" className="space-y-3 p-5">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-8 w-36" />
      <Skeleton className="h-3 w-28" />
    </Card>
  );
}

export function CategoryBadge({ category }) {
  const meta = categoryMeta(category);
  const Icon = meta.icon;
  return (
    <span
      className="grid size-9 shrink-0 place-items-center rounded-xl"
      style={{ background: `color-mix(in srgb, ${meta.color} 16%, transparent)`, color: meta.color }}
    >
      <Icon className="size-4" aria-hidden="true" />
    </span>
  );
}

export function Amount({ t, currency, className = "" }) {
  return (
    <span className={`num font-semibold ${t.type === "income" ? "text-income" : ""} ${className}`}>
      {t.type === "income" ? "+" : "-"}
      {formatMoney(t.amountMinor, currency)}
    </span>
  );
}

export function TxnLine({ t, currency, onClick }) {
  const meta = categoryMeta(t.category);
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left transition-colors hover:bg-surface-2"
    >
      <CategoryBadge category={t.category} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">{t.note || meta.label}</span>
        <span className="flex items-center gap-1.5 text-xs text-muted">
          {meta.label} · {formatDate(t.date, { day: "numeric", month: "short" })}
          {(t.recurring || t.fromRecurring) && <Repeat className="size-3" aria-label="Recurring" />}
        </span>
      </span>
      <Amount t={t} currency={currency} className="text-sm" />
    </button>
  );
}

const STATUS_BADGE = {
  warning: <Badge tone="warn">Near limit</Badge>,
  exceeded: <Badge tone="danger">Over</Badge>,
};

export function BudgetRow({ label, spentMinor, limitMinor, percent, status, currency }) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
        <span className="flex items-center gap-2 font-medium">
          {label} {STATUS_BADGE[status]}
        </span>
        <span className="num text-muted">
          <span className="text-ink">{formatMoney(spentMinor, currency, { compact: true })}</span> /{" "}
          {formatMoney(limitMinor, currency, { compact: true })}
        </span>
      </div>
      <ProgressBar percent={percent} status={status} label={`${label}: ${percent}% of budget used`} />
    </div>
  );
}

const TONE = {
  positive: { icon: ThumbsUp, cls: "text-income bg-brand-soft" },
  warning: { icon: TriangleAlert, cls: "text-warn bg-warn-soft" },
  neutral: { icon: Lightbulb, cls: "text-brand bg-surface-2" },
};

/** Groq-generated insights from the month's aggregates, with real loading/empty/error states. */
export function InsightsPanel({ period, version, limit }) {
  const { data, error, loading, reload } = useApi(
    `/api/reports/insights?year=${period.year}&month=${period.month}&v=${version}`,
  );
  const items = data?.insights?.slice(0, limit) ?? [];
  return (
    <Card aria-labelledby="insights-title" className="pb-2">
      <CardHeader
        id="insights-title"
        title={
          <span className="flex items-center gap-2">
            <Sparkles className="size-4 text-brand" aria-hidden="true" /> AI insights
          </span>
        }
        subtitle="Based only on your monthly totals"
        action={
          <IconButton label="Refresh insights" onClick={reload} disabled={loading}>
            <RotateCw className={`size-4 ${loading ? "animate-spin" : ""}`} aria-hidden="true" />
          </IconButton>
        }
      />
      <div className="px-5 pt-3 pb-3" aria-live="polite" aria-busy={loading}>
        {loading && (
          <div className="space-y-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="size-8 shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-3 w-full" />
                </div>
              </div>
            ))}
            <p className="text-xs text-muted">Reading your month...</p>
          </div>
        )}
        {!loading && error && <ErrorState compact error={error} onRetry={reload} />}
        {!loading && !error && items.length === 0 && (
          <p className="py-6 text-center text-sm text-muted">{data?.reason || "No insights for this month yet."}</p>
        )}
        {!loading && !error && items.length > 0 && (
          <ul className="space-y-4">
            {items.map((it, i) => {
              const tone = TONE[it.tone] || TONE.neutral;
              const Icon = tone.icon;
              return (
                <li key={i} className="rise flex gap-3" style={{ animationDelay: `${i * 60}ms` }}>
                  <span className={`grid size-8 shrink-0 place-items-center rounded-lg ${tone.cls}`}>
                    <Icon className="size-4" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-sm font-medium">{it.title}</p>
                    <p className="mt-0.5 text-sm text-muted">{it.detail}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </Card>
  );
}
