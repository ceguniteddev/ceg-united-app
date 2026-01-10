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
        <div className="flex-1 min-h-0 overflow-y-auto pt-[60px] lg:pt-0 px-4 lg:px-6 pb-36 lg:pb-0">
          {children}
        </div>
      </div>
    </div>
  );
}
