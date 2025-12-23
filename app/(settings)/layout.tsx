// import "driver.js/dist/driver.css";
import { Metadata } from "next";
import SidebarSettings from "@/components/SidebarSettings";
import MobileNavSettings from "@/components/MobileNavSettings";

export const metadata: Metadata = {
  title: "CEG United LLC",
  description: "CEG United LLC",
  icons: {
    icon: "/icon.ico",
  },
};

export default function SettingsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex h-screen w-full overflow-hidden font-inter">
      <SidebarSettings />
      <div className="flex flex-1 min-h-0 flex-col">
        <MobileNavSettings />
        <div className="flex-1 min-h-0 overflow-y-auto lg:pt-0 pt-[60px]">
          {children}
        </div>
      </div>
    </div>
  );
}
