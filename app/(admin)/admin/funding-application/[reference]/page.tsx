"use client";
import ClientDocuments from "@/components/ClientDocuments";
import AdminApproveDeclineApplication from "@/components/funding/AdminApproveDeclineApplication";
import AdminMappedFunds from "@/components/funding/AdminMappedFunds";
import FundingApplicationView from "@/components/funding/AdminViewApplicationForm";
import AdminViewUserProfile from "@/components/funding/AdminViewUserProfile";
import AnalysisView from "@/components/funding/AnalysisView";
import FundApplicationNotesV2 from "@/components/notes/FundApplicationNotesV2";
import SendEmail from "@/components/SendEmail";
import Spinner from "@/components/Spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useGetApplyFundingByReferenceNumber } from "@/hooks/apply-funding";
import { updateApplicationStatus } from "@/service/apply-funding";
import { useParams } from "next/navigation";
import { useEffect } from "react";

const AdminViewApplication = () => {
  const params = useParams();
  const reference = params.reference as string;

  const { appliedFunding: formData, isLoading } =
    useGetApplyFundingByReferenceNumber({
      referenceNumber: reference,
    });

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

  if (isLoading) {
    return <Spinner displayText="Loading data..." />;
  }

  return (
    <Tabs
      defaultValue="application"
      className="w-full flex flex-col items-start justify-start p-10"
    >
      <TabsList>
        <TabsTrigger value="application">Application</TabsTrigger>
        <TabsTrigger value="user-profile">User Profile</TabsTrigger>
        <TabsTrigger value="documents">Documents</TabsTrigger>
        <TabsTrigger value="analysis">Analysis</TabsTrigger>
        <TabsTrigger value="fund-mapping">Fund Mapping</TabsTrigger>
        <TabsTrigger value="notes">Notes</TabsTrigger>
        {/* <TabsTrigger value="approve-decline">
          Approve/Decline Application
        </TabsTrigger> */}
        <TabsTrigger value="email">Email</TabsTrigger>
      </TabsList>
      <TabsContent value="fund-mapping" className="w-full">
        <AdminMappedFunds
          referenceNumber={formData?.referenceNumber ?? ""}
          userId={formData?.userId ?? ""}
        />
      </TabsContent>
      <TabsContent value="notes" className="w-full">
        <FundApplicationNotesV2
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
        <FundingApplicationView data={formData} />
      </TabsContent>
      <TabsContent value="user-profile" className="w-full">
        <AdminViewUserProfile userId={formData?.userId ?? ""} />
      </TabsContent>

      <TabsContent value="documents" className="w-full">
        <ClientDocuments userId={formData?.userId ?? ""} />
      </TabsContent>

      <TabsContent value="analysis" className="w-full">
        <AnalysisView referenceNumber={formData?.referenceNumber ?? ""} />
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
