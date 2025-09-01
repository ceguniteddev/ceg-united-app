"use client";

import { sidebarLinks } from "@/constant/common";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Footer from "./Footer";
import PlaidLink from "./PlaidLink";
import { useAuth } from "@/provider/AuthContext";
import PlaidIncomeLink from "./PlaidLinkIncome";

const Sidebar = () => {
  const { user } = useAuth();
  const pathname = usePathname();

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
        <PlaidIncomeLink />
      </nav>

      <Footer />
    </section>
  );
};

export default Sidebar;
