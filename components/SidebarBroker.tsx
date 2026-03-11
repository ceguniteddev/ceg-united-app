"use client";

import { brokerSidebarLinks } from "@/constant/common";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Footer from "./Footer";
import UserNav from "./logout";
import { useAuth } from "@/provider/AuthContext";
import { WhatsNewAccordion } from "./WhatsNewAccordion";

const SidebarBroker = () => {
  const { user, loading } = useAuth();
  const pathname = usePathname();

  if (loading || !user) {
    return (
      <aside className="sidebar">
        <nav className="flex flex-col gap-4">
          <Link
            href="/broker/home"
            className="mb-3 cursor-pointer flex items-center gap-2"
          >
            <Image
              src="/icons/logo.svg"
              width={34}
              height={34}
              alt={process.env.NEXT_PUBLIC_APP_NAME as string}
              className="size-[24px] max-xl:size-14"
            />
            <h1 className="sidebar-logo">
              {process.env.NEXT_PUBLIC_APP_NAME as string}
            </h1>
          </Link>
        </nav>
      </aside>
    );
  }

  return (
    <aside className="sidebar max-lg:hidden">
      <nav className="flex flex-col">
        <Link
          href="/broker/home"
          className="mb-6 cursor-pointer flex items-center gap-2 xl:justify-center"
        >
          <Image
            src="/icons/logo.svg"
            width={34}
            height={34}
            alt={process.env.NEXT_PUBLIC_APP_NAME as string}
            className="size-[34px] xl:size-[64px]"
          />
          <h1 className="sidebar-logo xl:hidden">
            {process.env.NEXT_PUBLIC_APP_NAME as string}
          </h1>
        </Link>

        {brokerSidebarLinks.map((item) => {
          const isActive =
            pathname === item.route || pathname.startsWith(`${item.route}/`);

          return (
            <Link
              href={item.route}
              key={item.label}
              className={cn(
                "flex gap-3 items-center py-1 md:p-1 2xl:p-1 rounded-lg justify-start",
                { "bg-bank-gradient": isActive },
              )}
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

              <p
                className={cn("text-16 font-semibold text-black-2", {
                  "!text-white": isActive,
                })}
              >
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
    </aside>
  );
};

export default SidebarBroker;
