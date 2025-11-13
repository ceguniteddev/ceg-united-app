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
    <div className="space-y-6">
      {/* Content */}
      {!mappedFunding || mappedFunding.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="rounded-full bg-muted p-6 mb-4">
              <HandCoins className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">
              No funding products yet
            </h3>
            <p className="text-muted-foreground text-center max-w-md">
              This broker's clients don't have any approved funding products
              yet.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>
              All Client Funding Products ({mappedFunding.length})
            </CardTitle>
            <CardDescription>
              Track the status of funding applications for all broker's clients
            </CardDescription>
          </CardHeader>
          <CardContent>
            <BrokerFundingList appliedFunding={mappedFunding} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
