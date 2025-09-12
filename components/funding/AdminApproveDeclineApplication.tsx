"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckIcon, XIcon } from "lucide-react";
import {
  FundingApplicationApproveDecline,
  fundingApplicationApproveDeclineSchema,
  FundingApplicationSatus,
} from "@/schema/apply-funding";
import { updateApplicationStatus } from "@/service/apply-funding";
import { ConfirmButton } from "../Confirmation";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Form } from "../ui/form";
import { CustomFormField } from "../CustomFormField";
// If you keep FundingApplicationSatus as a const tuple:
type FundingApplicationStatus = (typeof FundingApplicationSatus)[number];

type Props = {
  referenceNumber: string;
  defaultValues?: Partial<FundingApplicationApproveDecline>;
  onStatusChange?: (status: FundingApplicationStatus) => void;
};

export default function AdminApproveDeclineApplication({
  referenceNumber,
  defaultValues,
  onStatusChange,
}: Props) {
  const form = useForm<FundingApplicationApproveDecline>({
    resolver: zodResolver(fundingApplicationApproveDeclineSchema),
    mode: "onSubmit", // validate on submit/explicit trigger
    reValidateMode: "onChange",
    defaultValues: {
      amountApprove: defaultValues?.amountApprove,
      remarks: defaultValues?.remarks ?? "",
    },
  });

  const [busyStatus, setBusyStatus] = React.useState<FundingApplicationStatus | null>(null);

  const doUpdate = async (status: FundingApplicationStatus) => {
    try {
      setBusyStatus(status);
      await updateApplicationStatus(referenceNumber, status, form.getValues());
      onStatusChange?.(status);
    } finally {
      setBusyStatus(null);
    }
  };

  // Intercept clicks on Approve to validate BEFORE opening the Confirm dialog.
  const handleApproveClickCapture: React.MouseEventHandler<HTMLSpanElement> = async (e) => {
    const ok = await form.trigger(); // runs Zod validation and shows errors if any
    if (!ok) {
      // Block the ConfirmButton from opening its dialog
      e.preventDefault();
      e.stopPropagation();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Approve or Decline Application</CardTitle>
      </CardHeader>
      <CardContent>
        {/* <form
          onSubmit={(e) => e.preventDefault()} // we handle actions via the confirm buttons
          className="max-w-lg space-y-4"
        > */}
        <Form {...form}>
          <form onSubmit={(e) => e.preventDefault()}>
            <fieldset disabled={form.formState.isSubmitting}>
              {/* Amount Approved */}
              <CustomFormField type="number" name="amountApprove" label="Amount to Approve" />

              {/* Remarks (optional) */}
              <CustomFormField type="textarea" name="remarks" label="Remarks (optional)" />

              {/* Actions */}
              <div className="mt-6 flex items-center justify-between gap-3">
                {/* Left: Decline (no validation needed) */}
                <ConfirmButton
                  label="Decline"
                  confirmLabel="Decline"
                  description="Do you really want to decline this request?"
                  variant="destructive"
                  size="sm"
                  icon={<XIcon className="h-4 w-4" />}
                  onConfirm={() => doUpdate("Declined")}
                  className="bg-red-600 hover:bg-red-700"
                  classNameAction="bg-red-600 hover:bg-red-700"
                  isLoading={form.formState.isSubmitting || busyStatus !== null}
                />

                {/* Right: Approve (validate first, then open confirm) */}
                <span onClickCapture={handleApproveClickCapture}>
                  <ConfirmButton
                    label="Approve"
                    confirmLabel="Approve"
                    description="Do you really want to approve this request?"
                    variant="default"
                    size="sm"
                    icon={<CheckIcon className="h-4 w-4" />}
                    onConfirm={() => doUpdate("Approved")}
                    className="bg-green-600 hover:bg-green-700"
                    classNameAction="bg-green-600 hover:bg-green-700"
                    isLoading={form.formState.isSubmitting || busyStatus !== null}
                  />
                </span>
              </div>
            </fieldset>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
