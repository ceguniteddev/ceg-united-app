import React, { useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ApplyFunding } from "@/schema/apply-funding";
import DocumentsDisplay from "./DocumentsDisplay";

import AnalysisView from "./AnalysisView";
import { updateApplicationStatus } from "@/service/apply-funding";
import AdminApproveDeclineApplication from "./AdminApproveDeclineApplication";
import FundingApplicationView from "./AdminViewApplicationForm";
import AdminViewUserProfile from "./AdminViewUserProfile";
import SendEmail from "../SendEmail";
import FundApplicationNotes from "@/components/notes/FundApplicationNotes";
import AdminMappedFunds from "./AdminMappedFunds";
// import AdminMappedFunds from "./AdminMappedFunds";

type Props = {
  formSetOpen: React.Dispatch<React.SetStateAction<boolean>>;
  formData: ApplyFunding;
};

const AdminViewApplication = ({ formSetOpen, formData }: Props) => {
  useEffect(() => {
    const updateStatus = async () => {
      if (formData?.status === "New") {
        await updateApplicationStatus(
          formData.referenceNumber ?? "",
          "Processing"
        );
      }
    };
    updateStatus();
  }, [formData]);

  return (
    <Tabs
      defaultValue="application"
      className="w-full flex flex-col items-start justify-start"
    >
      <TabsList>
        <TabsTrigger value="application">Application</TabsTrigger>
        <TabsTrigger value="user-profile">User Profile</TabsTrigger>
        <TabsTrigger value="document">Document</TabsTrigger>
        <TabsTrigger value="analysis">Analysis</TabsTrigger>
        <TabsTrigger value="fund-mapping">Fund Mapping</TabsTrigger>
        {/* <TabsTrigger value="approve-decline">Approve/Decline</TabsTrigger> */}
        <TabsTrigger value="notes">Notes</TabsTrigger>
        <TabsTrigger value="email">Email</TabsTrigger>
      </TabsList>
      <TabsContent value="fund-mapping" className="w-full">
        <AdminMappedFunds referenceNumber={formData?.referenceNumber ?? ""} />
      </TabsContent>
      <TabsContent value="notes" className="w-full">
        <FundApplicationNotes
          applicationReferenceNumber={formData?.referenceNumber ?? ""}
        />
      </TabsContent>
      <TabsContent value="email" className="w-full">
        <SendEmail
          referenceNumber={formData?.referenceNumber ?? ""}
          userId={formData?.userId ?? ""}
        />
      </TabsContent>
      <TabsContent value="application" className="w-full">
        <FundingApplicationView setOpen={formSetOpen} data={formData} />
      </TabsContent>
      <TabsContent value="user-profile" className="w-full">
        <AdminViewUserProfile userId={formData?.userId ?? ""} />
      </TabsContent>

      <TabsContent value="document" className="w-full">
        <DocumentsDisplay
          userId={formData?.userId ?? ""}
          referenceNumber={formData?.referenceNumber ?? ""}
        />
      </TabsContent>

      <TabsContent value="analysis" className="w-full">
        <AnalysisView
          referenceNumber={formData?.referenceNumber ?? ""}
          setOpen={formSetOpen}
        />
      </TabsContent>

      <TabsContent value="approve-decline" className="w-full">
        <AdminApproveDeclineApplication
          referenceNumber={formData?.referenceNumber ?? ""}
          defaultValues={{
            amountApprove: formData?.approveOrDecline?.amountApprove,
            remarks: formData?.approveOrDecline?.remarks,
          }}
        />
      </TabsContent>
    </Tabs>
  );
};

export default AdminViewApplication;
