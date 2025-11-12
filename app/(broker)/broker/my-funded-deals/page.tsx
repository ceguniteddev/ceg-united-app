"use client";

import { useGetBrokerCommissions } from "@/hooks/broker";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DollarSign, TrendingUp, Clock, CheckCircle2 } from "lucide-react";
import { formatAmount } from "@/lib/utils";
import { format } from "date-fns";

export default function MyFundedDealsPage() {
  const { commissions: allCommissions, isLoading: allLoading } =
    useGetBrokerCommissions();
  const { commissions: pendingCommissions, isLoading: pendingLoading } =
    useGetBrokerCommissions("Pending");
  const { commissions: paidCommissions, isLoading: paidLoading } =
    useGetBrokerCommissions("Paid");

  const totalEarned =
    allCommissions?.reduce(
      (sum: number, c: any) => sum + c.commissionAmount,
      0
    ) || 0;
  const totalPending =
    pendingCommissions?.reduce(
      (sum: number, c: any) => sum + c.commissionAmount,
      0
    ) || 0;
  const totalPaid =
    paidCommissions?.reduce(
      (sum: number, c: any) => sum + c.commissionAmount,
      0
    ) || 0;

  if (allLoading) {
    return (
      <div className="flex h-full w-full flex-col p-8 space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  const CommissionsTable = ({
    commissions,
    emptyMessage,
  }: {
    commissions: any[];
    emptyMessage: string;
  }) => {
    if (commissions.length === 0) {
      return (
        <div className="text-center py-12">
          <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">{emptyMessage}</p>
        </div>
      );
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Client Name</TableHead>
            <TableHead>Bank Name</TableHead>
            <TableHead>Funded Amount</TableHead>
            <TableHead>Commission Rate</TableHead>
            <TableHead>Commission Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {commissions.map((commission: any, index: number) => (
            <TableRow key={index}>
              <TableCell className="font-medium">
                {commission.clientName}
              </TableCell>
              <TableCell>{commission.bankName}</TableCell>
              <TableCell>{formatAmount(commission.fundedAmount)}</TableCell>
              <TableCell>{commission.commissionRate}%</TableCell>
              <TableCell className="font-semibold text-emerald-600">
                {formatAmount(commission.commissionAmount)}
              </TableCell>
              <TableCell>
                <Badge
                  variant={
                    commission.status === "Paid"
                      ? "default"
                      : commission.status === "Approved"
                      ? "secondary"
                      : "outline"
                  }
                >
                  {commission.status}
                </Badge>
              </TableCell>
              <TableCell>
                {commission.paidAt
                  ? format(new Date(commission.paidAt), "MMM dd, yyyy")
                  : commission.approvedAt
                  ? format(new Date(commission.approvedAt), "MMM dd, yyyy")
                  : format(new Date(commission.createdAt), "MMM dd, yyyy")}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  return (
    <div className="flex h-full w-full flex-col p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">My Funded Deals</h1>
        <p className="text-muted-foreground">
          Track your commissions and funded applications
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earned</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              {formatAmount(totalEarned)}
            </div>
            <p className="text-xs text-muted-foreground">
              From {allCommissions?.length || 0} deals
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {formatAmount(totalPending)}
            </div>
            <p className="text-xs text-muted-foreground">
              From {pendingCommissions?.length || 0} deals
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paid Out</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              {formatAmount(totalPaid)}
            </div>
            <p className="text-xs text-muted-foreground">
              From {paidCommissions?.length || 0} deals
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Commissions Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>Commission Details</CardTitle>
          <CardDescription>View all your commissions by status</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="w-full">
            <TabsList>
              <TabsTrigger value="all">
                All ({allCommissions?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="pending">
                Pending ({pendingCommissions?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="paid">
                Paid ({paidCommissions?.length || 0})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-6">
              <CommissionsTable
                commissions={allCommissions || []}
                emptyMessage="No commissions yet. Keep submitting applications!"
              />
            </TabsContent>

            <TabsContent value="pending" className="mt-6">
              <CommissionsTable
                commissions={pendingCommissions || []}
                emptyMessage="No pending commissions"
              />
            </TabsContent>

            <TabsContent value="paid" className="mt-6">
              <CommissionsTable
                commissions={paidCommissions || []}
                emptyMessage="No paid commissions yet"
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
