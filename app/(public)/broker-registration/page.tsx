"use client";

import { Suspense, use, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm, FormProvider } from "react-hook-form";
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
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { authFirebase } from "@/lib/firebase";
import { PasswordStrength } from "@/components/PasswordStrength";
import { passwordSchema, ssnSchema } from "@/schema/registration";
import Image from "next/image";
import { CustomFormField } from "@/components/CustomFormField";
import { genderTypes } from "@/schema";

// Simplified broker registration schema for the form
const brokerRegFormSchema = z.object({
  firstName: z.string().min(1, { message: "Required" }),
  //   middleName: z.string().optional(),
  lastName: z.string().min(1, { message: "Required" }),
  email: z.string().email(),
  password: passwordSchema,
  //   birthdate: z.string().min(1, { message: "Required" }),
  //   gender: z.enum(["Male", "Female", "Other"]),
  phoneNumber: z.string().min(1, { message: "Required" }),
  //   ssn: ssnSchema,
  companyName: z.string().optional(),
});

type BrokerRegForm = z.infer<typeof brokerRegFormSchema>;

export default function BrokerRegistrationPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const router = useRouter();
  //   const searchParams = useSearchParams();
  const params = use(searchParams);
  const token = params.token;

  const [isLoading, setIsLoading] = useState(false);
  const [isValidatingToken, setIsValidatingToken] = useState(true);
  const [invitationData, setInvitationData] = useState<any>(null);
  const [password, setPassword] = useState("");

  const form = useForm<BrokerRegForm>({
    resolver: zodResolver(brokerRegFormSchema),
    defaultValues: {
      email: "",
      companyName: "",
      //   middleName: "",
    },
  });

  const genderOptions = genderTypes();

  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        toast.error("Invalid invitation link");
        setIsValidatingToken(false);
        return;
      }

      try {
        const response = await fetch(
          `/api/broker/validate-token?token=${token}`
        );
        if (!response.ok) {
          throw new Error("Invalid or expired invitation");
        }

        const data = await response.json();
        setInvitationData(data);
        form.setValue("email", data.email);
      } catch (error: any) {
        toast.error(error.message || "Invalid invitation link");
        setTimeout(() => router.push("/"), 3000);
      } finally {
        setIsValidatingToken(false);
      }
    };

    validateToken();
  }, [token, form, router]);

  const onSubmit = async (data: BrokerRegForm) => {
    setIsLoading(true);

    try {
      // Create Firebase Auth user
      //   const userCredential = await createUserWithEmailAndPassword(
      //     authFirebase,
      //     data.email,
      //     data.password
      //   );

      //   const user = userCredential.user;

      // Register broker profile
      const response = await fetch("/api/broker/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          //   userId: user.uid,
          //   birthdate: new Date(data.birthdate),
          role: "Broker",
          isOnboarded: false,
          //   commissionRate: invitationData.commissionRate,
          invitedBy: invitationData.invitedBy,
          invitationToken: token,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to register");
      }

      toast.success("Registration successful!", {
        description: "Welcome to CEG United LLC!",
      });

      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push("/");
      }, 2000);
    } catch (error: any) {
      toast.error("Registration failed", {
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isValidatingToken) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="mt-4 text-sm text-muted-foreground">
              Validating invitation...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!invitationData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center p-12">
            <div className="rounded-full bg-red-100 p-3">
              <svg
                className="h-6 w-6 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h3 className="mt-4 text-lg font-semibold">Invalid Invitation</h3>
            <p className="mt-2 text-center text-sm text-muted-foreground">
              This invitation link is invalid or has expired.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-2xl my-8">
        <CardHeader>
          <div className="flex justify-center items-center">
            <Image
              src="/icon.png"
              alt={process.env.NEXT_PUBLIC_APP_NAME as string}
              width={100}
              height={100}
            />
          </div>
          <CardTitle className="text-center text-2xl">
            Complete Your Broker Registration
          </CardTitle>
          <CardDescription className="text-center">
            You've been invited by {invitationData.invitedByName} to join CEG
            United LLC as a broker
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FormProvider {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <CustomFormField
                  name="firstName"
                  label="First Name"
                  placeholder="John"
                />

                <CustomFormField
                  name="lastName"
                  label="Last Name"
                  placeholder="Doe"
                />
              </div>

              {/* <CustomFormField
                name="middleName"
                label="Middle Name (Optional)"
                placeholder="Middle name"
              /> */}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <CustomFormField
                  name="email"
                  label="Email"
                  type="email"
                  disabled={true}
                />

                <CustomFormField
                  name="phoneNumber"
                  label="Phone Number"
                  placeholder="(555) 123-4567"
                />
              </div>

              {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <CustomFormField
                  name="birthdate"
                  label="Date of Birth"
                  type="date-picker"
                  placeholder="Select date of birth"
                />

                <CustomFormField
                  name="gender"
                  label="Gender"
                  type="select"
                  placeholder="Select gender"
                  options={genderOptions}
                />
              </div> */}

              {/* <CustomFormField
                name="ssn"
                label="Social Security Number"
                placeholder="XXX-XX-XXXX"
                className="[&_input]:placeholder:text-xs"
              /> */}

              <CustomFormField
                name="companyName"
                label="Company Name (Optional)"
                placeholder="Your company name"
              />

              <CustomFormField
                name="password"
                label="Password"
                type="password"
                placeholder="Create a strong password"
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setPassword(e.target.value);
                }}
              />

              {password && (
                <div className="-mt-2">
                  <PasswordStrength password={password} />
                </div>
              )}

              {/* <div className="rounded-lg bg-blue-50 p-4 border border-blue-200">
                <h4 className="font-semibold text-sm text-blue-900 mb-2">
                  Your Commission Rate
                </h4>
                <p className="text-2xl font-bold text-blue-600">
                  {invitationData.commissionRate}%
                </p>
                <p className="text-xs text-blue-700 mt-1">
                  You'll earn this percentage on all funded deals
                </p>
              </div> */}

              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Complete Registration
              </Button>
            </form>
          </FormProvider>
        </CardContent>
      </Card>
    </div>
  );
}
