"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useAuth } from "@/provider/AuthContext";
import { Loader2, Mail, UserPlus } from "lucide-react";
import { CustomFormField } from "@/components/CustomFormField";

const inviteBrokerSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  //   commissionRate: z
  //     .number()
  //     .min(0, "Must be at least 0%")
  //     .max(100, "Cannot exceed 100%"),
});

type InviteBrokerForm = z.infer<typeof inviteBrokerSchema>;

export default function InviteBrokerPage() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<InviteBrokerForm>({
    resolver: zodResolver(inviteBrokerSchema),
    defaultValues: {
      email: "",
      //   commissionRate: 5,
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
          //   commissionRate: data.commissionRate,
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
    } catch (error: any) {
      toast.error("Failed to send invitation", {
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-full w-full flex-col p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Broker Management</h1>
        <p className="text-muted-foreground">
          Invite brokers to join your referral program
        </p>
      </div>

      <div className="grid gap-6 max-w-2xl">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              <CardTitle>Invite New Broker</CardTitle>
            </div>
            <CardDescription>
              Send an invitation email to a new broker with their registration
              link
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                {/* <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="broker@example.com"
                            className="pl-9"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormDescription>
                        The broker will receive an invitation email at this
                        address
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                /> */}
                <CustomFormField
                  name="email"
                  label="Email Address"
                  type="email"
                />

                {/* <FormField
                  control={form.control}
                  name="commissionRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Commission Rate (%)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          step="0.5"
                          placeholder="5"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Percentage of funded amount the broker will earn
                        (0-100%)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                /> */}

                <Button type="submit" disabled={isLoading} className="w-full">
                  {isLoading && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Send Invitation
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* <Card>
          <CardHeader>
            <CardTitle>How it works</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <div className="flex gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium">
                1
              </div>
              <p>
                Enter the broker's email address and set their commission rate
              </p>
            </div>
            <div className="flex gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium">
                2
              </div>
              <p>
                An invitation email with a secure registration link will be sent
              </p>
            </div>
            <div className="flex gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium">
                3
              </div>
              <p>The broker can register using the link within 7 days</p>
            </div>
            <div className="flex gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium">
                4
              </div>
              <p>
                Once registered, the broker can start submitting client
                applications
              </p>
            </div>
          </CardContent>
        </Card> */}
      </div>
    </div>
  );
}
