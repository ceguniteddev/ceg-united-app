"use client";

import { sidebarLinks } from "@/constant/common";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Footer from "./Footer";
// import PlaidLink from "./PlaidLink";
import { useAuth } from "@/provider/AuthContext";
import { useGetUserApplyFunding } from "@/hooks/apply-funding";
// import PlaidIncomeLinkBank from "./PlaidLinkIncomeBank";
// import PlaidIncomeLinkPayroll from "./PlaidLinkIncomePayroll";
// import { useEffect } from "react";

// import { driver } from "driver.js";
// import { useUpdateUserOnboardingMutation } from "@/hooks/user";
import { WhatsNewAccordion } from "./WhatsNewAccordion";
// import { isPlaidProductionReady } from "@/lib/plaid";
import { LockIcon } from "lucide-react";
// import { useGetDenefitsContractsByUserId } from "@/hooks/denefits";
// import { useEffect, useState } from "react";

const Sidebar = () => {
  const { user, isOnboarded, userData } = useAuth();
  const { appliedFunding } = useGetUserApplyFunding();
  const pathname = usePathname();
  // const { updateOnboarding } = useUpdateUserOnboardingMutation();
  // useEffect(() => {
  //   const driverObj = driver({
  //     // onCloseClick: () => console.log("onCloseClick"),
  //     onDestroyed: async () => await updateOnboarding(),
  //     steps: [
  //       {
  //         element: "#plaid-link-button",
  //         popover: {
  //           title: "Link your bank account",
  //           description: "Link your bank account to get started.",
  //         },
  //       },
  //       {
  //         element: "#plaid-link-income-bank-button",
  //         popover: {
  //           title: "Verify your bank income",
  //           description: "Verify your bank income to get started.",
  //         },
  //       },
  //       {
  //         element: "#plaid-link-income-payroll-button",
  //         popover: {
  //           title: "Verify your payroll income",
  //           description: "Verify your payroll income to get started.",
  //         },
  //       },
  //     ],
  //   });

  // const { denefitsContract, isLoading } = useGetDenefitsContractsByUserId(
  //   user?.uid || ""
  // );

  //   if (user && !isOnboarded) driverObj.drive();
  // }, [user, isOnboarded, updateOnboarding]);
  // const isPlaidProdReady = isPlaidProductionReady();
  if (!user) return null;

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
            // Income Funding logic
            // const hasIncomeBasedFunding = appliedFunding?.some((app) =>
            //   app.fundingProducts?.includes("Business Income Based Funding"),
            // );

            // if (item.route === "/client/my-funding" && hasIncomeBasedFunding) {
            //   return false; // Hide generic map if they have income funding
            // }

            // if (
            //   item.route === "/client/income-funding" &&
            //   !hasIncomeBasedFunding
            // ) {
            //   return false; // Hide income funding if they don't have it
            // }

            // If Plaid is not ready, filter out (remove) the "My Accounts" link
            // if (!isPlaidProdReady && item.route === "/client/my-accounts") {
            //   return false;
            // }

            // If user hasn't paid denefits contract, filter out "My Learning" link
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

            // Otherwise, keep the item in the array
            return true;
          })
          .map((item) => {
            const isActive =
              pathname === item.route || pathname.startsWith(`${item.route}/`);

            const isLocked =
              (!userData || !userData.isPremiumClient) &&
              (item.route === "/client/my-analysis" ||
                item.route === "/client/my-credit");

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
                      className="cursor-pointer hover:bg-gray-200/50 p-1 rounded-full transition-colors"
                      onClick={(e) => {
                        e.preventDefault();
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
                  key={item.label}
                  className={cn(
                    "flex gap-2 md:gap-3 items-center py-1 md:p-1 2xl:p-1 rounded-lg justify-start opacity-70",
                    { "bg-bank-gradient": isActive },
                  )}
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
    </aside>
  );
};

export default Sidebar;
