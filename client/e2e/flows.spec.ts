import { test, expect } from "@playwright/test";

/**
 * Phase 9 E2E flows — DEFERRED.
 *
 * These are intentionally skipped: they require the full stack (user-service +
 * video-service + Mongo/Postgres/Redis/RabbitMQ) and a Clerk test identity,
 * which CI does not stand up yet. They document the flows to implement once a
 * seeded test environment exists. See playwright.config.ts and
 * docs/IMPLEMENTATION_PLAN.md (Phase 9).
 */

test.describe("ReelMania critical flows", () => {
  test.skip("sign-in → upload → video appears in Vault via /videos/user/:id", async () => {
    // 1. Sign in as the seeded Clerk test user.
    // 2. Upload a small video; wait for the create-video request to resolve.
    // 3. Navigate to the Vault; assert the new video renders (per-user endpoint).
  });

  test.skip("like reflects across two tabs (socket rooms)", async () => {
    // 1. Open the same video in two browser contexts.
    // 2. Like in tab A; assert the like count increments in tab B (LIKES_CHANGED room event).
  });

  test.skip("profile edit updates name/avatar across video cards", async () => {
    // 1. Edit profile (name/avatar) via Clerk.
    // 2. Assert the RabbitMQ user.updated fan-out back-fills video-service so
    //    existing cards show the new name/avatar.
    expect(true).toBe(true);
  });
});
