import AppError from "@/error/AppError";
import { Registration } from "@/schema/registration";
import { registerClient } from "@/service/user";

import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
export const useRegistration = () => {
  const router = useRouter();

  const createMutation = useMutation({
    mutationFn: async (values: Registration) => {
      await registerClient(values);
      router.replace("/");
    },
    onSuccess: () => {
      toast.success("Registered successfully.");
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
    recordRegistration: createMutation.mutateAsync,
    isRecording: createMutation.isPending,
  };
};
