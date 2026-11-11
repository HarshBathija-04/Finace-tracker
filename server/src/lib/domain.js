import { z } from "zod";

export const EXPENSE_CATEGORIES = [
  "groceries",
  "food",
  "shopping",
  "travel",
  "entertainment",
  "bills",
  "utilities",
  "rent",
  "health",
  "education",
  "other",
];
export const INCOME_CATEGORIES = ["salary", "freelance", "investments", "gifts", "refund", "other"];
// Only 2-decimal currencies, because every amount is stored in hundredths.
export const CURRENCIES = ["INR", "USD", "EUR", "GBP", "CAD", "AUD", "SGD", "AED"];
export const PAYMENTS = ["card", "cash", "upi", "bank"];
export const FREQUENCIES = ["daily", "weekly", "monthly"];

export const isValidCategory = (type, category) =>
  (type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).includes(category);

// Money crosses the API as integer minor units; 10^12 minor units is far beyond any personal amount.
export const minorAmount = z.number().int().positive().max(1e12);
export const isoDate = z.iso.date();
export const yearMonth = {
  year: z.coerce.number().int().min(2000).max(2100),
  month: z.coerce.number().int().min(1).max(12),
};

/**
 * Converts a decimal amount ("245.5", 245.5) to integer minor units without float multiplication.
 * Returns null for anything that is not a non-negative decimal number.
 */
export function toMinor(value) {
  const match = /^(\d{1,12})(?:\.(\d+))?$/.exec(String(value ?? "").trim());
  if (!match) return null;
  const [, whole, frac = ""] = match;
  const cents = Number((frac + "00").slice(0, 2));
  const roundUp = Number(frac[2] ?? 0) >= 5 ? 1 : 0;
  return Number(whole) * 100 + cents + roundUp;
}

export class HttpError extends Error {
  constructor(status, message, code = "ERROR") {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export const notFound = (what) => new HttpError(404, `${what} not found`, "NOT_FOUND");

const pad = (n) => String(n).padStart(2, "0");
export const ymd = (y, m, d) => `${y}-${pad(m)}-${pad(d)}`;
export const todayIso = () => new Date().toISOString().slice(0, 10);

export const monthRange = (year, month) => {
  const next = month === 12 ? [year + 1, 1] : [year, month + 1];
  return [ymd(year, month, 1), ymd(next[0], next[1], 1)];
};
