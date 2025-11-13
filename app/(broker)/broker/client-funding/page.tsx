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
      <div className="flex h-full w-full items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <HandCoins className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Client Funding Products
            </h1>
            <p className="text-muted-foreground">
              View all approved funding products for your clients
            </p>
          </div>
        </div>
      </div>

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
              Your clients don't have any approved funding products yet. Once
              the admin approves funding products for your clients, they will
              appear here.
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
              Track the status of funding applications for all your clients
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
