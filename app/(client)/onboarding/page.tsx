"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { OnboardingForm } from "@/components/new-registration/OnboardingForm";
import { useNewRegistrationStore } from "@/store/new-registration-store";
import { useAuth } from "@/provider/AuthContext";
import Spinner from "@/components/Spinner";

export default function OnboardingPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { resetRegistration } = useNewRegistrationStore();

  const handleFinalSubmit = async (data: any) => {
    try {
      if (!user) throw new Error("Not authenticated");

      const response = await fetch(`/api/user/${user.uid}/onboarding`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Onboarding failed");
      }

      resetRegistration();
      toast.success("Onboarding completed successfully!");
      router.push("/client/home");
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "An error occurred");
      throw error;
    }
  };

  if (loading) {
    return <Spinner />;
  }

  if (!user) {
    router.push("/login");
    return null;
  }

  return (
    <div className="p-3 sm:p-4 md:p-6 min-h-screen">
      <div className="w-full max-w-[95vw] sm:max-w-[900px] lg:max-w-[1000px] mx-auto">
        <OnboardingForm onFinalSubmit={handleFinalSubmit} />
      </div>
    </div>
  );
}
