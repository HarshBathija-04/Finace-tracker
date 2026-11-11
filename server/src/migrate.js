import { readdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { pool, query, withTransaction } from "./db.js";
import { config } from "./config.js";

const dir = fileURLToPath(new URL("../migrations/", import.meta.url));

export async function migrate() {
  await query(`CREATE SCHEMA IF NOT EXISTS ${config.dbSchema}`);
  await query(
    "CREATE TABLE IF NOT EXISTS schema_migrations (name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())",
  );
  const { rows } = await query("SELECT name FROM schema_migrations");
  const applied = new Set(rows.map((r) => r.name));
  const files = (await readdir(dir)).filter((f) => f.endsWith(".sql") && !applied.has(f)).sort();
  for (const file of files) {
    const sql = await readFile(dir + file, "utf8");
    await withTransaction(async (db) => {
      await db.query(sql);
      await db.query("INSERT INTO schema_migrations (name) VALUES ($1)", [file]);
    });
    console.log(`migrated ${file}`);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  migrate()
    .then(() => pool.end())
    .catch((err) => {
      console.error("Migration failed:", err.message);
      process.exit(1);
    });
}
