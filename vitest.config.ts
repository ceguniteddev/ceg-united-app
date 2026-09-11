import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
      "server-only": path.resolve(
        __dirname,
        "./__tests__/empty-server-only.ts",
      ),
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    include: ["__tests__/**/*.test.ts", "__tests__/**/*.test.tsx"],
    exclude: ["node_modules", ".next"],
    setupFiles: ["__tests__/setup.ts"],
  },
});
