"use client";

import React from "react";
import Spinner from "@/components/Spinner";
import FundingList from "@/components/funding/funding-list";
import { useClientActiveFundingDetailsQuery } from "@/hooks/active-funding";
import { ApprovedBankFormData } from "@/schema/bank-products";

interface ClientActiveFundingListProps {
  userId?: string;
  referenceNumber?: string;
  showFundingPathway?: boolean;
}

export default function ClientActiveFundingList({
  userId,
  referenceNumber,
  showFundingPathway = false,
}: ClientActiveFundingListProps) {
  const { activeFunds = [], isLoading } = useClientActiveFundingDetailsQuery({
    userId,
    referenceNumber,
  });

  if (isLoading) return <Spinner />;

  return (
    <div className="space-y-4">
      <FundingList
        appliedFunding={activeFunds as ApprovedBankFormData[]}
        isAdminView={false}
        viewColumns={[
          { columnId: "bankName" },
          {
            columnId: showFundingPathway
              ? "fundingPathway"
              : "approvedProducts",
          },
          { columnId: "clientApplicationStatus" },
          { columnId: "approvedAmount" },
          { columnId: "approvedRemarks" },
          { columnId: "fundedAmount" },
        ]}
      />
    </div>
  );
}
