import { useOutletContext } from "react-router-dom";
import { ChartPie } from "lucide-react";
import { useApi } from "../lib/useApi";
import { useAuth } from "../context/auth";
import { categoryMeta } from "../lib/categories";
import { formatMoney, percentChange, periodLabel } from "../lib/format";
import { Card, CardHeader, EmptyState, ErrorState, Skeleton } from "../components/ui";
import { DailySpendChart } from "../components/charts";
import { CategoryBadge, Delta, InsightsPanel, StatCard, StatSkeleton } from "../components/finance";

export default function Reports() {
  const { period, version } = useOutletContext();
  const { user } = useAuth();
  const { data, error, reload } = useApi(`/api/reports/summary?year=${period.year}&month=${period.month}&v=${version}`);
  const s = data?.summary;
  const cur = s?.currency || user.currency;

  if (error) return <ErrorState error={error} onRetry={reload} />;

  const top = s?.byCategory[0];
  const prevAvg = s ? Math.round(s.previous.expenseMinor / new Date(period.year, period.month - 1, 0).getDate()) : 0;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        {!s ? (
          [0, 1, 2].map((i) => <StatSkeleton key={i} />)
        ) : (
          <>
            <StatCard
              label="Average daily spend"
              value={formatMoney(s.avgDailySpendMinor, cur)}
              footer={<Delta value={percentChange(s.avgDailySpendMinor, prevAvg)} goodWhenUp={false} />}
            />
            <StatCard
              label="Biggest category"
              value={top ? categoryMeta(top.category).label : "—"}
              footer={
                top && (
                  <span className="num text-xs text-muted">
                    {formatMoney(top.amountMinor, cur)} · {Math.round((top.amountMinor / s.expenseMinor) * 100)}% of
                    spending
                  </span>
                )
              }
            />
            <StatCard
              label="Transactions"
              value={s.transactionCount}
              footer={<span className="text-xs text-muted">Logged in {periodLabel(period)}</span>}
            />
          </>
        )}
      </div>

      <Card aria-labelledby="daily-title">
        <CardHeader id="daily-title" title="Daily spending" subtitle={periodLabel(period)} />
        <div className="px-3 py-4 sm:px-5">
          {!s ? <Skeleton className="h-64" /> : <DailySpendChart daily={s.daily} currency={cur} />}
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card aria-labelledby="breakdown-title">
          <CardHeader id="breakdown-title" title="Category breakdown" subtitle="Expenses only" />
          <div className="p-5">
            {!s ? (
              <div className="space-y-3">
                {[0, 1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-10" />
                ))}
              </div>
            ) : s.byCategory.length === 0 ? (
              <EmptyState icon={ChartPie} title="No expenses this month" />
            ) : (
              <table className="w-full text-sm">
                <caption className="sr-only">Spending by category</caption>
                <thead className="sr-only">
                  <tr>
                    <th scope="col">Category</th>
                    <th scope="col">Amount</th>
                    <th scope="col">Share</th>
                  </tr>
                </thead>
                <tbody>
                  {s.byCategory.map((c) => {
                    const pct = Math.round((c.amountMinor / s.expenseMinor) * 1000) / 10;
                    return (
                      <tr key={c.category}>
                        <td className="py-2 pr-3">
                          <div className="flex items-center gap-3">
                            <CategoryBadge category={c.category} />
                            <div className="min-w-0 flex-1">
                              <p className="font-medium">{categoryMeta(c.category).label}</p>
                              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-surface-2" aria-hidden="true">
                                <div
                                  className="h-full rounded-full"
                                  style={{ width: `${pct}%`, background: categoryMeta(c.category).color }}
                                />
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="num py-2 text-right font-medium whitespace-nowrap">
                          {formatMoney(c.amountMinor, cur)}
                        </td>
                        <td className="num w-16 py-2 text-right text-muted">{pct}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </Card>
        <InsightsPanel period={period} version={version} />
      </div>
    </div>
  );
}
