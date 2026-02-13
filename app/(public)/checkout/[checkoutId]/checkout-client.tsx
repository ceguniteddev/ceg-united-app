"use client";

import { WhopCheckoutView } from "@/components/funding/WhopCheckoutView";

type CheckoutClientProps = {
  checkoutDetails: any;
  checkoutId: string;
};

export default function CheckoutClient({
  checkoutDetails,
  checkoutId,
}: CheckoutClientProps) {
  return (
    <WhopCheckoutView
      checkoutDetails={checkoutDetails}
      checkoutId={checkoutId}
    />
  );
}
