"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ClientData from "@/app/(admin)/admin/clients/view";
import { UserWithId } from "@/schema/registration";
import AdminViewUserProfile from "@/components/funding/AdminViewUserProfile";
import SendEmail from "@/components/SendEmail";
import ClientNotes from "@/components/notes/ClientNotes";
import ClientAppliedFunding from "@/components/ClientAppliedFundingList";
import ClientDocuments from "@/components/ClientDocuments";
import ClientCreditReport from "@/components/ClientCreditReport";
import BusinessRecordsPage from "@/components/ClientBusinessReport";
import UserLearningMaterials from "@/components/UserLearningMaterials";
import { useParams } from "next/navigation";
import { useUserQuery } from "@/hooks/user";
import { useGetDenefitsContractsByUserId } from "@/hooks/denefits";
import Spinner from "@/components/Spinner";
import { useMemo } from "react";

const ClientProfilePage = () => {
  const params = useParams();
  const userId = params.userId as string;

  const { userData, isLoading: isUserLoading } = useUserQuery(userId);
  const { denefitsContract, isLoading: isDenefitsLoading } =
    useGetDenefitsContractsByUserId(userId);

  // Check if user has access to learning materials
  const hasLearningMaterialsAccess = useMemo(() => {
    return !!(denefitsContract && denefitsContract.length > 0);
  }, [denefitsContract]);

  // Show loading state while fetching data
  if (isUserLoading || isDenefitsLoading) {
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
      defaultValue="personal-information"
      className="w-full flex flex-col items-start justify-start p-10"
    >
      <TabsList>
        <TabsTrigger value="personal-information">
          Personal Information
        </TabsTrigger>
        <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
        <TabsTrigger value="documents">Documents</TabsTrigger>
        <TabsTrigger value="credit-report">Credit Report</TabsTrigger>
        <TabsTrigger value="business">Business</TabsTrigger>
        <TabsTrigger value="applied-funding">Applied Funding</TabsTrigger>
      </TabsList>

      <TabsContent value="personal-information" className="w-full">
        <ClientData user={userData as UserWithId} isBrokerView />
      </TabsContent>

      <TabsContent value="dashboard" className="w-full">
        <AdminViewUserProfile userId={userId} adminView={false} />
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
        <ClientAppliedFunding userId={userId} />
      </TabsContent>
    </Tabs>
  );
};

export default ClientProfilePage;
