"use client";
import Spinner from "@/components/Spinner";
import React from "react";
import FundingList from "@/components/funding/funding-list";
import { useClientMappedFundingDetailsQuery } from "@/hooks/admin/funding-application/fund-mapping";
// import { useAuth } from "@/provider/AuthContext";
import {
  ApprovedBankFormData,
  BankFormData,
  ClientApplicationStatus,
} from "@/schema/bank-products";
import { useGetDenefitsContractsByUserId } from "@/hooks/denefits";
import EmptyState from "./EmptyState";

const ClientAppliedFundingList = ({
  userId,
  referenceNumber,
  clientApplicationStatus,
  isAdminView,
}: {
  userId?: string;
  referenceNumber?: string;
  clientApplicationStatus?: ClientApplicationStatus[];
  isAdminView?: boolean;
}) => {
  const { mappedFund = [], isLoading } = useClientMappedFundingDetailsQuery({
    userId: userId,
    referenceNumber,
    clientApplicationStatus,
  });

  if (isLoading) return <Spinner />;

  if (!mappedFund || mappedFund.length === 0) {
    if (isAdminView) {
      return <EmptyState title="No application found" description="" />;
    }
    return (
      <p className="text-center text-xl font-medium text-gray-600">
        The {process.env.NEXT_PUBLIC_APP_NAME} team is currently processing your
        pre-approve funding products.
      </p>
    );
  }

  return (
    <FundingList
      appliedFunding={mappedFund as ApprovedBankFormData[]}
      isAdminView
    />
  );
};

export default ClientAppliedFundingList;
