// hooks/useGetClientDocuments.ts
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/provider/AuthContext";
import { GET_CLIENT_DOCUMENTS } from "@/constant/react-query-keys";

type DocumentItem = {
  name: string;
  path: string;
  size: number;
  updatedAt: string | null;
  contentType: string | null;
  url: string;
};
type ListResponse = { items: DocumentItem[] };

export const useGetClientDocuments = (userId: string) => {
  const { user } = useAuth();

  const { data, isLoading, error } = useQuery({
    queryKey: [GET_CLIENT_DOCUMENTS, userId],
    enabled: !!user && !!userId,
    queryFn: async (): Promise<ListResponse> => {
      if (!user) throw new Error("User not authenticated");
      const res = await fetch(`/api/plaid/document/${userId}`, { method: "GET" });
      if (!res.ok) throw new Error(`Failed: ${res.status}`);
      return res.json();
    },
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchInterval: 4 * 60 * 1000,
  });

  return { documents: data, isLoading, error };
};
