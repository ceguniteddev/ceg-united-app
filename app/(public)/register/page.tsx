"use client";
import { Suspense, useState, useEffect } from "react";
import { toast } from "sonner";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { MultiStepRegistrationForm } from "@/components/registration";
import { ClientApplicationForm } from "@/schema/client-application";
import { ApplyFunding } from "@/schema/apply-funding";
import { getCaptchaTokenRegistration } from "@/lib/captcha";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Spinner from "@/components/Spinner";

const RegistrationForm = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const invitationToken = searchParams.get("token");
  const invitationType = searchParams.get("type");

  const [invitationEmail, setInvitationEmail] = useState<string>("");
  const [isEmailReadOnly, setIsEmailReadOnly] = useState(false);

  useEffect(() => {
    const fetchInvitation = async () => {
      if (invitationToken && invitationType === "client") {
        try {
          const res = await fetch(
            `/api/auth/validate-invitation?token=${invitationToken}`,
          );
          if (res.ok) {
            const data = await res.json();
            if (data.email) {
              setInvitationEmail(data.email);
              setIsEmailReadOnly(true);
            }
          }
        } catch (error) {
          console.error("Error fetching invitation", error);
        }
      }
    };
    fetchInvitation();
  }, [invitationToken, invitationType]);

  const onSubmit = async (
    step1Data: ClientApplicationForm,
    step2Data: ApplyFunding,
  ) => {
    setIsSubmitting(true);
    try {
      const token = await getCaptchaTokenRegistration("registration");

      if (!token) {
        toast.warning("Failed to register. Please refresh the page.");
        return;
      }

      const response = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          step1Data,
          step2Data,
          invitationToken,
          invitationType,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.errors || "Registration failed");
      }

      toast.success("Registered successfully!", {
        description:
          "Your account has been created and your funding application has been submitted.",
      });
      router.push("/");
    } catch (error: any) {
      toast.error("Registration failed", {
        description: error.message || "Please try again later.",
      });
      console.error("Registration error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="flex justify-center">
        <Card className="w-full max-w-[95vw] sm:max-w-[900px] lg:max-w-[1200px]">
          <CardHeader>
            <CardTitle className="text-center flex flex-col">
              <span className="text-xl sm:text-2xl font-bold">
                Register your account
              </span>
              <span className="text-sm sm:text-base text-gray-600">
                Complete your personal information and funding application
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <MultiStepRegistrationForm
              onSubmit={onSubmit}
              isSubmitting={isSubmitting}
              onClose={() => router.push("/")}
              registrationType="client"
              initialEmail={invitationEmail}
              isEmailReadOnly={isEmailReadOnly}
            />
          </CardContent>
        </Card>
      </div>

      <div className="text-sm text-gray-600 text-center mt-4">
        Already have an account?{" "}
        <Link
          href="/"
          className="font-medium underline underline-offset-4 hover:no-underline focus:outline-none focus:ring-2 focus:ring-offset-2"
        >
          Signin here
        </Link>
      </div>
    </>
  );
};

const RegistrationPage = () => {
  return (
    <div className="p-3 sm:p-4 md:p-6 min-h-screen">
      <div className="flex justify-center items-center mb-4 sm:mb-6">
        <Image
          src="/icon.png"
          alt={process.env.NEXT_PUBLIC_APP_NAME as string}
          width={80}
          height={80}
          className="sm:w-[80px] sm:h-[60px]"
        />
      </div>
      <Suspense fallback={<Spinner />}>
        <RegistrationForm />
      </Suspense>
    </div>
  );
};

export default RegistrationPage;
