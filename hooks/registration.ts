import AppError from "@/error/AppError";
import { User } from "@/schema/registration";
import { registerUser } from "@/service/user";

import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { createEnterpriseAssessment } from "@/lib/captcha/captcha";
export const useRegistration = () => {
  const router = useRouter();

  const createMutation = useMutation({
    mutationFn: async ({
      token,
      values,
    }: {
      values: User;
      token: string | null;
    }) => {
      if (!token) {
        toast.warning("Failed to register. Please refresh the page.");
        return;
      }

      const response = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token, values }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw errorData;
      }
      return response.json();
    },
    onSuccess: () => {
      toast.success("Registered successfully.");
      router.replace("/");
    },
    onError: (error: any) => {
      toast.warning(error.errors[0]);
      console.error(error);
    },
  });

  return {
    recordRegistration: createMutation.mutateAsync,
    isRecording: createMutation.isPending,
  };
};
