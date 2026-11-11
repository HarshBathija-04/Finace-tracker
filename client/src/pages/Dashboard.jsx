import { Link, useOutletContext } from "react-router-dom";
import { ArrowRight, PiggyBank, ReceiptText, ChartPie } from "lucide-react";
import { useAuth } from "../context/auth";
import { useApi } from "../lib/useApi";
import { categoryMeta } from "../lib/categories";
import { formatMoney, percentChange, periodLabel, periodRange } from "../lib/format";
import { Button, buttonClass, Card, CardHeader, EmptyState, ErrorState, Skeleton } from "../components/ui";
import { CashflowChart, CategoryDonut } from "../components/charts";
import { BudgetRow, Delta, InsightsPanel, StatCard, StatSkeleton, TxnLine } from "../components/finance";

const CardLink = ({ to, children }) => (
  <Link to={to} className="inline-flex items-center gap-1 rounded-lg text-sm font-medium text-brand hover:underline">
    {children} <ArrowRight className="size-3.5" aria-hidden="true" />
  </Link>
);

export default function Dashboard() {
  const { period, openTransaction, version } = useOutletContext();
  const { user } = useAuth();
  const q = `year=${period.year}&month=${period.month}&v=${version}`;
  const { from, to } = periodRange(period);
  const summary = useApi(`/api/reports/summary?${q}`);
  const trend = useApi(`/api/reports/trend?${q}&months=6`);
  const recent = useApi(`/api/transactions?pageSize=6&from=${from}&to=${to}&v=${version}`);

  const s = summary.data?.summary;
  const budget = summary.data?.budget;
  const cur = s?.currency || user.currency;
  const firstName = user.name.split(" ")[0];

  if (summary.error && !s) return <ErrorState error={summary.error} onRetry={summary.reload} />;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted">{periodLabel(period)}</p>
        <h2 className="font-display text-3xl tracking-tight sm:text-4xl">Hi {firstName}, here's your month.</h2>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {!s ? (
          [0, 1, 2, 3].map((i) => <StatSkeleton key={i} />)
        ) : (
          <>
            <StatCard
              featured
              label="Balance"
              value={formatMoney(s.balanceMinor, cur)}
              footer={<span className="text-xs text-muted">All income minus expenses to date</span>}
            />
            <StatCard
              label="Income"
              tone="income"
              value={formatMoney(s.incomeMinor, cur)}
              footer={<Delta value={percentChange(s.incomeMinor, s.previous.incomeMinor)} />}
            />
            <StatCard
              label="Expenses"
              tone="expense"
              value={formatMoney(s.expenseMinor, cur)}
              footer={<Delta value={percentChange(s.expenseMinor, s.previous.expenseMinor)} goodWhenUp={false} />}
            />
            <StatCard
              label="Savings rate"
              value={s.savingsRate == null ? "—" : `${s.savingsRate}%`}
              footer={
                <span className="num text-xs text-muted">
                  {formatMoney(s.netMinor, cur)} {s.netMinor >= 0 ? "kept" : "overspent"} this month
                </span>
              }
            />
          </>
        )}
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2" aria-labelledby="cashflow-title">
          <CardHeader id="cashflow-title" title="Cash flow" subtitle="Income vs expenses, last 6 months" />
          <div className="px-3 pt-4 pb-4 sm:px-5">
            {trend.error ? (
              <ErrorState compact error={trend.error} onRetry={trend.reload} />
            ) : !trend.data ? (
              <Skeleton className="h-64" />
            ) : (
              <CashflowChart trend={trend.data.trend} currency={cur} />
            )}
            <div className="mt-2 flex gap-4 px-2 text-xs text-muted">
              <span className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-sm bg-income" aria-hidden="true" /> Income
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-sm bg-expense" aria-hidden="true" /> Expenses
              </span>
            </div>
          </div>
        </Card>

        <Card aria-labelledby="cats-title">
          <CardHeader id="cats-title" title="Where it went" subtitle="Spending by category" />
          <div className="p-5">
            {!s ? (
              <Skeleton className="mx-auto aspect-square max-w-[220px] rounded-full" />
            ) : s.byCategory.length === 0 ? (
              <EmptyState icon={ChartPie} title="No spending yet">
                Expenses you add this month will be grouped here.
              </EmptyState>
            ) : (
              <>
                <CategoryDonut data={s.byCategory} total={s.expenseMinor} currency={cur} />
                <ul className="mt-5 space-y-2">
                  {s.byCategory.slice(0, 5).map((c) => (
                    <li key={c.category} className="flex items-center gap-2 text-sm">
                      <span
                        className="size-2.5 rounded-full"
                        style={{ background: categoryMeta(c.category).color }}
                        aria-hidden="true"
                      />
                      <span className="flex-1 truncate">{categoryMeta(c.category).label}</span>
                      <span className="num text-muted">{Math.round((c.amountMinor / s.expenseMinor) * 100)}%</span>
                      <span className="num w-24 text-right font-medium">
                        {formatMoney(c.amountMinor, cur, { compact: true })}
                      </span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card aria-labelledby="recent-title">
          <CardHeader
            id="recent-title"
            title="Recent transactions"
            action={<CardLink to="/transactions">View all</CardLink>}
          />
          <div className="px-3 py-3">
            {recent.error ? (
              <ErrorState compact error={recent.error} onRetry={recent.reload} />
            ) : !recent.data ? (
              <div className="space-y-3 p-2">
                {[0, 1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-10" />
                ))}
              </div>
            ) : recent.data.items.length === 0 ? (
              <EmptyState
                icon={ReceiptText}
                title="Nothing logged this month"
                action={
                  <Button size="sm" onClick={() => openTransaction()}>
                    Add transaction
                  </Button>
                }
              />
            ) : (
              recent.data.items.map((t) => (
                <TxnLine key={t.id} t={t} currency={cur} onClick={() => openTransaction(t)} />
              ))
            )}
          </div>
        </Card>

        <Card aria-labelledby="budget-title">
          <CardHeader
            id="budget-title"
            title="Budget"
            subtitle={
              budget
                ? `${budget.percent}% of ${formatMoney(budget.limitMinor, cur, { compact: true })} used`
                : undefined
            }
            action={<CardLink to="/budgets">Manage</CardLink>}
          />
          <div className="space-y-4 p-5">
            {!summary.data ? (
              [0, 1, 2].map((i) => <Skeleton key={i} className="h-8" />)
            ) : !budget ? (
              <EmptyState
                icon={PiggyBank}
                title="No budget for this month"
                action={
                  <Link to="/budgets" className={buttonClass("secondary", "sm")}>
                    Set a budget
                  </Link>
                }
              >
                Set limits to get alerts before you overspend.
              </EmptyState>
            ) : (
              <>
                <BudgetRow label="Overall" currency={cur} {...budget} />
                {[...budget.categories]
                  .sort((a, b) => b.percent - a.percent)
                  .slice(0, 4)
                  .map((c) => (
                    <BudgetRow key={c.category} label={categoryMeta(c.category).label} currency={cur} {...c} />
                  ))}
              </>
            )}
          </div>
        </Card>

        <InsightsPanel period={period} version={version} limit={3} />
      </div>
    </div>
  );
}
