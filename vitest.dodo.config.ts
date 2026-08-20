import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: { alias: { "@": path.resolve(__dirname, "./") } },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["__tests__/setup.ts"],
    include: [
      "__tests__/service/dodo/**/*.test.ts",
      "__tests__/hooks/dodo.test.tsx",
      "__tests__/components/funding/DodoCheckoutView.test.tsx",
      "__tests__/api/dodo/**/*.test.ts",
      "__tests__/lib/dodo-sdk.test.ts",
    ],
    coverage: {
      provider: "istanbul",
      include: [
        "service/dodo/**",
        "hooks/dodo.ts",
        "hooks/admin/payments/dodo.ts",
        "lib/dodo-sdk.ts",
        "lib/dodo-env.ts",
      ],
      thresholds: {
        statements: 100,
        branches: 100,
        functions: 100,
        lines: 100,
      },
    },
  },
});
