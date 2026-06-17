"use client";
import React, { useState } from "react";
import { CheckCircle2, XCircle, ShieldCheck, LockIcon } from "lucide-react";
import { Business, CompatibilityFactor } from "@/schema";
import { useAuth } from "@/provider/AuthContext";
import { useMembership } from "@/hooks/membership";
import { Button } from "@/components/ui/button";
import { ResponsiveDialog } from "@/components/responsive-dialog";
import { PricingPlans } from "@/components/pricing-plans/PricingPlans";
import { MembershipCheckoutView } from "@/components/pricing-plans/MembershipCheckoutView";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  createMembershipCheckoutConfig,
  createAddonCheckoutConfig,
} from "@/service/whop";
import { useFeeSettings } from "@/hooks/fee-settings";
import { AddonCheckoutView } from "@/components/pricing-plans/AddonCheckoutView";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import IconMenu from "@/components/icon-menu";

interface Props {
  business: Business;
  factors?: CompatibilityFactor[];
}

export function FundabilityAuditTab({ business, factors = [] }: Props) {
  const { userData } = useAuth();
  const { data: userMembership } = useMembership(userData?.id);
  const { data: feeSettings } = useFeeSettings();
  const router = useRouter();

  // Pricing / Checkout state
  const [isPricingModalOpen, setPricingModalOpen] = useState(false);
  const [checkoutId, setCheckoutId] = useState<string | null>(null);
  const [isAddonCheckout, setIsAddonCheckout] = useState(false);
  const [isCheckoutSheetOpen, setCheckoutSheetOpen] = useState(false);
  const [isCreatingCheckout, setIsCreatingCheckout] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<{
    id: string;
    amount: number;
  } | null>(null);
  const [pendingAddons, setPendingAddons] = useState<string[]>([]);

  const handleSelectPlan = async (
    planId: string,
    amount: number,
    selectedAddons: string[] = [],
  ) => {
    if (!userData?.id) return;
    try {
      setIsCreatingCheckout(true);
      setPendingAddons(selectedAddons);
      setIsAddonCheckout(false);
      const res = await createMembershipCheckoutConfig({
        userId: userData.id,
        planId: planId as any,
        selectedAddonIds: selectedAddons,
      });
      setCheckoutId(res.checkoutId);
      setSelectedPlan({ id: planId, amount });
      setPricingModalOpen(false);
      setCheckoutSheetOpen(true);
    } catch (err: any) {
      toast.error("Failed to start checkout: " + err.message);
    } finally {
      setIsCreatingCheckout(false);
    }
  };

  const verificationItems = [
    {
      label: "EIN",
      value: business.employerIdentificationNumber || "—",
      met: !!business.employerIdentificationNumber,
    },
    {
      label: "Business Name",
      value: business.businessName || "—",
      met: !!business.businessName,
    },
    {
      label: "State",
      value: business.businessStateAddress || "—",
      met: !!business.businessStateAddress,
    },
    {
      label: "Email",
      value: business.businessEmail || "—",
      met: !!business.businessEmail,
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Business Verification Checklist */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-blue-600" />
          Business Verification
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {verificationItems.map((item) => (
            <div
              key={item.label}
              className="flex items-center gap-2.5 p-3 bg-gray-50 rounded-lg"
            >
              {item.met ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              ) : (
                <XCircle className="w-4 h-4 text-gray-300 flex-shrink-0" />
              )}
              <div className="min-w-0">
                <p className="text-[10px] text-gray-400 uppercase tracking-wider">
                  {item.label}
                </p>
                <p className="text-sm font-medium text-gray-900 break-all">
                  {item.value}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lender Compatibility Factors */}
      {factors.length > 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-base font-bold text-gray-900 mb-4">
            Lender Compatibility Factors
          </h3>
          <div className="space-y-3">
            {factors.map((f) => (
              <div
                key={f.id}
                className="flex items-center gap-3 py-2.5 px-3 rounded-lg hover:bg-gray-50 transition-colors min-h-[44px]"
              >
                {f.met ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">
                    {f.label}
                  </p>
                  <p className="text-xs text-gray-500">{f.detail}</p>
                </div>

                <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      f.met
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-red-100 text-red-600"
                    }`}
                  >
                    {f.met ? "Meets" : "Below"}
                  </span>
                  {!f.met && userMembership?.status !== "active" && (
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => setPricingModalOpen(true)}
                      className="group relative overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold cursor-pointer transition-all border-none shadow-sm hover:shadow-md h-7 px-2.5 text-[10px]"
                    >
                      <span className="absolute inset-0 bg-white/20 group-hover:translate-x-full transition-transform duration-700 ease-out -skew-x-12 -translate-x-full" />
                      <IconMenu
                        icon={
                          <LockIcon className="h-3 w-3 transition-all group-hover:scale-110" />
                        }
                        text="Upgrade"
                        className="gap-1.5"
                      />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 text-center text-gray-400">
          <ShieldCheck className="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p className="text-sm">
            Lender compatibility analysis not yet available.
          </p>
        </div>
      )}

      {/* Pricing Modals */}
      <ResponsiveDialog
        isOpen={isPricingModalOpen}
        setIsOpen={setPricingModalOpen}
        title="Upgrade to Resolve Factors"
        description=""
        className="sm:max-w-[90vw] md:max-w-6xl max-h-[90vh] overflow-y-auto p-0 border-0 z-[100]"
      >
        <PricingPlans
          isLoading={isCreatingCheckout}
          onSelectPlan={handleSelectPlan}
        />
      </ResponsiveDialog>

      <Sheet open={isCheckoutSheetOpen} onOpenChange={setCheckoutSheetOpen}>
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
            {checkoutId &&
              selectedPlan &&
              userData &&
              (isAddonCheckout ? (
                <AddonCheckoutView
                  checkoutId={checkoutId}
                  userId={userData.id!}
                  addonId={selectedPlan.id}
                  amount={selectedPlan.amount}
                  prefillEmail={userData.email || ""}
                  onPaymentCompleteAction={() => {
                    setCheckoutSheetOpen(false);
                    router.refresh();
                  }}
                />
              ) : (
                <MembershipCheckoutView
                  checkoutId={checkoutId}
                  userId={userData.id!}
                  tierId={selectedPlan.id}
                  amount={selectedPlan.amount}
                  prefillEmail={userData.email || ""}
                  pendingAddons={pendingAddons}
                  membershipAmount={selectedPlan?.amount ?? 0}
                  onPaymentCompleteAction={() => {
                    // Checkout is now 1-step, just close the modal
                    setCheckoutSheetOpen(false);
                    router.refresh();
                  }}
                />
              ))}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
