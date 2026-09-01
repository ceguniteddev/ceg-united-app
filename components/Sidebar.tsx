"use client";

import { sidebarLinks } from "@/constant/common";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Footer from "./Footer";
import { useAuth } from "@/provider/AuthContext";
import { useMembership } from "@/hooks/membership";
import { useAddons } from "@/hooks/addons";
import { useClientEntitlements } from "@/hooks/entitlements";
import { WhatsNewAccordion } from "./WhatsNewAccordion";
import { LockIcon } from "lucide-react";
import React, { useState } from "react";
import { useSystemConfig } from "@/hooks/system-config";
import { useUserPsfInvoicesQuery } from "@/hooks/psf-invoices";

// Pricing / Checkout imports
import { ResponsiveDialog } from "@/components/responsive-dialog";
import { PricingPlans } from "@/components/pricing-plans/PricingPlans";
import { AddonPlans } from "@/components/pricing-plans/AddonPlans";
import { MembershipCheckoutView } from "@/components/pricing-plans/MembershipCheckoutView";
import { AddonCheckoutView } from "@/components/pricing-plans/AddonCheckoutView";
// import { useFeeSettings } from "@/hooks/fee-settings";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  createMembershipCheckoutConfig,
  createAddonCheckoutConfig,
} from "@/service/dodo";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

const Sidebar = () => {
  const queryClient = useQueryClient();
  const { user, userData } = useAuth();
  const { data: membership } = useMembership(userData?.id);
  const { data: addons = [] } = useAddons();
  const { data: entitlements } = useClientEntitlements(userData?.id);
  const { data: invoices = [] } = useUserPsfInvoicesQuery(user?.uid || "");
  const pathname = usePathname();
  const router = useRouter();
  const { config: systemConfig } = useSystemConfig();

  const unpaidInvoicesCount = invoices.filter(
    (inv) => inv.status === "pending" || inv.status === "signed",
  ).length;
  // const { data: feeSettings } = useFeeSettings();

  // Pricing / Checkout state
  const [isPricingModalOpen, setPricingModalOpen] = useState(false);
  const [isAddonModalOpen, setAddonModalOpen] = useState(false);
  const [checkoutId, setCheckoutId] = useState<string | null>(null);
  const [isAddonCheckout, setIsAddonCheckout] = useState(false);
  const [isCheckoutSheetOpen, setCheckoutSheetOpen] = useState(false);
  const [isCreatingCheckout, setIsCreatingCheckout] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<{
    id: string;
    amount: number;
  } | null>(null);
  const [pendingAddons, setPendingAddons] = useState<string[]>([]);

  if (!user) return null;

  const handleSelectPlan = async (
    planId: string,
    amount: number,
    selectedAddons: string[] = [],
  ) => {
    if (!userData?.id) return;
    try {
      setIsCreatingCheckout(true);
      setPendingAddons(selectedAddons);
      const res = await createMembershipCheckoutConfig({
        userId: userData.id,
        planId: planId as any,
        selectedAddonIds: selectedAddons,
      });
      setCheckoutId(res.checkoutId);
      setSelectedPlan({ id: planId, amount });
      setIsAddonCheckout(false);
      setPricingModalOpen(false);
      setAddonModalOpen(false);
      setCheckoutSheetOpen(true);
    } catch (err: any) {
      toast.error("Failed to start checkout: " + err.message);
    } finally {
      setIsCreatingCheckout(false);
    }
  };

  const handleSelectAddon = async (addonId: string, amount: number) => {
    if (!userData?.id) return;
    try {
      setIsCreatingCheckout(true);
      const res = await createAddonCheckoutConfig({
        userId: userData.id,
        addonId: addonId as any,
      });
      setCheckoutId(res.checkoutId);
      setSelectedPlan({ id: addonId, amount });
      setIsAddonCheckout(true);
      setPricingModalOpen(false);
      setAddonModalOpen(false);
      setCheckoutSheetOpen(true);
    } catch (err: any) {
      toast.error("Failed to start checkout: " + err.message);
    } finally {
      setIsCreatingCheckout(false);
    }
  };

  return (
    <aside className="sidebar max-md:hidden">
      <nav className="flex flex-col">
        <Link
          href="/broker/home"
          className="mb-6 cursor-pointer flex items-center gap-2 xl:justify-center"
        >
          <Image
            src="/icon.png"
            alt="Logo"
            width={548}
            height={455}
            className="h-20 w-auto object-contain"
          />
          <h1 className="sidebar-logo xl:hidden">
            {process.env.NEXT_PUBLIC_APP_NAME as string}
          </h1>
        </Link>
        {sidebarLinks
          .filter((item) => {
            if (
              item.route === "/client/credit-repair" &&
              !systemConfig?.creditRepairEnabled
            ) {
              return false;
            }
            // if (
            //   item.route === "/client/my-learning" &&
            //   (!userData || membership?.status !== "active")
            // ) {
            //   return false;
            // }

            // if (
            //   item.route === "/client/credit-repair" &&
            //   (!userData || membership?.status !== "active")
            // ) {
            //   return false;
            // }

            if (item.route === "/client/letter-stream") {
              const hasAnyLetterFeature =
                userData?.letterFeatureEnabled ||
                userData?.latePaymentRemovalEnabled ||
                userData?.unauthorizedInquiryRemovalEnabled ||
                userData?.verifiedAccountDisputeEnabled ||
                userData?.noResponseFollowUpEnabled ||
                userData?.accountErrorCorrectionEnabled ||
                userData?.collectionAccountRemovalEnabled ||
                userData?.fraudulentAccountRemovalEnabled;

              if (!hasAnyLetterFeature) {
                return false;
              }
            }

            return true;
          })
          .map((item) => {
            const isActive =
              pathname === item.route || pathname.startsWith(`${item.route}/`);

            const hasActiveMembership =
              !!userData && membership?.status === "active";
            const hasCreditRepairAddon = addons.some(
              (addon) =>
                addon.addonId === "credit_module_pro" &&
                addon.status === "active",
            );
            const hasCreditRepairAccess =
              hasCreditRepairAddon || entitlements?.hasDisputeAccess === true;
            const isLocked =
              (!hasActiveMembership &&
                (item.route === "/client/my-analysis" ||
                  item.route === "/client/my-credit")) ||
              (item.route === "/client/credit-repair" &&
                !hasCreditRepairAccess);

            const content = (
              <>
                <div className="relative size-5 md:size-6 flex-shrink-0">
                  <Image
                    src={item.imgURL}
                    alt={item.label}
                    fill
                    sizes="24px"
                    className={cn({
                      "brightness-[3] invert-0": isActive,
                    })}
                  />
                </div>
                <div className="flex items-center justify-between flex-1 pr-2">
                  <div className="flex items-center gap-2">
                    <p
                      className={cn("text-16 font-semibold text-black-2", {
                        "!text-white": isActive,
                      })}
                    >
                      {item.label}
                    </p>
                    {item.route === "/client/my-invoices" &&
                      unpaidInvoicesCount > 0 && (
                        <span
                          className={cn(
                            "flex h-5 min-w-[20px] px-1 items-center justify-center rounded-full text-[11px] font-bold shadow-sm",
                            isActive
                              ? "bg-white text-brand-600"
                              : "bg-red-500 text-white",
                          )}
                        >
                          {unpaidInvoicesCount}
                        </span>
                      )}
                  </div>
                  {isLocked && (
                    <button
                      type="button"
                      title="This feature is locked. Please upgrade to access."
                      className="cursor-pointer hover:bg-gray-200/50 p-1 rounded-full transition-colors"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (item.route === "/client/credit-repair") {
                          setAddonModalOpen(true);
                        } else {
                          setPricingModalOpen(true);
                        }
                      }}
                    >
                      <LockIcon className="w-4 h-4 text-amber-500 opacity-80 hover:opacity-100 hover:text-amber-600" />
                    </button>
                  )}
                </div>
              </>
            );

            if (isLocked) {
              return (
                <div
                  key={item.label}
                  className={cn(
                    "flex gap-2 md:gap-3 items-center py-1 md:p-1 2xl:p-1 rounded-lg justify-start opacity-70 cursor-pointer",
                    { "bg-bank-gradient": isActive },
                  )}
                  onClick={() => {
                    if (item.route === "/client/credit-repair") {
                      setAddonModalOpen(true);
                    } else {
                      setPricingModalOpen(true);
                    }
                  }}
                >
                  {content}
                </div>
              );
            }

            return (
              <Link
                href={item.route}
                key={item.label}
                className={cn(
                  "flex gap-2 md:gap-3 items-center py-1 md:p-1 2xl:p-1 rounded-lg justify-start",
                  { "bg-bank-gradient": isActive },
                )}
              >
                {content}
              </Link>
            );
          })}
      </nav>
      <div className="flex flex-col">
        <WhatsNewAccordion />
        <Footer />
      </div>

      <ResponsiveDialog
        isOpen={isPricingModalOpen}
        setIsOpen={setPricingModalOpen}
        title="Upgrade to Access Feature"
        description=""
        className="sm:max-w-[90vw] md:max-w-6xl max-h-[90vh] overflow-y-auto p-0 border-0"
      >
        <PricingPlans
          isLoading={isCreatingCheckout}
          onSelectPlan={handleSelectPlan}
        />
      </ResponsiveDialog>

      <ResponsiveDialog
        isOpen={isAddonModalOpen}
        setIsOpen={setAddonModalOpen}
        title="Unlock Additional Modules"
        description=""
        className="sm:max-w-[90vw] md:max-w-5xl max-h-[90vh] overflow-y-auto p-0 border-0"
      >
        <AddonPlans
          isLoading={isCreatingCheckout}
          onSelectPlan={handleSelectAddon}
        />
      </ResponsiveDialog>

      <Sheet open={isCheckoutSheetOpen} onOpenChange={setCheckoutSheetOpen}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-2xl p-0 flex flex-col gap-0 overflow-hidden"
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
                    queryClient.invalidateQueries({ queryKey: ["membership"] });
                    queryClient.invalidateQueries({
                      queryKey: ["user", userData.id],
                    });
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
                    queryClient.invalidateQueries({ queryKey: ["membership"] });
                    queryClient.invalidateQueries({
                      queryKey: ["user", userData.id],
                    });
                    setCheckoutSheetOpen(false);
                    router.refresh();
                  }}
                />
              ))}
          </div>
        </SheetContent>
      </Sheet>
    </aside>
  );
};

export default Sidebar;
