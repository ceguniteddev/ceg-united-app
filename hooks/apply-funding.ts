import AppError from "@/error/AppError";
import { ApplyFunding, ApplyFundingWithUser } from "@/schema/apply-funding";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { verifyCaptchaToken } from "@/lib/captcha/captcha";
import {
  addFundApplicationNotes,
  applyFunding,
  deleteApplyFunding,
  getApplyFunding,
  getFundApplicationNotes,
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

export const useGetClientApprovedMappedFunding = () => {
  const { user } = useAuth();

  const { data: appliedFunding, isLoading } = useQuery({
    queryKey: ["useGetClientApprovedMappedFunding", user?.uid],
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
    mutationFn: async ({
      values,
      bankProductId,
    }: {
      values: ApplyFunding;
      bankProductId: string;
    }) => {
      if (!user) throw new Error("User not authenticated");

      await applyFunding({ value: values, bankProductId: bankProductId });
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

export const useAddFundApplicationNotesMutation = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const addUserNotesMutation = useMutation({
    mutationFn: async ({
      referenceNumber,
      notes,
    }: {
      referenceNumber: string;
      notes: string[];
    }) => {
      if (!user) {
        throw new AppError("User not authenticated");
      }

      await addFundApplicationNotes({ referenceNumber, notes });
    },
    onSuccess: (data, _variable) => {
      toast.success("Notes successfully added.");
      queryClient.invalidateQueries({
        queryKey: ["GET_FUND_APPLICATION_NOTES", _variable.referenceNumber],
      });
    },

    onError: (error: any) => {
      console.log("Error adding notes:", error);
      toast.error("Failed to add notes. Please try again.");
    },
  });

  return {
    addNotes: addUserNotesMutation.mutateAsync,
    isRecording: addUserNotesMutation.isPending,
  };
};

export const useAddFundApplicationNotesQuery = ({
  referenceNumber,
}: {
  referenceNumber: string;
}) => {
  const { user } = useAuth();

  const { data: notes, isLoading } = useQuery({
    queryKey: ["GET_FUND_APPLICATION_NOTES", referenceNumber],
    queryFn: async () => {
      if (!user) throw new Error("User not authenticated");

      const data = (await getFundApplicationNotes(referenceNumber)) as string[];

      return data;
    },
    enabled: !!user && !!referenceNumber,
  });

  return {
    notes,
    isLoading,
  };
};
