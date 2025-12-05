"use client";

import { useState, useMemo } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/provider/AuthContext";
import { useCreateDisputeLetter } from "@/hooks/dispute-letter";
import { DisputeTypeEnum, BureauEnum } from "@/schema/dispute-letter";
import { UserWithId } from "@/schema/registration";
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
import InaccurateInformationDisputeForm from "./forms/InaccurateInformationDisputeForm";

const letterFormSchema = z.object({
  // letterTitle: z.string().min(1, "Letter title is required"),
  disputeType: DisputeTypeEnum,
  disputeMessage: z.string().optional(),
  accountName: z.string().optional(),
  creditorName: z.string().optional(),
  accountNumber: z.string().optional(),
  disputeReason: z.string().optional(),
  additionalDetails: z.string().optional(),
  affectedBureaus: z.array(BureauEnum).optional(),
  // Sender address
  fullName: z.string().optional(),
  addressLine1: z.string().optional(),
  addressLine2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
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
  userId?: string;
  userData?: UserWithId;
}

export default function LetterForm({
  onSuccess,
  onCancel,
  userId,
  userData: propUserData,
}: LetterFormProps) {
  const { user, userData: authUserData } = useAuth();
  const targetUserId = userId || user?.uid;
  const { mutate: createLetter, isPending } =
    useCreateDisputeLetter(targetUserId);

  const form = useForm<LetterFormData>({
    resolver: zodResolver(letterFormSchema),
    defaultValues: {
      affectedBureaus: [],
      fullName: user && user.displayName ? user.displayName : "",
    },
  });

  const selectedDisputeType = form.watch("disputeType");

  // if (Object.keys(form.formState.errors).length > 0) {
  //   console.log("There are validation errors:", form.formState.errors);
  // }

  // Check if user has access to letter features
  // If propUserData is provided (e.g. admin view), use that. Otherwise use authUserData.
  const currentUserData = propUserData || authUserData;
  const hasAccess = currentUserData?.letterFeatureEnabled;

  const onSubmit = (data: LetterFormData) => {
    createLetter(
      {
        userId: targetUserId || "",
        disputeType: data.disputeType,
        letterTitle: "Dispute Letter", // Default title since field is removed
        letterContent: data.disputeMessage || "", // Will be generated by admin or AI
        status: "draft",
        // disputedAccounts: [
        //   {
        //     accountName: data.accountName || "",
        //     creditorName: data.creditorName || "",
        //     accountNumber: data.accountNumber,
        //     disputeReason: data.disputeReason || "",
        //     additionalDetails: data.additionalDetails,
        //     affectedBureaus: data.affectedBureaus || [],
        //     previouslyRemoved: false,
        //   },
        // ],
        // recipients: [], // Will be added later
        // senderAddress: {
        //   fullName: data.fullName || "",
        //   addressLine1: data.addressLine1 || "",
        //   addressLine2: data.addressLine2,
        //   city: data.city || "",
        //   state: data.state || "",
        //   postalCode: data.postalCode || "",
        // },
      },
      {
        onSuccess: () => {
          form.reset();
          onSuccess?.();
        },
      }
    );
  };

  if (!hasAccess) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          You don't have access to letter features yet. Please contact support
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
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2">
              {/* Dispute Type Selection */}
              <CustomFormField
                name="disputeType"
                label="Dispute Type *"
                type="select"
                placeholder="Select dispute type"
                options={DisputeTypeEnum.options.map((type) => ({
                  value: type,
                  label: type
                    .split("-")
                    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(" "),
                }))}
              />

              {/* Render specialized form based on dispute type */}
              {selectedDisputeType === "reinserted-account" ? (
                <ReinsertedAccountDisputeForm
                  availableDisputeTypes={DisputeTypeEnum.options}
                />
              ) : selectedDisputeType === "inaccurate-information" ? (
                <InaccurateInformationDisputeForm
                  availableDisputeTypes={DisputeTypeEnum.options}
                />
              ) : selectedDisputeType ? (
                <>
                  {/* Generic Form for other dispute types */}
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
