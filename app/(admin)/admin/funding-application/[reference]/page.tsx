"use client";
import ClientDocuments from "@/components/ClientDocuments";
import AdminMappedFunds from "@/components/funding/AdminMappedFunds";
import FundingApplicationView from "@/components/funding/AdminViewApplicationForm";
import AdminViewUserProfile from "@/components/funding/AdminViewUserProfile";
import AnalysisView from "@/components/funding/AnalysisView";
import FundApplicationNotesV2 from "@/components/notes/FundApplicationNotesV2";
import ClientData from "@/app/(admin)/admin/clients/view";
import Spinner from "@/components/Spinner";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useGetApplyFundingByReferenceNumber } from "@/hooks/apply-funding";
// import { updateApplicationStatus } from "@/service/apply-funding";
import { useParams } from "next/navigation";
import {  useState, useMemo } from "react";

import ClientCreditReport from "@/components/ClientCreditReport";
import BusinessRecordsPage from "@/components/ClientBusinessReport";
import ClientAppliedFunding from "@/components/ClientAppliedFundingList";
import UserLearningMaterials from "@/components/UserLearningMaterials";
import AdminLetterFeatureManagement from "@/components/AdminLetterFeatureManagement";
import LetterList from "@/components/letter-stream/list";
import LetterForm from "@/components/letter-stream/form";
import { ResponsiveDialog } from "@/components/responsive-dialog";
import { useUserQuery } from "@/hooks/user";
import { useMembership } from "@/hooks/membership";
import { UserWithId } from "@/schema/registration";
import { useGetClientApplyFunding } from "@/hooks/apply-funding";
// import { ApplyFundingWithUser } from "@/schema/apply-funding";

const AdminViewApplication = () => {
  const params = useParams();
  const reference = params.reference as string;
  const [activeTab, setActiveTab] = useState("application");
  const [isLetterFormOpen, setIsLetterFormOpen] = useState(false);

  const { appliedFunding: formData, isLoading } =
    useGetApplyFundingByReferenceNumber({
      referenceNumber: reference,
    });

  const userId = formData?.userId ?? "";

  const { userData, isLoading: isUserLoading } = useUserQuery(userId);
  const { appliedFunding, isLoading: isFundingLoading } =
    useGetClientApplyFunding(userId);
  const { data: userMembership } = useMembership(userId);

  const hasLearningMaterialsAccess = useMemo(() => {
    return userMembership?.status === "active";
  }, [userMembership]);

  const hasLetterFeatureEnabled = useMemo(() => {
    return !!userData?.letterFeatureEnabled;
  }, [userData]);

  // useEffect(() => {
  //   const updateStatus = async () => {
  //     if (formData?.status === "New") {
  //       await updateApplicationStatus({
  //         referenceNumber: formData.referenceNumber ?? "",
  //         status: "Processing",
  //       });
  //     }
  //   };
  //   updateStatus();
  // }, [formData]);

  const tabOptions = useMemo(() => {
    const options = [
      { value: "application", label: "Application" },
      { value: "personal-information", label: "Client Information" },
      { value: "client-profile", label: "Client Profile" },
      { value: "documents", label: "Documents" },
      { value: "analysis", label: "Analysis" },
      // { value: "fund-mapping", label: "Fund Mapping" },
      { value: "notes", label: "Notes" },
      { value: "credit-report", label: "Credit Report" },
      { value: "business", label: "Business" },
      { value: "applied-funding", label: "Applied Funding" },
    ];

    return options;
  }, [hasLearningMaterialsAccess, hasLetterFeatureEnabled]);

  if (isLoading || isUserLoading) {
    return <Spinner displayText="Loading data..." />;
  }

  return (
    <div className="w-full p-2 sm:p-3 md:p-4 lg:p-6">
      {/* Client Information Header */}
      {userData && (
        <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-xl font-bold text-gray-900">
                  {userData.firstName} {userData.middleName} {userData.lastName}
                </h1>
                {userMembership?.status === "active" && (
                  <span className="inline-flex items-center rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-800">
                    Premium Client
                  </span>
                )}
                {userData.activeStatus && (
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      userData.activeStatus === "Active"
                        ? "bg-green-100 text-green-800"
                        : userData.activeStatus === "Paused"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {userData.activeStatus}
                  </span>
                )}
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                  {userData.email}
                </span>
                <span className="flex items-center gap-1">
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    />
                  </svg>
                  {userData.phoneNumber}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

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
        <TabsContent value="personal-information" className="w-full">
          {userData && <ClientData user={userData as UserWithId} />}
        </TabsContent>
        {/* <TabsContent value="fund-mapping" className="w-full">
          <AdminMappedFunds
            referenceNumber={formData?.referenceNumber ?? ""}
            userId={formData?.userId ?? ""}
          />
        </TabsContent> */}
        <TabsContent value="notes" className="w-full">
          <FundApplicationNotesV2
            applicationReferenceNumber={formData?.referenceNumber ?? ""}
          />
        </TabsContent>
        {/* <TabsContent value="email" className="w-full">
          <SendEmail
            referenceNumber={formData?.referenceNumber ?? ""}
            userId={formData?.userId ?? ""}
          />
        </TabsContent> */}
        <TabsContent value="application" className="w-full">
          <FundingApplicationView data={formData} />
        </TabsContent>
        <TabsContent value="client-profile" className="w-full">
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

        <TabsContent value="credit-report" className="w-full">
          <ClientCreditReport
            userId={userId}
            isAdminView
            userData={userData as UserWithId}
          />
        </TabsContent>

        <TabsContent value="business" className="w-full">
          <BusinessRecordsPage userId={userId} />
        </TabsContent>

        <TabsContent value="applied-funding" className="w-full">
          <ClientAppliedFunding userId={userId} isAdminView={true} />
        </TabsContent>

        {hasLearningMaterialsAccess && (
          <TabsContent value="learning-materials" className="w-full">
            <UserLearningMaterials userId={userId} isAdminView />
          </TabsContent>
        )}

        <TabsContent value="letters" className="w-full">
          {userData && (
            <AdminLetterFeatureManagement user={userData as UserWithId} />
          )}
        </TabsContent>

        {hasLetterFeatureEnabled && (
          <TabsContent value="dispute-letters" className="w-full">
            <LetterList
              userId={userId}
              onCreateNew={() => setIsLetterFormOpen(true)}
            />
          </TabsContent>
        )}
      </Tabs>

      <ResponsiveDialog
        isOpen={isLetterFormOpen}
        setIsOpen={setIsLetterFormOpen}
        title="Create New Dispute Letter"
        description="Create a dispute letter for this client."
        className="w-4/6"
      >
        {userData && (
          <LetterForm
            userId={userId}
            userData={userData as UserWithId}
            onSuccess={() => setIsLetterFormOpen(false)}
            onCancel={() => setIsLetterFormOpen(false)}
          />
        )}
      </ResponsiveDialog>
    </div>
  );
};

export default AdminViewApplication;
