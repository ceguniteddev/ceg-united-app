"use client";

import { sidebarLinks } from "@/constant/common";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Footer from "./Footer";
// import PlaidLink from "./PlaidLink";
import { useAuth } from "@/provider/AuthContext";
// import PlaidIncomeLinkBank from "./PlaidLinkIncomeBank";
// import PlaidIncomeLinkPayroll from "./PlaidLinkIncomePayroll";
// import { useEffect } from "react";

import { driver } from "driver.js";
import { useUpdateUserOnboardingMutation } from "@/hooks/user";
import { WhatsNewAccordion } from "./WhatsNewAccordion";
import { isPlaidProductionReady } from "@/lib/plaid";
import { useGetDenefitsContractsByUserId } from "@/hooks/denefits";
import { useEffect, useState } from "react";

const Sidebar = () => {
  const { user, isOnboarded, userData } = useAuth();
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

  const { denefitsContract, isLoading } = useGetDenefitsContractsByUserId(
    user?.uid || ""
  );

  //   if (user && !isOnboarded) driverObj.drive();
  // }, [user, isOnboarded, updateOnboarding]);
  const isPlaidProdReady = isPlaidProductionReady();
  if (!user) return null;

  return (
    <section className="sidebar max-md:hidden">
      <nav className="flex flex-col">
        <Link
          href="/client/home"
          className="mb-3 cursor-pointer flex items-center justify-center"
        >
          <Image
            src="/icons/logo.svg"
            width={64}
            height={64}
            alt={process.env.NEXT_PUBLIC_APP_NAME as string}
          />
        </Link>
        {sidebarLinks
          .filter((item) => {
            // If Plaid is not ready, filter out (remove) the "My Accounts" link
            if (!isPlaidProdReady && item.route === "/client/my-accounts") {
              return false;
            }

            // If user hasn't paid denefits contract, filter out "My Learning" link
            if (
              item.route === "/client/my-learning" &&
              (!denefitsContract || denefitsContract.length === 0)
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

            return (
              <Link
                href={item.route}
                key={item.label}
                className={cn("sidebar-link", { "bg-bank-gradient": isActive })}
              >
                <div className="relative size-6">
                  <Image
                    src={item.imgURL}
                    alt={item.label}
                    fill
                    className={cn({
                      "brightness-[3] invert-0": isActive,
                    })}
                  />
                </div>
                <p className={cn("sidebar-label", { "!text-white": isActive })}>
                  {item.label}
                </p>
              </Link>
            );
          })}
      </nav>
      <div className="flex flex-col">
        <WhatsNewAccordion />
        <Footer />
      </div>
    </section>
  );
};

export default Sidebar;
