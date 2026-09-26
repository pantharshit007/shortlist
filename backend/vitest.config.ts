import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["test/**/*.test.ts"],
    // Modules that read config need these; unit tests never touch the database.
    env: {
      DATABASE_URL: "postgres://test:test@localhost:5432/test",
      BETTER_AUTH_SECRET: "test-secret-that-is-at-least-32-characters-long",
      LOG_LEVEL: "fatal",
    },
    testTimeout: 60_000,
  },
});
