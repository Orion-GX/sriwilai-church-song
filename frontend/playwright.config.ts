import path from "node:path";

import { config as loadEnv } from "dotenv";
import { defineConfig, devices } from "@playwright/test";

loadEnv({
  path: path.join(__dirname, ".env.test"),
  quiet: true,
});

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? "github" : [["html", { open: "never" }]],
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: process.env.PLAYWRIGHT_NO_WEB_SERVER
    ? undefined
    : {
        /** CI: `yarn build && PLAYWRIGHT_USE_PROD_SERVER=1 yarn test:e2e` — ลดไฟล์ watcher ของ `next dev` */
        command:
          process.env.PLAYWRIGHT_USE_PROD_SERVER === "1" ? "yarn start" : "yarn dev",
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
});
