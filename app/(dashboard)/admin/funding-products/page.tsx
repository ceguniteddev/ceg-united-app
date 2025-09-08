"use client";
import Spinner from "@/components/Spinner";
import { useGetFundingApplications } from "@/hooks/apply-funding";
import React from "react";
import HeaderBox from "@/components/HeaderBox";
import { withAdminGuard } from "@/components/wrapper";
import FundingProductsPage from "./product-form";

const FundingProductPage = () => {
  const { appliedFunding, isLoading } = useGetFundingApplications();

  if (isLoading) {
    return <Spinner displayText="Loading funding products…" />;
  }
  return (
    <section className="transactions">
      <div className="transactions-header flex flex-row justify-between">
        <HeaderBox title="Funding Product Management" />
      </div>

      {(!appliedFunding || appliedFunding.length === 0) && (
        <p className="text-center">No funding applications</p>
      )}

      {appliedFunding && appliedFunding.length > 0 && (
        <div className="space-y-6">
          <section className="flex w-full flex-col gap-6">
            <FundingProductsPage />
          </section>
        </div>
      )}
    </section>
  );
};

export default withAdminGuard(FundingProductPage);
