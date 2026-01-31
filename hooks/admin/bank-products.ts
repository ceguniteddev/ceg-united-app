import { GET_BANK_PRODUCTS } from "@/constant/react-query-keys";
import AppError from "@/error/AppError";
import { useAuth } from "@/provider/AuthContext";
import { BankFormData } from "@/schema/bank-products";
import {
  deleteBankProduct,
  getBankProduct,
  getBankProducts,
  recordBankProduct,
  updateBankProduct,
} from "@/service/bank-products";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export const useBankProductsQuery = () => {
  const { user } = useAuth();

  const { data, isLoading, error } = useQuery({
    queryKey: [GET_BANK_PRODUCTS],
    enabled: !!user,
    queryFn: async (): Promise<BankFormData[]> => {
      if (!user) throw new Error("User not authenticated");
      const data = await getBankProducts();
      if (!data.success) throw new Error(data.message);
      return data.data || [];
    },
  });

  return { products: data, isLoading, error };
};

export const useBankProductsQueryById = (id: string) => {
  const { user } = useAuth();

  const { data, isLoading, error } = useQuery({
    queryKey: [GET_BANK_PRODUCTS, id],
    enabled: !!user,
    queryFn: async (): Promise<BankFormData | null> => {
      if (!user) throw new Error("User not authenticated");
      const data = await getBankProduct(id);
      // if (!data) throw new Error("Bank product not found");
      return data;
    },
  });

  return { products: data, isLoading, error };
};

export const useBankProductsMutation = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async (values: BankFormData) => {
      if (!user) throw new Error("User not authenticated");

      await recordBankProduct(values);
    },
    onSuccess: (_data, variable) => {
      queryClient.invalidateQueries({
        queryKey: [GET_BANK_PRODUCTS],
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

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      values,
    }: {
      values: BankFormData;
      id: string;
    }) => {
      if (!user) throw new Error("User not authenticated");

      await updateBankProduct(id, values);
    },
    onSuccess: (_data, variable) => {
      queryClient.invalidateQueries({
        queryKey: [GET_BANK_PRODUCTS],
      });
      queryClient.invalidateQueries({
        queryKey: [GET_BANK_PRODUCTS, variable.id],
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
    mutationFn: async (id: string) => {
      if (!user) throw new Error("User not authenticated");

      await deleteBankProduct(id);
    },
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({
        queryKey: [GET_BANK_PRODUCTS],
      });
      queryClient.invalidateQueries({
        queryKey: [GET_BANK_PRODUCTS, id],
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
    createBankProduct: createMutation.mutateAsync,
    isCreating: createMutation.isPending,

    updateBankProduct: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,

    deleteBankProduct: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
    isDeleteSuccess: deleteMutation.isSuccess,
  };
};
