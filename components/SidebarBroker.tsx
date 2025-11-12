"use client";

import { brokerSidebarLinks } from "@/constant/common";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Footer from "./Footer";
import UserNav from "./logout";
import { useAuth } from "@/provider/AuthContext";

const SidebarBroker = () => {
  const { user, loading } = useAuth();
  const pathname = usePathname();

  if (loading || !user) {
    return (
      <aside className="sidebar">
        <nav className="flex flex-col gap-4">
          <Link
            href="/"
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
    <aside className="sidebar">
      <nav className="flex flex-col">
        <Link
          href="/broker/home"
          className="mb-6 cursor-pointer flex items-center justify-center"
        >
          <Image
            src="/icons/logo.svg"
            width={64}
            height={64}
            alt={process.env.NEXT_PUBLIC_APP_NAME as string}
          />
        </Link>

        {brokerSidebarLinks.map((item) => {
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

      <Footer />
    </aside>
  );
};

export default SidebarBroker;
