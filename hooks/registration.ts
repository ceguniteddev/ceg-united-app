import AppError from "@/error/AppError";
import { Registration } from "@/schema/registration";
import { registerClient } from "@/service/user";

import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { verifyCaptchaToken } from "@/lib/captcha/captcha";
export const useRegistration = () => {
  const router = useRouter();

  const createMutation = useMutation({
    mutationFn: async ({ token, values }: { values: Registration; token: string | null }) => {
      if (!token) {
        throw new AppError("Captcha token is missing. Please try again.");
      }

      const captchaData = await verifyCaptchaToken(token);
      if (
        !captchaData ||
        !captchaData.success ||
        captchaData.score < 0.5 ||
        captchaData.action !== "registration"
      ) {
        throw new AppError("Captcha verification failed. Please try again.");
      }

      await registerClient(values);
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
