import {
  GET_CLIENT_DOCUMENTS,
  GET_FUNDING_PRODUCT,
  GET_FUNDING_PRODUCTS,
} from "@/constant/react-query-keys";
import AppError from "@/error/AppError";
import { useAuth } from "@/provider/AuthContext";
import { FundingProduct } from "@/schema/funding-products";
import {
  deleteFundingProduct,
  getFundingProduct,
  getFundingProducts,
  recordFundingProduct,
  updateFundingProduct,
} from "@/service/funding-products";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { toast } from "sonner";

export const useFundingProducts = () => {
  const { user } = useAuth();

  const { data, isLoading, error } = useQuery({
    queryKey: [GET_FUNDING_PRODUCTS],
    enabled: !!user,
    queryFn: async (): Promise<FundingProduct[]> => {
      if (!user) throw new Error("User not authenticated");
      const data = await getFundingProducts();
      return data;
    },
    // staleTime: 0,
    // refetchOnWindowFocus: true,
    // refetchInterval: 4 * 60 * 1000,
  });

  return { products: data, isLoading, error };
};

export const useFundingProduct = (id: string) => {
  const { user } = useAuth();

  const { data, isLoading, error } = useQuery({
    queryKey: [GET_FUNDING_PRODUCT, id],
    enabled: !!user,
    queryFn: async (): Promise<FundingProduct> => {
      if (!user) throw new Error("User not authenticated");
      const data = await getFundingProduct(id);
      return data;
    },
    // staleTime: 0,
    // refetchOnWindowFocus: true,
    // refetchInterval: 4 * 60 * 1000,
  });

  return { products: data, isLoading, error };
};

export const useFundingProductMutation = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async (values: FundingProduct) => {
      if (!user) throw new Error("User not authenticated");

      await recordFundingProduct(values);
    },
    onSuccess: (_data, variable) => {
      queryClient.invalidateQueries({
        queryKey: [GET_FUNDING_PRODUCTS],
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
    mutationFn: async ({ id, values }: { values: FundingProduct; id: string }) => {
      if (!user) throw new Error("User not authenticated");

      await updateFundingProduct(id, values);
    },
    onSuccess: (_data, variable) => {
      queryClient.invalidateQueries({
        queryKey: [GET_FUNDING_PRODUCTS],
      });
      queryClient.invalidateQueries({
        queryKey: [GET_FUNDING_PRODUCT, variable.id],
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
      console.log("deleteFundingProduct", id);
      await deleteFundingProduct(id);
    },
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({
        queryKey: [GET_FUNDING_PRODUCTS],
      });
      queryClient.invalidateQueries({
        queryKey: [GET_FUNDING_PRODUCT, id],
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
    createFundingProduct: createMutation.mutateAsync,
    isCreating: createMutation.isPending,

    updateFundingProduct: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,

    deleteFundingProduct: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
    isDeleteSuccess: deleteMutation.isSuccess,
  };
};
