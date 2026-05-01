"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { brokerageSchema, Brokerage } from "@/schema/brokerage";
import { Form, FormLabel } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, XCircle, Save } from "lucide-react";
import { CustomFormField } from "@/components/CustomFormField";
import { useEffect } from "react";
import IconMenu from "@/components/icon-menu";

interface BrokerageFormProps {
  initialData?: Brokerage;
  onSuccess?: () => void;
  onClose?: () => void;
}

export default function BrokerageForm({
  initialData,
  onSuccess,
  onClose,
}: BrokerageFormProps) {
  const queryClient = useQueryClient();

  const form = useForm<Brokerage>({
    resolver: zodResolver(brokerageSchema) as any,
    defaultValues: initialData || {
      companyName: "",
      website: "",
      email: "",
      contactNumbers: [{ number: "" }],
    },
  });

  useEffect(() => {
    form.reset(
      initialData || {
        companyName: "",
        website: "",
        email: "",
        contactNumbers: [{ number: "" }],
      },
    );
  }, [initialData, form]);

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "contactNumbers",
  });

  const isEditing = !!initialData?.id;

  const mutation = useMutation({
    mutationFn: async (values: Brokerage) => {
      const url = isEditing
        ? `/api/admin/brokerages/${initialData.id}`
        : "/api/admin/brokerages";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.errors || "Failed to save brokerage");
      }

      return res.json();
    },
    onSuccess: () => {
      toast.success(
        isEditing
          ? "Brokerage updated successfully"
          : "Brokerage added successfully",
      );
      queryClient.invalidateQueries({ queryKey: ["brokerages"] });
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const onSubmit = (values: Brokerage) => {
    mutation.mutate(values);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit as any)} className="space-y-4">
        <CustomFormField
          name="companyName"
          label="Company Name *"
          placeholder="e.g. I fund you"
        />

        <CustomFormField
          name="website"
          label="Website"
          placeholder="https://example.com"
        />

        <CustomFormField
          name="email"
          label="Email Address *"
          type="email"
          placeholder="contact@brokerage.com"
        />

        <div className="space-y-2">
          <FormLabel>Contact Numbers</FormLabel>
          {fields.map((field, index) => (
            <div key={field.id} className="flex items-center gap-2">
              <div className="flex-1">
                <CustomFormField
                  name={`contactNumbers.${index}.number`}
                  placeholder="e.g. +1 234 567 8900"
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="shrink-0 text-red-500 hover:bg-red-50 hover:text-red-600"
                onClick={() => remove(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={() => append({ number: "" })}
          >
            <IconMenu
              text="Add Phone Number"
              icon={<Plus className="h-4 w-4" />}
            />
          </Button>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t mt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              onClose?.();
              onSuccess?.(); // if onClose is not passed, use onSuccess
            }}
            disabled={mutation.isPending}
            className="w-24"
          >
            <IconMenu text="Cancel" icon={<XCircle className="h-4 w-4" />} />
          </Button>
          <Button
            type="submit"
            disabled={mutation.isPending}
            className="w-32 bg-blue-600 hover:bg-blue-700"
          >
            {mutation.isPending ? (
              <IconMenu
                text="Saving..."
                icon={<Loader2 className="h-4 w-4 animate-spin" />}
              />
            ) : (
              <IconMenu
                text={isEditing ? "Update" : "Create"}
                icon={<Save className="h-4 w-4" />}
              />
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
