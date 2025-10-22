"use client";
import Spinner from "@/components/Spinner";
import React from "react";
import FundingList from "@/components/funding/funding-list";
import { useClientMappedFundingDetailsQuery } from "@/hooks/admin/funding-application/fund-mapping";
// import { useAuth } from "@/provider/AuthContext";
import { ApprovedBankFormData, BankFormData } from "@/schema/bank-products";

const ApplyFundingList = ({
  userId,
  referenceNumber,
}: {
  userId: string;
  referenceNumber?: string;
}) => {
  const { mappedFund = [], isLoading } = useClientMappedFundingDetailsQuery({
    userId: userId,
    adminApprovedStatus: "Approved",
    referenceNumber,
  });

  if (isLoading) return <Spinner />;

  if (!mappedFund || mappedFund.length === 0)
    return (
      <p className="text-center text-xl font-medium text-gray-600">
        The {process.env.NEXT_PUBLIC_APP_NAME} team is currently processing your
        pre-approve funding products.
      </p>
    );
  return (
    <FundingList
      appliedFunding={mappedFund as ApprovedBankFormData[]}
      isAdminView
    />
  );
};

export default ApplyFundingList;
