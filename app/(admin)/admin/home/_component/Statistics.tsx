"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Pie } from "react-chartjs-2";
import "@/lib/chart-config";
import { useGetAdminStatistics } from "@/hooks/statistics";
import Spinner from "@/components/Spinner";
import { StatesTable } from "./StatesTable";
import { useState, useMemo } from "react";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  ChartOptions,
} from "chart.js";
import {
  BanknoteArrowUp,
  CircleCheck,
  CircleDollarSign,
  CircleUser,
  Dock,
  // DollarSign,
  // FileText,
} from "lucide-react";
import { formatAmount } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { ResponsiveDialog } from "@/components/responsive-dialog";
// import { set } from "zod";
import ClientAppliedFundingList from "@/components/ClientAppliedFundingList";
import { useGetFundingApplications } from "@/hooks/apply-funding";
// import HeaderBox from "@/components/HeaderBox";
import AdminFundingList from "@/components/funding/admin-funding-list";
import { RowActions } from "../../funding-application/_components/RowActions";

ChartJS.register(ArcElement, Tooltip, Legend);

interface StatusColorMap {
  [key: string]: {
    background: string;
    border: string;
  };
  default: {
    background: string;
    border: string;
  };
}

const statusColorMap: StatusColorMap = {
  New: {
    background: "rgba(59, 130, 246, 0.7)", // Blue
    border: "rgba(59, 130, 246, 1)",
  },
  Processing: {
    background: "#F59E0B", // Amber
    border: "#F59E0B",
  },
  "Pre-Approved": {
    background: "#06B6D4", // Cyan
    border: "#06B6D4",
  },
  Approved: {
    background: "#059669", // Green
    border: "#059669",
  },
  Declined: {
    background: "rgba(239, 68, 68, 0.7)", // Red
    border: "rgba(239, 68, 68, 1)",
  },
  default: {
    background: "rgba(107, 114, 128, 0.7)", // Gray for any unknown status
    border: "rgba(107, 114, 128, 1)",
  },
};

export default function AdminDashboard() {
  const router = useRouter();
  const [isTotalApprovedApplicationsOpen, setIsTotalApprovedApplicationsOpen] =
    useState(false);
  const [isTotalFundedApplicationsOpen, setIsTotalFundedApplicationsOpen] =
    useState(false);
  const [isStateOpen, setIsStateOpen] = useState(false);
  const [selectedState, setSelectedState] = useState<string | undefined>(
    undefined
  );

  const { adminStatistics, isLoading } = useGetAdminStatistics(selectedState);

  const handleStateClick = (state: string) => {
    setSelectedState(state);
    setIsStateOpen(true);
  };

  const filteredStatusCounts = useMemo(() => {
    if (!adminStatistics) return {};
    if (!selectedState) return adminStatistics.countsByStatus;
    return adminStatistics.countsByStatus;
  }, [selectedState, adminStatistics]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner displayText="Loading statistics..." />
      </div>
    );
  }

  const labels = Object.keys(filteredStatusCounts || {});
  const dataValues = Object.values(filteredStatusCounts || {});

  const statusesData = {
    labels,
    datasets: [
      {
        data: dataValues,
        backgroundColor: labels.map(
          (label) =>
            (statusColorMap[label] || statusColorMap.default).background
        ),
        borderColor: labels.map(
          (label) => (statusColorMap[label] || statusColorMap.default).border
        ),
        borderWidth: 1,
      },
    ],
  };

  const chartOptions: ChartOptions<"pie"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
      },
    },
  };

  return (
    <div className="grid gap-4 md:gap-6">
      <ResponsiveDialog
        isOpen={isTotalApprovedApplicationsOpen}
        setIsOpen={setIsTotalApprovedApplicationsOpen}
        title={`Total Approved Applications`}
        description="Total approved funding applications"
        className="w-10/12 flex flex-col min-h-screen "
      >
        <ClientAppliedFundingList
          clientApplicationStatus={["Approved", "Funded"]}
          isAdminView={true}
        />
      </ResponsiveDialog>
      <ResponsiveDialog
        isOpen={isStateOpen}
        setIsOpen={setIsStateOpen}
        title={`${selectedState} - Funding Applications`}
        description=""
        className="w-10/12 flex flex-col min-h-screen "
      >
        <FundingApplications state={selectedState} />
      </ResponsiveDialog>
      <ResponsiveDialog
        isOpen={isTotalFundedApplicationsOpen}
        setIsOpen={setIsTotalFundedApplicationsOpen}
        title={`Total Funded Applications`}
        description="Total funded applications"
        className="w-10/12 flex flex-col min-h-screen "
      >
        <ClientAppliedFundingList
          clientApplicationStatus={["Funded"]}
          isAdminView={true}
        />
      </ResponsiveDialog>
      <Card className="w-full">
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Total Clients"
              value={adminStatistics?.totalClients || 0}
              description="Total clients registered on the platform"
              icon={CircleUser}
              className="cursor-pointer"
              onClick={() => router.push("/admin/clients")}
            />
            <StatCard
              title="Total Funding Applications"
              value={adminStatistics?.totalFundingApplications || 0}
              description="Total funding applications submitted by clients"
              icon={Dock}
              className="cursor-pointer"
              onClick={() => router.push("/admin/funding-application")}
            />
            <StatCard
              title="Total Approved Applications"
              value={adminStatistics?.totalApprovedApplications || 0}
              description="Total approved funding applications"
              icon={CircleCheck}
              className="cursor-pointer"
              onClick={() => setIsTotalApprovedApplicationsOpen(true)}
            />

            <StatCard
              title="Total Funded Applications"
              value={adminStatistics?.totalFundedApplications || 0}
              description="Total funded applications"
              icon={BanknoteArrowUp}
              className="cursor-pointer"
              onClick={() => setIsTotalFundedApplicationsOpen(true)}
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <StatCard
              title="Total Approved Amount"
              value={formatAmount(adminStatistics?.totalApprovedAmount || 0)}
              description="Total approved amount"
              icon={CircleDollarSign}
            />

            <StatCard
              title="Total Funded Amount"
              value={formatAmount(adminStatistics?.totalFundedAmount || 0)}
              description="Total funded amount"
              icon={CircleDollarSign}
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <StatesTable
          countsByState={adminStatistics?.countsByState || {}}
          selectedState={selectedState}
          onStateClick={handleStateClick}
        />

        <Card className="w-full">
          <CardHeader>
            <CardTitle>Applications by Status</CardTitle>
          </CardHeader>
          <CardContent className="h-64 md:h-80">
            <Pie data={statusesData} options={chartOptions} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

const StatCard = ({
  title,
  value,
  description,
  icon: Icon,
  className = "",
  onClick,
}: {
  title: string;
  value: string | number;
  description: string;
  icon: React.ElementType;
  className?: string;
  onClick?: (event: React.MouseEvent<HTMLDivElement>) => void;
}) => (
  <Card className={`w-full ${className}`} onClick={onClick}>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-center text-3xl sm:text-4xl md:text-5xl font-bold text-blue-500">
        {value}
      </div>
      <p className="text-xs text-muted-foreground pt-1 text-center">
        {description}
      </p>
    </CardContent>
  </Card>
);

const FundingApplications = ({ state }: { state?: string }) => {
  const { appliedFunding, isLoading } = useGetFundingApplications({ state });

  if (isLoading) {
    return <Spinner displayText="Loading funding applications…" />;
  }
  return (
    <section>
      {(!appliedFunding || appliedFunding.length === 0) && (
        <p className="text-center">No funding applications</p>
      )}

      {appliedFunding && appliedFunding.length > 0 && (
        <div className="space-y-6">
          <section className="flex w-full flex-col gap-6">
            <AdminFundingList
              appliedFunding={appliedFunding}
              rowActions={(data) => <RowActions data={data} />}
            />
          </section>
        </div>
      )}
    </section>
  );
};
