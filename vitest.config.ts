import { defineConfig } from "vitest/config";
// import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  resolve:{
    tsconfigPaths: true,
  },
  // plugins: [tsconfigPaths()],
  test: {
    globals: true,
    environment: "jsdom",
    include: ["__tests__/**/*.test.ts", "__tests__/**/*.test.tsx"],
    exclude: ["node_modules", ".next"],
    coverage: {
      provider: "v8",
      include: ["lib/**", "schema/**", "service/**", "hooks/**"],
      exclude: ["node_modules", ".next"],
    },
    setupFiles: ["__tests__/setup.ts"],
  },
});
