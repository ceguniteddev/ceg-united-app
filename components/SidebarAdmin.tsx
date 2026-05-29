"use client";

import { adminSidebarLinks } from "@/constant/common";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Footer from "./Footer";
import { useAuth } from "@/provider/AuthContext";
import { useContactUsQueryIsOpen } from "@/hooks/contact-us";
import { useGetFundingApplicationsIsNew } from "@/hooks/apply-funding";
import { usePendingTradelinesCount } from "@/hooks/tradelines";
import { Separator } from "./ui/separator";
import { useAdminIncomeFunding } from "@/hooks/admin/income-funding";

const Sidebar = () => {
  const { user, role } = useAuth();
  const pathname = usePathname();
  const { requestCallsOpen } = useContactUsQueryIsOpen();
  const { appliedFunding } = useGetFundingApplicationsIsNew();
  const { count: pendingTradelinesCount } = usePendingTradelinesCount();
  const { clients: coordinatorClients } = useAdminIncomeFunding();

  const coordinatorNeedsAttention = coordinatorClients?.some(
    (c) => c.status === "under-review" || c.status === "accepting",
  );
  if (!user) return null;

  if (role === "Client") return null;

  return (
    <aside className="sidebar max-md:hidden">
      <nav className="flex flex-col">
        <Link
          href="/admin/home"
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
        {adminSidebarLinks.map((item) => {
          const isActive = pathname.startsWith(item.route);

          return (
            <Link
              href={item.route}
              key={item.label}
              className={cn(
                "flex gap-2 md:gap-3 items-center py-1 md:p-1 2xl:p-1 rounded-lg justify-start",
                { "bg-bank-gradient": isActive },
              )}
            >
              <div className="relative size-5 md:size-6">
                <Image
                  src={item.imgURL}
                  alt={item.label}
                  fill
                  className={cn({
                    "brightness-[3] invert-0": isActive,
                  })}
                />
                {item.route === "/admin/funding-application" &&
                  (appliedFunding?.length ?? 0) > 0 && (
                    <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-red-500" />
                  )}
                {item.route === "/admin/call-requests" &&
                  (requestCallsOpen?.length ?? 0) > 0 && (
                    <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-red-500" />
                  )}
                {item.route === "/admin/coordinator" &&
                  coordinatorNeedsAttention && (
                    <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-red-500" />
                  )}
                {item.route === "/admin/tradelines" &&
                  pendingTradelinesCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-red-500" />
                  )}
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
      <Footer />
    </aside>
  );
};

export default Sidebar;
