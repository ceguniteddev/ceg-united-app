"use client";

import HeaderBox from "@/components/HeaderBox";
import React from "react";
import ApplyFunding from "./_funding/ApplyFunding";
import ApplyFundingList from "./_funding/ApplyFundingList";
import Spinner from "@/components/Spinner";
import {
  useGetPlaidAccounts,
  useHasIncomeBankVerificationQuery,
  useHasPayrollBankVerificationQuery,
} from "@/hooks/plaid";
import { useAuth } from "@/provider/AuthContext";
import NoBankLinked from "@/components/NoBankLinked";
import NoIncomeVerification from "@/components/NoIncomeVerification";

const ApplyFundingPage = () => {
  const { plaidAccounts, isLoading } = useGetPlaidAccounts();
  const { incomeBankItem, isLoading: incomeBankItemLoading } = useHasIncomeBankVerificationQuery();
  const { incomePayrollItem, isLoading: payrollBankItemLoading } =
    useHasPayrollBankVerificationQuery();
  const { user } = useAuth();

  if (isLoading) return <Spinner />;

  if (!user) return null;

  if (isLoading || incomeBankItemLoading || payrollBankItemLoading) return <Spinner />;

  if (!plaidAccounts || !plaidAccounts.data?.length) {
    return <NoBankLinked />;
  }

  if (!incomeBankItem) {
    return <NoIncomeVerification tokenType="INCOME_VERIFICATION_BANK" />;
  }
  // if (!incomePayrollItem) {
  //   return <NoIncomeVerification tokenType="INCOME_VERIFICATION_PAYROLL" />;
  // }

  return (
    <section className="home-content">
      <div className="home-header flex flex-row justify-between">
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
