import { useQuery } from "@tanstack/react-query";
import { getClientEntitlements } from "@/service/course-capabilities";

export const useClientEntitlements = (userId?: string) =>
  useQuery({
    queryKey: ["client-entitlements", userId],
    queryFn: () => getClientEntitlements(userId!),
    enabled: Boolean(userId),
  });
