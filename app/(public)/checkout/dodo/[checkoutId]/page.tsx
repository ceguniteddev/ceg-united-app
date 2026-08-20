import { notFound } from "next/navigation";
import { DodoCheckoutView } from "@/components/funding/DodoCheckoutView";
import { getDodoCheckoutDetailByCheckoutId } from "@/service/dodo";

export default async function DodoCheckoutPage({
  params,
}: {
  params: Promise<{ checkoutId: string }>;
}) {
  const { checkoutId } = await params;
  const checkout = await getDodoCheckoutDetailByCheckoutId(checkoutId);
  if (!checkout) notFound();
  return (
    <DodoCheckoutView
      checkoutId={checkoutId}
      checkoutDetails={JSON.parse(JSON.stringify(checkout))}
    />
  );
}
