import "dotenv/config";

const env = process.env;
const isProd = env.NODE_ENV === "production";

function required(name, devFallback) {
  const value = env[name] || (isProd ? undefined : devFallback);
  if (!value) throw new Error(`Missing required env var ${name}`);
  return value;
}

const schema = env.DB_SCHEMA || "finance_tracker";
// The schema name is interpolated into SQL, so only allow plain identifiers.
if (!/^[a-z_][a-z0-9_]{0,62}$/.test(schema)) throw new Error("DB_SCHEMA must be a lowercase identifier");

export const config = {
  isProd,
  port: Number(env.PORT) || 5122,
  databaseUrl: required("DATABASE_URL", "postgresql://postgres:postgres@localhost:5433/portfolio"),
  dbSchema: schema,
  jwtSecret: required("JWT_SECRET", "dev-only-insecure-secret"),
  jwtExpiresIn: env.JWT_EXPIRES_IN || "7d",
  frontendUrls: (env.FRONTEND_URL || "http://localhost:5211")
    .split(",")
    .map((s) => s.trim().replace(/\/$/, ""))
    .filter(Boolean),
  groqApiKey: env.GROQ_API_KEY || "",
  groqTextModel: env.GROQ_TEXT_MODEL || "openai/gpt-oss-120b",
  groqVisionModel: env.GROQ_VISION_MODEL || "qwen/qwen3.8-27b",
};
