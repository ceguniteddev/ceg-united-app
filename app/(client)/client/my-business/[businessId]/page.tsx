"use client";
import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  MoreHorizontal,
  PencilIcon,
  Trash2,
  ReceiptIcon,
  Loader2,
  X,
} from "lucide-react";
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
import { initiateCRSReportCheckout } from "@/service/crs";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { WhopCheckoutEmbed } from "@whop/checkout/react";

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

  const [isGenerating, setIsGenerating] = useState(false);
  const [checkoutId, setCheckoutId] = useState<string | null>(null);
  const [checkoutMetadata, setCheckoutMetadata] = useState<any>(null);

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

  const handleGenerateReport = async () => {
    try {
      setIsGenerating(true);
      const res = await initiateCRSReportCheckout({
        userId: user!.uid,
        reportType: "business",
        businessId,
      });

      if ("checkoutId" in res && res.checkoutId && "url" in res && res.url) {
        setCheckoutMetadata({
          reportType: "business",
          businessId,
          referenceNumber:
            "metadata" in res
              ? (res as any).metadata?.referenceNumber
              : undefined,
        });
        setCheckoutId(res.checkoutId);
      } else if ("success" in res && res.success) {
        toast.success(
          "Credit report generation has started. Please wait a few moments for the new data to appear.",
        );
      }
    } catch (error: any) {
      console.error("Failed to initiate CRS report checkout:", error);
      toast.error(
        error.message ||
          "Failed to generate credit report. Please contact support.",
      );
    } finally {
      setIsGenerating(false);
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

            <div className="flex items-center gap-3">
              <Button
                onClick={handleGenerateReport}
                disabled={isGenerating}
                className="hidden sm:flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-colors"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Pulling Credit Report...
                  </>
                ) : (
                  <>
                    <ReceiptIcon className="w-4 h-4" />
                    Pull Credit Report
                  </>
                )}
              </Button>

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
                  <DropdownMenuItem
                    className="sm:hidden cursor-pointer"
                    onSelect={(e) => {
                      e.preventDefault();
                      handleGenerateReport();
                    }}
                  >
                    <IconMenu
                      text={isGenerating ? "Pulling..." : "Pull Credit Report"}
                      icon={
                        isGenerating ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <ReceiptIcon className="h-4 w-4" />
                        )
                      }
                    />
                  </DropdownMenuItem>
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

      {/* Checkout Modal */}
      <Dialog
        open={!!checkoutId}
        onOpenChange={(open) => !open && setCheckoutId(null)}
      >
        <DialogContent
          className="w-[95vw] sm:max-w-[600px] md:max-w-[700px] p-0 overflow-hidden bg-transparent border-none shadow-none"
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogTitle className="sr-only">Complete Your Purchase</DialogTitle>
          {checkoutId && (
            <div className="bg-white rounded-xl shadow-2xl overflow-y-auto w-full max-h-[90vh] md:max-h-[85vh] relative">
              <button
                onClick={() => setCheckoutId(null)}
                className="absolute top-3 right-3 p-2 bg-gray-100 hover:bg-gray-200 rounded-full z-50 transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4 text-gray-600" />
              </button>
              <WhopCheckoutEmbed
                sessionId={checkoutId}
                prefill={{
                  email: user?.email || undefined,
                  address: {
                    country: "US",
                  },
                }}
                onComplete={async (planId, receiptId) => {
                  try {
                    const response = await fetch(
                      `/api/user/${user.uid}/crs/purchase`,
                      {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          planId,
                          receiptId,
                          checkoutId,
                          metadata: checkoutMetadata,
                        }),
                      },
                    );

                    if (!response.ok) {
                      throw new Error("Failed to trigger report generation");
                    }

                    toast.success(
                      "Payment successful! Generating your business credit report...",
                    );
                    setCheckoutId(null);
                    setCheckoutMetadata(null);
                  } catch (error) {
                    console.error(error);
                    toast.error(
                      "Payment succeeded but report generation failed. Please contact support.",
                    );
                    setCheckoutId(null);
                  }
                }}
                fallback={
                  <div className="flex items-center justify-center h-full min-h-[400px]">
                    <Spinner displayText="Loading secure checkout..." />
                  </div>
                }
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
