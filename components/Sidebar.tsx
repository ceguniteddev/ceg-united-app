"use client";

import { sidebarLinks } from "@/constant/common";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Footer from "./Footer";
import { useAuth } from "@/provider/AuthContext";
import { useGetUserApplyFunding } from "@/hooks/apply-funding";
import { useMembership } from "@/hooks/membership";
import { WhatsNewAccordion } from "./WhatsNewAccordion";
import { LockIcon } from "lucide-react";
import React, { useState } from "react";

// Pricing / Checkout imports
import { ResponsiveDialog } from "@/components/responsive-dialog";
import { PricingPlans } from "@/components/pricing-plans/PricingPlans";
import { AddonPlans } from "@/components/pricing-plans/AddonPlans";
import { MembershipCheckoutView } from "@/components/pricing-plans/MembershipCheckoutView";
import { AddonCheckoutView } from "@/components/pricing-plans/AddonCheckoutView";
import { useAddons } from "@/hooks/addons";
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
import { toast } from "sonner";

const Sidebar = () => {
  const { user, isOnboarded, userData } = useAuth();
  const { appliedFunding } = useGetUserApplyFunding();
  const { data: addons = [] } = useAddons();
  const { data: membership } = useMembership();
  const pathname = usePathname();
  const router = useRouter();

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

  if (!user) return null;

  const handleSelectPlan = async (planId: string, amount: number) => {
    if (!userData?.id) return;
    try {
      setIsCreatingCheckout(true);
      const res = await createMembershipCheckoutConfig({
        userId: userData.id,
        planId: planId as any,
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

            const isLocked =
              ((!userData || membership?.status !== "active") &&
                (item.route === "/client/my-analysis" ||
                  item.route === "/client/my-learning" ||
                  item.route === "/client/my-credit")) ||
              (item.route === "/client/credit-repair" &&
                !addons.some((a) => a.addonId === "credit_module_pro"));

            const content = (
              <>
                <div className="relative size-5 md:size-6 flex-shrink-0">
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
                      "!text-white": isActive,
                    })}
                  >
                    {item.label}
                  </p>
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
                      <LockIcon className="w-4 h-4 text-gray-500 opacity-80 hover:opacity-100 hover:text-blue-500" />
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
                  onPaymentCompleteAction={() => {
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
