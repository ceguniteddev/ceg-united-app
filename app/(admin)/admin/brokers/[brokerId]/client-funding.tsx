"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Spinner from "@/components/Spinner";
import { HandCoins } from "lucide-react";
import BrokerFundingList from "@/app/(broker)/broker/client-funding/_components/BrokerFundingList";
import { useQuery } from "@tanstack/react-query";

interface BrokerClientFundingProps {
  brokerId: string;
}

export default function BrokerClientFunding({
  brokerId,
}: BrokerClientFundingProps) {
  const { data: mappedFunding, isLoading } = useQuery({
    queryKey: ["BROKER_CLIENTS_MAPPED_FUNDING", brokerId],
    queryFn: async () => {
      const response = await fetch(`/api/broker/${brokerId}/clients-funding`);
      if (!response.ok) {
        throw new Error("Failed to fetch clients' funding products");
      }
      return await response.json();
    },
    enabled: !!brokerId,
  });

  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Content */}
      {!mappedFunding || mappedFunding.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 sm:py-16 px-4">
            <div className="rounded-full bg-muted p-4 sm:p-6 mb-3 sm:mb-4">
              <HandCoins className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold mb-2 text-center">
              No funding products yet
            </h3>
            <p className="text-sm sm:text-base text-muted-foreground text-center max-w-md">
              This broker's clients don't have any approved funding products
              yet.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="max-w-screen-2xl">
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-lg sm:text-xl">
                All Client Funding Products ({mappedFunding.length})
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Track the status of funding applications for all broker's
                clients
              </CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto p-0 sm:p-6">
              <BrokerFundingList appliedFunding={mappedFunding} />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
