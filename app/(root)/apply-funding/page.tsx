import HeaderBox from "@/components/HeaderBox";
import React from "react";
import ApplyFunding from "./_funding/ApplyFunding";
import ApplyFundingList from "./_funding/ApplyFundingList";

const ApplyFundingPage = () => {
  return (
    <section className="transactions">
      <div className="transactions-header flex flex-row justify-between">
        <HeaderBox title="Apply Funding" subtext="Manage your funding applications." />
        <ApplyFunding />
      </div>

      <div className="space-y-6">
        <section className="flex w-full flex-col gap-6">
          <ApplyFundingList />
        </section>
      </div>
    </section>
  );
};

export default ApplyFundingPage;
