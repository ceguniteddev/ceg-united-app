"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { CustomFormField } from "@/components/CustomFormField";
import { PasswordStrength } from "@/components/PasswordStrength";
import Spinner from "@/components/Spinner";
import { toast } from "sonner";
import { passwordSchema } from "@/schema/registration";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  ShieldCheck,
  Mail,
  Phone,
  Loader2,
} from "lucide-react";

// Form Validation Schema
const adminRegisterSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phoneNumber: z
    .string()
    .min(10, "Phone number must be at least 10 digits")
    .regex(/^\+?[0-9\s\-()]+$/, "Invalid phone number format"),
  password: passwordSchema,
});

type AdminRegisterValues = z.infer<typeof adminRegisterSchema>;

function AdminRegistrationForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [isValidating, setIsValidating] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const [email, setEmail] = useState("");
  const [invitedByName, setInvitedByName] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<AdminRegisterValues>({
    resolver: zodResolver(adminRegisterSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      phoneNumber: "",
      password: "",
    },
  });

  const passwordValue = form.watch("password");

  // Validate Token on Mount
  useEffect(() => {
    if (!token) {
      setIsValidating(false);
      setIsValid(false);
      return;
    }

    const validateToken = async () => {
      try {
        const response = await fetch(
          `/api/admin/validate-token?token=${token}`,
        );
        if (!response.ok) {
          throw new Error("Validation request failed");
        }
        const data = await response.json();
        if (data.valid) {
          setIsValid(true);
          setEmail(data.email);
          setInvitedByName(data.invitedByName);
        } else {
          setIsValid(false);
        }
      } catch (err) {
        console.error("Token validation error:", err);
        setIsValid(false);
      } finally {
        setIsValidating(false);
      }
    };

    validateToken();
  }, [token]);

  const onSubmit = async (data: AdminRegisterValues) => {
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/admin/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName: data.firstName.trim(),
          lastName: data.lastName.trim(),
          phoneNumber: data.phoneNumber.trim(),
          password: data.password,
          email,
          token,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(
          errData.message ||
            errData.errors?.[0] ||
            "Failed to register as administrator",
        );
      }

      toast.success("Registration Successful!", {
        description:
          "Your administrator account has been set up. Redirecting to login...",
      });

      // Redirect to login after a brief delay
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (err: any) {
      toast.error("Registration Failed", {
        description: err.message,
      });
      setIsSubmitting(false);
    }
  };

  if (isValidating) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50">
        <Spinner displayText="Validating administrator invitation..." />
      </div>
    );
  }

  // Token is expired, invalid, or missing
  if (!isValid) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50">
        <div className="w-full max-w-md bg-white rounded-2xl border border-gray-100 shadow-xl p-6 md:p-8 text-center space-y-6">
          <div className="flex justify-center">
            <div className="p-4 bg-red-50 text-red-600 rounded-full">
              <AlertCircle className="h-12 w-12" />
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              Invitation Invalid or Expired
            </h1>
            <p className="text-gray-600 text-sm leading-relaxed">
              The registration link you followed is no longer active, has
              expired, or may have already been used. Administrative invitations
              expire after 7 days for security reasons.
            </p>
          </div>

          <div className="p-4 bg-gray-50 rounded-xl space-y-3 text-left">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Next steps:
            </p>
            <div className="flex items-start gap-2 text-sm text-gray-600">
              <ShieldCheck className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
              <span>
                Contact your system administrator to send a new invitation.
              </span>
            </div>
            <div className="flex items-start gap-2 text-sm text-gray-600">
              <Mail className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
              <span>
                Make sure you are registering with the correct email address.
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <Button
              className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg"
              onClick={() => router.push("/login")}
            >
              Go to Login
            </Button>
            <Button
              variant="outline"
              className="w-full h-11 border-gray-200 text-gray-600 font-medium rounded-lg hover:bg-gray-50"
              onClick={() => router.push("mailto:support@cegunited.com")}
            >
              Contact Support
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 sm:p-6 md:p-8 bg-gray-50">
      <div className="w-full max-w-lg bg-white rounded-2xl border border-gray-100 shadow-xl p-6 sm:p-8 md:p-10 space-y-8">
        {/* Header and Branding */}
        <div className="flex flex-col items-center text-center space-y-4">
          <Image
            src="/icon.png"
            alt="CEG United Logo"
            width={120}
            height={100}
            className="h-16 w-auto object-contain"
            priority
          />
          <div className="space-y-1.5">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
              Complete Admin Setup
            </h1>
            <p className="text-gray-600 text-sm">
              {invitedByName ? (
                <span>
                  You have been invited by{" "}
                  <strong className="text-gray-900">{invitedByName}</strong> to
                  join CEG United LLC as an Administrator
                </span>
              ) : (
                <span>Join CEG United LLC as an Administrator</span>
              )}
            </p>
          </div>
        </div>

        {/* Registration Form */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <fieldset disabled={isSubmitting} className="space-y-5">
              {/* Email (Read-only) */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">
                  Invited Email Address
                </label>
                <div className="flex items-center h-11 px-3 bg-gray-50 border border-gray-200 text-gray-500 rounded-lg text-sm select-none">
                  {email}
                </div>
                <p className="text-xs text-gray-400">
                  This registration link is tied specifically to this email
                  address.
                </p>
              </div>

              {/* Name Fields (Grid) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <CustomFormField
                  name="firstName"
                  label="First Name"
                  type="text"
                  placeholder="First name"
                  inputClassName="h-11 rounded-lg border-gray-200"
                />
                <CustomFormField
                  name="lastName"
                  label="Last Name"
                  type="text"
                  placeholder="Last name"
                  inputClassName="h-11 rounded-lg border-gray-200"
                />
              </div>

              {/* Phone Number */}
              <CustomFormField
                name="phoneNumber"
                label="Phone Number"
                type="text"
                placeholder="(123) 456-7890"
                inputClassName="h-11 rounded-lg border-gray-200"
              />

              {/* Password */}
              <div className="space-y-3">
                <CustomFormField
                  name="password"
                  label="Password"
                  type="password"
                  placeholder="Enter secure password"
                  inputClassName="h-11 rounded-lg border-gray-200"
                />

                {/* Real-time Password Strength feedback */}
                {passwordValue && (
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <PasswordStrength password={passwordValue} />
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-4 space-y-3">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-sm"
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Setting up Admin Account...
                    </span>
                  ) : (
                    "Complete Registration"
                  )}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  disabled={isSubmitting}
                  onClick={() => router.push("/login")}
                  className="w-full h-11 text-gray-500 hover:text-gray-900 font-medium rounded-lg"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Login
                </Button>
              </div>
            </fieldset>
          </form>
        </Form>
      </div>
    </div>
  );
}

export default function AdminRegistrationPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50">
          <Spinner displayText="Loading setup form..." />
        </div>
      }
    >
      <AdminRegistrationForm />
    </Suspense>
  );
}
