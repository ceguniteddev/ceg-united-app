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
import { WhatsNewAccordion } from "./WhatsNewAccordion";
import { useGetUserApplyFunding } from "@/hooks/apply-funding";
import { LockIcon } from "lucide-react";
import React, { useState } from "react";

// Pricing / Checkout imports
import { ResponsiveDialog } from "@/components/responsive-dialog";
import { PricingPlans } from "@/components/pricing-plans/PricingPlans";
import { MembershipCheckoutView } from "@/components/pricing-plans/MembershipCheckoutView";
import {
  Sheet as PricingSheet,
  SheetContent as PricingSheetContent,
  SheetHeader as PricingSheetHeader,
  SheetTitle as PricingSheetTitle,
} from "@/components/ui/sheet";
import { createMembershipCheckoutConfig } from "@/service/whop";
import { toast } from "sonner";

const MobileNavClient = () => {
  const { user, userData } = useAuth();
  const { appliedFunding } = useGetUserApplyFunding();
  const pathname = usePathname();
  const router = useRouter();

  // Pricing / Checkout state
  const [isPricingModalOpen, setPricingModalOpen] = useState(false);
  const [checkoutId, setCheckoutId] = useState<string | null>(null);
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
      setPricingModalOpen(false);
      setCheckoutSheetOpen(true);
    } catch (err: any) {
      toast.error("Failed to start checkout: " + err.message);
    } finally {
      setIsCreatingCheckout(false);
    }
  };

  return (
    <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
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
                className="h-20 w-auto object-contain"
              />
            </Link>

            <nav className="flex-1 flex flex-col px-4 overflow-y-auto">
              {sidebarLinks
                .filter((item) => {
                  if (
                    item.route === "/client/my-learning" &&
                    (!userData || !userData.isPremiumClient)
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
                    (!userData || !userData.isPremiumClient) &&
                    (item.route === "/client/my-analysis" ||
                      item.route === "/client/my-credit");

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
                              setPricingModalOpen(true);
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
                        key={item.route}
                        className={cn(
                          "flex gap-3 items-center py-1 px-4 rounded-lg mb-2 opacity-70 cursor-pointer",
                          { "bg-bank-gradient": isActive },
                        )}
                        onClick={() => setPricingModalOpen(true)}
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
          className="h-20 w-auto object-contain"
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
            {checkoutId && selectedPlan && userData && (
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
            )}
          </div>
        </PricingSheetContent>
      </PricingSheet>
    </div>
  );
};

export default MobileNavClient;
