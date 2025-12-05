"use client";

import { useFormContext } from "react-hook-form";
import { CustomFormField } from "@/components/CustomFormField";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2, Loader, Mailbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";
import { useGenerateDisputeLetter } from "@/hooks/dispute-letter-generate";
import dynamic from "next/dynamic";
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { UserWithId } from "@/schema/registration";
const EditorQuill = dynamic(() => import("@/components/editor/EditorQuill"), {
  ssr: false,
});
interface ReinsertedAccountDisputeFormProps {
  availableDisputeTypes?: string[];
  userId?: string;
  userData?: UserWithId | null;
}

export default function ReinsertedAccountDisputeForm({
  availableDisputeTypes = [],
  userId,
  userData,
}: ReinsertedAccountDisputeFormProps) {
  const form = useFormContext();
  const [generatedContent, setGeneratedContent] = useState<string | null>(null);
  const [selectedDisputeType, setSelectedDisputeType] = useState<string | null>(
    null
  );

  const { mutate: generateLetter, isPending: isGenerating } =
    useGenerateDisputeLetter(userId);

  const handleGenerateDisputeReinserted = () => {
    generateLetter(
      {
        disputeType: "reinserted-account",
      },
      {
        onSuccess: (content) => {
          setGeneratedContent(content);
          form.setValue("disputeMessage", content);
        },
      }
    );
  };

  return (
    <div className="space-y-4">
      {/* Dispute Type Selection - REMOVED as it's already selected in parent form */}
      {/* <CustomFormField
        name="disputeType"
        label="Dispute Type *"
        type="select"
        placeholder="Select dispute type"
        options={availableDisputeTypes.map((type) => ({
          value: type,
          label: type
            .split("-")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" "),
        }))}
        onSelectValue={(value) => {
          setSelectedDisputeType(value);
        }}
      /> */}

      <div>
        <div className="rounded-md mb-4 p-4 flex flex-row justify-between bg-blue-50 items-center">
          <div>
            <h4 className="font-semibold text-blue-900 mb-2">
              Reinserted Account Dispute
            </h4>
            <p className="text-sm text-blue-800">
              This letter disputes accounts that were previously deleted but
              have been reinserted onto your credit report, which violates FCRA
              Section 611(a)(5).
            </p>
          </div>

          <Button
            className="bg-green-200 hover-green-300"
            type="button"
            variant={"outline"}
            onClick={handleGenerateDisputeReinserted}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <>
                <Loader className="h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Mailbox className="h-4 w-4" />
                Generate Dispute
              </>
            )}
          </Button>
        </div>
        <FormField
          control={form.control}
          name="disputeMessage"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <EditorQuill
                  {...field}
                  value={field.value || ""}
                  placeholder=""
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Previous Dispute Information */}
      {/* <div className="space-y-4 border-t pt-4">
        <h3 className="font-semibold">Previous Dispute Details</h3>

        <CustomFormField
          name="previousDisputeDate"
          label="Date of Original Dispute *"
          type="date-picker"
          placeholder="When did you first dispute this account?"
        />

        <CustomFormField
          name="accountDeletedDate"
          label="Date Account Was Deleted *"
          type="date-picker"
          placeholder="When was the account removed?"
        />

        <CustomFormField
          name="reinsertedDate"
          label="Date Account Was Reinserted *"
          type="date-picker"
          placeholder="When did it reappear on your report?"
        />

        <CustomFormField
          name="disputeMethod"
          label="How Did You Dispute? *"
          type="select"
          placeholder="Select dispute method"
          options={[
            { value: "online", label: "Online Portal" },
            { value: "mail", label: "Certified Mail" },
            { value: "phone", label: "Phone" },
            { value: "third-party", label: "Through Credit Monitoring Service" },
          ]}
        />

        <CustomFormField
          name="hasConfirmationLetter"
          label="Do you have the deletion confirmation letter?"
          type="switch"
        />

        <CustomFormField
          name="confirmationDetails"
          label="Confirmation/Reference Number"
          type="text"
          placeholder="Enter confirmation or reference number if available"
        />
      </div> */}

      {/* Account Information */}
      {/* <div className="space-y-4 border-t pt-4">
        <h3 className="font-semibold">Reinserted Account Information</h3>

        <CustomFormField
          name="accountName"
          label="Account Name *"
          type="text"
          placeholder="e.g., Capital One Credit Card"
        />

        <CustomFormField
          name="creditorName"
          label="Creditor/Furnisher Name *"
          type="text"
          placeholder="e.g., Capital One"
        />

        <CustomFormField
          name="accountNumber"
          label="Account Number *"
          type="text"
          placeholder="Last 4 digits recommended"
        />

        <CustomFormField
          name="accountType"
          label="Account Type *"
          type="select"
          placeholder="Select account type"
          options={[
            { value: "credit-card", label: "Credit Card" },
            { value: "mortgage", label: "Mortgage" },
            { value: "auto-loan", label: "Auto Loan" },
            { value: "personal-loan", label: "Personal Loan" },
            { value: "student-loan", label: "Student Loan" },
            { value: "collection", label: "Collection Account" },
            { value: "medical", label: "Medical Account" },
            { value: "other", label: "Other" },
          ]}
        />

        <CustomFormField
          name="originalBalance"
          label="Original Balance"
          type="number"
          placeholder="0.00"
          numberPrefix="$"
          decimalScale={2}
        />

        <CustomFormField
          name="currentBalance"
          label="Current Balance (if showing)"
          type="number"
          placeholder="0.00"
          numberPrefix="$"
          decimalScale={2}
        />
      </div> */}

      {/* Reason for Reinsertion Dispute */}
      {/* <div className="space-y-4 border-t pt-4">
        <h3 className="font-semibold">Dispute Grounds</h3>

        <CustomFormField
          name="reinsertionReason"
          label="Primary Reason for Dispute *"
          type="select"
          placeholder="Select primary reason"
          options={[
            { value: "no-new-information", label: "No new or additional information provided" },
            { value: "no-notice", label: "Never received reinsertion notice" },
            { value: "incomplete-notice", label: "Notice did not include required information" },
            { value: "within-5-days", label: "Reinserted within 5 business days" },
            { value: "still-inaccurate", label: "Information is still inaccurate" },
            { value: "not-verified", label: "Account was not properly verified" },
            { value: "fcra-violation", label: "Violates FCRA Section 611(a)(5)" },
          ]}
        />

        <CustomFormField
          name="additionalDetails"
          label="Additional Details *"
          type="textarea"
          placeholder="Provide detailed explanation of why this reinsertion violates FCRA requirements. Include timeline, what you disputed, why it was deleted, and what changed (if anything) when it was reinserted..."
        />

        <CustomFormField
          name="receivedNotice"
          label="Did you receive a reinsertion notice?"
          type="switch"
        />

        <CustomFormField
          name="noticeReceivedDate"
          label="Date Notice Was Received"
          type="date-picker"
          placeholder="When did you receive the notice?"
        />
      </div> */}

      {/* Supporting Documentation */}
      {/* <div className="space-y-4 border-t pt-4">
        <h3 className="font-semibold">Supporting Documentation</h3>

        <div className="space-y-3">
          <div className="flex items-start space-x-3">
            <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium">Documents to Include:</p>
              <ul className="text-sm text-gray-600 list-disc list-inside mt-1 space-y-1">
                <li>Original dispute letter (copy)</li>
                <li>Deletion confirmation letter</li>
                <li>Credit report showing deletion</li>
                <li>Current credit report showing reinsertion</li>
                <li>Reinsertion notice (if received)</li>
                <li>Certified mail receipts</li>
              </ul>
            </div>
          </div>
        </div>

        <CustomFormField
          name="hasOriginalDispute"
          label="I have copies of my original dispute"
          type="switch"
        />

        <CustomFormField
          name="hasDeletionConfirmation"
          label="I have the deletion confirmation letter"
          type="switch"
        />

        <CustomFormField
          name="hasBeforeAfterReports"
          label="I have credit reports showing before/after"
          type="switch"
        />

        <CustomFormField
          name="documentationNotes"
          label="Documentation Notes"
          type="textarea"
          placeholder="List all documents you're including with this dispute letter..."
        />
      </div> */}

      {/* Credit Bureau Information */}
      {/* <div className="space-y-4 border-t pt-4">
        <h3 className="font-semibold">Credit Bureau Reporting</h3>

        <div className="space-y-2">
          <label className="text-sm font-medium">
            Which bureaus reinserted this account? *
          </label>
          <p className="text-xs text-gray-500 mb-2">
            Select all bureaus showing the reinserted account
          </p>
          <div className="space-y-2">
            {["Equifax", "Experian", "TransUnion"].map((bureau) => (
              <div key={bureau} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id={`bureau-${bureau}`}
                  value={bureau}
                  {...form.register("affectedBureaus")}
                  className="rounded"
                />
                <label
                  htmlFor={`bureau-${bureau}`}
                  className="text-sm font-normal cursor-pointer"
                >
                  {bureau}
                </label>
              </div>
            ))}
          </div>
          {form.formState.errors.affectedBureaus && (
            <p className="text-sm text-red-600">
              {form.formState.errors.affectedBureaus.message as string}
            </p>
          )}
        </div>

        <CustomFormField
          name="allBureausReinserted"
          label="Was account reinserted on all bureaus?"
          type="switch"
        />
      </div> */}

      {/* Desired Resolution */}
      {/* <div className="space-y-4 border-t pt-4">
        <h3 className="font-semibold">Requested Action</h3>

        <CustomFormField
          name="requestedAction"
          label="What Action Do You Request? *"
          type="select"
          placeholder="Select requested action"
          options={[
            { value: "permanent-deletion", label: "Permanent deletion of account" },
            { value: "deletion-and-explanation", label: "Delete and explain why it was reinserted" },
            { value: "investigation", label: "Full investigation of reinsertion" },
            { value: "damages", label: "Delete and compensate for damages" },
          ]}
        />

        <CustomFormField
          name="impactStatement"
          label="Impact on You (Optional)"
          type="textarea"
          placeholder="Describe how this reinsertion has affected you (e.g., loan denial, higher interest rates, emotional distress)..."
        />
      </div> */}

      {/* Sender Address */}
      {/* <div className="space-y-4 border-t pt-4">
        <h3 className="font-semibold">Your Contact Information</h3>

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
          <CustomFormField
            name="city"
            label="City *"
            type="text"
          />

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

        <div className="grid grid-cols-2 gap-4">
          <CustomFormField
            name="phoneNumber"
            label="Phone Number *"
            type="text"
            placeholder="(555) 123-4567"
          />

          <CustomFormField
            name="email"
            label="Email Address *"
            type="email"
            placeholder="your.email@example.com"
          />
        </div>

        <CustomFormField
          name="dateOfBirth"
          label="Date of Birth *"
          type="date-picker"
          placeholder="MM/DD/YYYY"
        />

        <CustomFormField
          name="ssn"
          label="Social Security Number (Last 4 digits) *"
          type="text"
          placeholder="Last 4 digits only"
        />
      </div> */}

      {/* <Alert className="bg-red-50 border-red-200">
        <AlertCircle className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-red-800">
          <h4 className="font-semibold mb-2">
            FCRA Section 611(a)(5) Requirements
          </h4>
          <ul className="text-sm space-y-1 list-disc list-inside">
            <li>
              Bureaus must notify you within 5 business days before reinsertion
            </li>
            <li>
              Notice must include name, address, phone number of furnisher
            </li>
            <li>
              Must provide notice that you have the right to add a statement
            </li>
            <li>Reinsertion requires new or additional information</li>
            <li>You can file complaints with CFPB if rights are violated</li>
          </ul>
        </AlertDescription>
      </Alert> */}

      {/* <div className="bg-yellow-50 p-4 rounded-md">
        <h4 className="font-semibold text-yellow-900 mb-2 flex items-center gap-2">
          <span>⚠️</span> Important Tips
        </h4>
        <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
          <li>Send via certified mail with return receipt requested</li>
          <li>Keep copies of all correspondence and credit reports</li>
          <li>Document exact dates of dispute, deletion, and reinsertion</li>
          <li>Include copies (not originals) of supporting documents</li>
          <li>Consider filing CFPB complaint if FCRA violations occurred</li>
          <li>Follow up if no response within 30 days</li>
        </ul>
      </div> */}
    </div>
  );
}
