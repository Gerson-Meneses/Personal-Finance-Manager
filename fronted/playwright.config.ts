import { defineConfig } from "@playwright/test";

const testDatabaseUrl =
  process.env.TEST_DATABASE_URL ??
  "postgresql://postgres:admin123@localhost:5432/finance_manager_test?sslmode=disable";

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  expect: { timeout: 20_000 },
  fullyParallel: false,
  workers: 1,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: "http://127.0.0.1:5174",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  webServer: [
    {
      command: "bun run --cwd ../backend db:migrate && bun run --cwd ../backend dev",
      url: "http://127.0.0.1:3100/health/live",
      timeout: 120_000,
      reuseExistingServer: !process.env.CI,
      env: {
        NODE_ENV: "test",
        TEST_DATABASE_URL: testDatabaseUrl,
        JWT_SECRET: process.env.JWT_SECRET ?? "e2e-secret-key-with-at-least-32-characters",
        DISABLE_EMAILS: "true",
        PORT: "3100",
        CORS_ORIGINS: "http://127.0.0.1:5174,http://localhost:5174",
      },
    },
    {
      command: "npm run dev -- --host 127.0.0.1 --port 5174",
      url: "http://127.0.0.1:5174",
      timeout: 120_000,
      reuseExistingServer: !process.env.CI,
      env: {
        VITE_API_URL: "http://127.0.0.1:3100",
        VITE_DISABLE_ONBOARDING: "true",
      },
    },
  ],
});
