"use client";
import HeaderBox from "@/components/HeaderBox";
import Spinner from "@/components/Spinner";
import { withAdminGuard } from "@/components/wrapper";
import { useGetDenefitsPayments } from "@/hooks/denefits";
import React from "react";
import DenefitsPaymentsList from "./list";

const DenefitsPaymentsPage = () => {
  const { denefitsPayments, isLoading } = useGetDenefitsPayments();

  if (isLoading) {
    return <Spinner displayText="Loading denefits payments…" />;
  }

  return (
    <section className="home">
      <div className="home-content">
        <header className="home-header">
          <div className="flex flex-col sm:flex-row justify-between gap-3">
            <HeaderBox
              title="Denefits Payments"
              subtext="Manage denefits payments."
            />
          </div>
        </header>
        {(!denefitsPayments || denefitsPayments.length === 0) && (
          <p className="text-center text-sm sm:text-base">
            No denefits payments
          </p>
        )}

        {denefitsPayments && denefitsPayments.length > 0 && (
          <div className="space-y-6">
            <section className="flex w-full flex-col gap-6">
              <DenefitsPaymentsList denefitsPayments={denefitsPayments} />
            </section>
          </div>
        )}
      </div>
    </section>
  );
};

export default withAdminGuard(DenefitsPaymentsPage);
