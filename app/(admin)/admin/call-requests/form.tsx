"use client";

import React, { useCallback, useEffect } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Form } from "@/components/ui/form";
import { CustomFormField } from "@/components/CustomFormField";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { getRequestCallStatus, RequestCall, RequestCallStatusEnum } from "@/schema";
import { Loader2 } from "lucide-react"; // <-- 1. Import the loader icon
import { useContactUsMutation } from "@/hooks/contact-us";

// (Your schemas and DisplayField component remain the same)
const updateRequestCallSchema = z.object({
  id: z.string(),
  remarks: z.string().optional(),
  status: RequestCallStatusEnum,
});
type UpdateRequestCall = z.infer<typeof updateRequestCallSchema>;
const DisplayField = ({ label, value }: { label: string; value: string | undefined }) => (
  <div className="mb-4">
    <label className="block text-sm font-medium text-gray-500">{label}</label>
    <div className="mt-1 w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800">
      {value || "-"}
    </div>
  </div>
);

type Props = {
  data: RequestCall;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

const ViewCallRequestAdmin = ({ data, setOpen }: Props) => {
  const { updateRequestCall, isUpdating } = useContactUsMutation();

  const form = useForm<UpdateRequestCall>({
    resolver: zodResolver(updateRequestCallSchema),
    defaultValues: {
      id: data.id,
      remarks: "",
      status: "Pending",
    },
  });

  const { isSubmitting } = form.formState;

  const onSubmit: SubmitHandler<UpdateRequestCall> = useCallback(
    async (values) => {
      await updateRequestCall({
        id: data.id ?? "",
        values: { ...data, status: values.status, remarks: values.remarks },
      });

      setOpen(false);
      form.reset();
    },
    [form, setOpen, data, updateRequestCall]
  );

  return (
    <Form {...form}>
      <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
        <div className="rounded-2xl border bg-white p-6 shadow-sm w-full">
          {/* Section 1: Read-only Client Data (Unchanged) */}
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Client Request Details</h3>
          <DisplayField label="Full Name" value={data.fullName} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DisplayField label="Email Address" value={data.email} />
            <DisplayField label="Phone Number" value={data.phoneNumber} />
          </div>
          <DisplayField label="Message" value={data.message} />
          <Separator className="my-6" />

          {/* Section 2: Writable Admin Fields (Unchanged) */}
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Admin Actions</h3>
          <fieldset disabled={isSubmitting} className="space-y-4">
            <CustomFormField
              name={"remarks"}
              label="Remarks"
              type="textarea"
              placeholder="Add internal notes..."
            />

            <CustomFormField
              name={"status"}
              label="Status"
              type="select"
              placeholder=" "
              options={getRequestCallStatus()}
            />

            {/* Section 3: The AlertDialog with the fix */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button disabled={isSubmitting} className="w-full">
                  Update Status
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action will save your changes and update the request status.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  {/* Disable Cancel while submitting */}
                  <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>

                  {/* 
                    --- THE FIX ---
                    Replace AlertDialogAction with a regular Button.
                    This gives us full control over the onClick event and prevents the dialog
                    from closing automatically before our async function is done.
                  */}
                  <Button onClick={form.handleSubmit(onSubmit)} disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isSubmitting ? "Updating..." : "Confirm & Update"}
                  </Button>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </fieldset>
        </div>
      </form>
    </Form>
  );
};

export default ViewCallRequestAdmin;
