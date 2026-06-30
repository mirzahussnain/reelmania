import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    // Controllers are unit-tested with Prisma mocked — no real datastore needed.
    globals: false,
  },
});
