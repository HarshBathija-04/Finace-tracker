import { Router } from "express";
import { z } from "zod";
import { query, withTransaction } from "../db.js";
import { EXPENSE_CATEGORIES, minorAmount, notFound, yearMonth } from "../lib/domain.js";
import { requireAuth } from "../middleware.js";
import { checkBudgetAlerts, getBudgetProgress } from "../services/budgets.js";

const periodSchema = z.object(yearMonth);
const budgetSchema = z.object({
  limitMinor: z.number().int().min(0).max(1e12),
  targetSavingsMinor: z.number().int().min(0).max(1e12).default(0),
  categories: z
    .array(z.object({ category: z.enum(EXPENSE_CATEGORIES), limitMinor: minorAmount }))
    .max(EXPENSE_CATEGORIES.length)
    .refine((c) => new Set(c.map((x) => x.category)).size === c.length, "Each category can only appear once")
    .default([]),
});

export const budgetsRouter = Router();
budgetsRouter.use(requireAuth);

budgetsRouter.get("/:year/:month", async (req, res) => {
  const { year, month } = periodSchema.parse(req.params);
  res.json({ budget: await getBudgetProgress({ query }, req.userId, year, month) });
});

budgetsRouter.put("/:year/:month", async (req, res) => {
  const { year, month } = periodSchema.parse(req.params);
  const body = budgetSchema.parse(req.body);
  const budget = await withTransaction(async (db) => {
    const { rows } = await db.query(
      `INSERT INTO budgets (user_id, year, month, limit_minor, target_savings_minor) VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id, year, month)
       DO UPDATE SET limit_minor = EXCLUDED.limit_minor, target_savings_minor = EXCLUDED.target_savings_minor, updated_at = now()
       RETURNING id`,
      [req.userId, year, month, body.limitMinor, body.targetSavingsMinor],
    );
    await db.query("DELETE FROM category_budgets WHERE budget_id = $1", [rows[0].id]);
    if (body.categories.length) {
      await db.query(
        `INSERT INTO category_budgets (budget_id, category, limit_minor)
         SELECT $1, c, l FROM unnest($2::text[], $3::bigint[]) AS t(c, l)`,
        [rows[0].id, body.categories.map((c) => c.category), body.categories.map((c) => c.limitMinor)],
      );
    }
    return getBudgetProgress(db, req.userId, year, month);
  });
  await checkBudgetAlerts(req.userId, year, month).catch((err) => console.error("budget alerts:", err.message));
  res.json({ budget });
});

budgetsRouter.delete("/:year/:month", async (req, res) => {
  const { year, month } = periodSchema.parse(req.params);
  const { rowCount } = await query("DELETE FROM budgets WHERE user_id = $1 AND year = $2 AND month = $3", [
    req.userId,
    year,
    month,
  ]);
  if (!rowCount) throw notFound("Budget");
  res.status(204).end();
});
