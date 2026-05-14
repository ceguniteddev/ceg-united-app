"use client";

import { Suspense, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Spinner from "@/components/Spinner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CustomFormField } from "@/components/CustomFormField";
import { Form } from "@/components/ui/form";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { authSchema } from "@/schema/new-registration";
import { Button } from "@/components/ui/button";
import { FormPhoneInput } from "@/components/forms/form-phone-input";
import { FormInput } from "@/components/forms/form-input";
import { PasswordStrength } from "@/components/PasswordStrength";
import IconMenu from "@/components/icon-menu";
import { UserPlus } from "lucide-react";

const InitialSignupForm = () => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm({
    resolver: zodResolver(authSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      phoneNumber: "",
      email: "",
      password: "",
    },
  });

  const password = useWatch({
    control: form.control,
    name: "password",
    defaultValue: "",
  });

  const onSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ auth: data }),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "Registration failed");
      }

      toast.success(
        "Registration successful! Please check your email to verify your account.",
      );
      router.push("/");
    } catch (error: any) {
      toast.error(error.message || "Registration failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-center text-2xl font-bold">
          Create an Account
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <FormInput
                control={form.control}
                name="firstName"
                label="First Name"
                placeholder="John"
                required
              />
              <FormInput
                control={form.control}
                name="lastName"
                label="Last Name"
                placeholder="Doe"
                required
              />
            </div>

            <FormPhoneInput
              control={form.control}
              name="phoneNumber"
              label="Phone Number"
              required
            />

            <FormInput
              control={form.control}
              name="email"
              label="Email Address"
              type="email"
              placeholder="john@example.com"
              required
            />
            <FormInput
              control={form.control}
              name="password"
              label="Password"
              type="password"
              placeholder="••••••••"
              required
            />
            <PasswordStrength password={password ?? ""} />

            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-base py-6 transition-colors"
              disabled={isSubmitting}
            >
              <IconMenu
                text={isSubmitting ? "Creating account..." : "Join Now!"}
                icon={<UserPlus className="h-5 w-5" />}
              />
            </Button>

            <div className="text-center mt-6">
              <p className="text-sm text-gray-600">
                Already have an account?{" "}
                <Link
                  href="/"
                  className="text-blue-600 hover:text-blue-800 font-semibold hover:underline transition-all"
                >
                  Log in
                </Link>
              </p>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default function NewRegistrationPage() {
  return (
    <div className="p-3 sm:p-4 md:p-6 min-h-screen">
      <div className="flex justify-center items-center mb-6 sm:mb-8">
        <Image
          src="/icon.png"
          alt={(process.env.NEXT_PUBLIC_APP_NAME as string) || "CEG United"}
          width={80}
          height={80}
          className="sm:w-[80px] sm:h-[60px]"
        />
      </div>
      <Suspense fallback={<Spinner />}>
        <InitialSignupForm />
      </Suspense>
    </div>
  );
}
