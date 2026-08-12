import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["test/**/*.test.ts"],
    // PostgreSQL integration files share one disposable test database.
    // Run files serially so their reset/seed phases cannot overlap.
    fileParallelism: false,
  },
});
