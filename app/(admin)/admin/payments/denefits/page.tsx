"use client";
import Spinner from "@/components/Spinner";
import { useGetDenefitsPayments } from "@/hooks/denefits";
import React from "react";
import DenefitsPaymentsList from "./list";

const DenefitsPaymentsPage = () => {
  const { denefitsPayments, isLoading } = useGetDenefitsPayments();

  if (isLoading) {
    return <Spinner displayText="Loading payments…" />;
  }

  return (
    <>
      {(!denefitsPayments || denefitsPayments.length === 0) && (
        <p className="text-center text-sm sm:text-base">No payments</p>
      )}

      {denefitsPayments && denefitsPayments.length > 0 && (
        <div className="space-y-6">
          <section className="flex w-full flex-col gap-6">
            <DenefitsPaymentsList denefitsPayments={denefitsPayments} />
          </section>
        </div>
      )}
    </>
  );
};

export default DenefitsPaymentsPage;
