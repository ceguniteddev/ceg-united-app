"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Pie } from "react-chartjs-2";
import "@/lib/chart-config";
import { useGetAdminStatistics } from "@/hooks/statistics";
import Spinner from "@/components/Spinner";
import { StatesTable } from "./StatesTable";
import { useState, useMemo } from "react";
import { transactionCategoryStyles } from "@/constant/common";

export default function AdminDashboard() {
  const [selectedState, setSelectedState] = useState<string | undefined>(undefined);
  const { adminStatistics, isLoading } = useGetAdminStatistics(selectedState);

  // ✅ Filtered countsByStatus (if state is selected)
  const filteredStatusCounts = useMemo(() => {
    if (!adminStatistics) return {};
    if (!selectedState) return adminStatistics.countsByStatus;

    // If you already have breakdown per state+status in your backend, use that.
    // For now, assume you only have global countsByStatus.
    // In real-world: compute per-state-per-status in backend for accurate filtering.
    // Example fallback: show global stats when state is clicked.
    return adminStatistics.countsByStatus;
  }, [selectedState, adminStatistics]);

  if (isLoading) {
    return <Spinner displayText="Loading statistics..." />;
  }

  const labels = Object.keys(filteredStatusCounts || {});

  const statusesData = {
    labels,
    datasets: [
      {
        data: Object.values(filteredStatusCounts || {}),
        backgroundColor: labels.map((status) => {
          switch (status) {
            case "Declined":
              return "rgba(239, 68, 68, 0.7)";
            case "Processing":
              return "#F59E0B";
            case "Completed":
              return "#12B76A";
            default:
              return "rgba(59, 130, 246, 0.7)";
          }
        }),
      },
    ],
  };

  return (
    <div className="grid gap-6 p-6 md:grid-cols-2">
      {/* Summary */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Admin Overview</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-around text-center">
          <div>
            <p className="text-3xl font-bold">{adminStatistics?.totalClients}</p>
            <p className="text-sm text-muted-foreground">Total Clients</p>
          </div>
          <div>
            <p className="text-3xl font-bold">{adminStatistics?.totalFundingApplications}</p>
            <p className="text-sm text-muted-foreground">Funding Applications</p>
          </div>
        </CardContent>
      </Card>

      <StatesTable
        countsByState={adminStatistics?.countsByState || {}}
        selectedState={selectedState}
        onStateClick={setSelectedState}
      />

      <Card>
        <CardHeader>
          <CardTitle>Applications by Status</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Pie
            height={200}
            width={200}
            data={statusesData}
            options={{
              maintainAspectRatio: false,
              plugins: {
                legend: { position: "right" },
              },
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
