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
        throw new AppError("Failed to register. Please refresh the page.");
      }

      const captchaData = await createEnterpriseAssessment(
        token,
        "registration"
      );
      if (!captchaData || captchaData.score < 0.5) {
        throw new AppError("Failed to register. Please refresh the page.");
      }

      await registerUser(values);
      router.replace("/");
    },
    onSuccess: () => {
      toast.success("Registered successfully.");
    },
    onError: (error: any) => {
      if (error instanceof AppError) {
        toast.warning(error.message);
      } else {
        toast.warning(error.message);
        console.error(error);
      }
    },
  });

  return {
    recordRegistration: createMutation.mutateAsync,
    isRecording: createMutation.isPending,
  };
};
