"use client";
import Spinner from "@/components/Spinner";
import React from "react";
import FundingList from "@/components/funding/funding-list";
import { useClientMappedFundingDetailsQuery } from "@/hooks/admin/funding-application/fund-mapping";
import { useAuth } from "@/provider/AuthContext";
import { BankFormData } from "@/schema/bank-products";

const ApplyFundingList = () => {
  // const { appliedFunding, isLoading } = useGetUserApplyFunding();
  const { user } = useAuth();

  const { mappedFund = [], isLoading } = useClientMappedFundingDetailsQuery({
    userId: user?.uid || "",
    adminApprovedStatus: "Approved",
  });

  if (isLoading) return <Spinner />;

  if (!mappedFund || mappedFund.length === 0)
    return <p className="text-center">No funding applications</p>;

  return <FundingList appliedFunding={mappedFund as BankFormData[]} />;
};

export default ApplyFundingList;
