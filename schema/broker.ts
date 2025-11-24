import { z } from "zod";
import { dateOfBirthSchema, GenderEnum } from ".";
import { passwordSchema, ssnSchema } from "./registration";

// Broker-specific registration schema
export const brokerRegistrationSchema = z.object({
  firstName: z.string().min(1, { message: "Required" }),
  //   middleName: z.string().optional(),
  lastName: z.string().min(1, { message: "Required" }),
  email: z.string().email().min(1, { message: "Required" }),
  password: passwordSchema,
  //   birthdate: dateOfBirthSchema,
  //   gender: GenderEnum,
  phoneNumber: z.string().min(1, { message: "Required" }),
  //   ssn: ssnSchema,
  companyName: z.string().optional(),
  role: z.literal("Broker"),
  isOnboarded: z.boolean().default(false),
  registrationDate: z.date().optional(),
  activeStatus: z.enum(["Active", "InActive", "Paused"]).default("Active"),
  // Broker-specific fields
  referralCode: z.string().optional(), // Auto-generated unique code
  commissionRate: z.number().min(0).max(100).default(10), // Percentage
  invitedBy: z.string().optional(), // Admin ID who invited
  invitationToken: z.string().optional(), // Token from invitation email
});

export type BrokerRegistration = z.infer<typeof brokerRegistrationSchema>;

// Broker invitation schema
export const brokerInvitationSchema = z.object({
  email: z.string().email().min(1, { message: "Required" }),
  invitedBy: z.string().min(1, { message: "Required" }), // Admin ID
  invitedByName: z.string().optional(),
  token: z.string().min(1, { message: "Required" }),
  //   commissionRate: z.number().min(0).max(100).default(10),
  status: z.enum(["Pending", "Accepted", "Expired"]).default("Pending"),
  createdAt: z.date(),
  expiresAt: z.date(),
  acceptedAt: z.date().optional(),
});

export type BrokerInvitation = z.infer<typeof brokerInvitationSchema>;

// Broker-Client mapping schema
export const brokerClientMappingSchema = z.object({
  brokerId: z.string().min(1, { message: "Required" }),
  clientId: z.string().min(1, { message: "Required" }),
  clientEmail: z.string().email(),
  clientName: z.string(),
  createdAt: z.date(),
  createdBy: z.enum(["Broker", "Client"]), // Who initiated the relationship
  status: z.enum(["Active", "Inactive"]).default("Active"),
  clientActiveStatus: z.enum(["Active", "InActive", "Paused"]).optional(), // User's activeStatus from user collection
});

export type BrokerClientMapping = z.infer<typeof brokerClientMappingSchema>;

// Commission tracking schema
export const brokerCommissionSchema = z.object({
  brokerId: z.string().min(1, { message: "Required" }),
  clientId: z.string().min(1, { message: "Required" }),
  clientName: z.string(),
  fundingApplicationId: z.string().min(1, { message: "Required" }),
  fundMappingApprovedId: z.string().min(1, { message: "Required" }),
  bankName: z.string(),
  fundedAmount: z.number().min(0),
  commissionRate: z.number().min(0).max(100),
  commissionAmount: z.number().min(0),
  status: z.enum(["Pending", "Approved", "Paid"]).default("Pending"),
  approvedAt: z.date().optional(),
  paidAt: z.date().optional(),
  createdAt: z.date(),
  notes: z.string().optional(),
});

export type BrokerCommission = z.infer<typeof brokerCommissionSchema>;

// Broker statistics type
export type BrokerStatistics = {
  totalClients: number;
  totalSubmittedApplications: number;
  totalApprovedApplications: number;
  totalRejectedApplications: number;
  totalFundedAmount: number;
  totalCommissionEarned: number;
  totalCommissionPending: number;
  totalCommissionPaid: number;
  // Status breakdown counts
  notAppliedCount: number;
  sentToLenderCount: number;
  declinedCount: number;
  approvedCount: number;
  fundedCount: number;
};

// Application status for broker view
export const ApplicationStatusEnum = z.enum([
  "Submitted",
  "Under Review",
  "Approved",
  "Denied",
  "Funded",
]);

export type ApplicationStatus = z.infer<typeof ApplicationStatusEnum>;
