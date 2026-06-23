"use client";
import Spinner from "@/components/Spinner";
import React from "react";
import FundingList from "@/components/funding/funding-list";
import { useClientMappedFundingDetailsQuery } from "@/hooks/admin/funding-application/fund-mapping";
import {
  ApprovedBankFormData,
  ClientApplicationStatus,
} from "@/schema/bank-products";
import EmptyState from "./EmptyState";
import ManualFundedDialog from "./funding/ManualFundedDialog";
import ApplyFunding from "./fundingv2/ApplyFunding";

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

  return (
    <div className="space-y-4">
      {isAdminView && userId && (
        <div className="flex flex-col sm:flex-row justify-between gap-2 sm:gap-3">
          <ApplyFunding userId={userId} />
          <ManualFundedDialog userId={userId} />
        </div>
      )}

      {!mappedFund || mappedFund.length === 0 ? (
        isAdminView ? (
          <EmptyState title="No application found" description="" />
        ) : (
          <p className="text-center text-xl font-medium text-gray-600">
            The {process.env.NEXT_PUBLIC_APP_NAME} team is currently processing
            your pre-approve funding products.
          </p>
        )
      ) : (
        <FundingList
          appliedFunding={mappedFund as ApprovedBankFormData[]}
          isAdminView
        />
      )}
    </div>
  );
};

export default ClientAppliedFundingList;
