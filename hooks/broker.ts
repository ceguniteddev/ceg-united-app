import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/provider/AuthContext";
import { toast } from "sonner";
import { BrokerStatistics, BrokerRegistration } from "@/schema/broker";
import {
  ApprovedBankFormData,
  ClientApplicationStatus,
} from "@/schema/bank-products";
import { GET_ALL_BROKERS } from "@/constant/react-query-keys";

// Get broker statistics
export const useGetBrokerStatistics = () => {
  const { user } = useAuth();

  const {
    data: statistics,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["BROKER_STATISTICS", user?.uid],
    queryFn: async () => {
      if (!user) throw new Error("User not authenticated");

      const response = await fetch(`/api/broker/${user.uid}/statistics`);
      if (!response.ok) {
        throw new Error("Failed to fetch statistics");
      }

      const data = await response.json();
      return data as BrokerStatistics;
    },
    enabled: !!user,
  });

  return {
    statistics,
    isLoading,
    error,
    refetch,
  };
};

// Get broker clients
export const useGetBrokerClients = () => {
  const { user } = useAuth();

  const {
    data: clients,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["BROKER_CLIENTS", user?.uid],
    queryFn: async () => {
      if (!user) throw new Error("User not authenticated");

      const response = await fetch(`/api/broker/${user.uid}/clients`);
      if (!response.ok) {
        throw new Error("Failed to fetch clients");
      }

      return await response.json();
    },
    enabled: !!user,
  });

  return {
    clients: clients || [],
    isLoading,
    error,
    refetch,
  };
};

// Get broker commissions
export const useGetBrokerCommissions = (
  status?: "Pending" | "Approved" | "Paid"
) => {
  const { user } = useAuth();

  const {
    data: commissions,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["BROKER_COMMISSIONS", user?.uid, status],
    queryFn: async () => {
      if (!user) throw new Error("User not authenticated");

      const url = status
        ? `/api/broker/${user.uid}/commissions?status=${status}`
        : `/api/broker/${user.uid}/commissions`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to fetch commissions");
      }

      return await response.json();
    },
    enabled: !!user,
  });

  return {
    commissions: commissions || [],
    isLoading,
    error,
    refetch,
  };
};

// Submit client application
export const useSubmitClientApplication = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const mutation = useMutation({
    mutationFn: async ({
      step1Data,
      step2Data,
    }: {
      step1Data: any;
      step2Data: any;
    }) => {
      if (!user) throw new Error("User not authenticated");

      const response = await fetch(
        `/api/broker/${user.uid}/submit-application`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ step1Data, step2Data }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.errors[0] || "Failed to submit application");
      }

      return await response.json();
    },
    onSuccess: () => {
      // toast.success("Application submitted successfully!");
      queryClient.invalidateQueries({ queryKey: ["BROKER_CLIENTS"] });
      queryClient.invalidateQueries({ queryKey: ["BROKER_STATISTICS"] });
    },
    onError: (error: Error) => {
      toast.error("Failed to submit application", {
        description: error.message,
      });
    },
  });

  return mutation;
};

// Get all broker clients' mapped funding products
export const useGetBrokerClientsMappedFunding = () => {
  const { user } = useAuth();

  const {
    data: mappedFunding,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["BROKER_CLIENTS_MAPPED_FUNDING", user?.uid],
    queryFn: async () => {
      if (!user) throw new Error("User not authenticated");

      const response = await fetch(`/api/broker/${user.uid}/clients-funding`);
      if (!response.ok) {
        throw new Error("Failed to fetch clients' funding products");
      }

      return await response.json();
    },
    enabled: !!user,
  });

  return {
    mappedFunding: (mappedFunding || []) as ApprovedBankFormData[],
    isLoading,
    error,
    refetch,
  };
};

// Get all brokers (admin only)
export const useGetAllBrokers = () => {
  const { user } = useAuth();

  const {
    data: brokers,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: [GET_ALL_BROKERS],
    queryFn: async () => {
      if (!user) throw new Error("User not authenticated");

      const response = await fetch("/api/broker");
      if (!response.ok) {
        throw new Error("Failed to fetch brokers");
      }

      return await response.json();
    },
    enabled: !!user,
  });

  return {
    brokers: (brokers || []) as (BrokerRegistration & { id: string })[],
    isLoading,
    error,
    refetch,
  };
};

// Update broker status (admin only)
export const useUpdateBrokerStatusMutation = ({
  brokerId,
}: {
  brokerId: string;
}) => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({
      status,
    }: {
      status: "Active" | "InActive" | "Paused";
    }) => {
      const response = await fetch(`/api/broker/${brokerId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.errors || "Failed to update broker status");
      }

      return await response.json();
    },
    onSuccess: () => {
      toast.success("Broker status updated successfully!");
      queryClient.invalidateQueries({ queryKey: [GET_ALL_BROKERS] });
    },
    onError: (error: Error) => {
      toast.error("Failed to update broker status", {
        description: error.message,
      });
    },
  });

  return {
    updateBrokerStatus: mutation.mutateAsync,
    isUpdating: mutation.isPending,
  };
};
