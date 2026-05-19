"use client";
import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, MoreHorizontal, PencilIcon, Trash2 } from "lucide-react";
import { useAuth } from "@/provider/AuthContext";
import Spinner from "@/components/Spinner";
import {
  useBusinessByIdQuery,
  useBusinessAuditQuery,
  useBusinessMutation,
} from "@/hooks/business";
import { BusinessTabs, BusinessTab } from "../_components/BusinessTabs";
import { OverviewTab } from "../_components/tabs/OverviewTab";
import { CreditReportTab } from "../_components/tabs/CreditReportTab";
import { FinanceAuditTab } from "../_components/tabs/FinanceAuditTab";
import { TradelineSuggestionsTab } from "../_components/tabs/TradelineSuggestionsTab";
import { FundabilityAuditTab } from "../_components/tabs/FundabilityAuditTab";
import { ResponsiveDialog } from "@/components/responsive-dialog";
import ClientBusinessManagement from "@/components/ClientBusinessManagement";
import { Business } from "@/schema";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import IconMenu from "@/components/icon-menu";
import DeleteConfirmation from "@/components/delete-confirmation";

interface Props {
  params: Promise<{ businessId: string }>;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function BusinessDetailPage({ params }: Props) {
  const { businessId } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const { business, isLoading } = useBusinessByIdQuery(
    user?.uid ?? "",
    businessId,
  );
  const {
    auditItems,
    fundabilityScore,
    fundabilityStatus,
    creditScore,
    creditRating,
    creditChange,
    accounts,
    metrics,
    revenueData,
    compatibilityFactors,
  } = useBusinessAuditQuery(user?.uid ?? "", businessId);
  const { deleteBusiness, isDeleting } = useBusinessMutation();

  const [activeTab, setActiveTab] = useState<BusinessTab>("overview");
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editingBusiness, setEditingBusiness] = useState<Business | null>(null);

  if (!user || isLoading) {
    return <Spinner displayText="Loading business…" />;
  }

  if (!business) {
    return (
      <section className="home">
        <div className="home-content flex flex-col items-center justify-center py-24">
          <p className="text-lg font-semibold text-gray-700 mb-2">
            Business not found
          </p>
          <Link
            href="/client/my-business"
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            ← Back to My Businesses
          </Link>
        </div>
      </section>
    );
  }

  const handleEdit = () => {
    setEditingBusiness(business as Business);
    setIsEditOpen(true);
  };

  const handleDelete = async () => {
    try {
      await deleteBusiness(businessId);
      setIsDeleteOpen(false);
      router.push("/client/my-business");
    } catch (error) {
      console.error("Failed to delete business:", error);
    }
  };

  const renderTab = () => {
    switch (activeTab) {
      case "overview":
        return (
          <OverviewTab
            business={business}
            auditItems={auditItems}
            fundabilityScore={fundabilityScore}
            fundabilityStatus={fundabilityStatus}
          />
        );
      case "credit-report":
        return (
          <CreditReportTab
            business={business}
            creditScore={creditScore}
            creditRating={creditRating}
            creditChange={creditChange}
            accounts={accounts}
          />
        );
      case "finance-audit":
        return <FinanceAuditTab metrics={metrics} revenueData={revenueData} />;
      case "tradeline-suggestions":
        return <TradelineSuggestionsTab />;
      case "fundability-audit":
        return (
          <FundabilityAuditTab
            business={business}
            factors={compatibilityFactors}
          />
        );
      default:
        return (
          <OverviewTab
            business={business}
            auditItems={auditItems}
            fundabilityScore={fundabilityScore}
            fundabilityStatus={fundabilityStatus}
          />
        );
    }
  };

  return (
    <section className="home">
      <div className="home-content pb-8 sm:pb-0">
        {/* Back Link */}
        <Link
          href="/client/my-business"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-blue-600 transition-colors mb-5"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to My Businesses</span>
        </Link>

        {/* Business Header Card */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-slate-800 text-white flex items-center justify-center font-bold text-base flex-shrink-0">
                {getInitials(business.businessName)}
              </div>
              <div className="min-w-0">
                <h1 className="text-base sm:text-xl font-bold text-gray-900 truncate">
                  {business.businessName}
                </h1>
                <div className="flex items-center gap-2 flex-wrap mt-0.5">
                  <p className="text-xs sm:text-sm text-gray-400 truncate">
                    EIN: {business.employerIdentificationNumber}
                  </p>
                  {fundabilityStatus && fundabilityStatus !== "No Data" && (
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                        fundabilityStatus === "Excellent"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : fundabilityStatus === "Good"
                            ? "bg-blue-50 text-blue-700 border-blue-200"
                            : fundabilityStatus === "Fair"
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : "bg-red-50 text-red-600 border-red-200"
                      }`}
                    >
                      {fundabilityStatus}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="p-2 h-auto hover:bg-gray-100 rounded-lg"
                >
                  <MoreHorizontal className="w-5 h-5 text-gray-400" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Button
                    variant="ghost"
                    className="w-full justify-start cursor-pointer"
                    onClick={handleEdit}
                  >
                    <IconMenu
                      text="Edit Business"
                      icon={<PencilIcon className="h-4 w-4" />}
                    />
                  </Button>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Button
                    variant="ghost"
                    className="w-full justify-start cursor-pointer text-red-600 hover:text-red-700"
                    onClick={() => setIsDeleteOpen(true)}
                  >
                    <IconMenu
                      text="Delete Business"
                      icon={<Trash2 className="h-4 w-4" />}
                    />
                  </Button>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Tab Navigation */}
        <BusinessTabs activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Tab Content */}
        <div key={activeTab}>{renderTab()}</div>
      </div>

      {/* Edit Modal */}
      <ResponsiveDialog
        isOpen={isEditOpen}
        setIsOpen={setIsEditOpen}
        title="Edit Business"
        className="sm:max-w-2xl w-full"
      >
        <div className="overflow-y-auto px-4 pb-4 sm:px-6 sm:pb-6">
          <ClientBusinessManagement
            userId={user.uid}
            editingBusiness={editingBusiness}
            setEditingBusiness={setEditingBusiness}
            isModal
            setOpen={setIsEditOpen}
          />
        </div>
      </ResponsiveDialog>

      {/* Delete Confirmation Modal */}
      <ResponsiveDialog
        isOpen={isDeleteOpen}
        setIsOpen={setIsDeleteOpen}
        title="Delete Business"
        className="sm:max-w-md w-full"
      >
        <div className="px-4 pb-4 sm:px-6 sm:pb-6">
          <DeleteConfirmation
            handleDelete={handleDelete}
            isDeleting={isDeleting}
            info={business?.businessName || "this business"}
            setModalOpen={setIsDeleteOpen}
          />
        </div>
      </ResponsiveDialog>
    </section>
  );
}
