"use client";
import Spinner from "@/components/Spinner";
import { useGetFundingApplications } from "@/hooks/apply-funding";
import React from "react";
import { RowActions } from "./_components/RowActions";
import HeaderBox from "@/components/HeaderBox";
import { withAdminGuard } from "@/components/wrapper";
import AdminFundingList from "@/components/funding/admin-funding-list";

const FundingApplications = () => {
  const { appliedFunding, isLoading } = useGetFundingApplications();

  if (isLoading) {
    return <Spinner displayText="Loading funding applications…" />;
  }
  return (
    <section className="transactions">
      <div className="transactions-header flex flex-row justify-between">
        <HeaderBox title="Funding Applications" />
      </div>

      {(!appliedFunding || appliedFunding.length === 0) && (
        <p className="text-center">No funding applications</p>
      )}

      {appliedFunding && appliedFunding.length > 0 && (
        <div className="space-y-6">
          <section className="flex w-full flex-col gap-6">
            <AdminFundingList
              appliedFunding={appliedFunding}
              rowActions={(data) => <RowActions data={data} />}
            />
          </section>
        </div>
      )}
    </section>
  );
};

export default withAdminGuard(FundingApplications);
