import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getSystemConfig,
  updateSystemConfig,
  SystemConfig,
} from "@/service/system-config";

export const SYSTEM_CONFIG_QUERY_KEY = ["system-config"];

export const useSystemConfig = () => {
  const { data, isLoading } = useQuery({
    queryKey: SYSTEM_CONFIG_QUERY_KEY,
    queryFn: async () => {
      return await getSystemConfig();
    },
  });
  return { config: data, isLoading };
};

export const useUpdateSystemConfig = () => {
  const queryClient = useQueryClient();
  const { mutateAsync: saveConfig, isPending } = useMutation({
    mutationFn: async (config: Partial<SystemConfig>) => {
      await updateSystemConfig(config);
    },
    onSuccess: () => {
      toast.success("System configuration saved.");
      queryClient.invalidateQueries({ queryKey: SYSTEM_CONFIG_QUERY_KEY });
    },
    onError: () => toast.error("Failed to save system configuration."),
  });
  return { saveConfig, isPending };
};
