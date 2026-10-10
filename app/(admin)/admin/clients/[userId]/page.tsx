"use client";

import { Tabs, TabsContent } from "@/components/ui/tabs";
import ClientData from "@/app/(admin)/admin/clients/view";
import { UserWithId } from "@/schema/registration";
import AdminViewUserProfile from "@/components/funding/AdminViewUserProfile";
// import SendEmail from "@/components/SendEmail";
import ClientNotes from "@/components/notes/ClientNotes";
import ClientAppliedFunding from "@/components/ClientAppliedFundingList";
import ClientDocuments from "@/components/ClientDocuments";
import ClientCreditReport from "@/components/ClientCreditReport";
import UserLearningMaterials from "@/components/UserLearningMaterials";
import AdminLetterFeatureManagement from "@/components/AdminLetterFeatureManagement";
import CreditRepairDisputesView from "@/components/credit-repair/CreditRepairDisputesView";
import LetterList from "@/components/letter-stream/list";
import LetterForm from "@/components/letter-stream/form";
import { ResponsiveDialog } from "@/components/responsive-dialog";
import { useParams, useSearchParams } from "next/navigation";
import { useUserQuery } from "@/hooks/user";
import { useMembership } from "@/hooks/membership";
import { useUserAddons } from "@/hooks/addons";
// import { useGetDenefitsContractsByUserId } from "@/hooks/denefits";
import Spinner from "@/components/Spinner";
import { useMemo, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import AdminFundingList from "@/components/funding/admin-funding-list";
import { useGetClientApplyFunding } from "@/hooks/apply-funding";
import { RowActions } from "@/app/(admin)/admin/funding-application/_components/RowActions";
import { ApplyFundingWithUser } from "@/schema/apply-funding";
import { PsfInvoicesSection } from "@/components/income-funding/PsfInvoicesSection";
import ClientBusiness from "@/app/(client)/client/my-business/_components/ClientBusiness";

const ClientProfilePage = () => {
  const params = useParams();
  const searchParams = useSearchParams();
  const userId = params.userId as string;
  const [isLetterFormOpen, setIsLetterFormOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(
    () => searchParams.get("tab") || "personal-information",
  );

  const { userData, isLoading: isUserLoading } = useUserQuery(userId);
  const { data: membershipData } = useMembership(userId);
  const { appliedFunding, isLoading: isFundingLoading } =
    useGetClientApplyFunding(userId);

  const appliedFundingWithUser: ApplyFundingWithUser[] | undefined =
    useMemo(() => {
      return appliedFunding?.map((item) => ({
        ...item,
        user: userData,
      }));
    }, [appliedFunding, userData]);

  // const { denefitsContract, isLoading: isDenefitsLoading } =
  //   useGetDenefitsContractsByUserId(userId);

  const { data: addons = [] } = useUserAddons(userId);

  // Check if user has access to learning materials
  const hasLearningMaterialsAccess = useMemo(() => {
    return (
      membershipData?.status === "active" ||
      addons.some((a) => a.status === "active")
    );
  }, [membershipData, addons]);

  // Check if user has letter feature enabled
  const hasLetterFeatureEnabled = useMemo(() => {
    return !!userData?.letterFeatureEnabled;
  }, [userData]);

  const tabOptions = useMemo(() => {
    const options = [
      { value: "personal-information", label: "Personal Information" },
      { value: "invoice", label: "Invoice" },
      { value: "dashboard", label: "Dashboard" },
      { value: "documents", label: "Documents" },
      { value: "credit-report", label: "Credit Report" },
      { value: "business", label: "Business" },
      { value: "fund-application", label: "Funding Application" },
      { value: "applied-funding", label: "Applied Funding" },
      { value: "learning-materials", label: "Learning Materials" },
      { value: "credit-repair", label: "Credit Repair" },
    ];

    if (hasLetterFeatureEnabled) {
      options.push({ value: "dispute-letters", label: "Dispute Letters" });
    }

    options.push(
      { value: "note", label: "Note" },
      // { value: "email", label: "Email" },
    );

    return options;
  }, [hasLetterFeatureEnabled]);

  // Show loading state while fetching data
  if (isUserLoading) {
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
      className="w-full flex flex-col items-start justify-start p-4 md:p-10"
    >
      {/* Section Dropdown */}
      <div className="w-full mb-4">
        <Select value={activeTab} onValueChange={setActiveTab}>
          <SelectTrigger className="w-full sm:w-auto sm:min-w-[250px] h-10 sm:h-9">
            <SelectValue placeholder="Select a section" />
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

      <TabsContent value="personal-information" className="w-full">
        <ClientData user={userData as UserWithId} />
      </TabsContent>

      <TabsContent value="invoice" className="w-full">
        <PsfInvoicesSection userId={userId} isAdminView />
      </TabsContent>

      <TabsContent value="dashboard" className="w-full">
        <AdminViewUserProfile userId={userId} adminView={true} />
      </TabsContent>

      <TabsContent value="documents" className="w-full">
        <ClientDocuments userId={userId} />
      </TabsContent>

      <TabsContent value="credit-report" className="w-full">
        <ClientCreditReport userId={userId} userData={userData as UserWithId} />
      </TabsContent>

      <TabsContent value="business" className="w-full">
        <ClientBusiness userId={userId} isAdminView={true} />
      </TabsContent>

      <TabsContent value="applied-funding" className="w-full">
        <ClientAppliedFunding userId={userId} isAdminView={true} />
      </TabsContent>

      <TabsContent value="fund-application" className="w-full">
        {isFundingLoading ? (
          <Spinner displayText="Loading funding applications..." />
        ) : !appliedFundingWithUser || appliedFundingWithUser.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No funding applications found for this client.
          </div>
        ) : (
          <AdminFundingList
            appliedFunding={appliedFundingWithUser}
            rowActions={(data) => <RowActions data={data} />}
          />
        )}
      </TabsContent>

      <TabsContent value="learning-materials" className="w-full">
        <UserLearningMaterials userId={userId} isAdminView />
      </TabsContent>

      <TabsContent value="letters" className="w-full">
        <AdminLetterFeatureManagement user={userData as UserWithId} />
      </TabsContent>

      {hasLetterFeatureEnabled && (
        <TabsContent value="dispute-letters" className="w-full">
          <LetterList
            userId={userId}
            onCreateNew={() => setIsLetterFormOpen(true)}
          />
        </TabsContent>
      )}

      <TabsContent value="credit-repair" className="w-full">
        <CreditRepairDisputesView userId={userId} />
      </TabsContent>

      <TabsContent value="note" className="w-full">
        <ClientNotes userId={userId} />
      </TabsContent>

      {/* <TabsContent value="email" className="w-full">
        <SendEmail userId={userId} />
      </TabsContent> */}

      <ResponsiveDialog
        isOpen={isLetterFormOpen}
        setIsOpen={setIsLetterFormOpen}
        title="Create New Dispute Letter"
        description="Create a dispute letter for this client."
        className="w-4/6"
      >
        <LetterForm
          userId={userId}
          userData={userData as UserWithId}
          onSuccess={() => setIsLetterFormOpen(false)}
          onCancel={() => setIsLetterFormOpen(false)}
        />
      </ResponsiveDialog>
    </Tabs>
  );
};

export default ClientProfilePage;
