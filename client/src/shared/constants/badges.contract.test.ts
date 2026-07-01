import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, it, expect } from "vitest";
import { BADGE_ASSETS } from "./badges";

// Contract guard for the cross-service badge-id coupling (Option 2).
//
// The server (user-service `deriveBadges`) emits badges by id; this client maps
// those ids → images. Nothing at build time links the two repos, so a rename on
// one side would silently break badges in production. This test reads the
// canonical ids straight from the server's constants file and asserts the client
// has an asset for every one — so an id drift fails CI instead of shipping.

const SERVER_BADGES = path.resolve(
  process.cwd(),
  "../backend/user-service/src/constants/badges.ts"
);

/** Extract the string values of the `BADGES` object from the server source. */
const readServerBadgeIds = (): string[] => {
  const source = readFileSync(SERVER_BADGES, "utf8");
  const block = source.match(/export const BADGES\s*=\s*{([\s\S]*?)}\s*as const;/);
  if (!block) throw new Error("Could not locate the BADGES object in the server source");
  return [...block[1].matchAll(/:\s*"([^"]+)"/g)].map((m) => m[1]);
};

describe("badge id contract (server ↔ client)", () => {
  // Skip gracefully if the backend isn't present (e.g. a client-only checkout);
  // in the monorepo CI both are available and the guard runs.
  const run = existsSync(SERVER_BADGES) ? it : it.skip;

  run("every server badge id has a client asset", () => {
    const serverIds = readServerBadgeIds();
    expect(serverIds.length).toBeGreaterThan(0);

    const missing = serverIds.filter((id) => !(id in BADGE_ASSETS));
    expect(
      missing,
      `Server emits badge id(s) with no client asset in BADGE_ASSETS: ${missing.join(", ")}`
    ).toEqual([]);
  });
});
