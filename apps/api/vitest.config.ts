import { defineConfig } from "vitest/config";
import { resolve } from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      // Only measure coverage on pure logic — exclude infra files that
      // require live DB / Redis connections (those belong in integration tests)
      include: ["src/services/compare-engine.ts"],
      thresholds: {
        lines: 85,
        branches: 80,
        functions: 90,
      },
    },
  },
  resolve: {
    alias: {
      "@jsontools/shared": resolve(__dirname, "../../packages/shared/src/index.ts"),
    },
  },
});
