"use client";

import { useFormContext } from "react-hook-form";
import { CustomFormField } from "@/components/CustomFormField";

export default function LatePaymentRemovalForm() {
  const form = useFormContext();

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 p-4 rounded-md mb-4">
        <h4 className="font-semibold text-blue-900 mb-2">
          USC 1666b - Billing Error Dispute
        </h4>
        <p className="text-sm text-blue-800">
          This letter type disputes late payments as billing errors under
          federal law. The creditor must investigate and respond within specific
          timeframes.
        </p>
      </div>

      {/* Account Information Section */}
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
          label="Creditor/Furnisher Name *"
          type="text"
          placeholder="e.g., Chase Bank"
        />

        <CustomFormField
          name="accountNumber"
          label="Account Number *"
          type="text"
          placeholder="Last 4 digits recommended"
        />

        <CustomFormField
          name="originalCreditor"
          label="Original Creditor (if different)"
          type="text"
          placeholder="Original creditor name"
        />
      </div>

      {/* Late Payment Details */}
      <div className="space-y-4 border-t pt-4">
        <h3 className="font-semibold">Late Payment Details</h3>

        <CustomFormField
          name="paymentDate"
          label="Date Payment Was Made *"
          type="date-picker"
          placeholder="Select payment date"
        />

        <CustomFormField
          name="paymentAmount"
          label="Payment Amount *"
          type="number"
          placeholder="0.00"
          numberPrefix="$"
          decimalScale={2}
        />

        <CustomFormField
          name="dueDate"
          label="Original Due Date *"
          type="date-picker"
          placeholder="Select due date"
        />

        <CustomFormField
          name="reportedLateDate"
          label="Date Reported as Late *"
          type="date-picker"
          placeholder="When was it reported late?"
        />

        <CustomFormField
          name="disputeReason"
          label="Reason for Dispute *"
          type="select"
          placeholder="Select reason"
          options={[
            { value: "payment-sent-timely", label: "Payment was sent timely" },
            {
              value: "payment-received-timely",
              label: "Payment was received timely",
            },
            { value: "billing-error", label: "Billing error by creditor" },
            { value: "never-late", label: "Payment was never late" },
            { value: "creditor-error", label: "Creditor processing error" },
            { value: "postal-delay", label: "Postal service delay" },
            { value: "grace-period", label: "Within grace period" },
            { value: "other", label: "Other (explain below)" },
          ]}
        />

        <CustomFormField
          name="additionalDetails"
          label="Additional Details *"
          type="textarea"
          placeholder="Provide detailed explanation of why this late payment report is a billing error. Include dates, payment methods, confirmation numbers, or any other relevant information..."
        />
      </div>

      {/* Supporting Documentation */}
      <div className="space-y-4 border-t pt-4">
        <h3 className="font-semibold">Supporting Evidence</h3>

        <CustomFormField
          name="hasProofOfPayment"
          label="Do you have proof of payment?"
          type="switch"
        />

        <CustomFormField
          name="proofOfPaymentDetails"
          label="Proof of Payment Details"
          type="textarea"
          placeholder="Describe your proof of payment (e.g., check number, confirmation number, bank statement date, etc.)"
        />

        <CustomFormField
          name="hasCommunicationRecords"
          label="Do you have communication records with creditor?"
          type="switch"
        />

        <CustomFormField
          name="communicationDetails"
          label="Communication Details"
          type="textarea"
          placeholder="Describe any communications with the creditor about this payment (dates, representatives, what was discussed)"
        />
      </div>

      {/* Credit Bureau Information */}
      <div className="space-y-4 border-t pt-4">
        <h3 className="font-semibold">Credit Bureau Reporting</h3>

        <div className="space-y-2">
          <label className="text-sm font-medium">
            Affected Credit Bureaus *
          </label>
          <p className="text-xs text-gray-500 mb-2">
            Select all bureaus reporting this late payment
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
          name="currentCreditScore"
          label="Current Credit Score (Optional)"
          type="number"
          placeholder="e.g., 650"
          minValue={300}
          maxValue={850}
          decimalScale={0}
        />
      </div>

      {/* Sender Address */}
      <div className="space-y-4 border-t pt-4">
        <h3 className="font-semibold">Your Contact Information</h3>

        <CustomFormField name="fullName" label="Full Name *" type="text" />

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
      </div>

      <div className="bg-yellow-50 p-4 rounded-md mt-4">
        <h4 className="font-semibold text-yellow-900 mb-2 flex items-center gap-2">
          <span>⚠️</span> Important Legal Notice
        </h4>
        <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
          <li>Under USC 1666b, creditors must investigate billing errors</li>
          <li>This includes incorrect late payment reporting</li>
          <li>The creditor has specific timeframes to respond</li>
          <li>Keep copies of all correspondence and proof of mailing</li>
          <li>Consider sending via certified mail with return receipt</li>
        </ul>
      </div>
    </div>
  );
}
