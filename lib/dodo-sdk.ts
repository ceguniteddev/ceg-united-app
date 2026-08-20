import DodoPayments from "dodopayments";

import { dodoEnvironment, resolveDodoEnvironment } from "@/lib/dodo-env";

export const createDodoClient = (env: NodeJS.ProcessEnv = process.env) =>
  new DodoPayments({
    bearerToken: env.DODO_PAYMENTS_API_KEY || "dodo_test_dummy-key-for-tests",
    webhookKey: env.DODO_PAYMENTS_WEBHOOK_KEY || "dummy-webhook-key-for-tests",
    environment:
      env === process.env ? dodoEnvironment : resolveDodoEnvironment(env),
  });

export const dodoClient = createDodoClient();
