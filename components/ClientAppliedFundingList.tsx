"use client";
import Spinner from "@/components/Spinner";
import React, { useState } from "react";
import FundingList from "@/components/funding/funding-list";
import { useClientMappedFundingDetailsQuery } from "@/hooks/admin/funding-application/fund-mapping";
import {
  ApprovedBankFormData,
  ClientApplicationStatus,
} from "@/schema/bank-products";
import EmptyState from "./EmptyState";
import ManualFundedDialog from "./funding/ManualFundedDialog";
import ApplyFunding from "./fundingv2/ApplyFunding";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const pathwayLabels: Record<string, string> = {
  income_based: "Income-Based Lenders",
  business_credit_card_stacking: "Business Credit Card Stacking",
  business_lines_of_credit: "Business Lines of Credit",
  business_loan: "Business Loans",
  personal_loan: "Personal Loans",
  personal_credit_card: "Personal Credit Cards",
};

const getPathwayLabel = (pathwayId: string) => {
  if (pathwayLabels[pathwayId]) {
    return pathwayLabels[pathwayId];
  }
  return pathwayId
    .split(/[_-]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const ClientAppliedFundingList = ({
  userId,
  referenceNumber,
  clientApplicationStatus,
  isAdminView,
  appliedPathways,
}: {
  userId?: string;
  referenceNumber?: string;
  clientApplicationStatus?: ClientApplicationStatus[];
  isAdminView?: boolean;
  appliedPathways?: { pathwayId: string; status: string }[];
}) => {
  const [selectedPathwayId, setSelectedPathwayId] = useState<string>("all");

  const { mappedFund = [], isLoading } = useClientMappedFundingDetailsQuery({
    userId,
    referenceNumber,
    clientApplicationStatus,
    pathwayId: selectedPathwayId === "all" ? undefined : selectedPathwayId,
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

      {appliedPathways && appliedPathways.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-gray-100 shadow-xs">
          <div className="flex flex-col">
            <h4 className="text-sm font-semibold text-gray-900">
              Pathway Filter
            </h4>
            <p className="text-xs text-gray-500">
              Filter your applied funding offers by pathway
            </p>
          </div>
          <Select
            value={selectedPathwayId}
            onValueChange={setSelectedPathwayId}
          >
            <SelectTrigger className="w-full sm:w-[250px] h-10 bg-white">
              <SelectValue placeholder="All Pathways" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Pathways</SelectItem>
              {appliedPathways.map((pathway) => (
                <SelectItem key={pathway.pathwayId} value={pathway.pathwayId}>
                  {getPathwayLabel(pathway.pathwayId)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
