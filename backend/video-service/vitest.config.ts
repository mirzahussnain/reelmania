import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    // Controllers/utils are unit-tested with Prisma + Redis mocked, so no
    // real datastore is required (see backend test strategy, IMPLEMENTATION_PLAN 9).
    globals: false,
  },
});
