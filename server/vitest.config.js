import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    env: {
      NODE_ENV: "test",
      DB_SCHEMA: "finance_tracker_test",
      JWT_SECRET: "test-secret",
      GROQ_API_KEY: "",
      DATABASE_URL: process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5433/portfolio",
    },
    globalSetup: "./test/global-setup.js",
    fileParallelism: false,
    testTimeout: 20000,
  },
});
