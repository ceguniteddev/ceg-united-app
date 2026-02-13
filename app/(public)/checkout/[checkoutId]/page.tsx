import { notFound } from "next/navigation";
import { getWhopCheckoutDetailByCheckoutId } from "@/service/whop";
import { WhopCheckoutView } from "@/components/funding/WhopCheckoutView";

export const metadata = {
  title: "Complete Your Purchase - CEG United",
};

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ checkoutId: string }>;
}) {
  const { checkoutId } = await params;
  const checkoutDetails = await getWhopCheckoutDetailByCheckoutId(checkoutId);

  if (!checkoutDetails) {
    notFound();
  }

  // Serialize the details before passing to client component
  const serializedDetails = JSON.parse(JSON.stringify(checkoutDetails));

  return (
    <WhopCheckoutView
      checkoutDetails={serializedDetails}
      checkoutId={checkoutId}
    />
  );
}
