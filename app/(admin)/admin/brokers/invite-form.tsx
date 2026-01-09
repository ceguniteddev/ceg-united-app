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

const inviteBrokerSchema = z.object({
  email: z
    .email({ message: "Invalid email address" })
    .min(1, { message: "Email is required" }),
});

type InviteBrokerForm = z.infer<typeof inviteBrokerSchema>;

interface InviteBrokerFormProps {
  setOpen: (open: boolean) => void;
}

export default function InviteBrokerForm({ setOpen }: InviteBrokerFormProps) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<InviteBrokerForm>({
    resolver: zodResolver(inviteBrokerSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: InviteBrokerForm) => {
    if (!user) {
      toast.error("You must be logged in to invite brokers");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/broker/invite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: data.email,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to send invitation");
      }

      toast.success("Broker invitation sent successfully!", {
        description: `An invitation email has been sent to ${data.email}`,
      });

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
            placeholder="broker@example.com"
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
