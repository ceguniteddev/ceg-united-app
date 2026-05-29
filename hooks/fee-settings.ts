import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getFeeSettings,
  setFeeSettings,
  FeeSettings,
} from "@/service/fee-settings";

export const useFeeSettings = () => {
  return useQuery({
    queryKey: ["fee-settings"],
    queryFn: () => getFeeSettings(),
  });
};

export const useUpdateFeeSettings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (settings: FeeSettings) => setFeeSettings(settings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fee-settings"] });
    },
  });
};
