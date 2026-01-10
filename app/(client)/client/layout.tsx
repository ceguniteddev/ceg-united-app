import Sidebar from "@/components/Sidebar";
import MobileNavClient from "@/components/MobileNavClient";
import "driver.js/dist/driver.css";
import UserBanners from "@/components/UserBanners";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "CEG United LLC",
  description: "CEG United LLC",
  icons: {
    icon: "/icon.ico",
  },
};

export default function ClientLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div>
      <UserBanners />

      <main className="flex h-screen w-full font-inter">
        <Sidebar />
        <div className="flex size-full flex-col overflow-y-auto">
          <MobileNavClient />
          <div className="pt-[60px] md:pt-0 px-4 md:px-0 pb-24 md:pb-0">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
