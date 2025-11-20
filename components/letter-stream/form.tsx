"use client";

import { useState, useMemo } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/provider/AuthContext";
import { useCreateDisputeLetter } from "@/hooks/dispute-letter";
import { DisputeTypeEnum, BureauEnum } from "@/schema/dispute-letter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { FileText, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CustomFormField } from "@/components/CustomFormField";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import LatePaymentRemovalForm from "@/components/letter-stream/forms/LatePaymentRemovalForm";
import ReinsertedAccountDisputeForm from "@/components/letter-stream/forms/ReinsertedAccountDisputeForm";

const letterFormSchema = z.object({
  letterType: z.string().min(1, "Please select a letter type"),
  letterTitle: z.string().min(1, "Letter title is required"),
  disputeType: DisputeTypeEnum,
  accountName: z.string().min(1, "Account name is required"),
  creditorName: z.string().min(1, "Creditor name is required"),
  accountNumber: z.string().optional(),
  disputeReason: z.string().optional(),
  additionalDetails: z.string().optional(),
  affectedBureaus: z.array(BureauEnum).min(1, "Select at least one bureau"),
  // Sender address
  fullName: z.string().min(1, "Full name is required"),
  addressLine1: z.string().min(1, "Address is required"),
  addressLine2: z.string().optional(),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  postalCode: z.string().regex(/^\d{5}(-\d{4})?$/, "Invalid postal code"),
  // Late Payment Removal specific fields (optional)
  originalCreditor: z.string().optional(),
  paymentDate: z.date().optional(),
  paymentAmount: z.number().optional(),
  dueDate: z.date().optional(),
  reportedLateDate: z.date().optional(),
  hasProofOfPayment: z.boolean().optional(),
  proofOfPaymentDetails: z.string().optional(),
  hasCommunicationRecords: z.boolean().optional(),
  communicationDetails: z.string().optional(),
  currentCreditScore: z.number().optional(),
  phoneNumber: z.string().optional(),
  email: z.string().email().optional(),
  // Reinserted Account specific fields
  previousDisputeDate: z.date().optional(),
  accountDeletedDate: z.date().optional(),
  reinsertedDate: z.date().optional(),
  disputeMethod: z.string().optional(),
  hasConfirmationLetter: z.boolean().optional(),
  confirmationDetails: z.string().optional(),
  accountType: z.string().optional(),
  originalBalance: z.number().optional(),
  currentBalance: z.number().optional(),
  reinsertionReason: z.string().optional(),
  receivedNotice: z.boolean().optional(),
  noticeReceivedDate: z.date().optional(),
  hasOriginalDispute: z.boolean().optional(),
  hasDeletionConfirmation: z.boolean().optional(),
  hasBeforeAfterReports: z.boolean().optional(),
  documentationNotes: z.string().optional(),
  allBureausReinserted: z.boolean().optional(),
  requestedAction: z.string().optional(),
  impactStatement: z.string().optional(),
  dateOfBirth: z.date().optional(),
  ssn: z.string().optional(),
});

type LetterFormData = z.infer<typeof letterFormSchema>;

interface LetterFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

const LETTER_TYPE_CONFIG = [
  {
    key: "letterFeatureEnabled",
    label: "Credit Report Disputes",
    description: "General credit dispute letters for inaccuracies and errors",
    disputeTypes: [
      "reinserted-account",
      "inaccurate-information",
      "identity-theft",
      "duplicate-account",
      "outdated-information",
      "incorrect-balance",
      "incorrect-payment-history",
      "mixed-file",
    ],
  },
  {
    key: "latePaymentRemovalEnabled",
    label: "Late Payment Removal (USC 1666b)",
    description:
      "Remove late payments using USC 1666b billing error provisions",
    disputeTypes: ["incorrect-payment-history"],
  },
  {
    key: "unauthorizedInquiryRemovalEnabled",
    label: "Unauthorized Inquiry Removal",
    description: "Dispute and remove unauthorized credit inquiries",
    disputeTypes: ["unauthorized-inquiry"],
  },
  {
    key: "verifiedAccountDisputeEnabled",
    label: "Verified Account Re-Dispute",
    description: "Follow-up letters when accounts come back verified",
    disputeTypes: ["inaccurate-information", "duplicate-account"],
  },
  {
    key: "noResponseFollowUpEnabled",
    label: "No Response Follow-Up",
    description: "Follow-up when bureaus fail to respond within 30 days",
    disputeTypes: ["inaccurate-information"],
  },
  {
    key: "accountErrorCorrectionEnabled",
    label: "Account Error Corrections",
    description: "Dispute accounts with data accuracy issues",
    disputeTypes: [
      "incorrect-balance",
      "incorrect-payment-history",
      "inaccurate-information",
    ],
  },
  {
    key: "collectionAccountRemovalEnabled",
    label: "Collection Account Removal",
    description: "Challenge collection accounts using validation disputes",
    disputeTypes: ["inaccurate-information", "outdated-information"],
  },
  {
    key: "fraudulentAccountRemovalEnabled",
    label: "Fraudulent Account Removal",
    description: "Remove identity theft and fraudulent accounts",
    disputeTypes: ["identity-theft"],
  },
];

export default function LetterForm({ onSuccess, onCancel }: LetterFormProps) {
  const { user, userData } = useAuth();
  const { mutate: createLetter, isPending } = useCreateDisputeLetter();
  const [selectedLetterType, setSelectedLetterType] = useState<string>("");

  const form = useForm<LetterFormData>({
    resolver: zodResolver(letterFormSchema),
    defaultValues: {
      affectedBureaus: [],
      fullName: user && user.displayName ? user.displayName : "",
    },
  });

  // Get enabled letter types based on user's permissions
  const enabledLetterTypes = useMemo(() => {
    if (!userData) return [];
    return LETTER_TYPE_CONFIG.filter((config) => {
      const key = config.key as keyof typeof userData;
      return userData[key] === true;
    });
  }, [userData, user]);

  // Get available dispute types based on selected letter type
  const availableDisputeTypes = useMemo(() => {
    if (!selectedLetterType) return [];
    const config = LETTER_TYPE_CONFIG.find((c) => c.key === selectedLetterType);
    return config?.disputeTypes || [];
  }, [selectedLetterType]);

  const onSubmit = (data: LetterFormData) => {
    createLetter(
      {
        userId: user?.uid || "",
        disputeType: data.disputeType,
        letterTitle: data.letterTitle,
        letterContent: "", // Will be generated by admin or AI
        status: "draft",
        disputedAccounts: [
          {
            accountName: data.accountName,
            creditorName: data.creditorName,
            accountNumber: data.accountNumber,
            disputeReason: data.disputeReason || "",
            additionalDetails: data.additionalDetails,
            affectedBureaus: data.affectedBureaus,
            previouslyRemoved: false,
          },
        ],
        recipients: [], // Will be added later
        senderAddress: {
          fullName: data.fullName,
          addressLine1: data.addressLine1,
          addressLine2: data.addressLine2,
          city: data.city,
          state: data.state,
          postalCode: data.postalCode,
        },
      },
      {
        onSuccess: () => {
          form.reset();
          onSuccess?.();
        },
      }
    );
  };

  if (enabledLetterTypes.length === 0) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          You don't have access to any letter types yet. Please contact support
          to enable letter features for your account.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Create New Dispute Letter
        </CardTitle>
      </CardHeader>
      <CardContent>
        <FormProvider {...form}>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Letter Type Selection */}
              <div className="space-y-2">
                <Label>Letter Type *</Label>
                <Select
                  value={selectedLetterType}
                  onValueChange={(value) => {
                    setSelectedLetterType(value);
                    form.setValue("letterType", value);
                    form.setValue("disputeType", "" as any); // Reset dispute type
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a letter type" />
                  </SelectTrigger>
                  <SelectContent>
                    {enabledLetterTypes.map((type) => (
                      <SelectItem key={type.key} value={type.key}>
                        <div>
                          <div className="font-medium">{type.label}</div>
                          <div className="text-xs text-gray-500">
                            {type.description}
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.letterType && (
                  <p className="text-sm text-red-600">
                    {form.formState.errors.letterType.message}
                  </p>
                )}
              </div>

              {/* Dispute Type */}
              {selectedLetterType && (
                <CustomFormField
                  name="disputeType"
                  label="Dispute Type *"
                  type="select"
                  placeholder="Select dispute type"
                  options={availableDisputeTypes.map((type) => ({
                    value: type,
                    label: type
                      .split("-")
                      .map(
                        (word) => word.charAt(0).toUpperCase() + word.slice(1)
                      )
                      .join(" "),
                  }))}
                />
              )}

              {selectedLetterType && (
                <CustomFormField
                  name="letterTitle"
                  label="Letter Title *"
                  type="text"
                  placeholder="e.g., Dispute for Chase Credit Card"
                />
              )}

              {/* Render specialized form based on letter type */}
              {selectedLetterType === "latePaymentRemovalEnabled" ? (
                <LatePaymentRemovalForm />
              ) : selectedLetterType === "letterFeatureEnabled" ? (
                <ReinsertedAccountDisputeForm />
              ) : selectedLetterType ? (
                <>
                  {/* Generic Form for other letter types */}
                  {/* Account Information */}
                  <div className="space-y-4 border-t pt-4">
                    <h3 className="font-semibold">Account Information</h3>

                    <CustomFormField
                      name="accountName"
                      label="Account Name *"
                      type="text"
                      placeholder="e.g., Chase Credit Card"
                    />

                    <CustomFormField
                      name="creditorName"
                      label="Creditor Name *"
                      type="text"
                      placeholder="e.g., Chase Bank"
                    />

                    <CustomFormField
                      name="accountNumber"
                      label="Account Number (Optional)"
                      type="text"
                      placeholder="Last 4 digits"
                    />

                    <CustomFormField
                      name="disputeReason"
                      label="Dispute Reason *"
                      type="textarea"
                      placeholder="Explain why you are disputing this account..."
                    />

                    <CustomFormField
                      name="additionalDetails"
                      label="Additional Details (Optional)"
                      type="textarea"
                      placeholder="Any additional information..."
                    />

                    {/* Credit Bureaus */}
                    <FormField
                      control={form.control}
                      name="affectedBureaus"
                      render={() => (
                        <FormItem>
                          <FormLabel>Affected Credit Bureaus *</FormLabel>
                          <FormDescription>
                            Select all bureaus where this account appears
                          </FormDescription>
                          <div className="space-y-2">
                            {["Equifax", "Experian", "TransUnion"].map(
                              (bureau) => (
                                <FormField
                                  key={bureau}
                                  control={form.control}
                                  name="affectedBureaus"
                                  render={({ field }) => (
                                    <FormItem className="flex items-center space-x-2 space-y-0">
                                      <FormControl>
                                        <Checkbox
                                          checked={field.value?.includes(
                                            bureau as any
                                          )}
                                          onCheckedChange={(checked) => {
                                            const value = field.value || [];
                                            if (checked) {
                                              field.onChange([
                                                ...value,
                                                bureau,
                                              ]);
                                            } else {
                                              field.onChange(
                                                value.filter(
                                                  (b) => b !== bureau
                                                )
                                              );
                                            }
                                          }}
                                        />
                                      </FormControl>
                                      <FormLabel className="font-normal cursor-pointer">
                                        {bureau}
                                      </FormLabel>
                                    </FormItem>
                                  )}
                                />
                              )
                            )}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Sender Address */}
                  <div className="space-y-4 border-t pt-4">
                    <h3 className="font-semibold">Your Address</h3>

                    <CustomFormField
                      name="fullName"
                      label="Full Name *"
                      type="text"
                    />

                    <CustomFormField
                      name="addressLine1"
                      label="Address Line 1 *"
                      type="text"
                      placeholder="Street address"
                    />

                    <CustomFormField
                      name="addressLine2"
                      label="Address Line 2 (Optional)"
                      type="text"
                      placeholder="Apt, suite, etc."
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <CustomFormField name="city" label="City *" type="text" />

                      <CustomFormField
                        name="state"
                        label="State *"
                        type="text"
                        placeholder="e.g., CA"
                      />
                    </div>

                    <CustomFormField
                      name="postalCode"
                      label="Postal Code *"
                      type="text"
                      placeholder="12345 or 12345-6789"
                    />
                  </div>
                </>
              ) : null}

              {/* Actions */}
              <div className="flex justify-end gap-2">
                {onCancel && (
                  <Button type="button" variant="outline" onClick={onCancel}>
                    Cancel
                  </Button>
                )}
                <Button type="submit" disabled={isPending}>
                  {isPending ? "Creating..." : "Create Letter"}
                </Button>
              </div>
            </form>
          </Form>
        </FormProvider>
      </CardContent>
    </Card>
  );
}
