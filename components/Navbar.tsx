"use client";

import React from "react";

import EnvironmentBanner from "@/components/development-banner";
import Image from "next/image";

import Logout from "@/components/logout";
import { useRouter } from "next/navigation";

const Navbar = () => {
  const router = useRouter();
  return (
    <nav className="dashboard-navbar pb-1">
      <div className="dashboard-navbar__container">
        <div className="flex items-center space-x-4">
          <div
            className="flex items-center space-x-2 cursor-pointer"
            onClick={() => {
              router.push("/");
            }}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg overflow-hidden">
              <Image
                src="/icon.png"
                alt={process.env.NEXT_PUBLIC_APP_NAME as string}
                width={32}
                height={32}
              />
            </div>
            <div className="flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold">{process.env.NEXT_PUBLIC_APP_NAME}</span>
            </div>
          </div>
        </div>

        <div className={`ml-auto flex space-x-4`}>
          <EnvironmentBanner />
          <Logout />
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
