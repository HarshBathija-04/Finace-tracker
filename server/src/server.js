import { app } from "./app.js";
import { config } from "./config.js";
import { pool } from "./db.js";
import { runRecurring } from "./services/recurring.js";

const server = app.listen(config.port, () => console.log(`FinSight API listening on :${config.port}`));

const recurring = () =>
  runRecurring()
    .then((n) => n && console.log(`recurring: created ${n} transaction(s)`))
    .catch((err) => console.error("recurring run failed:", err.message));
recurring();
setInterval(recurring, 6 * 60 * 60_000).unref();

const shutdown = () => {
  server.close(() => pool.end().finally(() => process.exit(0)));
  setTimeout(() => process.exit(1), 10_000).unref();
};
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
