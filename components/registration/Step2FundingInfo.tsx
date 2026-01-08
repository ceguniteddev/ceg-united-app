"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FundingApplicationFields } from "@/components/registration/FundingApplicationFields";
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
      <CardHeader className="px-4 sm:px-6 py-4 sm:py-6">
        <CardTitle className="text-lg sm:text-xl md:text-2xl">
          Step 2: Funding Application
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 px-4 sm:px-6 pb-4 sm:pb-6">
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
