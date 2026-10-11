import { defineConfig } from "@playwright/test";

/**
 * تست‌های E2E روی نسخه‌ی production (npm run build && npm start).
 * کد OTP در حالت پیامک «console» از لاگ سرور خوانده می‌شود: E2E_SERVER_LOG
 */
export default defineConfig({
  testDir: "tests/e2e",
  timeout: 60_000,
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000",
    locale: "fa-IR",
    launchOptions: process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : undefined,
  },
});
