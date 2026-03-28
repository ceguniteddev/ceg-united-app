import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { SpecialDeal, SpecialDealForm } from "@/schema/special-deals";
import { toast } from "sonner";

// Query keys
export const SPECIAL_DEALS_KEY = "special-deals";
export const ACTIVE_SPECIAL_DEALS_KEY = "active-special-deals";

// Fetch all special deals (admin)
export const useSpecialDeals = () => {
  return useQuery({
    queryKey: [SPECIAL_DEALS_KEY],
    queryFn: async () => {
      const response = await fetch("/api/special-deals");
      if (!response.ok) {
        throw new Error("Failed to fetch special deals");
      }
      return response.json() as Promise<SpecialDeal[]>;
    },
  });
};

// Fetch active special deals (client)
export const useActiveSpecialDeals = () => {
  return useQuery({
    queryKey: [ACTIVE_SPECIAL_DEALS_KEY],
    queryFn: async () => {
      const response = await fetch("/api/special-deals?activeOnly=true");
      if (!response.ok) {
        throw new Error("Failed to fetch active special deals");
      }
      return response.json() as Promise<SpecialDeal[]>;
    },
  });
};

// Create special deal
export const useCreateSpecialDeal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: SpecialDealForm) => {
      const response = await fetch("/api/special-deals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create special deal");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SPECIAL_DEALS_KEY] });
      queryClient.invalidateQueries({ queryKey: [ACTIVE_SPECIAL_DEALS_KEY] });
      toast.success("Special deal created successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create special deal");
    },
  });
};

// Update special deal
export const useUpdateSpecialDeal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      dealId,
      data,
    }: {
      dealId: string;
      data: SpecialDealForm;
    }) => {
      const response = await fetch(`/api/special-deals/${dealId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update special deal");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SPECIAL_DEALS_KEY] });
      queryClient.invalidateQueries({ queryKey: [ACTIVE_SPECIAL_DEALS_KEY] });
      toast.success("Special deal updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update special deal");
    },
  });
};

// Toggle special deal active status
export const useToggleSpecialDeal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      dealId,
      isActive,
    }: {
      dealId: string;
      isActive: boolean;
    }) => {
      const response = await fetch(`/api/special-deals/${dealId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggleActive", isActive }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to toggle special deal");
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [SPECIAL_DEALS_KEY] });
      queryClient.invalidateQueries({ queryKey: [ACTIVE_SPECIAL_DEALS_KEY] });
      toast.success(
        `Special deal ${variables.isActive ? "activated" : "deactivated"} successfully`,
      );
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to toggle special deal");
    },
  });
};

// Delete special deal
export const useDeleteSpecialDeal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dealId: string) => {
      const response = await fetch(`/api/special-deals/${dealId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete special deal");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SPECIAL_DEALS_KEY] });
      queryClient.invalidateQueries({ queryKey: [ACTIVE_SPECIAL_DEALS_KEY] });
      toast.success("Special deal deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete special deal");
    },
  });
};
