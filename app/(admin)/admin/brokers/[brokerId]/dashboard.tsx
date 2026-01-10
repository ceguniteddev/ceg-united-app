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
    <div className="space-y-4 sm:space-y-6">
      {/* Statistics Cards */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
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
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
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
                    className="h-auto p-1 sm:p-0 text-blue-600 hover:text-blue-700 justify-start sm:justify-end"
                  >
                    <Percent className="h-3 w-3 mr-1" />
                    {currentCommissionRate}% (Edit)
                  </Button>
                ) : (
                  <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={commissionRate}
                      onChange={(e) => setCommissionRate(e.target.value)}
                      className="h-8 sm:h-7 w-20 text-xs"
                      placeholder="%"
                    />
                    <Button
                      size="sm"
                      onClick={handleUpdateCommission}
                      disabled={updateCommissionMutation.isPending}
                      className="h-8 sm:h-7 px-3 sm:px-2 text-xs"
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
                      className="h-8 sm:h-7 px-3 sm:px-2 text-xs"
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
          <CardTitle className="text-lg sm:text-xl">
            Application Status
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Overview of broker's submitted applications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-xs sm:text-sm truncate">
                    Not Applied
                  </p>
                </div>
              </div>
              <div className="text-lg sm:text-xl font-bold flex-shrink-0">
                {statistics?.notAppliedCount || 0}
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-xs sm:text-sm truncate">
                    Sent to Lender
                  </p>
                </div>
              </div>
              <div className="text-lg sm:text-xl font-bold flex-shrink-0">
                {statistics?.sentToLenderCount || 0}
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                  <XCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-xs sm:text-sm truncate">
                    Declined
                  </p>
                </div>
              </div>
              <div className="text-lg sm:text-xl font-bold flex-shrink-0">
                {statistics?.declinedCount || 0}
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-xs sm:text-sm truncate">
                    Approved
                  </p>
                </div>
              </div>
              <div className="text-lg sm:text-xl font-bold flex-shrink-0">
                {statistics?.approvedCount || 0}
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-xs sm:text-sm truncate">
                    Funded
                  </p>
                </div>
              </div>
              <div className="text-lg sm:text-xl font-bold flex-shrink-0">
                {statistics?.fundedCount || 0}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
