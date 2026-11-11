import { Router } from "express";
import { z } from "zod";
import { query } from "../db.js";
import { monthRange, yearMonth } from "../lib/domain.js";
import { aiLimiter, requireAuth } from "../middleware.js";
import { getBudgetProgress } from "../services/budgets.js";
import { generateInsights } from "../services/ai.js";
import { config } from "../config.js";

const periodSchema = z.object(yearMonth);
const trendSchema = z.object({ ...yearMonth, months: z.coerce.number().int().min(2).max(24).default(6) });

export async function monthSummary(userId, year, month) {
  const [from, to] = monthRange(year, month);
  const prev = month === 1 ? monthRange(year - 1, 12) : monthRange(year, month - 1);
  const totals = `COALESCE(SUM(amount_minor) FILTER (WHERE type = 'income'), 0)::bigint AS income,
                  COALESCE(SUM(amount_minor) FILTER (WHERE type = 'expense'), 0)::bigint AS expense`;
  const [cur, last, balance, cats, daily, user] = await Promise.all([
    query(
      `SELECT ${totals}, COUNT(*)::bigint AS count FROM transactions WHERE user_id = $1 AND occurred_on >= $2 AND occurred_on < $3`,
      [userId, from, to],
    ),
    query(`SELECT ${totals} FROM transactions WHERE user_id = $1 AND occurred_on >= $2 AND occurred_on < $3`, [
      userId,
      ...prev,
    ]),
    query(
      `SELECT COALESCE(SUM(CASE WHEN type = 'income' THEN amount_minor ELSE -amount_minor END), 0)::bigint AS balance
       FROM transactions WHERE user_id = $1 AND occurred_on < $2`,
      [userId, to],
    ),
    query(
      `SELECT category, SUM(amount_minor)::bigint AS amount FROM transactions
       WHERE user_id = $1 AND type = 'expense' AND occurred_on >= $2 AND occurred_on < $3
       GROUP BY category ORDER BY amount DESC`,
      [userId, from, to],
    ),
    query(
      `SELECT d::date::text AS date,
              COALESCE(SUM(t.amount_minor) FILTER (WHERE t.type = 'income'), 0)::bigint AS income,
              COALESCE(SUM(t.amount_minor) FILTER (WHERE t.type = 'expense'), 0)::bigint AS expense
       FROM generate_series($2::date, $3::date - 1, interval '1 day') AS d
       LEFT JOIN transactions t ON t.user_id = $1 AND t.occurred_on = d::date
       GROUP BY d ORDER BY d`,
      [userId, from, to],
    ),
    query("SELECT currency FROM users WHERE id = $1", [userId]),
  ]);
  const c = cur.rows[0];
  // Average over days elapsed so far, so the current month is not diluted by days still to come.
  const today = new Date().toISOString().slice(0, 10);
  const days = daily.rows.filter((r) => r.date <= today).length || daily.rows.length;
  return {
    year,
    month,
    currency: user.rows[0]?.currency || "INR",
    balanceMinor: balance.rows[0].balance,
    incomeMinor: c.income,
    expenseMinor: c.expense,
    netMinor: c.income - c.expense,
    savingsRate: c.income ? Math.round(((c.income - c.expense) / c.income) * 1000) / 10 : null,
    transactionCount: c.count,
    avgDailySpendMinor: Math.round(c.expense / days),
    previous: { incomeMinor: last.rows[0].income, expenseMinor: last.rows[0].expense },
    byCategory: cats.rows.map((r) => ({ category: r.category, amountMinor: r.amount })),
    daily: daily.rows.map((r) => ({ date: r.date, incomeMinor: r.income, expenseMinor: r.expense })),
  };
}

export async function monthlyTrend(userId, year, month, months) {
  const end = monthRange(year, month)[1];
  const { rows } = await query(
    `SELECT to_char(m, 'YYYY-MM') AS month,
            COALESCE(SUM(t.amount_minor) FILTER (WHERE t.type = 'income'), 0)::bigint AS income,
            COALESCE(SUM(t.amount_minor) FILTER (WHERE t.type = 'expense'), 0)::bigint AS expense
     FROM generate_series($2::date - make_interval(months => $3), $2::date - interval '1 month', interval '1 month') AS m
     LEFT JOIN transactions t ON t.user_id = $1 AND t.occurred_on >= m::date AND t.occurred_on < (m + interval '1 month')::date
     GROUP BY m ORDER BY m`,
    [userId, end, months],
  );
  return rows.map((r) => ({ month: r.month, incomeMinor: r.income, expenseMinor: r.expense }));
}

const major = (minor) => Math.round(minor) / 100;

/** The only data the AI sees: aggregated totals in major units. Pure, so it is unit-tested. */
export function buildInsightPayload(summary, budget) {
  return {
    currency: summary.currency,
    month: `${summary.year}-${String(summary.month).padStart(2, "0")}`,
    income: major(summary.incomeMinor),
    expenses: major(summary.expenseMinor),
    savingsRatePercent: summary.savingsRate,
    averageDailySpend: major(summary.avgDailySpendMinor),
    lastMonth: { income: major(summary.previous.incomeMinor), expenses: major(summary.previous.expenseMinor) },
    expensesByCategory: Object.fromEntries(summary.byCategory.map((c) => [c.category, major(c.amountMinor)])),
    budget: budget
      ? {
          limit: major(budget.limitMinor),
          savingsTarget: major(budget.targetSavingsMinor),
          usedPercent: budget.percent,
          categories: budget.categories.map((c) => ({
            category: c.category,
            limit: major(c.limitMinor),
            usedPercent: c.percent,
          })),
        }
      : null,
  };
}

// shortcut: in-memory cache, lost on restart and per instance; move to a table if the API scales out.
const insightCache = new Map();
const CACHE_MS = 30 * 60_000;

export const reportsRouter = Router();
reportsRouter.use(requireAuth);

reportsRouter.get("/summary", async (req, res) => {
  const { year, month } = periodSchema.parse(req.query);
  const [summary, budget] = await Promise.all([
    monthSummary(req.userId, year, month),
    getBudgetProgress({ query }, req.userId, year, month),
  ]);
  res.json({ summary, budget });
});

reportsRouter.get("/trend", async (req, res) => {
  const { year, month, months } = trendSchema.parse(req.query);
  res.json({ trend: await monthlyTrend(req.userId, year, month, months) });
});

reportsRouter.get("/insights", aiLimiter, async (req, res) => {
  const { year, month } = periodSchema.parse(req.query);
  const [summary, budget] = await Promise.all([
    monthSummary(req.userId, year, month),
    getBudgetProgress({ query }, req.userId, year, month),
  ]);
  if (!summary.transactionCount) {
    return res.json({ insights: [], reason: "Add a few transactions this month to unlock AI insights." });
  }
  const payload = buildInsightPayload(summary, budget);
  const key = `${req.userId}:${payload.month}`;
  const hash = JSON.stringify(payload);
  const hit = insightCache.get(key);
  if (hit && hit.hash === hash && Date.now() - hit.at < CACHE_MS) {
    return res.json({ insights: hit.insights, generatedAt: new Date(hit.at).toISOString(), cached: true });
  }
  const insights = await generateInsights(payload);
  if (insightCache.size > 1000) insightCache.clear();
  insightCache.set(key, { hash, insights, at: Date.now() });
  res.json({ insights, generatedAt: new Date().toISOString(), model: config.groqTextModel, cached: false });
});
