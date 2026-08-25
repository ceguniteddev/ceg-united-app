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
import { useAdminIncomeFunding } from "@/hooks/admin/income-funding";
import { ChevronDown } from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

const SidebarAdmin = () => {
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
    <Sidebar>
      <SidebarHeader className="p-4">
        <Link
          href="/admin/home"
          className="mb-4 cursor-pointer flex items-center gap-2 justify-center"
        >
          <Image
            src="/icon.png"
            alt="Logo"
            width={548}
            height={455}
            className="h-16 w-auto object-contain"
          />
        </Link>
      </SidebarHeader>

      <SidebarContent>
        {adminSidebarLinks.map((group) => (
          <Collapsible
            defaultOpen={false}
            key={group.group}
            className="group/collapsible"
          >
            <SidebarGroup>
              <SidebarGroupLabel
                asChild
                className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider hover:bg-transparent cursor-pointer"
              >
                <CollapsibleTrigger className="flex items-center w-full gap-2">
                  <group.icon className="size-4" />
                  {group.group}
                  <ChevronDown className="ml-auto size-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                </CollapsibleTrigger>
              </SidebarGroupLabel>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu>
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
                        <SidebarMenuItem key={item.label} className="px-2 ">
                          <SidebarMenuButton
                            asChild
                            isActive={isActive}
                            tooltip={item.label}
                            className={cn({
                              "bg-bank-gradient text-white hover:bg-bank-gradient hover:text-white":
                                isActive,
                            })}
                          >
                            <Link
                              href={item.route}
                              className="flex gap-3 items-center w-full"
                            >
                              <div className="relative size-5 shrink-0 flex items-center justify-center">
                                <Image
                                  src={item.imgURL}
                                  alt={item.label}
                                  fill
                                  sizes="20px"
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
                                  "text-sm font-semibold text-black-2 truncate",
                                  {
                                    "!text-white": isActive,
                                  },
                                )}
                              >
                                {item.label}
                              </span>
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>
        ))}
      </SidebarContent>

      <SidebarFooter className="p-4">
        <Footer />
      </SidebarFooter>
    </Sidebar>
  );
};

export default SidebarAdmin;
