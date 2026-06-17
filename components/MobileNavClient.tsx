"use client";

import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { VisuallyHidden } from "@/components/ui/visually-hidden";
import { sidebarLinks } from "@/constant/common";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Footer from "./Footer";
import { useAuth } from "@/provider/AuthContext";
import { useMembership } from "@/hooks/membership";
import { WhatsNewAccordion } from "./WhatsNewAccordion";
// import { useGetUserApplyFunding } from "@/hooks/apply-funding";
import { LockIcon } from "lucide-react";
import React, { useState } from "react";
import { useSystemConfig } from "@/hooks/system-config";

// Pricing / Checkout imports
import { ResponsiveDialog } from "@/components/responsive-dialog";
import { PricingPlans } from "@/components/pricing-plans/PricingPlans";
import { AddonPlans } from "@/components/pricing-plans/AddonPlans";
import { MembershipCheckoutView } from "@/components/pricing-plans/MembershipCheckoutView";
import { AddonCheckoutView } from "@/components/pricing-plans/AddonCheckoutView";
import { useAddons } from "@/hooks/addons";
// import { useFeeSettings } from "@/hooks/fee-settings";
import {
  Sheet as PricingSheet,
  SheetContent as PricingSheetContent,
  SheetHeader as PricingSheetHeader,
  SheetTitle as PricingSheetTitle,
} from "@/components/ui/sheet";
import {
  createMembershipCheckoutConfig,
  createAddonCheckoutConfig,
} from "@/service/whop";
import { toast } from "sonner";

const MobileNavClient = () => {
  const { user, userData } = useAuth();
  // const { appliedFunding } = useGetUserApplyFunding();
  const { data: addons = [] } = useAddons();
  const { data: membership } = useMembership(userData?.id);
  // const { data: feeSettings } = useFeeSettings();
  const pathname = usePathname();
  const router = useRouter();
  const { config: systemConfig } = useSystemConfig();

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
    <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between ">
      <Sheet>
        <SheetTrigger>
          <Image
            src="/icons/hamburger.svg"
            width={30}
            height={30}
            alt="menu"
            className="cursor-pointer"
          />
        </SheetTrigger>
        <SheetContent
          side="left"
          className="border-none bg-white w-[280px] p-0"
        >
          <VisuallyHidden>
            <SheetTitle>Client Navigation Menu</SheetTitle>
          </VisuallyHidden>
          <div className="flex flex-col h-full">
            <Link
              href="/client/home"
              className="cursor-pointer flex items-center justify-center py-6"
            >
              <Image
                src="/icon.png"
                alt="Logo"
                width={548}
                height={455}
                className="h-14 w-auto object-contain"
              />
            </Link>

            <nav className="flex-1 flex flex-col px-4 overflow-y-auto">
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

                  if (
                    item.route === "/client/credit-repair" &&
                    (!userData || membership?.status !== "active")
                  ) {
                    return false;
                  }

                  // Filter out "Letter Stream" if user has no letter features enabled
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
                    pathname === item.route ||
                    pathname.startsWith(`${item.route}/`);

                  const isLocked =
                    ((!userData || membership?.status !== "active") &&
                      (item.route === "/client/my-analysis" ||
                        item.route === "/client/my-learning" ||
                        item.route === "/client/my-credit")) ||
                    (item.route === "/client/credit-repair" &&
                      !addons.some((a) => a.addonId === "credit_module_pro"));

                  const content = (
                    <>
                      <div className="relative size-6 flex-shrink-0">
                        <Image
                          src={item.imgURL}
                          alt={item.label}
                          fill
                          className={cn({
                            "brightness-[3] invert-0": isActive,
                          })}
                        />
                      </div>
                      <div className="flex items-center justify-between flex-1 pr-2">
                        <p
                          className={cn("text-16 font-semibold text-black-2", {
                            "text-white": isActive,
                          })}
                        >
                          {item.label}
                        </p>
                        {isLocked && (
                          <button
                            type="button"
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
                        key={item.route}
                        className={cn(
                          "flex gap-3 items-center py-1 px-4 rounded-lg mb-2 opacity-70 cursor-pointer",
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
                    <SheetClose asChild key={item.route}>
                      <Link
                        href={item.route}
                        className={cn(
                          "flex gap-3 items-center py-1 px-4 rounded-lg mb-2",
                          { "bg-bank-gradient": isActive },
                        )}
                      >
                        {content}
                      </Link>
                    </SheetClose>
                  );
                })}
            </nav>

            <div className="flex flex-col px-4">
              <WhatsNewAccordion />
              <Footer type="mobile" />
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <Link href="/client/home" className="flex items-center">
        <Image
          src="/icon.png"
          alt="Logo"
          width={548}
          height={455}
          className="h-14 w-auto object-contain"
        />
      </Link>

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

      <ResponsiveDialog
        isOpen={isAddonModalOpen}
        setIsOpen={setAddonModalOpen}
        title="Unlock Additional Modules"
        description=""
        className="sm:max-w-[90vw] md:max-w-5xl max-h-[90vh] overflow-y-auto p-0 border-0 z-[100]"
      >
        <AddonPlans
          isLoading={isCreatingCheckout}
          onSelectPlan={handleSelectAddon}
        />
      </ResponsiveDialog>

      <PricingSheet
        open={isCheckoutSheetOpen}
        onOpenChange={setCheckoutSheetOpen}
      >
        <PricingSheetContent
          side="right"
          className="w-full sm:max-w-2xl p-0 flex flex-col gap-0 overflow-hidden z-[100]"
        >
          <PricingSheetHeader className="px-6 py-4 border-b border-gray-200">
            <PricingSheetTitle className="text-xl font-bold">
              Secure Checkout
            </PricingSheetTitle>
          </PricingSheetHeader>
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
        </PricingSheetContent>
      </PricingSheet>
    </div>
  );
};

export default MobileNavClient;
