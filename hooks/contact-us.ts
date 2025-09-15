import AppError from "@/error/AppError";
import { useAuth } from "@/provider/AuthContext";
import { RequestCall } from "@/schema";
import {
  getRequestsCustomerCall,
  getRequestsCustomerCallIsOpen,
  recordRequestCustomerCall,
  updateRequestCustomerCall,
} from "@/service/contact-us";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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

export const useContactUsQueryIsOpen = () => {
  const { user } = useAuth();

  const { data: requestCallsOpen, isLoading } = useQuery({
    queryKey: ["GET_USER_REQUEST_CALLS_OPEN"],
    queryFn: async () => {
      if (!user) throw new Error("User not authenticated");
      const data = (await getRequestsCustomerCallIsOpen()) as RequestCall[];

      return data;
    },
    enabled: !!user,
  });

  return {
    requestCallsOpen,
    isLoading,
  };
};

export const useContactUsMutation = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

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

  const updateMutation = useMutation({
    mutationFn: async ({ values, id }: { values: RequestCall; id: string }) => {
      if (!user) {
        throw new AppError("User not authenticated");
      }

      await updateRequestCustomerCall(id, values);
    },
    onSuccess: () => {
      toast.success("Call request has been updated.");
      queryClient.invalidateQueries({
        queryKey: ["GET_USER_REQUEST_CALLS"],
      });
      queryClient.invalidateQueries({
        queryKey: ["GET_USER_REQUEST_CALLS_OPEN"],
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
    requestCall: createMutation.mutateAsync,
    isRequesting: createMutation.isPending,

    updateRequestCall: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
  };
};
