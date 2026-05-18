"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormInput } from "@/components/forms/form-input";
import { FormPhoneInput } from "@/components/forms/form-phone-input";
import { PasswordStrength } from "@/components/PasswordStrength";
import { useFormContext, useWatch } from "react-hook-form";
import Link from "next/link";
import { FormSSNInput } from "../forms/form-ssn-input";

export function Step1Auth() {
  const form = useFormContext();

  const password = useWatch({
    control: form.control,
    name: "password",
    defaultValue: "",
  });

  return (
    <Card className="bg-slate-100 border-slate-200">
      <CardHeader>
        <CardTitle className="text-center text-2xl font-bold">
          Create an Account
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
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
            name="middleName"
            label="Middle Name"
            placeholder="(Optional)"
          />
          <FormInput
            control={form.control}
            name="lastName"
            label="Last Name"
            placeholder="Doe"
            required
          />
        </div>

        <FormSSNInput
          control={form.control}
          name="ssn"
          label="Social Security Number"
          required
        />

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

        <div className="text-center mt-6">
          <p className="text-sm text-gray-600">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-blue-600 hover:text-blue-800 font-semibold hover:underline transition-all"
            >
              Log in
            </Link>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
