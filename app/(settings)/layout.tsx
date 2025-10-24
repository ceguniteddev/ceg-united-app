import "driver.js/dist/driver.css";
import UserBanners from "@/components/UserBanners";
import { Metadata } from "next";
import SidebarSettings from "@/components/SidebarSettings";

export const metadata: Metadata = {
  title: "CEG United LLC",
  description: "CEG United LLC",
  icons: {
    icon: "../icon.ico",
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
        <SidebarSettings />
        <div className="flex size-full flex-col overflow-y-auto">{children}</div>
      </main>
    </div>
  );
}
