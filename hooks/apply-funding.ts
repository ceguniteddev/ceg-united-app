import AppError from "@/error/AppError";
import { ApplyFunding } from "@/schema/apply-funding";

import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { verifyCaptchaToken } from "@/lib/captcha/captcha";
import { applyFunding, getApplyFunding } from "@/service/apply-funding";
import { useAuth } from "@/provider/AuthContext";

export const useGetUserApplyFunding = () => {
  const { user } = useAuth();

  const { data: appliedFunding, isLoading } = useQuery({
    queryKey: ["GET_USER_APPLY_FUNDING", user?.uid],
    queryFn: async () => {
      if (!user) throw new Error("User not authenticated");
      const data = (await getApplyFunding(user.uid)) as ApplyFunding[];

      return data;
    },
    enabled: !!user,
  });

  return {
    appliedFunding,
    isLoading,
  };
};

export const useApplyFunding = () => {
  const router = useRouter();

  const createMutation = useMutation({
    mutationFn: async ({ token, values }: { values: ApplyFunding; token: string | null }) => {
      if (!token) {
        throw new AppError("Captcha token is missing. Please try again.");
      }

      const captchaData = await verifyCaptchaToken(token);
      if (
        !captchaData ||
        !captchaData.success ||
        captchaData.score < 0.5 ||
        captchaData.action !== "applyFunding"
      ) {
        throw new AppError("Captcha verification failed. Please try again.");
      }

      await applyFunding(values);
    },
    // onSuccess: () => {
    //   toast.success("Funding application is submitted successfully");
    // },
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
    applyFunding: createMutation.mutateAsync,
    isRecording: createMutation.isPending,
  };
};
