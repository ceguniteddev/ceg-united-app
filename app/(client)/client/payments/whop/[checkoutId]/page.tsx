"use client";

import { useParams } from "next/navigation";
import { useAuth } from "@/provider/AuthContext";
import Spinner from "@/components/Spinner";
import { useWhopCheckoutDetails } from "@/hooks/whop";
import { WhopCheckoutView } from "@/components/funding/WhopCheckoutView";

const WhopCheckoutPage = () => {
  const params = useParams();
  const { user, loading: userLoading } = useAuth();
  const checkoutId = params.checkoutId as string;

  const {
    checkoutDetails,
    isLoading: checkoutLoading,
    error,
  } = useWhopCheckoutDetails(checkoutId);

  if (userLoading || checkoutLoading) {
    return <Spinner displayText="Loading checkout details..." />;
  }

  if (error || !checkoutDetails) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        {error
          ? `Error: ${error.message}`
          : "Invalid checkout session or details not found."}
      </div>
    );
  }

  return (
    <WhopCheckoutView
      checkoutDetails={checkoutDetails}
      checkoutId={checkoutId}
      prefillEmail={user?.email || ""}
    />
  );
};

export default WhopCheckoutPage;
