"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FundingApplicationFields } from "@/components/fundingv2/FundingApplicationFields";
import { useBusinessQuery } from "@/hooks/business";

interface Step2FundingInfoProps {
  userId: string;
}

export function Step2FundingInfo({ userId }: Step2FundingInfoProps) {
  const {
    businessData,
    isLoading: isBusinessLoading,
    refetch: refetchBusinesses,
  } = useBusinessQuery(userId, false);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Step 2: Funding Application</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <FundingApplicationFields
          userId={userId}
          businessData={businessData}
          isBusinessLoading={isBusinessLoading}
          refetchBusinesses={refetchBusinesses}
          isViewing={false}
        />
      </CardContent>
    </Card>
  );
}
