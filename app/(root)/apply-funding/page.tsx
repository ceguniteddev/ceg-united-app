"use client";

import HeaderBox from "@/components/HeaderBox";
import React from "react";
import ApplyFunding from "./_funding/ApplyFunding";
import ApplyFundingList from "./_funding/ApplyFundingList";
import Spinner from "@/components/Spinner";
import { useGetPlaidAccounts } from "@/hooks/plaid";
import { useAuth } from "@/provider/AuthContext";
import NoBankLinked from "@/components/NoBankLinked";

const ApplyFundingPage = () => {
  const { plaidAccounts, isLoading } = useGetPlaidAccounts();
  const { user } = useAuth();

  if (!user) return null;

  if (isLoading) return <Spinner />;

  if (!plaidAccounts || !plaidAccounts.data?.length) {
    return <NoBankLinked />;
  }
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
