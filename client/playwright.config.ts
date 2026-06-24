import { defineConfig, devices } from "@playwright/test";

/**
 * E2E scaffold (Phase 9 — flows intentionally deferred).
 *
 * The real flows (sign-in → upload → Vault, cross-tab like via rooms,
 * profile-edit propagation) need the full stack running — both services, the
 * four datastores, and a Clerk test user — so they are NOT wired into CI yet.
 * This config + the placeholder spec capture the intended structure so the
 * suite can be filled in once a seeded test environment exists.
 *
 * Run locally against an already-running app:  npm run test:e2e
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: "list",
  use: {
    baseURL: process.env.E2E_BASE_URL || "http://localhost:5173",
    trace: "on-first-retry",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
});
