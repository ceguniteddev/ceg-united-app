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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useGetApplyFundingByReferenceNumber } from "@/hooks/apply-funding";
import { updateApplicationStatus } from "@/service/apply-funding";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

const AdminViewApplication = () => {
  const params = useParams();
  const reference = params.reference as string;
  const [activeTab, setActiveTab] = useState("application");

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

  const tabOptions = [
    { value: "application", label: "Application" },
    { value: "user-profile", label: "User Profile" },
    { value: "documents", label: "Documents" },
    { value: "analysis", label: "Analysis" },
    { value: "fund-mapping", label: "Fund Mapping" },
    { value: "notes", label: "Notes" },
    { value: "email", label: "Email" },
  ];

  return (
    <div className="w-full p-2 sm:p-3 md:p-4 lg:p-6">
      {/* Section Dropdown */}
      <div className="mb-4">
        <Select value={activeTab} onValueChange={setActiveTab}>
          <SelectTrigger className="w-full sm:w-auto sm:min-w-[250px] h-10 sm:h-9">
            <SelectValue placeholder="Select section" />
          </SelectTrigger>
          <SelectContent>
            {tabOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Content Sections */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full flex flex-col"
      >
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
          <AdminViewUserProfile
            userId={formData?.userId ?? ""}
            adminView={true}
          />
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
    </div>
  );
};

export default AdminViewApplication;
