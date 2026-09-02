"use client";
import { useGetClientStatistics } from "@/hooks/statistics";
import { ClientDashboard } from "@/components/ClientDashboard";
import Spinner from "@/components/Spinner";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { useAuth } from "@/provider/AuthContext";
import { useMembership } from "@/hooks/membership";
import { useFeeSettings } from "@/hooks/fee-settings";

export default function DashboardPage() {
  const { clientStatistics, isLoading } = useGetClientStatistics();
  const { userData } = useAuth();
  const { data: membership } = useMembership(userData?.id);
  const { data: fees } = useFeeSettings();

  if (isLoading) return <Spinner displayText="Loading dashboard..." />;

  return (
    <div className="w-full">
      {membership?.status !== "active" && (
        <div className="mx-4 mb-6 flex flex-col gap-4 rounded-xl border border-blue-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white">
              <Sparkles className="h-5 w-5" />
            </span>
            <div>
              <p className="font-semibold text-slate-950">
                Unlock CEG Brain Platform Access
              </p>
              <p className="mt-1 text-sm text-slate-600">
                Get audits, analysis, credit reports, and course-powered tools
                for ${(fees?.platformAccessPrice ?? 499).toLocaleString()}
                /month. Income-based funding remains free.
              </p>
            </div>
          </div>
          <Link
            href="/client/platform-access"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            View access <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}
      <ClientDashboard clientData={clientStatistics} />
    </div>
  );
}
