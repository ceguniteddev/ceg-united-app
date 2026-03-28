import { z } from "zod";

export const SpecialDealTagEnum = z.enum([
  "Flash Sale",
  "Limited Time",
  "Best Value",
]);

export const SpecialDealSchema = z.object({
  id: z.string().optional(),
  // From pricing table
  image: z.string().url().optional().or(z.literal("")),
  bank_name: z.string().min(1, "Bank name is required"),
  card_id: z.string().min(1, "Card ID is required"),
  credit_limit: z.number().positive("Credit limit must be positive"),
  date_opened: z.string().min(1, "Date opened is required"),
  purchase_by_date: z.string().optional(),
  reporting_date: z.string().optional(),
  stock: z.number().int().nonnegative("Stock cannot be negative"),
  base_price: z.number().positive("Base price must be positive"),

  // Deal-specific
  tag: SpecialDealTagEnum,
  discountPercent: z
    .number()
    .min(1, "Discount must be at least 1%")
    .max(99, "Discount cannot exceed 99%"),
  originalPrice: z.number().positive("Original price must be positive"),
  salePrice: z.number().positive("Sale price must be positive"),
  expiresAt: z.date().or(z.string()),
  isActive: z.boolean().default(true),
  createdAt: z.date().or(z.string()).optional(),
  updatedAt: z.date().or(z.string()).optional(),
});

export type SpecialDeal = z.infer<typeof SpecialDealSchema>;
export type SpecialDealTag = z.infer<typeof SpecialDealTagEnum>;

// Form schema for creating/updating deals (without computed fields)
export const SpecialDealFormSchema = z.object({
  image: z.string().url().optional().or(z.literal("")),
  bank_name: z.string().min(1, "Bank name is required"),
  card_id: z.string().min(1, "Card ID is required"),
  credit_limit: z.number().positive("Credit limit must be positive"),
  date_opened: z.string().min(1, "Date opened is required"),
  purchase_by_date: z.string().optional(),
  reporting_date: z.string().optional(),
  stock: z
    .number()
    .int()
    .nonnegative("Stock cannot be negative")
    .min(1, "Stock must be at least 1"),
  base_price: z.number().positive("Base price must be positive"),
  tag: SpecialDealTagEnum,
  discountPercent: z
    .number()
    .nonnegative()
    .max(100, "Discount cannot exceed 100%"),
  originalPrice: z.number().positive("Original price must be positive"),
  salePrice: z.number().optional(), // Computed field for UI display
  expiresAt: z.coerce.date<Date>({ error: "Required" }),
  isActive: z.boolean().optional().default(true),
});

export type SpecialDealForm = z.infer<typeof SpecialDealFormSchema>;
