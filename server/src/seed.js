import { randomBytes } from "node:crypto";
import { fileURLToPath } from "node:url";
import bcrypt from "bcryptjs";
import { pool, withTransaction } from "./db.js";
import { DEMO_EMAIL } from "./routes/auth.js";
import { checkBudgetAlerts } from "./services/budgets.js";

// Deterministic PRNG so every reseed produces the same realistic-looking history.
function rng(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const iso = (y, m, d) => `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

/** Six months of INR history ending today. Amounts are minor units (paise). */
export function demoTransactions(today = new Date()) {
  const rand = rng(20240601);
  const between = (lo, hi) => Math.round((lo + rand() * (hi - lo)) / 10) * 1000; // whole rupees ending in 0
  const pick = (arr) => arr[Math.floor(rand() * arr.length)];
  const out = [];
  for (let back = 5; back >= 0; back--) {
    const first = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - back, 1));
    const y = first.getUTCFullYear();
    const m = first.getUTCMonth() + 1;
    const lastDay = back === 0 ? today.getUTCDate() : new Date(Date.UTC(y, m, 0)).getUTCDate();
    const add = (day, type, category, amountMinor, note, payment, extra = {}) => {
      if (day <= lastDay) out.push({ date: iso(y, m, day), type, category, amountMinor, note, payment, ...extra });
    };
    add(1, "income", "salary", 8500000, "Monthly salary - Northwind Labs", "bank");
    add(2, "expense", "rent", 2200000, "Apartment rent", "bank", { rentTemplate: back === 5 });
    if (rand() > 0.4)
      add(12 + Math.floor(rand() * 10), "income", "freelance", between(800, 2500), "Freelance UI project", "bank");
    if (back % 3 === 0) add(20, "income", "investments", between(150, 600), "Mutual fund dividend", "bank");
    for (let d = 3; d <= 28; d += 7)
      add(
        d,
        "expense",
        "groceries",
        between(1200, 3400),
        pick(["BigBasket order", "DMart weekly shop", "Local market"]),
        pick(["upi", "card"]),
      );
    for (let i = 0; i < 10; i++)
      add(
        1 + Math.floor(rand() * 28),
        "expense",
        "food",
        between(220, 1300),
        pick(["Swiggy dinner", "Zomato lunch", "Cafe with friends", "Office canteen"]),
        "upi",
      );
    for (let i = 0; i < 7; i++)
      add(
        1 + Math.floor(rand() * 28),
        "expense",
        "travel",
        between(120, 900),
        pick(["Uber to office", "Metro card top-up", "Ola ride", "Fuel"]),
        pick(["upi", "card"]),
      );
    add(5, "expense", "utilities", between(1400, 2600), "Electricity bill", "upi");
    add(7, "expense", "bills", 79900, "Mobile + broadband plan", "card");
    add(9, "expense", "entertainment", 64900, "Streaming subscriptions", "card");
    for (let i = 0; i < 3; i++)
      add(
        1 + Math.floor(rand() * 28),
        "expense",
        "shopping",
        between(700, 5200),
        pick(["Myntra order", "Amazon - home essentials", "Decathlon", "Books"]),
        "card",
      );
    for (let i = 0; i < 2; i++)
      add(
        1 + Math.floor(rand() * 28),
        "expense",
        "entertainment",
        between(300, 1500),
        pick(["Movie night", "Concert tickets", "Bowling"]),
        pick(["upi", "card"]),
      );
    if (rand() > 0.5)
      add(
        1 + Math.floor(rand() * 28),
        "expense",
        "health",
        between(400, 2200),
        pick(["Pharmacy", "Doctor consultation", "Gym membership"]),
        "upi",
      );
  }
  return out;
}

const DEMO_BUDGET = {
  limitMinor: 6000000,
  targetSavingsMinor: 2000000,
  categories: {
    rent: 2200000,
    groceries: 1000000,
    food: 700000,
    shopping: 800000,
    travel: 400000,
    entertainment: 250000,
    utilities: 300000,
  },
};

export async function seed(today = new Date()) {
  const thisMonth = iso(today.getUTCFullYear(), today.getUTCMonth() + 1, 1);
  const { rows } = await pool.query(
    `SELECT u.id, EXISTS (SELECT 1 FROM transactions t WHERE t.user_id = u.id AND t.occurred_on >= $2) AS fresh
     FROM users u WHERE lower(email) = $1`,
    [DEMO_EMAIL, thisMonth],
  );
  if (rows[0]?.fresh) return console.log("seed: demo data is current, nothing to do");

  const userId = await withTransaction(async (db) => {
    // The demo account only signs in through POST /api/auth/demo, so its password is random.
    const hash = await bcrypt.hash(randomBytes(24).toString("hex"), 10);
    const user = await db.query(
      `INSERT INTO users (name, email, password_hash, currency) VALUES ('Aarav Sharma', $1, $2, 'INR')
       ON CONFLICT ((lower(email))) DO UPDATE SET name = EXCLUDED.name RETURNING id`,
      [DEMO_EMAIL, hash],
    );
    const id = user.rows[0].id;
    await db.query("DELETE FROM transactions WHERE user_id = $1", [id]);
    await db.query("DELETE FROM budgets WHERE user_id = $1", [id]);
    await db.query("DELETE FROM notifications WHERE user_id = $1", [id]);

    let rentTemplate = null;
    for (const t of demoTransactions(today)) {
      const isRent = t.category === "rent";
      const r = await db.query(
        `INSERT INTO transactions (user_id, type, category, amount_minor, occurred_on, payment, note,
           recurring_frequency, recurring_status, recurring_parent_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
        [
          id,
          t.type,
          t.category,
          t.amountMinor,
          t.date,
          t.payment,
          t.note,
          t.rentTemplate ? "monthly" : null,
          t.rentTemplate ? "active" : null,
          isRent && !t.rentTemplate ? rentTemplate : null,
        ],
      );
      if (t.rentTemplate) rentTemplate = r.rows[0].id;
      if (isRent && rentTemplate)
        await db.query("UPDATE transactions SET recurring_last_run = $2 WHERE id = $1", [rentTemplate, t.date]);
    }

    for (let back = 1; back >= 0; back--) {
      const d = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - back, 1));
      const b = await db.query(
        "INSERT INTO budgets (user_id, year, month, limit_minor, target_savings_minor) VALUES ($1, $2, $3, $4, $5) RETURNING id",
        [id, d.getUTCFullYear(), d.getUTCMonth() + 1, DEMO_BUDGET.limitMinor, DEMO_BUDGET.targetSavingsMinor],
      );
      const cats = Object.entries(DEMO_BUDGET.categories);
      await db.query(
        "INSERT INTO category_budgets (budget_id, category, limit_minor) SELECT $1, c, l FROM unnest($2::text[], $3::bigint[]) AS t(c, l)",
        [b.rows[0].id, cats.map((c) => c[0]), cats.map((c) => c[1])],
      );
    }
    await db.query(
      "INSERT INTO notifications (user_id, message, type) VALUES ($1, 'Welcome to FinSight! This demo account resets every month with fresh sample data.', 'general')",
      [id],
    );
    return id;
  });
  await checkBudgetAlerts(userId, today.getUTCFullYear(), today.getUTCMonth() + 1);
  console.log("seed: demo account refreshed");
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  seed()
    .then(() => pool.end())
    .catch((err) => {
      console.error("Seed failed:", err.message);
      process.exit(1);
    });
}
