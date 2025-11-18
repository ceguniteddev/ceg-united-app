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
import { useGetDenefitsContractsByUserId } from "@/hooks/denefits";

const MobileNavClient = () => {
  const { user } = useAuth();
  const pathname = usePathname();
  const { denefitsContract } = useGetDenefitsContractsByUserId(user?.uid || "");
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
                src="/icons/logo.svg"
                width={64}
                height={64}
                alt={process.env.NEXT_PUBLIC_APP_NAME as string}
              />
            </Link>

            <nav className="flex-1 flex flex-col px-4 overflow-y-auto">
              {sidebarLinks
                .filter((item) => {
                  if (
                    !isPlaidProdReady &&
                    item.route === "/client/my-accounts"
                  ) {
                    return false;
                  }
                  if (
                    item.route === "/client/my-learning" &&
                    (!denefitsContract || denefitsContract.length === 0)
                  ) {
                    return false;
                  }
                  return true;
                })
                .map((item) => {
                  const isActive =
                    pathname === item.route ||
                    pathname.startsWith(`${item.route}/`);

                  return (
                    <SheetClose asChild key={item.route}>
                      <Link
                        href={item.route}
                        className={cn(
                          "flex gap-3 items-center py-3 px-4 rounded-lg mb-2",
                          { "bg-bank-gradient": isActive }
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
                            "text-white": isActive,
                          })}
                        >
                          {item.label}
                        </p>
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
          src="/icons/logo.svg"
          width={40}
          height={40}
          alt={process.env.NEXT_PUBLIC_APP_NAME as string}
        />
      </Link>
    </div>
  );
};

export default MobileNavClient;
