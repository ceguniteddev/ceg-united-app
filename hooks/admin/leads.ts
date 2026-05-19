import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Lead } from "@/types/lead";
import { toast } from "sonner";

export const useLeadsQuery = () => {
  return useQuery<Lead[]>({
    queryKey: ["leads"],
    queryFn: async () => {
      const response = await fetch("/api/leads");
      if (!response.ok) {
        throw new Error("Failed to fetch leads");
      }
      return response.json();
    },
  });
};

export const useLeadQuery = (leadId: string) => {
  return useQuery<Lead>({
    queryKey: ["leads", leadId],
    queryFn: async () => {
      const response = await fetch(`/api/leads/${leadId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch lead");
      }
      return response.json();
    },
    enabled: !!leadId,
  });
};

export const useDeleteLeadMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (leadId: string) => {
      const response = await fetch(`/api/leads/${leadId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to delete lead");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      toast.success("Lead deleted successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete lead");
    },
  });
};
