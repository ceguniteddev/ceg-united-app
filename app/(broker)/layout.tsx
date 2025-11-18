import SidebarBroker from "@/components/SidebarBroker";
import MobileNavBroker from "@/components/MobileNavBroker";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "CEG United LLC - Broker Portal",
  description: "CEG United LLC Broker Portal",
  icons: {
    icon: "/icon.ico",
  },
};

export default function BrokerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen w-full overflow-hidden font-inter">
      <SidebarBroker />
      <div className="flex flex-1 min-h-0 flex-col">
        <MobileNavBroker />
        <div className="flex-1 min-h-0 overflow-y-auto lg:pt-0 pt-[60px]">
          {children}
        </div>
      </div>
    </div>
  );
}
