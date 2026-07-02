"use client";
import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useUserQuery } from "@/hooks/user";
import { GET_USER } from "@/constant/react-query-keys";
import {
  ArrowLeft,
  MoreHorizontal,
  PencilIcon,
  Trash2,
  ReceiptIcon,
  Loader2,
  X,
  LockIcon,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/provider/AuthContext";
import Spinner from "@/components/Spinner";
import {
  useBusinessByIdQuery,
  useBusinessAuditQuery,
  useBusinessMutation,
} from "@/hooks/business";
import { BusinessTabs, BusinessTab } from "./BusinessTabs";
import { OverviewTab } from "./tabs/OverviewTab";
import { CreditReportTab } from "./tabs/CreditReportTab";
import { FinanceAuditTab } from "./tabs/FinanceAuditTab";
import { TradelineSuggestionsTab } from "./tabs/TradelineSuggestionsTab";
import { FundabilityAuditTab } from "./tabs/FundabilityAuditTab";
import { ConfirmButton } from "@/components/Confirmation";
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
import { useFeeSettings } from "@/hooks/fee-settings";

import { useMembership } from "@/hooks/membership";
import { checkFreePullEligibility } from "@/lib/crs-eligibility";

// Pricing / Checkout imports
import { PricingPlans } from "@/components/pricing-plans/PricingPlans";
import { MembershipCheckoutView } from "@/components/pricing-plans/MembershipCheckoutView";
import { AddonCheckoutView } from "@/components/pricing-plans/AddonCheckoutView";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { createMembershipCheckoutConfig } from "@/service/whop";

interface BusinessDetailViewProps {
  targetUserId: string;
  businessId: string;
  isAdminView?: boolean;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function BusinessDetailView({
  targetUserId,
  businessId,
  isAdminView = false,
}: BusinessDetailViewProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { userData: clientUserData } = useUserQuery(targetUserId);
  const activeUserData = clientUserData;
  const { business, isLoading } = useBusinessByIdQuery(
    targetUserId,
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
  } = useBusinessAuditQuery(targetUserId, businessId);
  const { deleteBusiness, isDeleting } = useBusinessMutation();

  const [activeTab, setActiveTab] = useState<BusinessTab>("overview");
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [editingBusiness, setEditingBusiness] = useState<Business | null>(null);

  // CRS Report Checkout State
  const [isGenerating, setIsGenerating] = useState(false);
  const [crsCheckoutId, setCrsCheckoutId] = useState<string | null>(null);
  const [checkoutMetadata, setCheckoutMetadata] = useState<any>(null);

  // Membership Checkout State
  const [isPricingModalOpen, setPricingModalOpen] = useState(false);
  const [membershipCheckoutId, setMembershipCheckoutId] = useState<
    string | null
  >(null);
  const [isMembershipSheetOpen, setMembershipSheetOpen] = useState(false);
  const [isCreatingCheckout, setIsCreatingCheckout] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<{
    id: string;
    amount: number;
  } | null>(null);
  const [isAddonCheckout, setIsAddonCheckout] = useState(false);
  const [pendingAddons, setPendingAddons] = useState<string[]>([]);

  const { data: feeSettings } = useFeeSettings();
  const reportFee = feeSettings?.businessCreditReportFee || 0;

  const { data: userMembership } = useMembership(targetUserId);
  const isPremium = userMembership?.status === "active";

  const isEligibleForFreePull = useMemo(() => {
    return checkFreePullEligibility(
      userMembership,
      activeUserData?.lastFreeBusinessPullAt,
    );
  }, [userMembership, activeUserData?.lastFreeBusinessPullAt]);

  if (!user || isLoading) {
    return <Spinner displayText="Loading business…" />;
  }

  const backUrl = isAdminView
    ? `/admin/clients/${targetUserId}?tab=business`
    : "/client/my-business";

  if (!business) {
    return (
      <section className="home">
        <div className="home-content flex flex-col items-center justify-center py-24">
          <p className="text-lg font-semibold text-gray-700 mb-2">
            Business not found
          </p>
          <Link
            href={backUrl}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            ← {isAdminView ? "Back to Client Profile" : "Back to My Businesses"}
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
      queryClient.invalidateQueries({
        queryKey: ["GET_BUSINESS_DETAILS", targetUserId],
      });
      setIsDeleteOpen(false);
      router.push(backUrl);
    } catch (error) {
      console.error("Failed to delete business:", error);
    }
  };

  const handleGenerateReport = async () => {
    try {
      setIsGenerating(true);
      const res = await initiateCRSReportCheckout({
        userId: targetUserId,
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
        setCrsCheckoutId(res.checkoutId);
        setIsConfirmOpen(false);
      } else if ("success" in res && res.success) {
        toast.success(
          "Credit report generation has started. Please wait a few moments for the new data to appear.",
        );
        queryClient.invalidateQueries({ queryKey: [GET_USER, targetUserId] });
        queryClient.invalidateQueries({
          queryKey: ["GET_BUSINESS_BY_ID", targetUserId, businessId],
        });
        queryClient.invalidateQueries({
          queryKey: ["GET_BUSINESS_AUDIT", targetUserId, businessId],
        });
        setIsConfirmOpen(false);
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

  const handleSelectPlan = async (
    planId: string,
    amount: number,
    selectedAddons: string[] = [],
  ) => {
    if (!activeUserData?.id) return;
    try {
      setIsCreatingCheckout(true);
      setPendingAddons(selectedAddons);
      setIsAddonCheckout(false);
      const res = await createMembershipCheckoutConfig({
        userId: activeUserData.id,
        planId: planId as any,
        selectedAddonIds: selectedAddons,
      });
      setMembershipCheckoutId(res.checkoutId);
      setSelectedPlan({ id: planId, amount });
      setPricingModalOpen(false);
      setMembershipSheetOpen(true);
    } catch (err: any) {
      toast.error("Failed to start checkout: " + err.message);
    } finally {
      setIsCreatingCheckout(false);
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
        return (
          <TradelineSuggestionsTab
            isPremium={isPremium}
            onUpgradeClick={() => {
              if (isAdminView) {
                toast.info("Pricing actions are disabled in Admin view.");
              } else {
                setPricingModalOpen(true);
              }
            }}
          />
        );
      case "fundability-audit":
        return (
          <FundabilityAuditTab
            business={business}
            factors={compatibilityFactors}
            userId={targetUserId}
            isAdminView={isAdminView}
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
          href={backUrl}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-blue-600 transition-colors mb-5"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>
            {isAdminView ? "Back to Client Profile" : "Back to My Businesses"}
          </span>
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
              <div className="hidden sm:flex items-center gap-3">
                {isPremium ? (
                  <Button
                    onClick={() => setIsConfirmOpen(true)}
                    disabled={isGenerating}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg shadow-sm transition-colors cursor-pointer"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Pulling Credit Report...
                      </>
                    ) : isEligibleForFreePull ? (
                      <>
                        <Sparkles className="w-4 h-4 text-yellow-300" />
                        Pull Credit Report (Free)
                      </>
                    ) : (
                      <>
                        <ReceiptIcon className="w-4 h-4" />
                        Pull Credit Report
                      </>
                    )}
                  </Button>
                ) : isAdminView ? (
                  <Button
                    type="button"
                    disabled
                    className="flex items-center gap-1.5 bg-gray-100 text-gray-400 text-xs sm:text-sm px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg font-bold border-none shadow-none cursor-not-allowed"
                  >
                    <LockIcon className="h-4 w-4" />
                    <span>Upgrade required to pull Business Credit</span>
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={() => setPricingModalOpen(true)}
                    className="flex items-center gap-1.5 sm:gap-2 group relative overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs sm:text-sm px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg font-bold cursor-pointer transition-all border-none shadow-md hover:shadow-lg"
                  >
                    <span className="absolute inset-0 bg-white/20 group-hover:translate-x-full transition-transform duration-700 ease-out -skew-x-12 -translate-x-full" />
                    <IconMenu
                      icon={
                        <LockIcon className="h-4 w-4 transition-all group-hover:scale-110" />
                      }
                      text="Upgrade to pull Business Credit"
                    />
                  </Button>
                )}
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

          {/* Mobile-only action button */}
          <div className="sm:hidden mt-4 w-full">
            {isPremium ? (
              <Button
                onClick={() => setIsConfirmOpen(true)}
                disabled={isGenerating}
                className="w-full justify-center flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm py-2.5 rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Pulling Credit Report...
                  </>
                ) : isEligibleForFreePull ? (
                  <>
                    <Sparkles className="w-4 h-4 text-yellow-300" />
                    Pull Credit Report (Free)
                  </>
                ) : (
                  <>
                    <ReceiptIcon className="w-4 h-4" />
                    Pull Credit Report
                  </>
                )}
              </Button>
            ) : isAdminView ? (
              <Button
                type="button"
                disabled
                className="w-full justify-center flex items-center gap-1.5 bg-gray-100 text-gray-400 text-sm py-2.5 rounded-lg font-bold border-none shadow-none cursor-not-allowed"
              >
                <LockIcon className="h-4 w-4" />
                <span>Upgrade required to pull Business Credit</span>
              </Button>
            ) : (
              <Button
                type="button"
                onClick={() => setPricingModalOpen(true)}
                className="w-full justify-center flex items-center gap-1.5 group relative overflow-hidden bg-gradient-to-br from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm py-2.5 rounded-lg font-bold cursor-pointer transition-all border-none shadow-md hover:shadow-lg"
              >
                <span className="absolute inset-0 bg-white/20 group-hover:translate-x-full transition-transform duration-700 ease-out -skew-x-12 -translate-x-full" />
                <IconMenu
                  icon={
                    <LockIcon className="h-4 w-4 transition-all group-hover:scale-110" />
                  }
                  text="Upgrade to pull Business Credit"
                />
              </Button>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <BusinessTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          isPremium={isPremium}
        />

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
            userId={targetUserId}
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

      {/* Pull CRS Report Modal */}
      <ConfirmButton
        open={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        showTrigger={false}
        onConfirm={handleGenerateReport}
        isLoading={isGenerating}
        description={
          isEligibleForFreePull ? (
            <div className="bg-blue-50 text-blue-800 border-blue-100 p-4 rounded-lg border space-y-3 mt-4 text-sm">
              <div className="flex items-center gap-2 font-semibold">
                <Sparkles className="w-5 h-5 text-blue-600" />
                Monthly Free Benefit Available
              </div>
              <p>
                As an active{" "}
                {userMembership?.tier
                  ? userMembership.tier
                      .replace("tier_", "")
                      .charAt(0)
                      .toUpperCase() +
                    userMembership.tier.replace("tier_", "").slice(1)
                  : "Premium"}{" "}
                member, they are eligible for 1 free business credit report pull
                every calendar month.
              </p>
              <p>
                They have not used their free business pull for this month yet.
                Pulling a new credit report now will use this monthly benefit
                and will be completely free of charge.
              </p>
            </div>
          ) : (
            <div className="space-y-3 mt-2 text-sm text-gray-600">
              <p>
                Pulling a new business credit report requires a one-time fee.
              </p>
              <ul className="list-disc pl-5 font-medium text-gray-800">
                <li>Fee ${reportFee.toFixed(2)}.</li>
              </ul>
              <p>
                {isAdminView
                  ? "Admin payment processing is not supported here."
                  : "You will be redirected to our secure payment portal to complete your purchase before the report is generated."}
              </p>
            </div>
          )
        }
        confirmLabel={
          isEligibleForFreePull
            ? "Pull Credit Report for Free"
            : isAdminView
              ? "Close"
              : "Proceed to Payment"
        }
        classNameAction={
          isEligibleForFreePull
            ? "bg-blue-600 hover:bg-blue-700 text-white"
            : isAdminView
              ? "bg-gray-100 text-gray-800 hover:bg-gray-200"
              : "bg-blue-600 hover:bg-blue-700 text-white"
        }
        title={
          isEligibleForFreePull
            ? "Free Credit Report Pull"
            : "Pull New Credit Report"
        }
      />

      {/* Membership Pricing Modal */}
      {!isAdminView && (
        <ResponsiveDialog
          isOpen={isPricingModalOpen}
          setIsOpen={setPricingModalOpen}
          title="Upgrade to Access Feature"
          description=""
          className="sm:max-w-[90vw] md:max-w-6xl max-h-[90vh] overflow-y-auto p-0 border-0 z-[100]"
        >
          <PricingPlans
            isLoading={isCreatingCheckout}
            onSelectPlan={handleSelectPlan}
          />
        </ResponsiveDialog>
      )}

      {/* Membership Checkout Sheet */}
      {!isAdminView && (
        <Sheet
          open={isMembershipSheetOpen}
          onOpenChange={setMembershipSheetOpen}
        >
          <SheetContent
            side="right"
            className="w-full sm:max-w-2xl p-0 flex flex-col gap-0 overflow-hidden z-[100]"
          >
            <SheetHeader className="px-6 py-4 border-b border-gray-200">
              <SheetTitle className="text-xl font-bold">
                Secure Checkout
              </SheetTitle>
            </SheetHeader>
            <div className="flex-1 overflow-y-auto">
              {membershipCheckoutId &&
                selectedPlan &&
                activeUserData &&
                (isAddonCheckout ? (
                  <AddonCheckoutView
                    checkoutId={membershipCheckoutId}
                    userId={activeUserData.id!}
                    addonId={selectedPlan.id}
                    amount={selectedPlan.amount}
                    prefillEmail={activeUserData.email || ""}
                    onPaymentCompleteAction={() => {
                      setMembershipSheetOpen(false);
                      router.refresh();
                    }}
                  />
                ) : (
                  <MembershipCheckoutView
                    checkoutId={membershipCheckoutId}
                    userId={activeUserData.id!}
                    tierId={selectedPlan.id}
                    amount={selectedPlan.amount}
                    prefillEmail={activeUserData.email || ""}
                    pendingAddons={pendingAddons}
                    membershipAmount={selectedPlan?.amount ?? 0}
                    onPaymentCompleteAction={() => {
                      setMembershipSheetOpen(false);
                      router.refresh();
                    }}
                  />
                ))}
            </div>
          </SheetContent>
        </Sheet>
      )}

      {/* One-time CRS Report Checkout Modal */}
      {!isAdminView && (
        <Dialog
          open={!!crsCheckoutId}
          onOpenChange={(open) => !open && setCrsCheckoutId(null)}
        >
          <DialogContent
            className="w-[95vw] sm:max-w-[600px] md:max-w-[700px] p-0 overflow-hidden bg-transparent border-none shadow-none"
            onInteractOutside={(e) => e.preventDefault()}
          >
            <DialogTitle className="sr-only">
              Complete Your Purchase
            </DialogTitle>
            {crsCheckoutId && (
              <div className="bg-white rounded-xl shadow-2xl overflow-y-auto w-full max-h-[90vh] md:max-h-[85vh] relative">
                <button
                  onClick={() => setCrsCheckoutId(null)}
                  className="absolute top-3 right-3 p-2 bg-gray-100 hover:bg-gray-200 rounded-full z-50 transition-colors"
                  aria-label="Close"
                >
                  <X className="w-4 h-4 text-gray-600" />
                </button>
                <WhopCheckoutEmbed
                  sessionId={crsCheckoutId}
                  prefill={{
                    email: activeUserData?.email || undefined,
                    address: {
                      country: "US",
                    },
                  }}
                  onComplete={async (planId, receiptId) => {
                    try {
                      const response = await fetch(
                        `/api/user/${targetUserId}/crs/purchase`,
                        {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            planId,
                            receiptId,
                            checkoutId: crsCheckoutId,
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
                      queryClient.invalidateQueries({
                        queryKey: [GET_USER, targetUserId],
                      });
                      queryClient.invalidateQueries({
                        queryKey: [
                          "GET_BUSINESS_BY_ID",
                          targetUserId,
                          businessId,
                        ],
                      });
                      queryClient.invalidateQueries({
                        queryKey: [
                          "GET_BUSINESS_AUDIT",
                          targetUserId,
                          businessId,
                        ],
                      });
                      setCrsCheckoutId(null);
                      setCheckoutMetadata(null);
                    } catch (error) {
                      console.error(error);
                      toast.error(
                        "Payment succeeded but report generation failed. Please contact support.",
                      );
                      setCrsCheckoutId(null);
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
      )}
    </section>
  );
}
