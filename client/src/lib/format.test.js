import { describe, expect, it } from "vitest";
import { formatMoney, minorToInput, parseToMinor, percentChange, periodRange, shiftPeriod } from "./format";

describe("parseToMinor", () => {
  it("turns typed amounts into exact minor units", () => {
    expect(parseToMinor("245.5")).toBe(24550);
    expect(parseToMinor("1,234.05")).toBe(123405);
    expect(parseToMinor("0.1")).toBe(10);
    expect(parseToMinor("19.99")).toBe(1999);
  });
  it("rejects zero, negatives, junk and extra decimals", () => {
    for (const bad of ["", "0", "0.00", "-4", "abc", "1.234", "1e5"]) expect(parseToMinor(bad)).toBeNull();
  });
  it("round-trips with minorToInput", () => {
    for (const m of [1, 10, 99, 100, 123405]) expect(parseToMinor(minorToInput(m))).toBe(m);
  });
});

describe("formatMoney", () => {
  it("formats INR with Indian grouping", () => {
    expect(formatMoney(19482200, "INR")).toBe("₹1,94,822.00");
    expect(formatMoney(150000, "USD")).toBe("$1,500.00");
  });
});

describe("period helpers", () => {
  it("wraps years and knows month lengths", () => {
    expect(shiftPeriod({ year: 2026, month: 1 }, -1)).toEqual({ year: 2025, month: 12 });
    expect(periodRange({ year: 2028, month: 2 })).toEqual({ from: "2028-02-01", to: "2028-02-29" });
  });
  it("computes percent change, null without a baseline", () => {
    expect(percentChange(150, 100)).toBe(50);
    expect(percentChange(5, 0)).toBeNull();
  });
});
