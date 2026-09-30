import { z } from "zod";

export const ApiScopes = {
  HEALTH_READ: "health:read",
  CLIENTS_READ: "clients:read",
  SNAPSHOT_READ: "snapshot:read",
  PAYMENTS_READ: "payments:read",
  CREDIT_READ: "credit:read",
  FUNDING_READ: "funding:read",
  NOTES_READ: "notes:read",
  NOTES_WRITE: "notes:write",
  KEYS_MANAGE: "keys:manage",
  INCLUDE_SSN_LAST4: "include:ssn_last4",
  INCLUDE_CREDIT_SCORES: "include:credit_scores",
  INCLUDE_NEGATIVES_SUMMARY: "include:negatives_summary",
} as const;

export type ApiScope = (typeof ApiScopes)[keyof typeof ApiScopes];

export const ALL_SCOPES = Object.values(ApiScopes);

export const apiKeySchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Name is required"),
  keyPrefix: z.string(),
  keyHash: z.string(),
  scopes: z.array(z.string()).min(1, "At least one scope is required"),
  rateLimit: z
    .object({
      burstPerMinute: z.number().default(600),
      hourlyQuota: z.number().default(10000),
    })
    .default({
      burstPerMinute: 600,
      hourlyQuota: 10000,
    }),
  status: z.enum(["active", "revoked"]).default("active"),
  createdAt: z.string(),
  expiresAt: z.string().nullable().optional(),
  lastUsedAt: z.string().nullable().optional(),
});

export type ApiKeyRecord = z.infer<typeof apiKeySchema>;
