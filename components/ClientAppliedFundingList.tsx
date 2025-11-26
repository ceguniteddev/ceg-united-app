"use client";
import Spinner from "@/components/Spinner";
import React from "react";
import FundingList from "@/components/funding/funding-list";
import { useClientMappedFundingDetailsQuery } from "@/hooks/admin/funding-application/fund-mapping";
import {
  ApprovedBankFormData,
  BankFormData,
  ClientApplicationStatus,
} from "@/schema/bank-products";
import EmptyState from "./EmptyState";
import ManualFundedDialog from "./funding/ManualFundedDialog";

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
        <div className="flex justify-end">
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
