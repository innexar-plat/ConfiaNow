import { defineConfig } from "@playwright/test";

const webPort = Number(process.env.E2E_WEB_PORT ?? 3100);
const apiPort = Number(process.env.E2E_API_PORT ?? 3333);

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI
    ? [["list"], ["html", { open: "never" }]]
    : [["list"]],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? `http://localhost:${webPort}`,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure"
  },
  webServer: [
    {
      command: `npm run dev --workspace @platform/api`,
      url: `http://127.0.0.1:${apiPort}/api/v1/health/ready`,
      reuseExistingServer: !process.env.CI,
      timeout: 120000
    },
    {
      command: `npm run dev --workspace @platform/web -- --port ${webPort}`,
      url: `http://localhost:${webPort}/signin`,
      reuseExistingServer: !process.env.CI,
      timeout: 120000
    }
  ]
});