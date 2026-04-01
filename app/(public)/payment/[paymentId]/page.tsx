import { Metadata } from "next";
import { getUserById } from "@/service/user";
import { notFound } from "next/navigation";
import { getPaymentRequestById } from "@/service/whop/utils";
import PricingPlansGrid from "@/components/funding/PricingPlansGrid";

export const metadata: Metadata = {
  title: "Complete Your Payment - CEG United",
};

export default async function PaymentPage({
  params,
}: {
  params: Promise<{ paymentId: string }>;
}) {
  const { paymentId } = await params;
  const paymentRequest = await getPaymentRequestById(paymentId);

  if (!paymentRequest || !paymentRequest.userId) {
    notFound();
  }

  const user = await getUserById(paymentRequest.userId);
  if (!user) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-4xl">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Complete Your Payment
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Choose your preferred payment method below
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-4xl">
        <PricingPlansGrid userId={user.id} />
      </div>
    </div>
  );
}
