import React, { useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ApplyFunding } from "@/schema/apply-funding";

import ClientData from "@/app/(admin)/admin/clients/view";
import AdminMappedFunds from "@/components/funding/AdminMappedFunds";
import { UserFundMapStatus, UserWithId } from "@/schema/registration";
import AdminViewUserProfile from "@/components/funding/AdminViewUserProfile";
import SendEmail from "@/components/SendEmail";
import ClientNotes from "@/components/notes/ClientNotes";
// import AdminMappedFunds from "./AdminMappedFunds";

type Props = {
  formSetOpen: React.Dispatch<React.SetStateAction<boolean>>;
  data: UserWithId;
  status?: UserFundMapStatus | null;
};

const TabView = ({ formSetOpen, data, status }: Props) => {
  return (
    <Tabs defaultValue="application" className="w-full flex flex-col items-start justify-start">
      <TabsList>
        <TabsTrigger value="personal-information">Personal Information</TabsTrigger>
        {status && <TabsTrigger value="pre-approved-funds">Pre-approved Funds</TabsTrigger>}
        <TabsTrigger value="statistics">Statistics</TabsTrigger>
        <TabsTrigger value="note">Note</TabsTrigger>
        <TabsTrigger value="email">Email</TabsTrigger>
      </TabsList>
      <TabsContent value="email" className="w-full">
        <SendEmail userId={data.id} />
      </TabsContent>
      <TabsContent value="note" className="w-full">
        <ClientNotes userId={data.id} />
      </TabsContent>
      <TabsContent value="personal-information" className="w-full">
        <ClientData user={data} />
      </TabsContent>
      <TabsContent value="pre-approved-funds" className="w-full">
        <AdminMappedFunds userId={data.id} />
      </TabsContent>

      <TabsContent value="statistics" className="w-full">
        <AdminViewUserProfile userId={data.id} />
      </TabsContent>
    </Tabs>
  );
};

export default TabView;
