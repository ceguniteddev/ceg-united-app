import React, { useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ApplyFunding } from "@/schema/apply-funding";
import ApplyFundingForm from "./ApplyFundingForm";
import DocumentsDisplay from "./DocumentsDisplay";

import AnalysisView from "./AnalysisView";
import { updateApplicationStatus } from "@/service/apply-funding";
import AdminApproveDeclineApplication from "./AdminApproveDeclineApplication";

type Props = {
  formSetOpen: React.Dispatch<React.SetStateAction<boolean>>;
  formSetCongratsOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  formData?: ApplyFunding;
};

const ViewApplication = ({ formSetOpen, formSetCongratsOpen, formData }: Props) => {
  useEffect(() => {
    const updateStatus = async () => {
      if (formData?.status === "New") {
        await updateApplicationStatus(formData.referenceNumber ?? "", "Processing");
      }
    };
    updateStatus();
  }, [formData]);

  return (
    <Tabs defaultValue="application" className="w-full flex flex-col items-start justify-start">
      <TabsList>
        <TabsTrigger value="application">Application</TabsTrigger>
        <TabsTrigger value="document">Document</TabsTrigger>
        <TabsTrigger value="analysis">Analysis</TabsTrigger>
        <TabsTrigger value="approve-decline">Approve/Decline</TabsTrigger>
      </TabsList>

      <TabsContent value="application" className="w-full">
        <ApplyFundingForm
          setOpen={formSetOpen}
          setCongratsOpen={formSetCongratsOpen}
          data={formData}
        />
      </TabsContent>

      <TabsContent value="document" className="w-full">
        <DocumentsDisplay
          userId={formData?.userId ?? ""}
          referenceNumber={formData?.referenceNumber ?? ""}
        />
      </TabsContent>

      <TabsContent value="analysis" className="w-full">
        <AnalysisView referenceNumber={formData?.referenceNumber ?? ""} setOpen={formSetOpen} />
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

export default ViewApplication;
