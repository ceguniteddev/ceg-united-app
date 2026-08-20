/// <reference types="vitest/globals" />

describe("Dodo SDK", () => {
  it("initializes in test mode with safe test fallbacks", async () => {
    const { createDodoClient, dodoClient } = await import("@/lib/dodo-sdk");
    expect(createDodoClient({} as NodeJS.ProcessEnv)).toBeTruthy();
    expect(dodoClient).toBeTruthy();
  });

  it("initializes in live mode with configured credentials", async () => {
    const { createDodoClient } = await import("@/lib/dodo-sdk");
    expect(
      createDodoClient({
        DODO_PAYMENTS_API_KEY: "dodo_live_example",
        DODO_PAYMENTS_WEBHOOK_KEY: "whsec_example",
        DODO_PAYMENTS_ENVIRONMENT: "live_mode",
      } as unknown as NodeJS.ProcessEnv),
    ).toBeTruthy();
  });
});

describe("Dodo environment", () => {
  it("resolves safe environments and return URLs", async () => {
    const { resolveDodoEnvironment, resolveDodoReturnUrl } =
      await import("@/lib/dodo-env");
    expect(resolveDodoEnvironment({} as NodeJS.ProcessEnv)).toBe("test_mode");
    expect(
      resolveDodoEnvironment({
        DODO_PAYMENTS_ENVIRONMENT: "live_mode",
      } as unknown as NodeJS.ProcessEnv),
    ).toBe("live_mode");
    expect(resolveDodoReturnUrl({} as NodeJS.ProcessEnv)).toBe(
      "http://localhost:3000/client/home",
    );
    expect(
      resolveDodoReturnUrl({
        NEXT_PUBLIC_APP_URL: "https://app.example",
      } as unknown as NodeJS.ProcessEnv),
    ).toBe("https://app.example/client/home");
    expect(
      resolveDodoReturnUrl({
        DODO_PAYMENTS_RETURN_URL: "https://return.example",
      } as unknown as NodeJS.ProcessEnv),
    ).toBe("https://return.example");
  });
});
