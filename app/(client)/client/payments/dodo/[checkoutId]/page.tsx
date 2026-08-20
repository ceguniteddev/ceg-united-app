"use client";

import { useParams } from "next/navigation";
import Spinner from "@/components/Spinner";
import { DodoCheckoutView } from "@/components/funding/DodoCheckoutView";
import { useDodoCheckoutDetails } from "@/hooks/dodo";

export default function ClientDodoCheckoutPage() {
  const { checkoutId } = useParams<{ checkoutId: string }>();
  const { checkoutDetails, isLoading, error } =
    useDodoCheckoutDetails(checkoutId);
  if (isLoading) return <Spinner displayText="Loading Dodo checkout..." />;
  if (error || !checkoutDetails)
    return <p role="alert">Unable to load checkout.</p>;
  return (
    <DodoCheckoutView
      checkoutId={checkoutId}
      checkoutDetails={checkoutDetails}
    />
  );
}
