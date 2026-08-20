import { notFound } from "next/navigation";
import { getDodoCheckoutDetailByCheckoutId } from "@/service/dodo";
import { DodoCheckoutView } from "@/components/funding/DodoCheckoutView";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Complete Your Purchase - CEG United",
};

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ checkoutId: string }>;
}) {
  const { checkoutId } = await params;
  const checkoutDetails = await getDodoCheckoutDetailByCheckoutId(checkoutId);

  if (!checkoutDetails) {
    notFound();
  }

  // Serialize the details before passing to client component
  const serializedDetails = JSON.parse(JSON.stringify(checkoutDetails));

  return (
    <DodoCheckoutView
      checkoutDetails={serializedDetails}
      checkoutId={checkoutId}
    />
  );
}
