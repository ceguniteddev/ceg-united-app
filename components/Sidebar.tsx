"use client";

import { sidebarLinks } from "@/constant/common";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Footer from "./Footer";
import PlaidLink from "./PlaidLink";
import { useAuth } from "@/provider/AuthContext";
import PlaidIncomeLinkBank from "./PlaidLinkIncomeBank";
import PlaidIncomeLinkPayroll from "./PlaidLinkIncomePayroll";
import { useEffect } from "react";

import { driver } from "driver.js";
import { useUpdateUserOnboardingMutation } from "@/hooks/user";

const Sidebar = () => {
  const { user, isOnboarded } = useAuth();
  const pathname = usePathname();
  const { updateOnboarding } = useUpdateUserOnboardingMutation();
  useEffect(() => {
    const driverObj = driver({
      // onCloseClick: () => console.log("onCloseClick"),
      onDestroyed: async () => await updateOnboarding(),
      steps: [
        {
          element: "#plaid-link-button",
          popover: {
            title: "Link your bank account",
            description: "Link your bank account to get started.",
          },
        },
        {
          element: "#plaid-link-income-bank-button",
          popover: {
            title: "Verify your bank income",
            description: "Verify your bank income to get started.",
          },
        },
        {
          element: "#plaid-link-income-payroll-button",
          popover: {
            title: "Verify your payroll income",
            description: "Verify your payroll income to get started.",
          },
        },
      ],
    });

    if (user && !isOnboarded) driverObj.drive();
  }, [user, isOnboarded, updateOnboarding]);

  if (!user) return null;

  return (
    <section className="sidebar">
      <nav className="flex flex-col gap-4">
        <Link
          href="/overview"
          className="mb-6 cursor-pointer flex items-center justify-center gap-2"
        >
          <Image
            src="/icons/logo.svg"
            width={64}
            height={64}
            alt={process.env.NEXT_PUBLIC_APP_NAME as string}
          />
        </Link>
        {sidebarLinks.map((item) => {
          const isActive = pathname === item.route || pathname.startsWith(`${item.route}/`);

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
              <p className={cn("sidebar-label", { "!text-white": isActive })}>{item.label}</p>
            </Link>
          );
        })}
        <PlaidLink />
        <PlaidIncomeLinkBank />
        <PlaidIncomeLinkPayroll />
      </nav>

      <Footer />
    </section>
  );
};

export default Sidebar;
