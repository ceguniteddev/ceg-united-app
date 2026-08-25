"use client";

import { settingsSidebar, settingsSidebarAdmin } from "@/constant/common";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Footer from "./Footer";
import { useAuth } from "@/provider/AuthContext";

const SidebarSettings = () => {
  const { user, role } = useAuth();
  const pathname = usePathname();

  if (!user) return null;

  const sidebar = role === "Admin" ? settingsSidebarAdmin : settingsSidebar;

  return (
    <section className="sidebar">
      <nav className="flex flex-col">
        <Link
          href="/"
          className="mb-3 cursor-pointer flex items-center justify-center"
        >
          <Image
            src="/icon.png"
            alt="Logo"
            width={548}
            height={455}
            className="h-20 w-auto object-contain"
          />
        </Link>
        {sidebar.map((item) => {
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
                  sizes="24px"
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
        <Footer />
      </div>
    </section>
  );
};

export default SidebarSettings;
