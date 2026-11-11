import { Router } from "express";
import { z } from "zod";
import { query } from "../db.js";
import {
  FREQUENCIES,
  PAYMENTS,
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  isValidCategory,
  isoDate,
  minorAmount,
  notFound,
  HttpError,
} from "../lib/domain.js";
import { aiLimiter, receiptUpload, requireAuth } from "../middleware.js";
import { checkBudgetAlerts } from "../services/budgets.js";
import { scanReceipt } from "../services/ai.js";

const today = () => new Date().toISOString().slice(0, 10);

const txnSchema = z
  .object({
    type: z.enum(["income", "expense"]),
    category: z.string().trim().toLowerCase(),
    amountMinor: minorAmount,
    date: isoDate.optional(),
    payment: z.enum(PAYMENTS).nullish(),
    note: z.string().trim().max(280).nullish(),
    recurring: z.object({ frequency: z.enum(FREQUENCIES), endDate: isoDate.nullish() }).nullish(),
  })
  .refine((t) => isValidCategory(t.type, t.category), {
    message: "Pick a category that matches the transaction type",
    path: ["category"],
  });

const listSchema = z.object({
  type: z.enum(["income", "expense"]).optional(),
  category: z.enum([...new Set([...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES])]).optional(),
  from: isoDate.optional(),
  to: isoDate.optional(),
  q: z.string().trim().max(80).optional(),
  recurring: z.enum(["true"]).optional(),
  sort: z.enum(["date_desc", "date_asc", "amount_desc", "amount_asc"]).default("date_desc"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

const idSchema = z.object({ id: z.uuid("Invalid transaction id") });

const COLS = `id, type, category, amount_minor, occurred_on, payment, note, recurring_frequency, recurring_status,
  recurring_end_date, recurring_parent_id, created_at`;
const SORTS = {
  date_desc: "occurred_on DESC, created_at DESC",
  date_asc: "occurred_on ASC, created_at ASC",
  amount_desc: "amount_minor DESC",
  amount_asc: "amount_minor ASC",
};

export const toTxn = (r) => ({
  id: r.id,
  type: r.type,
  category: r.category,
  amountMinor: r.amount_minor,
  date: r.occurred_on,
  payment: r.payment,
  note: r.note,
  recurring: r.recurring_frequency
    ? { frequency: r.recurring_frequency, status: r.recurring_status, endDate: r.recurring_end_date }
    : null,
  fromRecurring: Boolean(r.recurring_parent_id),
  createdAt: r.created_at,
});

const ymOf = (iso) => iso.split("-").slice(0, 2).map(Number);
// Alerts are best-effort: a failure here must never fail the user's write.
const alertsFor = (userId, ...rows) =>
  Promise.all(
    rows.filter((r) => r?.type === "expense").map((r) => checkBudgetAlerts(userId, ...ymOf(r.occurred_on))),
  ).catch((err) => console.error("budget alert check failed:", err.message));

export const transactionsRouter = Router();
transactionsRouter.use(requireAuth);

transactionsRouter.get("/", async (req, res) => {
  const f = listSchema.parse(req.query);
  const where = ["user_id = $1"];
  const params = [req.userId];
  const add = (sql, value) => {
    params.push(value);
    where.push(sql.replace("?", `$${params.length}`));
  };
  if (f.type) add("type = ?", f.type);
  if (f.category) add("category = ?", f.category);
  if (f.from) add("occurred_on >= ?", f.from);
  if (f.to) add("occurred_on <= ?", f.to);
  if (f.q) {
    params.push(`%${f.q.replace(/[%_\\]/g, "\\$&")}%`);
    where.push(`(note ILIKE $${params.length} OR category ILIKE $${params.length})`);
  }
  if (f.recurring) where.push("recurring_frequency IS NOT NULL");
  const whereSql = where.join(" AND ");

  const [list, totals] = await Promise.all([
    query(
      `SELECT ${COLS} FROM transactions WHERE ${whereSql} ORDER BY ${SORTS[f.sort]}
       LIMIT ${f.pageSize} OFFSET ${(f.page - 1) * f.pageSize}`,
      params,
    ),
    query(
      `SELECT COUNT(*)::bigint AS count,
              COALESCE(SUM(amount_minor) FILTER (WHERE type = 'income'), 0)::bigint AS income,
              COALESCE(SUM(amount_minor) FILTER (WHERE type = 'expense'), 0)::bigint AS expense
       FROM transactions WHERE ${whereSql}`,
      params,
    ),
  ]);
  const t = totals.rows[0];
  res.json({
    items: list.rows.map(toTxn),
    total: t.count,
    page: f.page,
    pageSize: f.pageSize,
    totals: { incomeMinor: t.income, expenseMinor: t.expense },
  });
});

transactionsRouter.post("/", async (req, res) => {
  const t = txnSchema.parse(req.body);
  const { rows } = await query(
    `INSERT INTO transactions (user_id, type, category, amount_minor, occurred_on, payment, note,
       recurring_frequency, recurring_status, recurring_end_date)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING ${COLS}`,
    [
      req.userId,
      t.type,
      t.category,
      t.amountMinor,
      t.date || today(),
      t.payment ?? null,
      t.note || null,
      t.recurring?.frequency ?? null,
      t.recurring ? "active" : null,
      t.recurring?.endDate ?? null,
    ],
  );
  await alertsFor(req.userId, rows[0]);
  res.status(201).json({ transaction: toTxn(rows[0]) });
});

transactionsRouter.put("/:id", async (req, res) => {
  const { id } = idSchema.parse(req.params);
  const t = txnSchema.parse(req.body);
  const before = await query("SELECT type, occurred_on FROM transactions WHERE id = $1 AND user_id = $2", [
    id,
    req.userId,
  ]);
  if (!before.rows[0]) throw notFound("Transaction");
  const { rows } = await query(
    `UPDATE transactions SET type = $3, category = $4, amount_minor = $5, occurred_on = COALESCE($6, occurred_on),
       payment = $7, note = $8, recurring_frequency = $9,
       recurring_status = CASE WHEN $9::text IS NULL THEN NULL ELSE COALESCE(recurring_status, 'active') END,
       recurring_end_date = $10, updated_at = now()
     WHERE id = $1 AND user_id = $2 RETURNING ${COLS}`,
    [
      id,
      req.userId,
      t.type,
      t.category,
      t.amountMinor,
      t.date ?? null,
      t.payment ?? null,
      t.note || null,
      t.recurring?.frequency ?? null,
      t.recurring?.endDate ?? null,
    ],
  );
  await alertsFor(req.userId, rows[0]);
  res.json({ transaction: toTxn(rows[0]) });
});

transactionsRouter.patch("/:id/recurring", async (req, res) => {
  const { id } = idSchema.parse(req.params);
  const { status } = z.object({ status: z.enum(["active", "paused", "cancelled"]) }).parse(req.body);
  const { rows } = await query(
    `UPDATE transactions SET recurring_status = $3, updated_at = now()
     WHERE id = $1 AND user_id = $2 AND recurring_frequency IS NOT NULL AND recurring_status <> 'cancelled'
     RETURNING ${COLS}`,
    [id, req.userId, status],
  );
  if (!rows[0]) throw notFound("Active recurring transaction");
  res.json({ transaction: toTxn(rows[0]) });
});

transactionsRouter.delete("/:id", async (req, res) => {
  const { id } = idSchema.parse(req.params);
  const { rows } = await query(`DELETE FROM transactions WHERE id = $1 AND user_id = $2 RETURNING ${COLS}`, [
    id,
    req.userId,
  ]);
  if (!rows[0]) throw notFound("Transaction");
  res.status(204).end();
});

transactionsRouter.post("/scan-receipt", aiLimiter, receiptUpload, async (req, res) => {
  if (!req.file) throw new HttpError(400, "Attach a receipt image", "BAD_REQUEST");
  res.json({ draft: await scanReceipt(req.file.buffer, req.file.mimetype) });
});
