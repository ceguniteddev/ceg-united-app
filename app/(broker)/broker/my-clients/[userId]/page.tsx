"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ClientData from "@/app/(admin)/admin/clients/view";
import { UserWithId } from "@/schema/registration";
import AdminViewUserProfile from "@/components/funding/AdminViewUserProfile";
import ClientDocuments from "@/components/ClientDocuments";
import ClientCreditReport from "@/components/ClientCreditReport";
import BusinessRecordsPage from "@/components/ClientBusinessReport";
import { useParams } from "next/navigation";
import { useUserQuery } from "@/hooks/user";
import Spinner from "@/components/Spinner";
import ApplyFunding from "@/components/fundingv2/ApplyFunding";
import FundingList from "@/components/funding/funding-list";
import { useClientMappedFundingDetailsQuery } from "@/hooks/admin/funding-application/fund-mapping";
import { ApprovedBankFormData } from "@/schema/bank-products";
import { useState } from "react";

const ClientProfilePage = () => {
  const params = useParams();
  const userId = params.userId as string;
  const [activeTab, setActiveTab] = useState("personal-information");

  const { userData, isLoading: isUserLoading } = useUserQuery(userId);

  const { mappedFund = [], isLoading } = useClientMappedFundingDetailsQuery({
    userId,
  });

  // Show loading state while fetching data
  if (isUserLoading || isLoading) {
    return <Spinner displayText="Loading user profile..." />;
  }

  // If no user data, show error state
  if (!userData) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900">
            User Not Found
          </h2>
          <p className="mt-2 text-gray-600">
            The requested user could not be found.
          </p>
        </div>
      </div>
    );
  }

  return (
    <Tabs
      value={activeTab}
      onValueChange={setActiveTab}
      className="w-full flex flex-col items-start justify-start p-2 sm:p-4 md:p-6 lg:p-10"
    >
      {/* Section Dropdown */}
      <div className="w-full mb-6">
        <Select value={activeTab} onValueChange={setActiveTab}>
          <SelectTrigger className="w-full sm:w-auto sm:min-w-[250px] h-10 sm:h-9">
            <SelectValue placeholder="Select a section" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="personal-information">
              Personal Information
            </SelectItem>
            <SelectItem value="dashboard">Dashboard</SelectItem>
            <SelectItem value="documents">Documents</SelectItem>
            <SelectItem value="credit-report">Credit Report</SelectItem>
            <SelectItem value="business">Business</SelectItem>
            <SelectItem value="applied-funding">Applied Funding</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <TabsContent value="personal-information" className="w-full">
        <ClientData user={userData as UserWithId} isBrokerView />
      </TabsContent>

      <TabsContent value="dashboard" className="w-full">
        <AdminViewUserProfile userId={userId} adminView={true} />
      </TabsContent>

      <TabsContent value="documents" className="w-full">
        <ClientDocuments userId={userId} />
      </TabsContent>

      <TabsContent value="credit-report" className="w-full">
        <ClientCreditReport userId={userId} isAdminView />
      </TabsContent>

      <TabsContent value="business" className="w-full">
        <BusinessRecordsPage userId={userId} />
      </TabsContent>

      <TabsContent value="applied-funding" className="w-full">
        <div className="flex flex-col sm:flex-row sm:justify-end mb-4 w-full">
          <ApplyFunding userId={userId} />
        </div>
        {/* <ClientAppliedFunding userId={userId} /> */}
        <FundingList appliedFunding={mappedFund as ApprovedBankFormData[]} />
      </TabsContent>
    </Tabs>
  );
};

export default ClientProfilePage;
