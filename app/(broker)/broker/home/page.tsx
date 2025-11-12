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
  Plus,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { formatAmount } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function BrokerHomePage() {
  const { statistics, isLoading: statsLoading } = useGetBrokerStatistics();
  const { clients, isLoading: clientsLoading } = useGetBrokerClients();

  if (statsLoading) {
    return (
      <div className="flex h-full w-full flex-col p-8 space-y-6">
        <Skeleton className="h-12 w-64" />
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
    <div className="flex h-full w-full flex-col p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Broker Dashboard
          </h1>
          <p className="text-muted-foreground">
            Manage your clients and track your earnings
          </p>
        </div>
        <Link href="/broker/submit-application">
          <Button size="lg" className="gap-2">
            <Plus className="h-4 w-4" />
            Submit Application
          </Button>
        </Link>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
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
            <CardTitle className="text-sm font-medium">Total Funded</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatAmount(statistics?.totalFundedAmount || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {statistics?.totalApprovedApplications || 0} approved deals
            </p>
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
      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Clients */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Clients</CardTitle>
                <CardDescription>
                  Your most recently added clients
                </CardDescription>
              </div>
              <Link href="/broker/my-clients">
                <Button variant="outline" size="sm">
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
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Users className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{client.clientName}</p>
                        <p className="text-sm text-muted-foreground">
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
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  No clients yet. Start by submitting an application!
                </p>
                <Link href="/broker/submit-application">
                  <Button size="sm" className="mt-4">
                    Submit Application
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Application Status Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Application Status</CardTitle>
            <CardDescription>
              Overview of your submitted applications
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-medium">Approved Applications</p>
                    <p className="text-sm text-muted-foreground">
                      Successfully approved
                    </p>
                  </div>
                </div>
                <div className="text-2xl font-bold">
                  {statistics?.totalApprovedApplications || 0}
                </div>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                    <XCircle className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <p className="font-medium">Rejected Applications</p>
                    <p className="text-sm text-muted-foreground">
                      Not approved
                    </p>
                  </div>
                </div>
                <div className="text-2xl font-bold">
                  {statistics?.totalRejectedApplications || 0}
                </div>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="font-medium">Total Submitted</p>
                    <p className="text-sm text-muted-foreground">
                      All applications
                    </p>
                  </div>
                </div>
                <div className="text-2xl font-bold">
                  {statistics?.totalSubmittedApplications || 0}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
