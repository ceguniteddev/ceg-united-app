"use client";

import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { VisuallyHidden } from "@/components/ui/visually-hidden";
import { brokerSidebarLinks } from "@/constant/common";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Footer from "./Footer";
import { useAuth } from "@/provider/AuthContext";
import { WhatsNewAccordion } from "./WhatsNewAccordion";
import LanguageSwitcher from "./LanguageSwitcher";
import { useTranslation } from "@/lib/i18n";

const BROKER_NAV_LABEL_KEYS: Record<string, string> = {
  Home: "navigation.home",
  Clients: "navigation.clients",
  "Funding Products": "navigation.fundingProducts",
  "Apply Funding": "navigation.funding",
};

const MobileNavBroker = () => {
  const { t } = useTranslation();
  const { user, loading } = useAuth();
  const pathname = usePathname();

  if (loading || !user) return null;

  return (
    <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between h-[105px]">
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
            <SheetTitle>Broker Navigation Menu</SheetTitle>
          </VisuallyHidden>
          <div className="flex flex-col h-full">
            <Link
              href="/broker/home"
              className="cursor-pointer flex items-center justify-center py-6"
            >
              <Image
                src="/icon.png"
                alt="Logo"
                width={548}
                height={455}
                className="h-14 w-auto object-contain"
              />
            </Link>

            <nav className="flex-1 flex flex-col px-4 overflow-y-auto">
              {brokerSidebarLinks.map((item) => {
                const isActive =
                  pathname === item.route ||
                  pathname.startsWith(`${item.route}/`);

                return (
                  <SheetClose asChild key={item.route}>
                    <Link
                      href={item.route}
                      className={cn(
                        "flex gap-3 items-center py-1 px-4 rounded-lg mb-2",
                        { "bg-bank-gradient": isActive },
                      )}
                    >
                      <div className="relative size-6">
                        <Image
                          src={item.imgURL}
                          alt={item.label}
                          fill
                          sizes="24px"
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
                        {BROKER_NAV_LABEL_KEYS[item.label]
                          ? t(BROKER_NAV_LABEL_KEYS[item.label])
                          : item.label}
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

      <div className="flex items-center gap-2">
        <Link href="/broker/home" className="flex items-center">
          <Image
            src="/icon.png"
            alt="Logo"
            width={548}
            height={455}
            className="h-14 w-auto object-contain"
          />
        </Link>
        <LanguageSwitcher variant="outline" size="sm" showLabel={false} />
      </div>
    </div>
  );
};

export default MobileNavBroker;
