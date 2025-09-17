import Sidebar from "@/components/SidebarAdmin";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "CEG United LLC",
  description: "CEG United LLC",
  icons: {
    icon: "../icon.ico",
  },
};

// app/(dashboard)/layout.tsx
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-dvh w-full overflow-hidden font-inter">
      <Sidebar /> {/* add its own scroll if needed: className="min-h-0 overflow-y-auto" */}
      <div className="flex flex-1 min-h-0 flex-col">
        <div className="flex-1 min-h-0 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
