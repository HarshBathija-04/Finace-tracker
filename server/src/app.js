import express from "express";
import cors from "cors";
import helmet from "helmet";
import { config } from "./config.js";
import { query } from "./db.js";
import { authRouter, userRouter } from "./routes/auth.js";
import { transactionsRouter } from "./routes/transactions.js";
import { budgetsRouter } from "./routes/budgets.js";
import { reportsRouter } from "./routes/reports.js";
import { notificationsRouter } from "./routes/notifications.js";
import { errorHandler, notFoundHandler } from "./middleware.js";

export const app = express();

app.set("trust proxy", 1); // Render terminates TLS in front of the app; needed for per-IP rate limits.
app.disable("x-powered-by");
app.use(helmet());
app.use(
  cors({
    origin: (origin, cb) => cb(null, !origin || config.frontendUrls.includes(origin)),
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    maxAge: 86400,
  }),
);
app.use(express.json({ limit: "100kb" }));

app.get("/", (_req, res) => res.json({ name: "FinSight API", status: "ok", health: "/health" }));

app.get("/health", async (_req, res) => {
  try {
    await query("SELECT 1");
    res.json({ status: "ok", db: "ok" });
  } catch {
    res.status(503).json({ status: "error", db: "error" });
  }
});

app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);
app.use("/api/transactions", transactionsRouter);
app.use("/api/budgets", budgetsRouter);
app.use("/api/reports", reportsRouter);
app.use("/api/notifications", notificationsRouter);

app.use(notFoundHandler);
app.use(errorHandler);
