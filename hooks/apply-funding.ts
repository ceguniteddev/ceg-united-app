import AppError from "@/error/AppError";
import { ApplyFunding, ApplyFundingWithUser } from "@/schema/apply-funding";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { verifyCaptchaToken } from "@/lib/captcha/captcha";
import {
  applyFunding,
  deleteApplyFunding,
  getApplyFunding,
  getFundingApplications,
} from "@/service/apply-funding";
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

export const useGetFundingApplications = () => {
  const { user } = useAuth();

  const { data: appliedFunding, isLoading } = useQuery({
    queryKey: ["GET_FUNDING_APPLICATIONS"],
    queryFn: async () => {
      if (!user) throw new Error("User not authenticated");

      const data = (await getFundingApplications({})) as ApplyFundingWithUser[];

      return data;
    },
    enabled: !!user,
  });

  return {
    appliedFunding,
    isLoading,
  };
};

export const useGetFundingApplicationsIsNew = () => {
  const { user } = useAuth();

  const { data: appliedFunding, isLoading } = useQuery({
    queryKey: ["GET_FUNDING_APPLICATIONS_NEW"],
    queryFn: async () => {
      if (!user) throw new Error("User not authenticated");

      const data = (await getFundingApplications({ status: "New" })) as ApplyFundingWithUser[];

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
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const createMutation = useMutation({
    mutationFn: async ({ values }: { values: ApplyFunding }) => {
      // if (!token) {
      //   throw new AppError("Captcha token is missing. Please try again.");
      // }

      if (!user) throw new Error("User not authenticated");

      // const captchaData = await verifyCaptchaToken(token);
      // if (
      //   !captchaData ||
      //   !captchaData.success ||
      //   captchaData.score < 0.5 ||
      //   captchaData.action !== "applyFunding"
      // ) {
      //   throw new AppError("Captcha verification failed. Please try again.");
      // }

      await applyFunding(values);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["GET_USER_APPLY_FUNDING", user?.uid],
      });
      queryClient.invalidateQueries({
        queryKey: ["GET_FUNDING_APPLICATIONS"],
      });
      queryClient.invalidateQueries({
        queryKey: ["GET_FUNDING_APPLICATIONS_NEW"],
      });
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

  const deleteMutation = useMutation({
    mutationFn: async (referenceNumber: string) => {
      await deleteApplyFunding(referenceNumber);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["GET_USER_APPLY_FUNDING", user?.uid],
      });
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
    applyFunding: createMutation.mutateAsync,
    isRecording: createMutation.isPending,

    deleteAppliedFunding: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
  };
};
