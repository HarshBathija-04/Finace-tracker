// Fresh, isolated schema for each run; never touches the app's real schema.
export async function setup() {
  Object.assign(process.env, { DB_SCHEMA: "finance_tracker_test", JWT_SECRET: "test-secret" });
  const { pool } = await import("../src/db.js");
  await pool.query("DROP SCHEMA IF EXISTS finance_tracker_test CASCADE");
  const { migrate } = await import("../src/migrate.js");
  await migrate();
  await pool.end();
}
