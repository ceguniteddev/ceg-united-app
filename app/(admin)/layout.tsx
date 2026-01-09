import Sidebar from "@/components/SidebarAdmin";
import MobileNavAdmin from "@/components/MobileNavAdmin";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "CEG United LLC",
  description: "CEG United LLC",
  icons: {
    icon: "/icon.ico",
  },
};

// app/(dashboard)/layout.tsx
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-dvh w-full overflow-hidden font-inter">
      {/* Hide sidebar on mobile, show on md and up */}
      <div className="hidden md:block">
        <Sidebar />
      </div>
      <div className="flex flex-1 min-h-0 flex-col">
        <MobileNavAdmin />
        <div className="flex-1 min-h-0 overflow-y-auto md:pt-0 pt-[60px] px-4 md:px-6 py-4 md:py-6">
          {children}
        </div>
      </div>
    </div>
  );
}
