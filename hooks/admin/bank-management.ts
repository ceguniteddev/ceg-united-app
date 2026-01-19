import { GET_BANK_MANAGEMENT } from "@/constant/react-query-keys";
import { BankManagement } from "@/schema/bank-management";
import {
  createBank,
  deleteBank,
  getBanks,
  updateBank,
} from "@/service/bank-management";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/provider/AuthContext";

export const useBankManagementQuery = () => {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: [GET_BANK_MANAGEMENT],
    queryFn: async () => {
      const banks = await getBanks();
      return banks;
    },
    enabled: !!user,
  });

  return { banks: data, isLoading };
};

export const useBankManagementMutation = () => {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: createBank,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [GET_BANK_MANAGEMENT] });
      toast.success("Bank created successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create bank");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<BankManagement> }) =>
      updateBank(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [GET_BANK_MANAGEMENT] });
      toast.success("Bank updated successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update bank");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteBank,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [GET_BANK_MANAGEMENT] });
      toast.success("Bank deleted successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete bank");
    },
  });

  return {
    createBank: createMutation.mutateAsync,
    updateBank: updateMutation.mutateAsync,
    deleteBank: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};
