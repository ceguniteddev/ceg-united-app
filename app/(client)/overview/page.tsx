"use client";
import { useGetClientStatistics } from "@/hooks/statistics";
import { ClientDashboard } from "@/components/ClientDashboard";
import Spinner from "@/components/Spinner";

export default function DashboardPage() {
  const { clientStatistics, isLoading } = useGetClientStatistics();

  if (isLoading) return <Spinner displayText="Loading dashboard..." />;

  return (
    <div className="container mx-auto py-8">
      <ClientDashboard clientData={clientStatistics} />
    </div>
  );
}
