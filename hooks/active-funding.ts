import { useAuth } from "@/provider/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApprovedBankFormData } from "@/schema/bank-products";

export const useClientActiveFundingDetailsQuery = ({
  userId,
  referenceNumber,
  pathwayId,
}: {
  userId?: string;
  referenceNumber?: string;
  pathwayId?: string;
}) => {
  const { user } = useAuth();

  const {
    data: activeFunds,
    isLoading,
    error,
  } = useQuery<ApprovedBankFormData[], Error>({
    queryKey: [
      "useClientActiveFundingDetailsQuery",
      userId,
      referenceNumber,
      pathwayId,
    ],
    // Only run if user is authenticated and both userId and referenceNumber are defined
    enabled: !!user && !!userId && !!referenceNumber,
    queryFn: async () => {
      if (!user) throw new Error("User not authenticated");
      if (!userId || !referenceNumber)
        throw new Error("Missing userId or referenceNumber");

      const queryParams = new URLSearchParams({
        userId,
        referenceNumber,
      });
      ["Sent to Lender", "Approved", "Declined", "Funded"].forEach((status) =>
        queryParams.append("clientApplicationStatus", status),
      );
      if (pathwayId) {
        queryParams.append("pathwayId", pathwayId);
      }

      const url = `/api/funding-application?${queryParams.toString()}`;
      const idToken = await user.getIdToken();

      const response = await fetch(url, {
        credentials: "same-origin",
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error(
          errorData || `Request failed with status ${response.status}`,
        );
        toast.error("Failed to fetch active client funding details.");
        return [];
      }

      const data = await response.json();
      return (data as ApprovedBankFormData[]) || [];
    },
    staleTime: 0,
    refetchInterval: 5 * 60 * 1000,
  });

  return { activeFunds, isLoading, error };
};
