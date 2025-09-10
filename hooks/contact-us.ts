import AppError from "@/error/AppError";
import { useAuth } from "@/provider/AuthContext";
import { RequestCall } from "@/schema";
import { getRequestsCustomerCall, recordRequestCustomerCall } from "@/service/contact-us";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

export const useContactUsQuery = () => {
  const { user } = useAuth();

  const { data: requestCalls, isLoading } = useQuery({
    queryKey: ["GET_USER_REQUEST_CALLS"],
    queryFn: async () => {
      if (!user) throw new Error("User not authenticated");
      const data = (await getRequestsCustomerCall()) as RequestCall[];

      return data;
    },
    enabled: !!user,
  });

  return {
    requestCalls,
    isLoading,
  };
};

export const useContactUsMutation = () => {
  const { user } = useAuth();

  const createMutation = useMutation({
    mutationFn: async ({ values }: { values: RequestCall }) => {
      if (!user) {
        throw new AppError("User not authenticated");
      }

      await recordRequestCustomerCall(user.uid, values);
    },
    onSuccess: () => {
      toast.success("Your request has been submitted. We'll reach out soon.");
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
    requestCall: createMutation.mutateAsync,
    isRequesting: createMutation.isPending,
  };
};
