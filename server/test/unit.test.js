import { describe, expect, it } from "vitest";
import { toMinor, monthRange, isValidCategory } from "../src/lib/domain.js";
import { budgetStatus } from "../src/services/budgets.js";
import { dueDates, nextOccurrence } from "../src/services/recurring.js";
import { normalizeReceipt } from "../src/services/ai.js";
import { buildInsightPayload } from "../src/routes/reports.js";
import { demoTransactions } from "../src/seed.js";

describe("toMinor", () => {
  it("parses decimals without float error", () => {
    expect(toMinor("245.5")).toBe(24550);
    expect(toMinor("1.005")).toBe(101);
    expect(toMinor("19.99")).toBe(1999);
    expect(toMinor(42)).toBe(4200);
  });
  it("rejects junk", () => {
    for (const bad of ["", "-5", "1e3", "abc", null, "1.2.3"]) expect(toMinor(bad)).toBeNull();
  });
});

describe("monthRange", () => {
  it("wraps December", () => expect(monthRange(2026, 12)).toEqual(["2026-12-01", "2027-01-01"]));
});

describe("budgetStatus", () => {
  it("applies thresholds", () => {
    expect(budgetStatus(79, 100)).toBe("ok");
    expect(budgetStatus(80, 100)).toBe("warning");
    expect(budgetStatus(100, 100)).toBe("warning");
    expect(budgetStatus(101, 100)).toBe("exceeded");
    expect(budgetStatus(500, 0)).toBe("ok");
  });
});

describe("recurring schedule", () => {
  it("clamps monthly to short months and restores the anchor day", () => {
    expect(nextOccurrence("2026-01-31", "monthly", 31)).toBe("2026-02-28");
    expect(nextOccurrence("2026-02-28", "monthly", 31)).toBe("2026-03-31");
    expect(nextOccurrence("2026-12-15", "monthly", 15)).toBe("2027-01-15");
  });
  it("lists due dates up to today and the end date", () => {
    expect(dueDates({ lastRun: "2026-03-01", frequency: "weekly", today: "2026-03-22" })).toEqual([
      "2026-03-08",
      "2026-03-15",
      "2026-03-22",
    ]);
    expect(dueDates({ lastRun: "2026-03-01", frequency: "daily", today: "2026-03-10", endDate: "2026-03-03" })).toEqual(
      ["2026-03-02", "2026-03-03"],
    );
    expect(dueDates({ lastRun: "2026-03-01", frequency: "monthly", anchorDay: 1, today: "2026-03-31" })).toEqual([]);
  });
});

describe("normalizeReceipt", () => {
  it("coerces model output into a safe draft", () => {
    expect(
      normalizeReceipt({
        type: "weird",
        amount: "1,234.50",
        category: "Groceries",
        date: "2026-02-30x",
        payment: "crypto",
      }),
    ).toEqual({ type: "expense", category: "groceries", amountMinor: 123450, date: null, payment: null, note: null });
  });
});

describe("isValidCategory", () => {
  it("ties categories to type", () => {
    expect(isValidCategory("income", "salary")).toBe(true);
    expect(isValidCategory("expense", "salary")).toBe(false);
  });
});

describe("buildInsightPayload", () => {
  it("sends only aggregates in major units", () => {
    const payload = buildInsightPayload(
      {
        currency: "INR",
        year: 2026,
        month: 3,
        incomeMinor: 500000,
        expenseMinor: 123456,
        savingsRate: 75.3,
        avgDailySpendMinor: 3982,
        previous: { incomeMinor: 0, expenseMinor: 100 },
        byCategory: [{ category: "food", amountMinor: 123456 }],
      },
      null,
    );
    expect(payload).toMatchObject({
      month: "2026-03",
      income: 5000,
      expenses: 1234.56,
      expensesByCategory: { food: 1234.56 },
    });
    expect(JSON.stringify(payload)).not.toMatch(/note|email|name/);
  });
});

describe("demoTransactions", () => {
  it("is deterministic and never in the future", () => {
    const today = new Date(Date.UTC(2026, 10, 11));
    const a = demoTransactions(today);
    expect(a).toEqual(demoTransactions(today));
    expect(a.every((t) => t.date <= "2026-11-11" && Number.isInteger(t.amountMinor) && t.amountMinor > 0)).toBe(true);
  });
});
