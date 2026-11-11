import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { categoryMeta } from "../lib/categories";
import { formatMoney, todayIso } from "../lib/format";

const axis = { fontSize: 12, fill: "var(--muted)" };

function ChartTooltip({ active, payload, label, currency, labelFormat = (l) => l }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-line bg-surface px-3 py-2 text-sm shadow-pop">
      {label != null && <p className="mb-1 font-medium">{labelFormat(label)}</p>}
      {payload.map((p) => (
        <p key={p.dataKey ?? p.name} className="num flex items-center gap-2 text-muted">
          <span className="size-2 rounded-full" style={{ background: p.color || p.payload?.fill }} aria-hidden="true" />
          {p.name}: <span className="font-medium text-ink">{formatMoney(p.value, currency)}</span>
        </p>
      ))}
    </div>
  );
}

const monthShort = (ym) => new Date(`${ym}-01T00:00:00`).toLocaleString("en", { month: "short" });

/** Income vs expenses per month. Bars are paired, so a text summary follows for screen readers. */
export function CashflowChart({ trend, currency }) {
  return (
    <div className="h-64 xl:h-80" role="img" aria-label={`Income and expenses for the last ${trend.length} months`}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={trend} barGap={4} margin={{ top: 8, right: 4, left: 4, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--line)" />
          <XAxis dataKey="month" tickFormatter={monthShort} tick={axis} axisLine={false} tickLine={false} />
          <YAxis
            tickFormatter={(v) => formatMoney(v, currency, { compact: true })}
            tick={axis}
            axisLine={false}
            tickLine={false}
            width={64}
          />
          <Tooltip
            cursor={{ fill: "var(--surface-2)" }}
            content={
              <ChartTooltip
                currency={currency}
                labelFormat={(m) =>
                  new Date(`${m}-01T00:00:00`).toLocaleString("en", { month: "long", year: "numeric" })
                }
              />
            }
          />
          <Bar dataKey="incomeMinor" name="Income" fill="var(--income)" radius={[6, 6, 0, 0]} maxBarSize={28} />
          <Bar dataKey="expenseMinor" name="Expenses" fill="var(--expense)" radius={[6, 6, 0, 0]} maxBarSize={28} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function CategoryDonut({ data, total, currency }) {
  const rows = data.map((d) => ({ ...d, name: categoryMeta(d.category).label, fill: categoryMeta(d.category).color }));
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[220px]" role="img" aria-label="Spending by category">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={rows}
            dataKey="amountMinor"
            nameKey="name"
            innerRadius="66%"
            outerRadius="100%"
            paddingAngle={2}
            stroke="none"
          >
            {rows.map((r) => (
              <Cell key={r.category} fill={r.fill} />
            ))}
          </Pie>
          <Tooltip content={<ChartTooltip currency={currency} />} />
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xs text-muted">Spent</span>
        <span className="num font-display text-2xl">{formatMoney(total, currency, { compact: true })}</span>
      </div>
    </div>
  );
}

export function DailySpendChart({ daily, currency }) {
  return (
    <div className="h-64" role="img" aria-label="Daily spending this month">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={daily.map((d) => (d.date > todayIso() ? { ...d, expenseMinor: null } : d))}
          margin={{ top: 8, right: 4, left: 4, bottom: 0 }}
        >
          <defs>
            <linearGradient id="spendFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--expense)" stopOpacity={0.28} />
              <stop offset="100%" stopColor="var(--expense)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="var(--line)" />
          <XAxis
            dataKey="date"
            tickFormatter={(d) => Number(d.slice(8))}
            tick={axis}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
            minTickGap={16}
          />
          <YAxis
            tickFormatter={(v) => formatMoney(v, currency, { compact: true })}
            tick={axis}
            axisLine={false}
            tickLine={false}
            width={64}
          />
          <Tooltip
            content={
              <ChartTooltip
                currency={currency}
                labelFormat={(d) =>
                  new Date(`${d}T00:00:00`).toLocaleDateString("en", { day: "numeric", month: "short" })
                }
              />
            }
          />
          <Area
            type="monotone"
            dataKey="expenseMinor"
            name="Spent"
            stroke="var(--expense)"
            strokeWidth={2}
            fill="url(#spendFill)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
