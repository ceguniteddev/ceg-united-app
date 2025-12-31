"use client";

import { useGetBrokerStatistics, useGetBrokerClients } from "@/hooks/broker";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DollarSign,
  Users,
  TrendingUp,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { formatAmount } from "@/lib/utils";

export default function BrokerHomePage() {
  const { statistics, isLoading: statsLoading } = useGetBrokerStatistics();
  const { clients, isLoading: clientsLoading } = useGetBrokerClients();

  if (statsLoading) {
    return (
      <div className="flex h-full w-full flex-col p-3 sm:p-4 md:p-6 lg:p-8 space-y-4 sm:space-y-6">
        <Skeleton className="h-10 sm:h-12 w-48 sm:w-64" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  const recentClients = clients?.slice(0, 5) || [];

  return (
    <div className="flex h-full w-full flex-col p-3 sm:p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 sm:mb-6 md:mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">
            Broker Dashboard
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Manage your clients and track your earnings
          </p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3 mb-4 sm:mb-6 md:mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">
              Total Clients
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">
              {statistics?.totalClients || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {statistics?.totalSubmittedApplications || 0} applications
              submitted
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">
              Total Funded
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">
              {formatAmount(statistics?.totalFundedAmount || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {statistics?.totalApprovedApplications || 0} approved deals
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">
              Total Commission
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">
              {formatAmount(statistics?.totalCommissionEarned || 0)}
            </div>
            {/* <p className="text-xs text-muted-foreground">
              {formatAmount(statistics?.totalCommissionPending || 0)} pending •{" "}
              {formatAmount(statistics?.totalCommissionPaid || 0)} paid
            </p> */}
          </CardContent>
        </Card>

        {/* <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Commission Earned
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatAmount(statistics?.totalCommissionEarned || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {formatAmount(statistics?.totalCommissionPaid || 0)} paid
            </p>
          </CardContent>
        </Card> */}

        {/* <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Commission
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatAmount(statistics?.totalCommissionPending || 0)}
            </div>
            <Link href="/broker/my-funded-deals">
              <Button variant="link" className="h-auto p-0 text-xs">
                View details <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </Link>
          </CardContent>
        </Card> */}
      </div>

      {/* Recent Clients & Activity */}
      <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
        {/* Recent Clients */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
              <div>
                <CardTitle className="text-base sm:text-lg">
                  Recent Clients
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Your most recently added clients
                </CardDescription>
              </div>
              <Link href="/broker/my-clients">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs sm:text-sm"
                >
                  View All
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {clientsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16" />
                ))}
              </div>
            ) : recentClients.length > 0 ? (
              <div className="space-y-3">
                {recentClients.map((client: any) => (
                  <div
                    key={client.clientId}
                    className="flex items-center justify-between p-2 sm:p-3 rounded-lg border"
                  >
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                      <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Users className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm sm:text-base truncate">
                          {client.clientName}
                        </p>
                        <p className="text-xs sm:text-sm text-muted-foreground truncate">
                          {client.clientEmail}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant={
                        client.status === "Active" ? "default" : "secondary"
                      }
                    >
                      {client.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 sm:py-8">
                <Users className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-2 sm:mb-3" />
                <p className="text-xs sm:text-sm text-muted-foreground">
                  No clients yet. Add them now!
                </p>
                <Link href="/broker/my-clients">
                  <Button size="sm" className="mt-3 sm:mt-4 text-xs sm:text-sm">
                    Add Client
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Application Status Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">
              Application Status
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Overview of your submitted applications
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-2 sm:p-3 rounded-lg border">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="font-medium text-xs sm:text-sm">
                      Not Applied
                    </p>
                  </div>
                </div>
                <div className="text-lg sm:text-xl font-bold">
                  {statistics?.notAppliedCount || 0}
                </div>
              </div>

              <div className="flex items-center justify-between p-2 sm:p-3 rounded-lg border">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-xs sm:text-sm">
                      Sent to Lender
                    </p>
                  </div>
                </div>
                <div className="text-lg sm:text-xl font-bold">
                  {statistics?.sentToLenderCount || 0}
                </div>
              </div>

              <div className="flex items-center justify-between p-2 sm:p-3 rounded-lg border">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                    <XCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />
                  </div>
                  <div>
                    <p className="font-medium text-xs sm:text-sm">Declined</p>
                  </div>
                </div>
                <div className="text-lg sm:text-xl font-bold">
                  {statistics?.declinedCount || 0}
                </div>
              </div>

              <div className="flex items-center justify-between p-2 sm:p-3 rounded-lg border">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-xs sm:text-sm">Approved</p>
                  </div>
                </div>
                <div className="text-lg sm:text-xl font-bold">
                  {statistics?.approvedCount || 0}
                </div>
              </div>

              <div className="flex items-center justify-between p-2 sm:p-3 rounded-lg border">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                    <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-medium text-xs sm:text-sm">Funded</p>
                  </div>
                </div>
                <div className="text-lg sm:text-xl font-bold">
                  {statistics?.fundedCount || 0}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
