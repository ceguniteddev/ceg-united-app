import { Registration } from "@/schema/registration";

import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

export const useRegistration = () => {
  const createMutation = useMutation({
    mutationFn: async (values: Registration) => {
      //   await createContractParticularsInfo(values, referenceNumber);
    },
    onSuccess: () => {
      toast.success("Registered successfully.");
    },
    onError: (error: any) => {
      toast.error("Failed to record registration.");
      console.error(error);
    },
  });

  return {
    recordRegistration: createMutation.mutateAsync,
    isRecording: createMutation.isPending,
  };
};
