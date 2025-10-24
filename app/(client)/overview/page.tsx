"use client";
import { useGetClientStatistics } from "@/hooks/statistics";
import { ClientDashboard } from "@/components/ClientDashboard";
import Spinner from "@/components/Spinner";
import { ResponsiveDialog } from "@/components/responsive-dialog";
import React, { useEffect } from "react";
import { useAuth } from "@/provider/AuthContext";
import ApplyFundingForm from "@/components/fundingv2/ApplyFundingForm";

export default function DashboardPage() {
  const { user } = useAuth();
  const { clientStatistics, isLoading } = useGetClientStatistics();
  const [open, setOpen] = React.useState(false);

  useEffect(() => {
    if (!isLoading && user) {
      setOpen(true);
    }
  }, [user, isLoading]);

  if (isLoading) return <Spinner displayText="Loading dashboard..." />;

  return (
    <div className="container mx-auto py-8">
      <ResponsiveDialog
        isOpen={open}
        setIsOpen={setOpen}
        title="Apply Funding"
        description={""}
        descriptionClassName="text-red-500 text-lg font-semibold"
        className="w-4/6"
      >
        <ApplyFundingForm setOpen={setOpen} userId={user?.uid || ""} />
      </ResponsiveDialog>
      <ClientDashboard clientData={clientStatistics} />
    </div>
  );
}
