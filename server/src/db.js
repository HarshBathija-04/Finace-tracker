import pg from "pg";
import { config } from "./config.js";

// BIGINT (money in minor units, counts) -> JS number. Safe: amounts stay far below 2^53.
pg.types.setTypeParser(20, (v) => Number(v));
// DATE -> "YYYY-MM-DD" string, avoiding timezone shifts from JS Date.
pg.types.setTypeParser(1082, (v) => v);

const needsSsl = /\.render\.com|sslmode=require/.test(config.databaseUrl);

export const pool = new pg.Pool({
  connectionString: config.databaseUrl,
  // Render's internal URL needs no TLS; external URLs do. DATABASE_SSL_NO_VERIFY is an escape hatch only.
  ssl: needsSsl ? { rejectUnauthorized: process.env.DATABASE_SSL_NO_VERIFY !== "true" } : false,
  max: 5,
  // Every app shares one database; this app's tables live in its own schema.
  options: `-c search_path=${config.dbSchema}`,
});

export const query = (text, params) => pool.query(text, params);

export async function withTransaction(fn) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}
