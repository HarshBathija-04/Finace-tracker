import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "../src/app.js";
import { pool } from "../src/db.js";
import { runRecurring } from "../src/services/recurring.js";

const api = request(app);
const auth = (t) => ({ Authorization: `Bearer ${t}` });
let alice;
let bob;

async function register(name) {
  const res = await api
    .post("/api/auth/register")
    .send({ name, email: `${name}-${Date.now()}@example.com`, password: "correct-horse-1" });
  expect(res.status).toBe(201);
  return res.body;
}

beforeAll(async () => {
  alice = await register("alice");
  bob = await register("bob");
});
afterAll(() => pool.end());

describe("health", () => {
  it("checks the database", async () => {
    const res = await api.get("/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok", db: "ok" });
  });
});

describe("auth", () => {
  it("never returns the password hash", () => {
    expect(alice.user).not.toHaveProperty("password_hash");
    expect(alice.user.currency).toBe("INR");
  });
  it("rejects duplicate emails case-insensitively", async () => {
    const res = await api
      .post("/api/auth/register")
      .send({ name: "x", email: alice.user.email.toUpperCase(), password: "correct-horse-1" });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("EMAIL_TAKEN");
  });
  it("logs in and rejects bad passwords with one generic message", async () => {
    const ok = await api.post("/api/auth/login").send({ email: alice.user.email, password: "correct-horse-1" });
    expect(ok.status).toBe(200);
    const bad = await api.post("/api/auth/login").send({ email: alice.user.email, password: "wrong-password" });
    const missing = await api.post("/api/auth/login").send({ email: "nobody@example.com", password: "wrong-password" });
    expect(bad.status).toBe(401);
    expect(missing.body).toEqual(bad.body);
  });
  it("validates input", async () => {
    const res = await api.post("/api/auth/register").send({ name: "", email: "nope", password: "short" });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });
  it("requires a valid token", async () => {
    expect((await api.get("/api/user/me")).status).toBe(401);
    expect((await api.get("/api/user/me").set(auth("garbage"))).status).toBe(401);
    expect((await api.get("/api/user/me").set(auth(alice.token))).body.user.id).toBe(alice.user.id);
  });
  it("needs the current password to change it", async () => {
    const res = await api.put("/api/user/me").set(auth(alice.token)).send({ newPassword: "another-pass-2" });
    expect(res.status).toBe(400);
  });
  it("reports the demo as unavailable until seeded", async () => {
    expect((await api.post("/api/auth/demo")).status).toBe(503);
  });
});

describe("transactions", () => {
  let txnId;
  it("creates with integer minor units", async () => {
    const res = await api.post("/api/transactions").set(auth(alice.token)).send({
      type: "expense",
      category: "food",
      amountMinor: 45050,
      date: "2026-03-10",
      payment: "upi",
      note: "Team lunch",
    });
    expect(res.status).toBe(201);
    expect(res.body.transaction).toMatchObject({ amountMinor: 45050, date: "2026-03-10", category: "food" });
    txnId = res.body.transaction.id;
  });
  it("rejects floats and mismatched categories", async () => {
    const float = await api
      .post("/api/transactions")
      .set(auth(alice.token))
      .send({ type: "expense", category: "food", amountMinor: 10.5 });
    const mismatch = await api
      .post("/api/transactions")
      .set(auth(alice.token))
      .send({ type: "income", category: "food", amountMinor: 100 });
    expect(float.status).toBe(400);
    expect(mismatch.status).toBe(400);
  });
  it("filters and totals", async () => {
    await api
      .post("/api/transactions")
      .set(auth(alice.token))
      .send({ type: "income", category: "salary", amountMinor: 5000000, date: "2026-03-01" });
    const res = await api
      .get("/api/transactions?type=expense&q=lunch&from=2026-03-01&to=2026-03-31")
      .set(auth(alice.token));
    expect(res.body.total).toBe(1);
    expect(res.body.totals).toEqual({ incomeMinor: 0, expenseMinor: 45050 });
  });
  it("isolates users", async () => {
    expect((await api.get("/api/transactions").set(auth(bob.token))).body.total).toBe(0);
    const body = { type: "expense", category: "food", amountMinor: 1 };
    expect((await api.put(`/api/transactions/${txnId}`).set(auth(bob.token)).send(body)).status).toBe(404);
    expect((await api.delete(`/api/transactions/${txnId}`).set(auth(bob.token))).status).toBe(404);
  });
  it("updates and deletes own rows", async () => {
    const upd = await api
      .put(`/api/transactions/${txnId}`)
      .set(auth(alice.token))
      .send({ type: "expense", category: "food", amountMinor: 50000, date: "2026-03-10" });
    expect(upd.body.transaction.amountMinor).toBe(50000);
    expect((await api.delete(`/api/transactions/${txnId}`).set(auth(alice.token))).status).toBe(204);
  });
});

describe("budgets, reports and alerts", () => {
  it("tracks spend against category limits and raises one alert", async () => {
    const put = await api
      .put("/api/budgets/2026/4")
      .set(auth(bob.token))
      .send({ limitMinor: 100000, categories: [{ category: "shopping", limitMinor: 10000 }] });
    expect(put.status).toBe(200);
    for (const day of ["2026-04-02", "2026-04-03"]) {
      await api
        .post("/api/transactions")
        .set(auth(bob.token))
        .send({ type: "expense", category: "shopping", amountMinor: 6000, date: day });
    }
    const { body } = await api.get("/api/budgets/2026/4").set(auth(bob.token));
    expect(body.budget.spentMinor).toBe(12000);
    expect(body.budget.categories[0]).toMatchObject({ category: "shopping", spentMinor: 12000, status: "exceeded" });
    const notes = await api.get("/api/notifications").set(auth(bob.token));
    expect(notes.body.items.filter((n) => n.message.includes("gone over your April shopping")).length).toBe(1);
    expect((await api.get("/api/budgets/2026/4").set(auth(alice.token))).body.budget).toBeNull();
  });
  it("summarizes a month", async () => {
    const { body } = await api.get("/api/reports/summary?year=2026&month=4").set(auth(bob.token));
    expect(body.summary).toMatchObject({ expenseMinor: 12000, incomeMinor: 0, balanceMinor: -12000 });
    expect(body.summary.daily).toHaveLength(30);
    const trend = await api.get("/api/reports/trend?year=2026&month=4&months=3").set(auth(bob.token));
    expect(trend.body.trend.map((t) => t.month)).toEqual(["2026-02", "2026-03", "2026-04"]);
  });
  it("fails AI insights gracefully without a key", async () => {
    const res = await api.get("/api/reports/insights?year=2026&month=4").set(auth(bob.token));
    expect(res.status).toBe(503);
    expect(res.body.error.code).toBe("AI_UNAVAILABLE");
  });
});

describe("recurring", () => {
  it("copies templates forward once and can be paused", async () => {
    const res = await api
      .post("/api/transactions")
      .set(auth(alice.token))
      .send({
        type: "expense",
        category: "rent",
        amountMinor: 2000000,
        date: "2026-01-05",
        recurring: { frequency: "monthly" },
      });
    await runRecurring("2026-03-20");
    await runRecurring("2026-03-20");
    const list = await api.get("/api/transactions?category=rent").set(auth(alice.token));
    expect(list.body.items.map((t) => t.date)).toEqual(["2026-03-05", "2026-02-05", "2026-01-05"]);
    const paused = await api
      .patch(`/api/transactions/${res.body.transaction.id}/recurring`)
      .set(auth(alice.token))
      .send({ status: "paused" });
    expect(paused.body.transaction.recurring.status).toBe("paused");
  });
});

describe("hardening", () => {
  it("returns JSON 404s and rejects foreign origins", async () => {
    const res = await api.get("/api/nope");
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("NOT_FOUND");
    const cors = await api.get("/health").set("Origin", "https://evil.example");
    expect(cors.headers["access-control-allow-origin"]).toBeUndefined();
  });
});
