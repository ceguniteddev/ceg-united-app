import { useGetClientStatisticsByUserId } from "@/hooks/statistics";
import React from "react";
import Spinner from "@/components/Spinner";
import { ClientDashboard } from "@/components/ClientDashboard";

const AdminViewUserProfile = ({ userId }: { userId: string }) => {
  const { clientStatistics, isLoading } = useGetClientStatisticsByUserId(userId);
  if (isLoading) return <Spinner displayText="Loading client dashboard..." />;

  return <ClientDashboard clientData={clientStatistics} />;
};

export default AdminViewUserProfile;
