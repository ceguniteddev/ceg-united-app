"use client";
import Spinner from "@/components/Spinner";
import FundingList from "@/components/funding/funding-list";
import { useClientMappedFundingDetailsQuery } from "@/hooks/admin/funding-application/fund-mapping";
import { useAuth } from "@/provider/AuthContext";
import { ApplyFunding } from "@/schema/apply-funding";
import { ApprovedBankFormData } from "@/schema/bank-products";
import { useMemo } from "react";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AnalysisView from "@/components/funding/AnalysisView";
import { Card, CardContent } from "@/components/ui/card";

type Props = {
  selectedReference: string;
};

export const FundingBankProducts = ({ selectedReference }: Props) => {
  const { user } = useAuth();

  const { mappedFund = [], isLoading } = useClientMappedFundingDetailsQuery({
    userId: user?.uid,
  });

  // Filter mapped funds by selected reference number
  const filteredMappedFund = useMemo(() => {
    if (!mappedFund || mappedFund.length === 0) return [];

    if (!selectedReference) return mappedFund;

    return mappedFund.filter(
      (fund: ApplyFunding) => fund.referenceNumber === selectedReference,
    );
  }, [mappedFund, selectedReference]);

  if (isLoading) return <Spinner />;

  if (!mappedFund || mappedFund.length === 0)
    return (
      <p className="text-center text-xl font-medium text-gray-600">
        The {process.env.NEXT_PUBLIC_APP_NAME} team is currently processing your
        pre-approve funding products.
      </p>
    );

  if (selectedReference && filteredMappedFund.length === 0)
    return (
      <p className="text-center text-xl font-medium text-gray-600">
        No funding products found for the selected application.
      </p>
    );

  return (
    <Card>
      <CardContent className="pt-6">
        <FundingList
          appliedFunding={filteredMappedFund as ApprovedBankFormData[]}
        />
      </CardContent>
    </Card>
  );
};

export const FundingAnalysis = ({ selectedReference }: Props) => {
  if (!selectedReference)
    return (
      <p className="text-center text-gray-600 py-8">
        Please select an application to view analysis.
      </p>
    );

  return <AnalysisView referenceNumber={selectedReference} />;
};
