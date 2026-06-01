"use client";

import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { VisuallyHidden } from "@/components/ui/visually-hidden";
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
import { useAdminIncomeFunding } from "@/hooks/admin/income-funding";
import { ChevronDown } from "lucide-react";

const MobileNavAdmin = () => {
  const { user, role } = useAuth();
  const pathname = usePathname();
  const { requestCallsOpen } = useContactUsQueryIsOpen();
  const { appliedFunding } = useGetFundingApplicationsIsNew();
  const { count: pendingTradelinesCount } = usePendingTradelinesCount();
  const { clients: coordinatorClients } = useAdminIncomeFunding();

  const coordinatorNeedsAttention = coordinatorClients?.some(
    (c) => c.status === "under-review" || c.status === "accepting",
  );

  if (!user || role !== "Admin") return null;

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
            <SheetTitle>Admin Navigation Menu</SheetTitle>
          </VisuallyHidden>
          <div className="flex flex-col h-full">
            <Link
              href="/admin/home"
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

            <nav className="flex-1 flex flex-col px-2 overflow-y-auto">
              {adminSidebarLinks.map((group) => (
                <Collapsible
                  defaultOpen={false}
                  key={group.group}
                  className="group/collapsible mb-2"
                >
                  <CollapsibleTrigger className="flex items-center w-full px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider gap-2">
                    <group.icon className="size-4" />
                    {group.group}
                    <ChevronDown className="ml-auto size-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-1">
                    {group.links.map((item) => {
                      const isActive = pathname.startsWith(item.route);

                      let badgeIndicator = false;
                      if (
                        item.route === "/admin/funding-application" &&
                        (appliedFunding?.length ?? 0) > 0
                      )
                        badgeIndicator = true;
                      if (
                        item.route === "/admin/call-requests" &&
                        (requestCallsOpen?.length ?? 0) > 0
                      )
                        badgeIndicator = true;
                      if (
                        item.route === "/admin/coordinator" &&
                        coordinatorNeedsAttention
                      )
                        badgeIndicator = true;
                      if (
                        item.route === "/admin/tradelines" &&
                        pendingTradelinesCount > 0
                      )
                        badgeIndicator = true;

                      return (
                        <SheetClose asChild key={item.route}>
                          <Link
                            href={item.route}
                            className={cn(
                              "flex gap-3 items-center py-1 px-4 rounded-lg",
                              { "bg-bank-gradient": isActive },
                            )}
                          >
                            <div className="relative size-5 shrink-0 flex items-center justify-center">
                              <Image
                                src={item.imgURL}
                                alt={item.label}
                                fill
                                className={cn("object-contain", {
                                  "brightness-[3] invert-0": isActive,
                                })}
                              />
                              {badgeIndicator && (
                                <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-red-500" />
                              )}
                            </div>
                            <span
                              className={cn(
                                "text-[15px] font-semibold text-black-2 truncate",
                                {
                                  "!text-white": isActive,
                                },
                              )}
                            >
                              {item.label}
                            </span>
                          </Link>
                        </SheetClose>
                      );
                    })}
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </nav>

            <Footer type="mobile" />
          </div>
        </SheetContent>
      </Sheet>

      <Link href="/admin/home" className="flex items-center">
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

export default MobileNavAdmin;
