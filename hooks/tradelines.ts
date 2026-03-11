import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getMarkupPercentage, setMarkupPercentage } from "@/service/tradelines";

const QUERY_KEY = ["system-config", "markupPercentage"];

export const useMarkupPercentage = () => {
  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const res = await getMarkupPercentage();
      return res as number;
    },
  });
  return { markupPercentage: data ?? 0, isLoading };
};

export const useSetMarkupPercentage = () => {
  const queryClient = useQueryClient();
  const { mutateAsync: saveMarkup, isPending } = useMutation({
    mutationFn: async (value: number) => {
      await setMarkupPercentage(value);
    },
    onSuccess: () => {
      toast.success("Markup percentage saved.");
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
    onError: () => toast.error("Failed to save markup percentage."),
  });
  return { saveMarkup, isPending };
};
