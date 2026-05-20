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
import { usePathname } from "next/navigation";
import Footer from "./Footer";
import { useAuth } from "@/provider/AuthContext";
import { WhatsNewAccordion } from "./WhatsNewAccordion";
import { isPlaidProductionReady } from "@/lib/plaid";
import { useGetUserApplyFunding } from "@/hooks/apply-funding";
import { LockIcon } from "lucide-react";
// import { useGetDenefitsContractsByUserId } from "@/hooks/denefits";

const MobileNavClient = () => {
  const { user, userData } = useAuth();
  const { appliedFunding } = useGetUserApplyFunding();
  const pathname = usePathname();
  // const { denefitsContract } = useGetDenefitsContractsByUserId(user?.uid || "");
  const isPlaidProdReady = isPlaidProductionReady();

  if (!user) return null;

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
                  // Income Funding logic
                  const hasIncomeBasedFunding = appliedFunding?.some((app) =>
                    app.fundingProducts?.includes(
                      "Business Income Based Funding",
                    ),
                  );

                  if (
                    item.route === "/client/my-funding" &&
                    hasIncomeBasedFunding
                  ) {
                    return false; // Hide generic map if they have income funding
                  }

                  if (
                    item.route === "/client/income-funding" &&
                    !hasIncomeBasedFunding
                  ) {
                    return false; // Hide income funding if they don't have it
                  }

                  if (
                    !isPlaidProdReady &&
                    item.route === "/client/my-accounts"
                  ) {
                    return false;
                  }
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
                              // TODO: Route to payment screen
                              console.log("Route to payment screen");
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
                          "flex gap-3 items-center py-1 px-4 rounded-lg mb-2 opacity-70",
                          { "bg-bank-gradient": isActive },
                        )}
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
    </div>
  );
};

export default MobileNavClient;
