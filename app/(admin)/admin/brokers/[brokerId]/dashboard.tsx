"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DollarSign,
  Users,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Percent,
  Loader2Icon,
} from "lucide-react";
import { formatAmount } from "@/lib/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

interface BrokerDashboardProps {
  brokerId: string;
}

export default function BrokerDashboard({ brokerId }: BrokerDashboardProps) {
  const queryClient = useQueryClient();
  const [commissionRate, setCommissionRate] = useState<string>("");
  const [isEditing, setIsEditing] = useState(false);

  const { data: statistics, isLoading } = useQuery({
    queryKey: ["BROKER_STATISTICS", brokerId],
    queryFn: async () => {
      const response = await fetch(`/api/broker/${brokerId}/statistics`);
      if (!response.ok) {
        throw new Error("Failed to fetch statistics");
      }
      return await response.json();
    },
    enabled: !!brokerId,
  });

  const { data: brokerData, isLoading: isBrokerLoading } = useQuery({
    queryKey: ["BROKER_DATA", brokerId],
    queryFn: async () => {
      const response = await fetch(`/api/user/${brokerId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch broker data");
      }
      return await response.json();
    },
    enabled: !!brokerId,
  });

  const updateCommissionMutation = useMutation({
    mutationFn: async (rate: number) => {
      const response = await fetch(`/api/broker/${brokerId}/commission-rate`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commissionRate: rate }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update commission rate");
      }
      return await response.json();
    },
    onSuccess: () => {
      toast.success("Commission rate updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["BROKER_DATA", brokerId] });
      setIsEditing(false);
    },
    onError: (error: Error) => {
      toast.error("Failed to update commission rate", {
        description: error.message,
      });
    },
  });

  const handleUpdateCommission = () => {
    const rate = parseFloat(commissionRate);
    if (isNaN(rate) || rate < 0 || rate > 100) {
      toast.error("Please enter a valid percentage between 0 and 100");
      return;
    }
    updateCommissionMutation.mutate(rate);
  };

  if (isLoading || isBrokerLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  const currentCommissionRate = brokerData?.commissionRate || 10;

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Commission
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              {formatAmount(statistics?.totalCommissionEarned || 0)}
            </div>
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  Commission Rate
                </span>
                {!isEditing ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setIsEditing(true);
                      setCommissionRate(currentCommissionRate.toString());
                    }}
                    className="h-auto p-0 text-blue-600 hover:text-blue-700"
                  >
                    <Percent className="h-3 w-3 mr-1" />
                    {currentCommissionRate}% (Edit)
                  </Button>
                ) : (
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={commissionRate}
                      onChange={(e) => setCommissionRate(e.target.value)}
                      className="h-7 w-20 text-xs"
                      placeholder="%"
                    />
                    <Button
                      size="sm"
                      onClick={handleUpdateCommission}
                      disabled={updateCommissionMutation.isPending}
                      className="h-7 px-2"
                    >
                      {updateCommissionMutation.isPending ? (
                        <Loader2Icon className="h-3 w-3 animate-spin" />
                      ) : (
                        "Save"
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setIsEditing(false)}
                      className="h-7 px-2"
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Application Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Application Status</CardTitle>
          <CardDescription>
            Overview of broker's submitted applications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-gray-600" />
                </div>
                <div>
                  <p className="font-medium text-sm">Not Applied</p>
                </div>
              </div>
              <div className="text-xl font-bold">
                {statistics?.notAppliedCount || 0}
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-sm">Sent to Lender</p>
                </div>
              </div>
              <div className="text-xl font-bold">
                {statistics?.sentToLenderCount || 0}
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                  <XCircle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="font-medium text-sm">Declined</p>
                </div>
              </div>
              <div className="text-xl font-bold">
                {statistics?.declinedCount || 0}
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-sm">Approved</p>
                </div>
              </div>
              <div className="text-xl font-bold">
                {statistics?.approvedCount || 0}
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="font-medium text-sm">Funded</p>
                </div>
              </div>
              <div className="text-xl font-bold">
                {statistics?.fundedCount || 0}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
