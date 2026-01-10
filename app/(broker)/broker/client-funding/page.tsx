"use client";

import Spinner from "@/components/Spinner";
import { useGetBrokerClientsMappedFunding } from "@/hooks/broker";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { HandCoins } from "lucide-react";
import BrokerFundingList from "./_components/BrokerFundingList";

export default function ClientFundingPage() {
  const { mappedFunding, isLoading } = useGetBrokerClientsMappedFunding();

  if (isLoading) {
    return (
      <div className="flex w-full items-center justify-center py-16">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <HandCoins className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">
              Client Funding Products
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              View all approved funding products for your clients
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      {!mappedFunding || mappedFunding.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="rounded-full bg-muted p-6 mb-4">
            <HandCoins className="h-12 w-12 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">
            No funding products yet
          </h3>
          <p className="text-muted-foreground text-center max-w-md">
            Your clients don't have any approved funding products yet. Once the
            admin approves funding products for your clients, they will appear
            here.
          </p>
        </div>
      ) : (
        <div className="w-full">
          <div className="mb-4">
            <h2 className="text-lg sm:text-xl font-semibold">
              All Client Funding Products ({mappedFunding.length})
            </h2>
            <p className="text-sm text-muted-foreground">
              Track the status of funding applications for all your clients
            </p>
          </div>
          <BrokerFundingList appliedFunding={mappedFunding} />
        </div>
      )}
    </div>
  );
}
