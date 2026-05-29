import { defineConfig, devices } from "@playwright/test";

const EXTRA_LIBS = "/tmp/playwright-libs/extracted/usr/lib/x86_64-linux-gnu";
const LD_LIBRARY_PATH = process.env.LD_LIBRARY_PATH
  ? `${EXTRA_LIBS}:${process.env.LD_LIBRARY_PATH}`
  : EXTRA_LIBS;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    launchOptions: {
      env: { LD_LIBRARY_PATH },
    },
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
