"use client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import ClientData from "@/app/(admin)/admin/clients/view";
import AdminMappedFunds from "@/components/funding/AdminMappedFunds";
import { UserFundMapStatus, UserWithId } from "@/schema/registration";
import AdminViewUserProfile from "@/components/funding/AdminViewUserProfile";
import SendEmail from "@/components/SendEmail";
import ClientNotes from "@/components/notes/ClientNotes";
import ClientAppliedFunding from "@/app/(admin)/admin/clients/client-applied-funding";
import ClientDocuments from "@/components/ClientDocuments";
import ClientCreditReport from "@/components/ClientCreditReport";
import BusinessRecordsPage from "@/components/ClientBusinessReport";
import { useParams } from "next/navigation";
import { useUserQuery } from "@/hooks/user";
import Spinner from "@/components/Spinner";

type Props = {
  formSetOpen: React.Dispatch<React.SetStateAction<boolean>>;
  data: UserWithId;
  status?: UserFundMapStatus | null;
};

const TabView = () => {
  const params = useParams();
  const userId = params.userId as string;

  const { userData, isLoading } = useUserQuery(userId);

  if (isLoading) {
    return <Spinner displayText="Loading user profile..." />;
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
        {/* <TabsTrigger value="pre-approved-funds">Pre-approved Funds</TabsTrigger> */}
        <TabsTrigger value="applied-funding">Applied Funding</TabsTrigger>
        <TabsTrigger value="note">Note</TabsTrigger>
        <TabsTrigger value="email">Email</TabsTrigger>
      </TabsList>
      <TabsContent value="business" className="w-full">
        <BusinessRecordsPage userId={userId} />
      </TabsContent>
      <TabsContent value="credit-report" className="w-full">
        <ClientCreditReport userId={userId} isAdminView />
      </TabsContent>
      <TabsContent value="documents" className="w-full">
        <ClientDocuments userId={userId} />
      </TabsContent>
      <TabsContent value="applied-funding" className="w-full">
        <ClientAppliedFunding userId={userId} />
      </TabsContent>
      <TabsContent value="email" className="w-full">
        <SendEmail userId={userId} />
      </TabsContent>
      <TabsContent value="note" className="w-full">
        <ClientNotes userId={userId} />
      </TabsContent>
      <TabsContent value="personal-information" className="w-full">
        <ClientData user={userData as UserWithId} />
      </TabsContent>
      {/* <TabsContent value="pre-approved-funds" className="w-full">
        <AdminMappedFunds userId={userId} />
      </TabsContent> */}

      <TabsContent value="dashboard" className="w-full">
        <AdminViewUserProfile userId={userId} />
      </TabsContent>
    </Tabs>
  );
};

export default TabView;
