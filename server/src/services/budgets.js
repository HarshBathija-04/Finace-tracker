import { query } from "../db.js";
import { monthRange } from "../lib/domain.js";

export const WARNING_RATIO = 0.8;

/** "ok" below 80% of the limit, "warning" from 80%, "exceeded" over 100%. A zero limit is never exceeded. */
export function budgetStatus(spentMinor, limitMinor) {
  if (!limitMinor) return "ok";
  if (spentMinor > limitMinor) return "exceeded";
  return spentMinor >= limitMinor * WARNING_RATIO ? "warning" : "ok";
}

const percent = (spent, limit) => (limit ? Math.round((spent / limit) * 1000) / 10 : 0);

/** The month's budget with live spend per category, or null when the user has not set one. */
export async function getBudgetProgress(db, userId, year, month) {
  const { rows } = await db.query(
    "SELECT id, limit_minor, target_savings_minor, updated_at FROM budgets WHERE user_id = $1 AND year = $2 AND month = $3",
    [userId, year, month],
  );
  const budget = rows[0];
  if (!budget) return null;
  const [from, to] = monthRange(year, month);
  const [limits, spend] = await Promise.all([
    db.query("SELECT category, limit_minor FROM category_budgets WHERE budget_id = $1 ORDER BY category", [budget.id]),
    db.query(
      `SELECT category, type, SUM(amount_minor)::bigint AS total FROM transactions
       WHERE user_id = $1 AND occurred_on >= $2 AND occurred_on < $3
       GROUP BY category, type`,
      [userId, from, to],
    ),
  ]);
  const spentBy = {};
  let spentMinor = 0;
  let incomeMinor = 0;
  for (const r of spend.rows) {
    if (r.type === "income") incomeMinor += r.total;
    else {
      spentBy[r.category] = r.total;
      spentMinor += r.total;
    }
  }
  return {
    id: budget.id,
    year,
    month,
    limitMinor: budget.limit_minor,
    targetSavingsMinor: budget.target_savings_minor,
    spentMinor,
    incomeMinor,
    savedMinor: incomeMinor - spentMinor,
    percent: percent(spentMinor, budget.limit_minor),
    status: budgetStatus(spentMinor, budget.limit_minor),
    categories: limits.rows.map((c) => {
      const spent = spentBy[c.category] || 0;
      return {
        category: c.category,
        limitMinor: c.limit_minor,
        spentMinor: spent,
        percent: percent(spent, c.limit_minor),
        status: budgetStatus(spent, c.limit_minor),
      };
    }),
    updatedAt: budget.updated_at,
  };
}

/** Creates one notification per threshold crossed; the dedupe key stops repeats within the month. */
export async function checkBudgetAlerts(userId, year, month) {
  const { rows } = await query("SELECT budget_alerts FROM users WHERE id = $1", [userId]);
  if (!rows[0]?.budget_alerts) return;
  const progress = await getBudgetProgress({ query }, userId, year, month);
  if (!progress) return;
  const label = new Date(Date.UTC(year, month - 1, 1)).toLocaleString("en", { month: "long", timeZone: "UTC" });
  const items = [
    { key: "overall", name: "overall budget", ...progress },
    ...progress.categories.map((c) => ({ key: c.category, name: `${c.category} budget`, ...c })),
  ];
  for (const item of items) {
    if (item.status === "ok") continue;
    const message =
      item.status === "exceeded"
        ? `You've gone over your ${label} ${item.name} (${item.percent}% used).`
        : `Heads up: ${item.percent}% of your ${label} ${item.name} is already used.`;
    await query(
      `INSERT INTO notifications (user_id, message, type, dedupe_key) VALUES ($1, $2, 'budget', $3)
       ON CONFLICT (user_id, dedupe_key) WHERE dedupe_key IS NOT NULL DO NOTHING`,
      [userId, message, `budget:${year}-${month}:${item.key}:${item.status}`],
    );
  }
}
