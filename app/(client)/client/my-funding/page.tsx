"use client";

import HeaderBox from "@/components/HeaderBox";
import ApplyFundingList from "./_funding/ApplyFundingList";
import { useAuth } from "@/provider/AuthContext";
import ApplyFunding from "@/components/fundingv2/ApplyFunding";

const ApplyFundingPage = () => {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <section className="home-content">
      <div className="home-header flex flex-row justify-between">
        <HeaderBox
          title="Apply Funding"
          subtext="Manage your funding applications."
        />
        <ApplyFunding userId={user.uid} />
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
