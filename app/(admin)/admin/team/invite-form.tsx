"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { toast } from "sonner";
import { useAuth } from "@/provider/AuthContext";
import { Loader2 } from "lucide-react";
import { CustomFormField } from "@/components/CustomFormField";
import { useQueryClient } from "@tanstack/react-query";
import { GET_USERS } from "@/constant/react-query-keys";

const inviteAdminSchema = z.object({
  email: z
    .email({ message: "Invalid email address" })
    .min(1, { message: "Email is required" }),
});

type InviteAdminFormValues = z.infer<typeof inviteAdminSchema>;

interface InviteAdminFormProps {
  setOpen: (open: boolean) => void;
}

export default function InviteAdminForm({ setOpen }: InviteAdminFormProps) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();

  const form = useForm<InviteAdminFormValues>({
    resolver: zodResolver(inviteAdminSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: InviteAdminFormValues) => {
    if (!user) {
      toast.error("You must be logged in to invite admins");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/admin/invite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: data.email.trim(),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(
          error.message || error.errors?.[0] || "Failed to send invitation",
        );
      }

      toast.success("Admin invitation sent successfully!", {
        description: `An invitation email has been sent to ${data.email}`,
      });

      // Invalidate the admin list query
      queryClient.invalidateQueries({ queryKey: [GET_USERS, "Admin"] });

      form.reset();
      setOpen(false);
    } catch (error: any) {
      toast.error("Failed to send invitation", {
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <fieldset disabled={isLoading} className="space-y-6 w-full p-4 sm:p-0">
          <CustomFormField
            name="email"
            label="Email Address"
            type="email"
            placeholder="admin@example.com"
          />

          <div className="flex flex-col-reverse sm:flex-row gap-3 sm:gap-4 sm:justify-end pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send Invitation
            </Button>
          </div>
        </fieldset>
      </form>
    </Form>
  );
}
