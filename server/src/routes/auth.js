import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { query } from "../db.js";
import { config } from "../config.js";
import { CURRENCIES, HttpError, notFound } from "../lib/domain.js";
import { authLimiter, requireAuth } from "../middleware.js";

export const DEMO_EMAIL = "demo@finsight.app";
const BCRYPT_ROUNDS = 11;
// Compared against when the email is unknown, so both failure paths take the same time.
const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", BCRYPT_ROUNDS);

const email = z
  .email("Enter a valid email")
  .max(254)
  .transform((e) => e.toLowerCase());
const password = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(72, "Password must be at most 72 characters");
const name = z.string().trim().min(1, "Name is required").max(80);

const registerSchema = z.object({ name, email, password, currency: z.enum(CURRENCIES).default("INR") });
const loginSchema = z.object({ email, password: z.string().min(1, "Password is required").max(72) });
const profileSchema = z
  .object({
    name: name.optional(),
    email: email.optional(),
    currency: z.enum(CURRENCIES).optional(),
    budgetAlerts: z.boolean().optional(),
    currentPassword: z.string().max(72).optional(),
    newPassword: password.optional(),
  })
  .refine((d) => !d.newPassword || d.currentPassword, {
    message: "Current password is required to set a new one",
    path: ["currentPassword"],
  });

const USER_COLS = "id, name, email, currency, budget_alerts, created_at";
export const toUser = (r) => ({
  id: r.id,
  name: r.name,
  email: r.email,
  currency: r.currency,
  budgetAlerts: r.budget_alerts,
  createdAt: r.created_at,
});
const sign = (id) => jwt.sign({ sub: id }, config.jwtSecret, { expiresIn: config.jwtExpiresIn, algorithm: "HS256" });

export const authRouter = Router();

authRouter.post("/register", authLimiter, async (req, res) => {
  const body = registerSchema.parse(req.body);
  const hash = await bcrypt.hash(body.password, BCRYPT_ROUNDS);
  const { rows } = await query(
    `INSERT INTO users (name, email, password_hash, currency) VALUES ($1, $2, $3, $4)
     ON CONFLICT ((lower(email))) DO NOTHING RETURNING ${USER_COLS}`,
    [body.name, body.email, hash, body.currency],
  );
  if (!rows[0]) throw new HttpError(409, "An account with this email already exists", "EMAIL_TAKEN");
  res.status(201).json({ user: toUser(rows[0]), token: sign(rows[0].id) });
});

authRouter.post("/login", authLimiter, async (req, res) => {
  const body = loginSchema.parse(req.body);
  const { rows } = await query(`SELECT ${USER_COLS}, password_hash FROM users WHERE lower(email) = $1`, [body.email]);
  const ok = await bcrypt.compare(body.password, rows[0]?.password_hash || DUMMY_HASH);
  if (!rows[0] || !ok) throw new HttpError(401, "Invalid email or password", "INVALID_CREDENTIALS");
  res.json({ user: toUser(rows[0]), token: sign(rows[0].id) });
});

// One-click demo: signs in to the seeded demo account, whose password is random and never published.
authRouter.post("/demo", authLimiter, async (_req, res) => {
  if (process.env.DEMO_ENABLED === "false") throw new HttpError(404, "Demo is disabled", "NOT_FOUND");
  const { rows } = await query(`SELECT ${USER_COLS} FROM users WHERE lower(email) = $1`, [DEMO_EMAIL]);
  if (!rows[0]) throw new HttpError(503, "Demo data is not seeded yet", "DEMO_UNAVAILABLE");
  res.json({ user: toUser(rows[0]), token: sign(rows[0].id) });
});

export const userRouter = Router();
userRouter.use(requireAuth);

userRouter.get("/me", async (req, res) => {
  const { rows } = await query(`SELECT ${USER_COLS} FROM users WHERE id = $1`, [req.userId]);
  if (!rows[0]) throw notFound("User");
  res.json({ user: toUser(rows[0]) });
});

userRouter.put("/me", async (req, res) => {
  const body = profileSchema.parse(req.body);
  const { rows: current } = await query("SELECT email, password_hash FROM users WHERE id = $1", [req.userId]);
  if (!current[0]) throw notFound("User");
  if (current[0].email === DEMO_EMAIL && ((body.email && body.email !== current[0].email) || body.newPassword)) {
    throw new HttpError(403, "The demo account's email and password can't be changed", "DEMO_READ_ONLY");
  }
  let hash = null;
  if (body.newPassword) {
    if (!(await bcrypt.compare(body.currentPassword, current[0].password_hash))) {
      throw new HttpError(400, "Current password is incorrect", "INVALID_CREDENTIALS");
    }
    hash = await bcrypt.hash(body.newPassword, BCRYPT_ROUNDS);
  }
  try {
    const { rows } = await query(
      `UPDATE users SET name = COALESCE($2, name), email = COALESCE($3, email), currency = COALESCE($4, currency),
         budget_alerts = COALESCE($5, budget_alerts), password_hash = COALESCE($6, password_hash), updated_at = now()
       WHERE id = $1 RETURNING ${USER_COLS}`,
      [req.userId, body.name, body.email, body.currency, body.budgetAlerts, hash],
    );
    if (!rows[0]) throw notFound("User");
    res.json({ user: toUser(rows[0]) });
  } catch (err) {
    if (err.code === "23505") throw new HttpError(409, "An account with this email already exists", "EMAIL_TAKEN");
    throw err;
  }
});
