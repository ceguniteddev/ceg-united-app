export const resolveDodoEnvironment = (env: NodeJS.ProcessEnv = process.env) =>
  env.DODO_PAYMENTS_ENVIRONMENT === "live_mode" ? "live_mode" : "test_mode";

export const resolveDodoReturnUrl = (env: NodeJS.ProcessEnv = process.env) =>
  env.DODO_PAYMENTS_RETURN_URL ||
  `${env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}`;

export const dodoEnvironment = resolveDodoEnvironment();
export const dodoReturnUrl = resolveDodoReturnUrl();
